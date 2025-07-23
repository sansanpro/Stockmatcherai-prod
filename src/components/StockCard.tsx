
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
    <Card className="w-full shadow-xl border-0 bg-card overflow-hidden">
      <CardContent className="p-0">
        {/* Header with company info */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 text-white p-4 sm:p-6">
          <div className="flex justify-between items-start mb-3 sm:mb-4">
            <div className="min-w-0 flex-1 mr-2">
              <h2 className="text-lg sm:text-xl font-bold truncate">{stock.companyName}</h2>
              <p className="text-blue-100 dark:text-blue-200 font-medium text-sm">({stock.ticker})</p>
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
          
          <div className="flex items-center gap-2 text-sm">
            <span>🏢</span>
            <span className="text-blue-100 dark:text-blue-200">{stock.sector}</span>
          </div>
        </div>

        {/* Expert Insights Banner */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-3 sm:p-4 border-b dark:border-gray-700">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Analyst:</span>
                <Badge className={`${analystRating.includes('Buy') ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                  analystRating === 'Hold' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'} text-[10px] sm:text-xs px-2 py-1`}>
                  {analystRating}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">ESG:</span>
                <span className={`font-bold text-xs sm:text-sm ${esgRating.color}`}>{esgRating.rating}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CEO Section with Stylish Initials */}
        <div className="p-4 sm:p-6 border-b bg-gray-50 dark:bg-gray-700/50 dark:border-gray-700">
          <div className="flex items-center gap-3 sm:gap-4 mb-3">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-600 to-slate-800 dark:from-slate-500 dark:to-slate-700 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-600 flex-shrink-0">
              <span className="text-white font-bold text-sm sm:text-xl tracking-wide">
                {getCeoInitials(stock.ceoName)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg truncate">{stock.ceoName}</h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Chief Executive Officer</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 truncate">{stock.companyName}</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {stock.ceoHighlights}
          </p>
        </div>

        {/* Financials */}
        <div className="p-4 sm:p-6 border-b dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
            <span>💰</span>
            Key Financials
          </h4>
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div className="text-center p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mb-1">P/E Ratio</p>
              <p className="font-bold text-xs sm:text-sm text-blue-600 dark:text-blue-400">{stock.peRatio}</p>
            </div>
            <div className="text-center p-2 sm:p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mb-1">Market Cap</p>
              <p className="font-bold text-xs sm:text-sm text-purple-600 dark:text-purple-400">{stock.marketCap}</p>
            </div>
            <div className="text-center p-2 sm:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mb-1">1-Year Return</p>
              <p className={`font-bold text-xs sm:text-sm ${stock.oneYearReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {stock.oneYearReturn > 0 ? '+' : ''}{stock.oneYearReturn.toFixed(1)}%
              </p>
            </div>
            <div className="text-center p-2 sm:p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mb-1">Price/Share</p>
              <p className="font-bold text-xs sm:text-sm text-orange-600 dark:text-orange-400">{formatNumber(stock.pricePerShare)}</p>
            </div>
          </div>
          
          {stock.dividendYield > 0 && (
            <div className="mt-2 sm:mt-4 col-span-2 text-center p-2 sm:p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mb-1">Dividend Yield</p>
              <p className="font-bold text-xs sm:text-sm text-yellow-600 dark:text-yellow-400">{stock.dividendYield.toFixed(2)}%</p>
            </div>
          )}
        </div>

        {/* Why it fits */}
        <div className="p-4 sm:p-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm sm:text-base">
            <span>💡</span>
            Why this fits you
          </h4>
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg">
            {stock.whyItFits}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockCard;
