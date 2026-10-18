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
// url/init receive the model name so callers can adapt the request per model.
export async function fetchGeminiWithFallback(
  url: (model: string) => string,
  init: (model: string) => RequestInit,
  models: string[] = [GEMINI_MODEL, GEMINI_FALLBACK_MODEL],
): Promise<{ response: Response; model: string }> {
  let last: { response: Response; model: string } | null = null;
  for (const model of [...new Set(models)]) {
    const response = await fetch(url(model), init(model));
    if (response.ok || !isRetryableGeminiStatus(response.status)) {
      return { response, model };
    }
    const body = await response.text();
    console.warn(`[gemini] ${model} returned ${response.status}: ${body.slice(0, 200)}`);
    // Body was consumed for logging; hand back an equivalent unread response
    last = { response: new Response(body, { status: response.status, headers: response.headers }), model };
  }
  return last!;
}
