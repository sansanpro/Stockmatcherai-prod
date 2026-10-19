import { Card, CardContent } from '@/components/ui/card';
import { getMomentum } from '@/utils/momentum';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StockRecommendation } from '@/types/stock-matcher';
import { Eye, Star } from 'lucide-react';
import StockNewsPill from '@/components/StockNewsPill';
import CompanySnapshot from '@/components/CompanySnapshot';

interface StockCardProps {
  stock: StockRecommendation;
  onViewDetails?: (stock: StockRecommendation) => void;
}

const StockCard = ({ stock, onViewDetails }: StockCardProps) => {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700';
      case 'high': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    }
  };

  const getRiskEmoji = (risk: string) => {
    switch (risk) {
      case 'low': return '🟢';
      case 'medium': return '🟡';
      case 'high': return '🔴';
      default: return '⚪';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(1)}B`;
    }
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    }
    return `$${num.toFixed(2)}`;
  };

  const momentum = getMomentum(stock.oneYearReturn);

  return (
    <Card className="w-full max-w-md md:max-w-xl lg:max-w-3xl xl:max-w-4xl mx-auto shadow-xl border-0 bg-card overflow-hidden max-h-[85vh] lg:max-h-[calc(100vh-10rem)] overflow-y-auto">
      <CardContent className="p-0">
        {/* Header with company info */}
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white p-4 sm:p-6 lg:p-4">
          <div className="flex justify-between items-start mb-3 sm:mb-4 lg:mb-4">
            <div className="min-w-0 flex-1 mr-2">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">{stock.companyName}</h2>
              <p className="text-blue-100 dark:text-blue-200 font-medium text-sm lg:text-base">({stock.ticker})</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Badge className={`${getRiskColor(stock.riskLevel)} font-semibold text-xs whitespace-nowrap`}>
                {getRiskEmoji(stock.riskLevel)} {stock.riskLevel.toUpperCase()}
              </Badge>
              {onViewDetails && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onViewDetails(stock)}
                  className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white border-0 text-xs h-8 px-2"
                >
                  <Eye className="w-3 h-3" />
                  Details
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span>🏢</span>
            <span className="text-blue-100 dark:text-blue-200">{stock.sector}</span>
            <StockNewsPill ticker={stock.ticker} companyName={stock.companyName} />
          </div>
        </div>

        {/* Expert Insights Banner */}
        <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20 p-3 sm:p-4 border-b border-border">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">1Y momentum:</span>
                <Badge className={`${momentum.badgeClass} text-[10px] sm:text-xs px-2 py-1`}>
                  {momentum.label}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Company Snapshot */}
        <CompanySnapshot 
          ticker={stock.ticker} 
          companyName={stock.companyName} 
          sector={stock.sector}
          variant="compact" 
        />

        {/* Financials */}
        <div className="p-4 sm:p-6 lg:p-4 border-b border-border">
          <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base">
            <span>💰</span>
            Key Financials
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-100 dark:border-violet-800/30">
              <p className="text-xs text-muted-foreground mb-1">P/E Ratio</p>
              <p className="font-bold text-sm text-violet-600 dark:text-violet-400">{stock.peRatio}</p>
            </div>
            <div className="text-center p-3 bg-fuchsia-50 dark:bg-fuchsia-900/20 rounded-xl border border-fuchsia-100 dark:border-fuchsia-800/30">
              <p className="text-xs text-muted-foreground mb-1">Market Cap</p>
              <p className="font-bold text-sm text-fuchsia-600 dark:text-fuchsia-400">{stock.marketCap}</p>
            </div>
            <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
              <p className="text-xs text-muted-foreground mb-1">1-Year Return</p>
              <p className={`font-bold text-sm ${stock.oneYearReturn >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                {stock.oneYearReturn > 0 ? '+' : ''}{stock.oneYearReturn.toFixed(1)}%
              </p>
            </div>
            <div className="text-center p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl border border-cyan-100 dark:border-cyan-800/30">
              <p className="text-xs text-muted-foreground mb-1">Price/Share</p>
              <p className="font-bold text-sm text-cyan-600 dark:text-cyan-400">{formatNumber(stock.pricePerShare)}</p>
            </div>
          </div>

          {stock.dividendYield > 0 && (
            <div className="mt-3 text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/30">
              <p className="text-xs text-muted-foreground mb-1">Dividend Yield</p>
              <p className="font-bold text-sm text-amber-600 dark:text-amber-400">{stock.dividendYield.toFixed(2)}%</p>
            </div>
          )}
        </div>

        {/* Why it fits */}
        <div className="p-4 sm:p-6 lg:p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base">
            <span>💡</span>
            Why this fits you
          </h4>
          <p className="text-xs sm:text-sm leading-relaxed bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10 p-4 rounded-xl">
            {stock.whyItFits}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockCard;
