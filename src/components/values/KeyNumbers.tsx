import EducationalTooltip from '@/components/EducationalTooltip';
import type { StockRecommendation } from '@/types/stock-matcher';

// Plain-English meanings: the full text behind each "?", and a short line shown under the
// number for people who have never bought a stock
const HELP = {
  price: { full: 'What one share costs right now. Many brokers let you buy a slice of a share.', short: 'Cost of one share' },
  pastYear: { full: "How much the share price changed over the last 12 months. Past moves don't predict future ones.", short: 'Change over 12 months' },
  marketCap: { full: 'What the whole company is worth on the stock market: the share price times the number of shares.', short: 'What the whole company is worth' },
  pe: { full: "The share price divided by a year of profit per share. Higher usually means investors expect more growth. Shown as — when the company had no profit.", short: 'Price compared with profit' },
  dividend: { full: 'Cash the company pays its shareholders each year, as a percentage of the share price.', short: 'Yearly cash paid to owners' },
};

// Risk in plain words (from the company's size and how much its stock usually moves)
export const RISK_WORDS: Record<StockRecommendation['riskLevel'], { emoji: string; text: string }> = {
  low: { emoji: '🟢', text: 'Steadier: a large, established company' },
  medium: { emoji: '🟡', text: 'Moderate price swings' },
  high: { emoji: '🔴', text: 'Bigger price swings' },
};
const RISK_HELP = "Based on the company's size and how much its stock has usually moved. Any stock can lose value.";

const formatPrice = (n: number) => (n > 0 ? `$${n.toFixed(2)}` : '—');

interface KeyNumbersProps {
  stock: StockRecommendation;
  price: number; // live price
  explain?: boolean; // show the short meaning under each number
}

const Stat = ({ label, value, help, explain, valueClass = '' }: {
  label: string; value: string; help: { full: string; short: string }; explain?: boolean; valueClass?: string;
}) => (
  <div className="rounded-xl bg-muted/60 dark:bg-gray-700/40 p-3">
    <div className="flex items-center text-xs text-muted-foreground font-medium">
      {label}
      <EducationalTooltip content={help.full} label={`What is ${label}?`} />
    </div>
    <p className={`text-lg font-bold mt-0.5 ${valueClass || 'text-gray-900 dark:text-white'}`}>{value}</p>
    {explain && <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{help.short}</p>}
  </div>
);

// The numbers, last on the card, each with a plain-English explanation
const KeyNumbers = ({ stock, price, explain = false }: KeyNumbersProps) => {
  const change = stock.oneYearReturn;
  const risk = RISK_WORDS[stock.riskLevel] ?? RISK_WORDS.medium;
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">The numbers</p>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Share price" value={formatPrice(price)} help={HELP.price} explain={explain} />
        <Stat label="Past year" value={`${change > 0 ? '+' : ''}${change.toFixed(1)}%`} help={HELP.pastYear} explain={explain}
          valueClass={change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} />
        <Stat label="Market Cap" value={stock.marketCap || '—'} help={HELP.marketCap} explain={explain} />
        <Stat label="P/E Ratio" value={stock.peRatio > 0 ? stock.peRatio.toFixed(1) : '—'} help={HELP.pe} explain={explain} />
        {stock.dividendYield > 0 && (
          <Stat label="Dividend" value={`${stock.dividendYield.toFixed(2)}%`} help={HELP.dividend} explain={explain} />
        )}
      </div>
      <div className="flex items-center gap-1 mt-2 text-sm text-gray-700 dark:text-gray-300">
        <span aria-hidden>{risk.emoji}</span> {risk.text}
        <EducationalTooltip content={RISK_HELP} label="How is this decided?" />
      </div>
    </div>
  );
};

export default KeyNumbers;
