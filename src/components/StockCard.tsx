
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StockRecommendation } from '@/types/stock-matcher';

interface StockCardProps {
  stock: StockRecommendation;
}

const StockCard = ({ stock }: StockCardProps) => {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  return (
    <Card className="w-full shadow-xl border-0 bg-white overflow-hidden">
      <CardContent className="p-0">
        {/* Header with company info */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold">{stock.companyName}</h2>
              <p className="text-blue-100 font-medium">({stock.ticker})</p>
            </div>
            <Badge className={`${getRiskColor(stock.riskLevel)} font-semibold`}>
              {getRiskEmoji(stock.riskLevel)} {stock.riskLevel.toUpperCase()}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <span>🏢</span>
            <span className="text-blue-100">{stock.sector}</span>
          </div>
        </div>

        {/* CEO Section with Stylish Initials */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
              <span className="text-white font-bold text-xl tracking-wide">
                {getCeoInitials(stock.ceoName)}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{stock.ceoName}</h3>
              <p className="text-sm text-gray-600">Chief Executive Officer</p>
              <p className="text-xs text-gray-500">{stock.companyName}</p>
            </div>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {stock.ceoHighlights}
          </p>
        </div>

        {/* Financials */}
        <div className="p-6 border-b">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>💰</span>
            Key Financials
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">P/E Ratio</p>
              <p className="font-bold text-blue-600">{stock.peRatio}</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Market Cap</p>
              <p className="font-bold text-purple-600">{stock.marketCap}</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">1-Year Return</p>
              <p className={`font-bold ${stock.oneYearReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stock.oneYearReturn > 0 ? '+' : ''}{stock.oneYearReturn.toFixed(1)}%
              </p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Price/Share</p>
              <p className="font-bold text-orange-600">{formatNumber(stock.pricePerShare)}</p>
            </div>
          </div>
          
          {stock.dividendYield > 0 && (
            <div className="mt-4 text-center p-3 bg-yellow-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Dividend Yield</p>
              <p className="font-bold text-yellow-600">{stock.dividendYield.toFixed(2)}%</p>
            </div>
          )}
        </div>

        {/* Why it fits */}
        <div className="p-6">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span>💡</span>
            Why this fits you
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed bg-blue-50 p-4 rounded-lg">
            {stock.whyItFits}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockCard;
