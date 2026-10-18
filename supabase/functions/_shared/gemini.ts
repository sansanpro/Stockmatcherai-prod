// Gemini API settings shared by edge functions, using our own GEMINI_API_KEY.
// Model list and deprecations: https://ai.google.dev/gemini-api/docs/deprecations
// Override without a code change: `supabase secrets set GEMINI_MODEL=... GEMINI_FALLBACK_MODEL=...`

// gemini-3.6-flash measured ~2s to first tool call vs ~7.5s (and frequent 503s) for 3.8-flash
export const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-3.6-flash';
// Used when the primary model is overloaded (503) or rate limited (429)
export const GEMINI_FALLBACK_MODEL = Deno.env.get('GEMINI_FALLBACK_MODEL') || 'gemini-3.5-flash-lite';

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
      const response = await fetch(url(model), init(model));
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
