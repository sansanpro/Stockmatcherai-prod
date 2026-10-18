// Gemini API settings shared by edge functions, using our own GEMINI_API_KEY.
// Model list and deprecations: https://ai.google.dev/gemini-api/docs/deprecations
// Override the model without a code change: `supabase secrets set GEMINI_MODEL=...`

export const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-3.8-flash';

// OpenAI-compatible endpoint (chat completions, streaming, tool calls)
export const GEMINI_OPENAI_CHAT_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

// Native generateContent endpoint
export const geminiGenerateContentUrl = (model = GEMINI_MODEL) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

export function getGeminiApiKey(): string | undefined {
  return Deno.env.get('GEMINI_API_KEY');
}
