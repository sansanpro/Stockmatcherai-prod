import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StockRecommendation } from '@/types/stock-matcher';
import { Eye } from 'lucide-react';
import StockNewsPill from '@/components/StockNewsPill';
import CompanyLogo from '@/components/values/CompanyLogo';
import CauseChips, { causeGradient } from '@/components/values/CauseChips';
import { RISK_WORDS } from '@/components/values/KeyNumbers';

interface StockCardProps {
  stock: StockRecommendation;
  onViewDetails?: (stock: StockRecommendation) => void;
}

// A liked company in Likes: what it works on and which of your causes it matches. The full
// picture (proof, things to know, every number, news) is one tap away in Details.
const StockCard = ({ stock, onViewDetails }: StockCardProps) => {
  const risk = RISK_WORDS[stock.riskLevel] ?? RISK_WORDS.medium;
  const change = stock.oneYearReturn;
  const story = stock.missionStory || stock.whyItFits;

  return (
    <Card className="w-full overflow-hidden border-0 shadow-xl bg-card">
      <div className={`bg-gradient-to-br ${causeGradient(stock.matchedCauses?.[0]?.cause)} text-white p-4 space-y-3`}>
        <div className="flex items-center gap-3">
          <CompanyLogo src={stock.logoUrl} name={stock.companyName} ticker={stock.ticker} className="w-11 h-11" />
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold leading-tight truncate">{stock.companyName}</h3>
            <p className="text-sm text-white/80 truncate">{stock.ticker}{stock.sector ? ` · ${stock.sector}` : ''}</p>
          </div>
          {onViewDetails && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onViewDetails(stock)}
              aria-label={`View ${stock.companyName} details`}
              className="flex-shrink-0 gap-1 bg-white/20 hover:bg-white/30 text-white border-0 h-9 px-3"
            >
              <Eye className="w-4 h-4" />
              Details
            </Button>
          )}
        </div>
        <CauseChips causes={stock.matchedCauses} />
      </div>

      <div className="p-4 space-y-3">
        {story && <p className="text-sm leading-snug text-gray-800 dark:text-gray-200 line-clamp-3">{story}</p>}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {stock.pricePerShare > 0 && (
            <span>Share price <span className="font-semibold text-foreground">${stock.pricePerShare.toFixed(2)}</span></span>
          )}
          <span>
            Past year{' '}
            <span className={`font-semibold ${change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {change > 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
          </span>
          <span><span aria-hidden>{risk.emoji}</span> {risk.text}</span>
        </div>
        <StockNewsPill ticker={stock.ticker} companyName={stock.companyName} />
      </div>
    </Card>
  );
};

export default StockCard;
