
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StockRecommendation } from '@/types/stock-matcher';
import { Eye, Star, Leaf } from 'lucide-react';

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

  const getCeoInitials = (ceoName: string) => {
    return ceoName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getESGRating = (score: number) => {
    if (score >= 80) return { rating: 'A+', color: 'text-green-600 dark:text-green-400' };
    if (score >= 70) return { rating: 'A', color: 'text-green-600 dark:text-green-400' };
    if (score >= 60) return { rating: 'B+', color: 'text-blue-600 dark:text-blue-400' };
    if (score >= 50) return { rating: 'B', color: 'text-yellow-600 dark:text-yellow-400' };
    return { rating: 'C', color: 'text-red-600 dark:text-red-400' };
  };

  const analystRating = stock.oneYearReturn > 15 ? 'Strong Buy' : stock.oneYearReturn > 5 ? 'Buy' : stock.oneYearReturn > -5 ? 'Hold' : 'Sell';
  const esgRating = getESGRating(stock.esgScore || 70);

  return (
    <Card className="w-full max-w-md md:max-w-xl lg:max-w-3xl xl:max-w-4xl mx-auto shadow-xl border-0 bg-card overflow-hidden overflow-y-auto">
      <CardContent className="p-0">
        {/* Header with company info - Compact on mobile */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 text-white p-2.5 sm:p-4 lg:p-4">
          <div className="flex justify-between items-start mb-1.5 sm:mb-3 lg:mb-4">
            <div className="min-w-0 flex-1 mr-2">
              <h2 className="text-sm sm:text-lg lg:text-2xl font-bold truncate">{stock.companyName}</h2>
              <p className="text-blue-100 dark:text-blue-200 font-medium text-xs sm:text-sm lg:text-base">({stock.ticker})</p>
            </div>
            <div className="flex flex-col gap-1 sm:gap-2 sm:flex-row sm:items-center">
              <Badge className={`${getRiskColor(stock.riskLevel)} font-semibold text-[10px] sm:text-xs whitespace-nowrap`}>
                {getRiskEmoji(stock.riskLevel)} {stock.riskLevel.toUpperCase()}
              </Badge>
              {onViewDetails && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onViewDetails(stock)}
                  className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white border-0 text-[10px] sm:text-xs h-6 sm:h-8 px-1.5 sm:px-2"
                >
                  <Eye className="w-3 h-3" />
                  <span className="hidden sm:inline">Details</span>
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <span>🏢</span>
            <span className="text-blue-100 dark:text-blue-200">{stock.sector}</span>
          </div>
        </div>

        {/* Expert Insights Banner - Compact on mobile */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-2 sm:p-3 border-b dark:border-gray-700">
          <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1.5 sm:gap-2 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex items-center gap-1 sm:gap-2">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 flex-shrink-0" />
                <span className="text-[10px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300">Analyst:</span>
                <Badge className={`${analystRating.includes('Buy') ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                  analystRating === 'Hold' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'} text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1`}>
                  {analystRating}
                </Badge>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <Leaf className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                <span className="text-[10px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300">ESG:</span>
                <span className={`font-bold text-[10px] sm:text-xs ${esgRating.color}`}>{esgRating.rating}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CEO Section - Compact on mobile */}
        <div className="p-2.5 sm:p-4 lg:p-4 border-b bg-gray-50 dark:bg-gray-700/50 dark:border-gray-700">
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-5 mb-2 sm:mb-3">
            <div className="w-10 h-10 sm:w-14 sm:h-14 lg:w-20 lg:h-20 bg-gradient-to-br from-slate-600 to-slate-800 dark:from-slate-500 dark:to-slate-700 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-600 flex-shrink-0">
              <span className="text-white font-bold text-sm sm:text-base lg:text-2xl tracking-wide">
                {getCeoInitials(stock.ceoName)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white text-xs sm:text-base lg:text-xl truncate">{stock.ceoName}</h3>
              <p className="text-[10px] sm:text-xs lg:text-base text-gray-600 dark:text-gray-400">CEO</p>
              <p className="text-[9px] sm:text-xs lg:text-sm text-gray-500 dark:text-gray-500 truncate">{stock.companyName}</p>
            </div>
          </div>
          <p className="text-[10px] sm:text-xs lg:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
            {stock.ceoHighlights}
          </p>
        </div>

        {/* Financials - Compact on mobile */}
        <div className="p-2.5 sm:p-4 lg:p-4 border-b dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3 lg:mb-4 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm lg:text-lg">
            <span>💰</span>
            Key Financials
          </h4>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-3">
            <div className="text-center p-2 sm:p-3 lg:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-[10px] sm:text-xs lg:text-base text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">P/E Ratio</p>
              <p className="font-bold text-xs sm:text-sm lg:text-lg text-blue-600 dark:text-blue-400">{stock.peRatio}</p>
            </div>
            <div className="text-center p-2 sm:p-3 lg:p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-[10px] sm:text-xs lg:text-base text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">Market Cap</p>
              <p className="font-bold text-xs sm:text-sm lg:text-lg text-purple-600 dark:text-purple-400">{stock.marketCap}</p>
            </div>
            <div className="text-center p-2 sm:p-3 lg:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-[10px] sm:text-xs lg:text-base text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">1-Year Return</p>
              <p className={`font-bold text-xs sm:text-sm lg:text-lg ${stock.oneYearReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {stock.oneYearReturn > 0 ? '+' : ''}{stock.oneYearReturn.toFixed(1)}%
              </p>
            </div>
            <div className="text-center p-2 sm:p-3 lg:p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <p className="text-[10px] sm:text-xs lg:text-base text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">Price/Share</p>
              <p className="font-bold text-xs sm:text-sm lg:text-lg text-orange-600 dark:text-orange-400">{formatNumber(stock.pricePerShare)}</p>
            </div>
          </div>
          
          {stock.dividendYield > 0 && (
            <div className="mt-2 sm:mt-3 lg:mt-4 col-span-2 text-center p-2 sm:p-3 lg:p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-[10px] sm:text-xs lg:text-base text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">Dividend Yield</p>
              <p className="font-bold text-xs sm:text-sm lg:text-lg text-yellow-600 dark:text-yellow-400">{stock.dividendYield.toFixed(2)}%</p>
            </div>
          )}
        </div>

        {/* Why it fits - Compact on mobile */}
        <div className="p-2.5 sm:p-4 lg:p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm lg:text-lg">
            <span>💡</span>
            Why this fits you
          </h4>
          <p className="text-[10px] sm:text-xs lg:text-base text-gray-700 dark:text-gray-300 leading-relaxed bg-blue-50 dark:bg-blue-900/20 p-2.5 sm:p-4 lg:p-4 rounded-lg">
            {stock.whyItFits}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockCard;
