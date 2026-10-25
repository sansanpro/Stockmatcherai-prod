// What a day of likes says about someone, for the end-of-deck recap. Everything here is worked out
// from the companies themselves (their causes, how central the cause is, size and steadiness,
// dividends), never guessed, and none of it is advice.
import type { StockRecommendation } from '@/types/stock-matcher';
import type { CauseInfo } from '@/lib/matchFeed';

export interface Persona {
  title: string;
  line: string;
}

const PERSONAS: Record<string, Persona> = {
  beat_cancer: { title: 'The Cure Seeker', line: 'You back the people racing to beat cancer and disease.' },
  live_healthier: { title: 'The Longevity Builder', line: 'You back companies helping people live longer, healthier lives.' },
  clean_energy: { title: 'The Clean Power Backer', line: 'You back the shift to clean energy.' },
  keeping_safe: { title: 'The Guardian', line: 'You back the companies keeping people safe.' },
  clean_food: { title: 'The Good Food Grower', line: 'You back better food and smarter farming.' },
  mental_health: { title: 'The Mind Champion', line: 'You back better care for mental health.' },
};
const MIXED: Persona = { title: 'The Big-Picture Backer', line: 'You spread your support across several causes.' };

export interface RecapInsights {
  persona: Persona;
  topCause: CauseInfo | null; // the cause most of the likes work on
  facts: string[]; // up to three, most telling first
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export function recapInsights(liked: StockRecommendation[], myCauses: CauseInfo[]): RecapInsights {
  const n = liked.length;
  // How many liked companies work on each cause (a company counts once per cause)
  const counts = new Map<string, number>();
  for (const s of liked) {
    for (const cause of new Set((s.matchedCauses ?? []).map(m => m.cause))) {
      counts.set(cause, (counts.get(cause) ?? 0) + 1);
    }
  }
  // Most likes first; ties go to the cause the user ranked higher
  const rank = (id: string) => {
    const i = myCauses.findIndex(c => c.id === id);
    return i === -1 ? 99 : i;
  };
  const [topId, topCount] = [...counts.entries()].sort((a, b) => b[1] - a[1] || rank(a[0]) - rank(b[0]))[0] ?? [null, 0];
  const topCause = myCauses.find(c => c.id === topId) ?? null;
  const persona = topId && PERSONAS[topId] && topCount * 2 >= n ? PERSONAS[topId] : MIXED;

  const facts: string[] = [];
  if (topCause && n >= 2) {
    facts.push(topCount === n
      ? `All ${n} of your likes work on ${topCause.label}.`
      : `${topCount} of your ${n} likes work on ${topCause.label}.`);
  }
  const core = liked.filter(s => (s.matchedCauses ?? []).some(m => m.exposure === 'core')).length;
  if (core === n && n > 0) facts.push(n === 1 ? 'It does this as its core business.' : 'Every one does it as its core business.');
  else if (core > 0) facts.push(`${core} ${plural(core, 'does', 'do')} it as ${plural(core, 'its', 'their')} core business.`);
  const steady = liked.filter(s => s.riskLevel === 'low').length;
  const moving = liked.filter(s => s.riskLevel === 'high').length;
  if (n > 0) {
    if (steady * 2 > n) facts.push('You leaned toward steadier, established companies.');
    else if (moving * 2 > n) facts.push("You're open to companies whose stock moves more.");
    else if (n >= 2) facts.push('You picked a mix of steady and faster-moving companies.');
  }
  const dividends = liked.filter(s => s.dividendYield > 0).length;
  if (dividends > 0 && facts.length < 3) {
    facts.push(`${dividends} ${plural(dividends, 'pays its', 'pay their')} owners a share of profits (a dividend).`);
  }
  if (facts.length < 3) facts.push(`${plural(n, 'It comes', 'Each one comes')} with a fact you can check.`);
  return { persona, topCause, facts: facts.slice(0, 3) };
}

// Short text for sharing a day's recap
export function recapShareText(liked: StockRecommendation[], persona: Persona): string {
  const names = liked.slice(0, 3).map(s => s.companyName);
  const more = liked.length > 3 ? ` and ${liked.length - 3} more` : '';
  return `My StockMatcher day: I liked ${names.join(', ')}${more}. I'm "${persona.title}". Find companies that match your values:`;
}
