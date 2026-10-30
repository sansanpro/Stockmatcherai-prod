import { useState } from 'react';
import { Quote as QuoteIcon } from 'lucide-react';
import { feedDate } from '@/lib/matchFeed';
import { QUOTES, pickQuote, quoteTieIn, type Quote } from '@/lib/quotes';
import type { OnboardingAnswers } from '@/lib/onboarding';

// Today's quote stays the same all day; the history keeps it from repeating on this device
const HISTORY_KEY = 'quote_history';
const todayKey = () => `daily_quote_${feedDate()}`;

function todaysQuote(likedCauses: string[], answers: OnboardingAnswers): Quote {
  let history: string[] = [];
  try {
    const saved = QUOTES.find(q => q.id === localStorage.getItem(todayKey()));
    if (saved) return saved;
    history = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
  } catch { /* storage blocked: still show a quote */ }
  const quote = pickQuote({ likedCauses, causes: answers.causes, risk: answers.risk, goal: answers.goal, experience: answers.experience, date: feedDate() }, history);
  try {
    localStorage.setItem(todayKey(), quote.id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify([...history.filter(id => id !== quote.id), quote.id]));
  } catch { /* as above */ }
  return quote;
}

interface DailyQuoteProps {
  likedCauses: string[]; // the main cause of each company liked today
  answers: OnboardingAnswers;
  causeLabel: (id: string) => string | undefined;
}

// Shown once the day's deck (and its recap) is done: a real, sourced quote chosen from the user's
// likes and profile, what it has to do with their day, and one idea it teaches
const DailyQuote = ({ likedCauses, answers, causeLabel }: DailyQuoteProps) => {
  const [quote] = useState(() => todaysQuote(likedCauses, answers));
  return (
    <figure className="card-plum rise-in rounded-3xl p-5 text-left text-white shadow-[0_18px_40px_rgb(var(--shadow)/0.18)]">
      <p className="flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-white/75">
        <QuoteIcon className="w-3.5 h-3.5" aria-hidden /> Today's thought
      </p>
      <blockquote className="mt-3 text-[1.1875rem] leading-snug font-semibold">“{quote.text}”</blockquote>
      <figcaption className="mt-3 text-sm">
        <span className="font-semibold">{quote.author}</span>
        <span className="block text-xs text-white/75 mt-0.5">{quote.source}</span>
      </figcaption>
      <div className="mt-4 pt-4 border-t border-white/15 text-sm leading-snug text-white/85 space-y-2">
        <p>{quoteTieIn(quote, likedCauses, causeLabel)}</p>
        <p>{quote.lesson}</p>
        {quote.url && (
          <a href={quote.url} target="_blank" rel="noopener noreferrer" className="tap-target inline-block font-semibold text-white underline">
            Read the original ↗
          </a>
        )}
      </div>
    </figure>
  );
};

export default DailyQuote;
