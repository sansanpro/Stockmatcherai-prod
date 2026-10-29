import { feedDate } from '@/lib/matchFeed';

// Remembers on this device that today's deck was swiped to the end, so Profile can say up front
// that new causes start with tomorrow's deck (the server never refills a finished day).
const key = () => `deck_finished_${feedDate()}`;

export const markDeckFinished = () => {
  try { localStorage.setItem(key(), '1'); } catch { /* storage blocked: the deck screen still says it */ }
};

export const deckFinishedToday = () => {
  try { return localStorage.getItem(key()) === '1'; } catch { return false; }
};
