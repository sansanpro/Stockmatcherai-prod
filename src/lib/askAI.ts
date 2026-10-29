// Opens Ask AI with a question filled in (not sent, so the user stays in control of their free
// questions). AIAssistantWidget listens for this event.
export const ASK_AI_EVENT = 'stockmatcher:ask-ai';

export function askAI(prompt: string) {
  window.dispatchEvent(new CustomEvent(ASK_AI_EVENT, { detail: { prompt } }));
}

// Tutor mode (Premium): the same question, answered step by step for a beginner. Prompting only.
export const tutorPrompt = (question: string) =>
  `Tutor mode: I'm new to investing. Explain this step by step in short numbered steps, and explain each term the first time you use it. ${question}`;
