// Gemini API settings shared by edge functions, using our own GEMINI_API_KEY.
// Model list and deprecations: https://ai.google.dev/gemini-api/docs/deprecations
// Override without a code change: `supabase secrets set GEMINI_MODEL=... GEMINI_FALLBACK_MODELS=a,b`

// Flash-Lite on the free tier (decided 2026-10-22): gemini-3.6-flash kept hitting its free-tier
// rate limit (429), which made users wait through retries before falling back to Lite anyway.
export const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-3.5-flash-lite';
// Tried in order when the models before them are overloaded (503), hung, rate limited or out of
// free daily quota (429). Each model has its own free quota; gemini-3.6-flash gets only 20
// requests a day, so it goes last.
export const GEMINI_FALLBACK_MODELS = (Deno.env.get('GEMINI_FALLBACK_MODELS') || 'gemini-3.1-flash-lite,gemini-3.6-flash')
  .split(',').map(m => m.trim()).filter(Boolean);
export const GEMINI_MODELS = [...new Set([GEMINI_MODEL, ...GEMINI_FALLBACK_MODELS])];

// OpenAI-compatible endpoint (chat completions, streaming, tool calls)
export const GEMINI_OPENAI_CHAT_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

export function getGeminiApiKey(): string | undefined {
  return Deno.env.get('GEMINI_API_KEY');
}

// Overload, rate limit and transient server errors are worth retrying on another model
export const isRetryableGeminiStatus = (status: number) => status === 429 || status >= 500;

// How long an attempt may wait for Gemini to start answering before moving on (an overloaded
// model tends to hang rather than fail). Only the wait for the response headers is limited, so a
// long streamed answer is never cut off. Normal first responses arrive in 2-8s.
export const GEMINI_FIRST_BYTE_TIMEOUT_MS = 12_000;

type Db = { from: (table: string) => any };

// A model that just failed or hung is tried last for a while, so a struggling model doesn't slow
// down every request while it recovers. Shared through public.ai_model_status when a db is given,
// since each request may run on a fresh instance.
const MODEL_COOL_DOWN_MS = 10 * 60_000;
// A 429 says when the quota frees up ("retryDelay": "56001s" once a free daily quota is used up)
const quotaWaitMs = (body: string) => {
  const seconds = body.match(/"retryDelay":\s*"(\d+(?:\.\d+)?)s"/)?.[1];
  return seconds ? Math.min(Math.max(Number(seconds) * 1000, 60_000), 24 * 3600_000) : MODEL_COOL_DOWN_MS;
};
const coolingUntil = new Map<string, number>();
const isCooling = (model: string) => (coolingUntil.get(model) ?? 0) > Date.now();

async function loadCooling(db: Db) {
  try {
    const { data, error } = await db.from('ai_model_status').select('model, cooling_until').gt('cooling_until', new Date().toISOString());
    if (error) throw error;
    for (const row of data ?? []) coolingUntil.set(row.model, Date.parse(row.cooling_until));
  } catch (e) {
    console.warn('[gemini] could not read model status:', e);
  }
}

async function coolDown(model: string, db?: Db, ms = MODEL_COOL_DOWN_MS) {
  const until = Date.now() + ms;
  coolingUntil.set(model, until);
  if (!db) return;
  try {
    const { error } = await db.from('ai_model_status').upsert({ model, cooling_until: new Date(until).toISOString(), updated_at: new Date().toISOString() });
    if (error) throw error;
  } catch (e) {
    console.warn('[gemini] could not save model status:', e);
  }
}

// POSTs to Gemini until a model answers without a retryable error. Retryable failures (overload,
// rate limit, no response, model gone) move straight on to the next model; models that were
// overloaded (5xx) get a second try after a short pause, since those spikes are often brief.
// url/init receive the model name so callers can adapt the request per model.
export async function fetchGeminiWithFallback(
  url: (model: string) => string,
  init: (model: string) => RequestInit,
  { models = GEMINI_MODELS, db }: { models?: string[]; db?: Db } = {},
): Promise<{ response: Response; model: string; failures: string[] }> {
  let last: { response: Response; model: string } | null = null;
  const failures: string[] = [];
  if (db) await loadCooling(db);
  const unique = [...new Set(models)];
  let queue = [...unique.filter(m => !isCooling(m)), ...unique.filter(isCooling)];
  for (let pass = 1; pass <= 2 && queue.length > 0; pass++) {
    if (pass > 1) await new Promise(resolve => setTimeout(resolve, 800));
    const retryLater: string[] = [];
    for (const model of queue) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), GEMINI_FIRST_BYTE_TIMEOUT_MS);
      let response: Response;
      try {
        response = await fetch(url(model), { ...init(model), signal: controller.signal });
      } catch (error) {
        if (!controller.signal.aborted) throw error;
        failures.push(`${model}#${pass}: no response in ${GEMINI_FIRST_BYTE_TIMEOUT_MS / 1000}s`);
        console.warn(`[gemini] ${model} pass ${pass} timed out waiting for a response`);
        last = { response: new Response('Gemini did not respond in time', { status: 504 }), model };
        await coolDown(model, db);
        continue;
      } finally {
        clearTimeout(timer);
      }
      if (response.ok || !(isRetryableGeminiStatus(response.status) || response.status === 404)) {
        return { response, model, failures };
      }
      const body = await response.text();
      failures.push(`${model}#${pass}: ${response.status}`);
      console.warn(`[gemini] ${model} pass ${pass} returned ${response.status}: ${body.slice(0, 200)}`);
      // Body was consumed for logging; hand back an equivalent unread response
      last = { response: new Response(body, { status: response.status, headers: response.headers }), model };
      await coolDown(model, db, response.status === 429 ? quotaWaitMs(body) : MODEL_COOL_DOWN_MS);
      if (response.status >= 500) retryLater.push(model);
    }
    queue = retryLater;
  }
  return { ...last!, failures };
}

// Records an AI failure in public.ai_error_logs (never throws)
export async function logAiError(
  db: Db,
  entry: { function_name: string; stage: string; user_id?: string | null; model?: string | null; status?: number | null; message: string },
) {
  try {
    const { error } = await db.from('ai_error_logs').insert({ ...entry, message: entry.message.slice(0, 2000) });
    if (error) console.error('[ai_error_logs] insert failed:', error);
  } catch (e) {
    console.error('[ai_error_logs] insert threw:', e);
  }
}
