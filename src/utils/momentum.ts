// Describes a stock's 1-year price change. Deliberately not a buy/sell rating: the app is
// educational, and this is computed from past returns only, not from analysts.
export type MomentumTone = 'strong' | 'positive' | 'flat' | 'negative';

export interface Momentum {
  label: string;
  tone: MomentumTone;
  barColor: string;
  textColor: string;
  badgeClass: string;
  width: string;
}

export function getMomentum(oneYearReturn: number): Momentum {
  if (oneYearReturn > 15) {
    return { label: 'Strong momentum', tone: 'strong', barColor: 'bg-emerald-500', textColor: 'text-emerald-600',
      badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', width: '90%' };
  }
  if (oneYearReturn > 5) {
    return { label: 'Positive momentum', tone: 'positive', barColor: 'bg-green-400', textColor: 'text-green-600',
      badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', width: '70%' };
  }
  if (oneYearReturn > -5) {
    return { label: 'Flat', tone: 'flat', barColor: 'bg-yellow-400', textColor: 'text-yellow-600',
      badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', width: '50%' };
  }
  return { label: 'Negative momentum', tone: 'negative', barColor: 'bg-red-500', textColor: 'text-red-600',
    badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', width: '20%' };
}
