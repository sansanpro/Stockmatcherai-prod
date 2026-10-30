// Opens Ask AI with a question filled in (not sent, so the user stays in control of their free
// questions). AIAssistantWidget listens for this event.
export const ASK_AI_EVENT = 'stockmatcher:ask-ai';

export function askAI(prompt: string) {
  window.dispatchEvent(new CustomEvent(ASK_AI_EVENT, { detail: { prompt } }));
}

// The question "Ask AI" fills in for a company (the swipe card's Ask AI button and the details sheet)
export const companyQuestion = (name: string, ticker: string) =>
  `What does ${name} (${ticker}) do, and how does it connect to my causes?`;

// Tutor mode (Premium): the same question, answered step by step for a beginner. Prompting only.
export const tutorPrompt = (question: string) =>
  `Tutor mode: I'm new to investing. Explain this step by step in short numbered steps, and explain each term the first time you use it. ${question}`;
