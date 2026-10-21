// Onboarding v2 answers: the questions, how answers are kept on the device before sign-in,
// and how they map onto user_profiles and match-feed preferences.

export type Risk = 'low' | 'medium' | 'high';
export type Goal = 'growth' | 'income' | 'short_term' | 'learning';
export type Experience = 'never' | 'few' | 'comfortable';

export interface OnboardingAnswers {
  motivation?: string;
  causes: string[]; // cause ids, in the order tapped (that order is the rank)
  dealbreakers: string[];
  risk?: Risk;
  experience?: Experience;
  goal?: Goal;
  startingAmount?: string;
}

export const MAX_CAUSES = 3;

export const MOTIVATIONS = [
  { id: 'savings_idle', label: 'My savings are just sitting there' },
  { id: 'family', label: 'I want to build something for my family' },
  { id: 'meaning', label: 'I want my money to actually mean something' },
  { id: 'overdue', label: "I've been meaning to for years" },
] as const;

// Shown back to the user on the reveal screen
export const MOTIVATION_LINES: Record<string, string> = {
  savings_idle: 'Your savings can start working on something you care about.',
  family: "You're building something for your family. Start with companies you believe in.",
  meaning: 'Now your money can say what you believe.',
  overdue: "You've been meaning to for years. Today you start learning.",
};

export const DEALBREAKERS = [
  { id: 'tobacco', label: 'Tobacco' },
  { id: 'weapons', label: 'Weapons' },
  { id: 'fossil_fuels', label: 'Fossil fuels' },
  { id: 'gambling', label: 'Gambling' },
  { id: 'factory_farming', label: 'Factory farming' },
] as const;

export const RISK_OPTIONS: { id: Risk; label: string }[] = [
  { id: 'low', label: "Sell. I can't watch that." },
  { id: 'medium', label: 'Wait it out.' },
  { id: 'high', label: 'Buy a little more if I still believe in it.' },
];

export const EXPERIENCE_OPTIONS: { id: Experience; label: string }[] = [
  { id: 'never', label: 'Never' },
  { id: 'few', label: 'A few times' },
  { id: 'comfortable', label: "I'm comfortable" },
];

export const GOAL_OPTIONS: { id: Goal; label: string }[] = [
  { id: 'growth', label: 'Growing it for the long haul (5+ years)' },
  { id: 'income', label: 'A little extra income' },
  { id: 'short_term', label: 'Something in the next few years' },
  { id: 'learning', label: 'Just learning for now' },
];

export const STARTING_AMOUNTS = [
  { id: '100', label: '$100' },
  { id: '500', label: '$500' },
  { id: '1000_plus', label: '$1K+' },
  { id: 'not_sure', label: 'Not sure yet' },
] as const;

export const emptyAnswers = (): OnboardingAnswers => ({ causes: [], dealbreakers: [] });

// Enough to build a deck
export const isComplete = (a: OnboardingAnswers | null | undefined): a is OnboardingAnswers =>
  !!a && a.causes.length > 0 && !!a.risk && !!a.goal;

const ANSWERS_KEY = 'onboarding_v2_answers';

export function loadAnswers(): OnboardingAnswers | null {
  try {
    const raw = localStorage.getItem(ANSWERS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { ...emptyAnswers(), ...parsed };
  } catch {
    return null;
  }
}

export function saveAnswers(answers: OnboardingAnswers) {
  try { localStorage.setItem(ANSWERS_KEY, JSON.stringify(answers)); } catch { /* storage blocked */ }
}

export function clearAnswers() {
  try { localStorage.removeItem(ANSWERS_KEY); } catch { /* storage blocked */ }
}

// What match-feed matches on
export const toPrefs = (a: OnboardingAnswers) => ({
  causes: a.causes,
  dealbreakers: a.dealbreakers,
  risk: a.risk ?? 'medium',
  goal: a.goal ?? 'growth',
});

// The user_profiles columns these answers fill. Gender, salary and age are no longer collected.
export function toProfileRow(a: OnboardingAnswers, userId: string) {
  return {
    user_id: userId,
    causes: a.causes,
    dealbreakers: a.dealbreakers,
    motivation: a.motivation ?? null,
    risk_tolerance: a.risk ?? 'medium',
    investment_experience: a.experience ?? null,
    investment_goals: [a.goal ?? 'growth'],
    horizon: a.goal === 'short_term' ? 'short_term' : a.goal === 'learning' ? null : 'long_term',
    starting_amount: a.startingAmount ?? null,
    onboarding_version: 2,
    updated_at: new Date().toISOString(),
  };
}

type ProfileRow = {
  causes?: string[] | null;
  dealbreakers?: string[] | null;
  motivation?: string | null;
  risk_tolerance?: string | null;
  investment_experience?: string | null;
  investment_goals?: string[] | null;
  horizon?: string | null;
  starting_amount?: string | null;
};

// Reads a stored profile (v1 or v2) back into answers
export function profileToAnswers(row: ProfileRow): OnboardingAnswers {
  const goals = row.investment_goals ?? [];
  const goal: Goal = row.horizon === 'short_term' || goals.includes('short-term') ? 'short_term'
    : goals.includes('income') ? 'income'
    : goals.includes('learning') || goals.includes('none') ? 'learning'
    : 'growth';
  const exp = row.investment_experience;
  const experience: Experience | undefined = exp === 'never' || exp === 'none' ? 'never'
    : exp === 'few' || exp === 'beginner' ? 'few'
    : exp === 'comfortable' || exp === 'intermediate' || exp === 'advanced' ? 'comfortable'
    : undefined;
  const risk = row.risk_tolerance;
  return {
    motivation: row.motivation ?? undefined,
    causes: row.causes ?? [],
    dealbreakers: row.dealbreakers ?? [],
    risk: risk === 'low' || risk === 'high' ? risk : 'medium',
    experience,
    goal,
    startingAmount: row.starting_amount ?? undefined,
  };
}
