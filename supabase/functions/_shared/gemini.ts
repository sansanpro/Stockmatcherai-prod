// Gemini API settings shared by edge functions, using our own GEMINI_API_KEY.
// Model list and deprecations: https://ai.google.dev/gemini-api/docs/deprecations
// Override without a code change: `supabase secrets set GEMINI_MODEL=... GEMINI_FALLBACK_MODEL=...`

// Flash-Lite on the free tier (decided 2026-10-22): gemini-3.6-flash kept hitting its free-tier
// rate limit (429), which made users wait through retries before falling back to Lite anyway.
export const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-3.5-flash-lite';
// Used when the primary model is overloaded (503) or rate limited (429)
export const GEMINI_FALLBACK_MODEL = Deno.env.get('GEMINI_FALLBACK_MODEL') || 'gemini-3.6-flash';

// OpenAI-compatible endpoint (chat completions, streaming, tool calls)
export const GEMINI_OPENAI_CHAT_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

// Native generateContent endpoint
export const geminiGenerateContentUrl = (model = GEMINI_MODEL) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

export function getGeminiApiKey(): string | undefined {
  return Deno.env.get('GEMINI_API_KEY');
}

// Overload, rate limit and transient server errors are worth retrying on another model
export const isRetryableGeminiStatus = (status: number) => status === 429 || status >= 500;

// How long an attempt may wait for Gemini to start answering before moving on. Only the wait for
// the response headers is limited, so a long streamed answer is never cut off.
export const GEMINI_FIRST_BYTE_TIMEOUT_MS = 20_000;

// POSTs to Gemini, trying each model in order until one doesn't return a retryable error.
// Each model gets a second attempt after a short pause on 5xx, since 503 "high demand" spikes are brief.
// url/init receive the model name so callers can adapt the request per model.
export async function fetchGeminiWithFallback(
  url: (model: string) => string,
  init: (model: string) => RequestInit,
  models: string[] = [GEMINI_MODEL, GEMINI_FALLBACK_MODEL],
  attemptsPerModel = 2,
): Promise<{ response: Response; model: string; failures: string[] }> {
  let last: { response: Response; model: string } | null = null;
  const failures: string[] = [];
  for (const model of [...new Set(models)]) {
    for (let attempt = 1; attempt <= attemptsPerModel; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), GEMINI_FIRST_BYTE_TIMEOUT_MS);
      let response: Response;
      try {
        response = await fetch(url(model), { ...init(model), signal: controller.signal });
      } catch (error) {
        if (!controller.signal.aborted) throw error;
        // A hung request: try the next model rather than waiting on this one
        failures.push(`${model}#${attempt}: no response in ${GEMINI_FIRST_BYTE_TIMEOUT_MS / 1000}s`);
        console.warn(`[gemini] ${model} attempt ${attempt} timed out waiting for a response`);
        last = { response: new Response('Gemini did not respond in time', { status: 504 }), model };
        break;
      } finally {
        clearTimeout(timer);
      }
      if (response.ok || !isRetryableGeminiStatus(response.status)) {
        return { response, model, failures };
      }
      const body = await response.text();
      failures.push(`${model}#${attempt}: ${response.status}`);
      console.warn(`[gemini] ${model} attempt ${attempt} returned ${response.status}: ${body.slice(0, 200)}`);
      // Body was consumed for logging; hand back an equivalent unread response
      last = { response: new Response(body, { status: response.status, headers: response.headers }), model };
      // A rate limit (429) won't clear in a second, so move straight to the next model
      if (response.status === 429) break;
      if (attempt < attemptsPerModel) await new Promise(resolve => setTimeout(resolve, 600 * attempt));
    }
  }
  return { ...last!, failures };
}

// Records an AI failure in public.ai_error_logs (never throws)
export async function logAiError(
  db: { from: (table: string) => any },
  entry: { function_name: string; stage: string; user_id?: string | null; model?: string | null; status?: number | null; message: string },
) {
  try {
    const { error } = await db.from('ai_error_logs').insert({ ...entry, message: entry.message.slice(0, 2000) });
    if (error) console.error('[ai_error_logs] insert failed:', error);
  } catch (e) {
    console.error('[ai_error_logs] insert threw:', e);
  }
}
