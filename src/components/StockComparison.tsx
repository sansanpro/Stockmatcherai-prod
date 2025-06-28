
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StockRecommendation } from '@/types/stock-matcher';
import { useApp } from '@/contexts/AppContext';
import { BarChart, TrendingUp, TrendingDown, Star, Scale, X } from 'lucide-react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface StockComparisonProps {
  availableStocks: StockRecommendation[];
}

const StockComparison = ({ availableStocks }: StockComparisonProps) => {
  const [selectedStocks, setSelectedStocks] = useState<StockRecommendation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { watchlist } = useApp();

  const allStocks = [...watchlist, ...availableStocks];
  const uniqueStocks = allStocks.filter((stock, index, self) => 
    index === self.findIndex(s => s.id === stock.id)
  );

  const addStockToComparison = (stockId: string) => {
    if (selectedStocks.length >= 3) return;
    
    const stock = uniqueStocks.find(s => s.id === stockId);
    if (stock && !selectedStocks.find(s => s.id === stock.id)) {
      setSelectedStocks([...selectedStocks, stock]);
    }
  };

  const removeStockFromComparison = (stockId: string) => {
    setSelectedStocks(selectedStocks.filter(s => s.id !== stockId));
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'high': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const comparisonData = [
    {
      metric: 'P/E Ratio',
      ...selectedStocks.reduce((acc, stock, index) => ({
        ...acc,
        [`stock${index}`]: stock.peRatio
      }), {})
    },
    {
      metric: '1Y Return (%)',
      ...selectedStocks.reduce((acc, stock, index) => ({
        ...acc,
        [`stock${index}`]: stock.oneYearReturn
      }), {})
    },
    {
      metric: 'Dividend Yield (%)',
      ...selectedStocks.reduce((acc, stock, index) => ({
        ...acc,
        [`stock${index}`]: stock.dividendYield
      }), {})
    },
    {
      metric: 'ESG Score',
      ...selectedStocks.reduce((acc, stock, index) => ({
        ...acc,
        [`stock${index}`]: stock.esgScore || 70
      }), {})
    }
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B'];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 dark:border-gray-600 dark:text-gray-300">
          <Scale className="w-4 h-4" />
          Compare Stocks
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 dark:text-white">
            <Scale className="w-5 h-5" />
            Stock Comparison Tool
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stock Selection */}
          <Card className="dark:bg-gray-700 dark:border-gray-600">
            <CardHeader>
              <CardTitle className="text-lg dark:text-white">Select Stocks to Compare (Max 3)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select onValueChange={addStockToComparison}>
                  <SelectTrigger className="dark:bg-gray-600 dark:border-gray-500">
                    <SelectValue placeholder="Choose a stock to add..." />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                    {uniqueStocks
                      .filter(stock => !selectedStocks.find(s => s.id === stock.id))
                      .map(stock => (
                        <SelectItem key={stock.id} value={stock.id} className="dark:text-white dark:focus:bg-gray-600">
                          {stock.companyName} ({stock.ticker})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                {selectedStocks.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedStocks.map(stock => (
                      <Badge 
                        key={stock.id} 
                        variant="outline" 
                        className="flex items-center gap-2 px-3 py-1 dark:border-gray-500 dark:text-gray-300"
                      >
                        {stock.ticker}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-auto p-0 hover:bg-transparent"
                          onClick={() => removeStockFromComparison(stock.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {selectedStocks.length >= 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Comparison Table */}
              <Card className="dark:bg-gray-700 dark:border-gray-600">
                <CardHeader>
                  <CardTitle className="text-lg dark:text-white">Key Metrics Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b dark:border-gray-600">
                          <th className="text-left py-2 text-gray-600 dark:text-gray-300">Metric</th>
                          {selectedStocks.map((stock, index) => (
                            <th key={stock.id} className="text-center py-2 dark:text-white">
                              {stock.ticker}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b dark:border-gray-600">
                          <td className="py-2 text-gray-600 dark:text-gray-300">Company</td>
                          {selectedStocks.map(stock => (
                            <td key={stock.id} className="text-center py-2 dark:text-white text-xs">
                              {stock.companyName}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b dark:border-gray-600">
                          <td className="py-2 text-gray-600 dark:text-gray-300">Sector</td>
                          {selectedStocks.map(stock => (
                            <td key={stock.id} className="text-center py-2 dark:text-white text-xs">
                              {stock.sector}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b dark:border-gray-600">
                          <td className="py-2 text-gray-600 dark:text-gray-300">Risk Level</td>
                          {selectedStocks.map(stock => (
                            <td key={stock.id} className="text-center py-2">
                              <Badge className={getRiskColor(stock.riskLevel)} size="sm">
                                {stock.riskLevel.toUpperCase()}
                              </Badge>
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b dark:border-gray-600">
                          <td className="py-2 text-gray-600 dark:text-gray-300">Price</td>
                          {selectedStocks.map(stock => (
                            <td key={stock.id} className="text-center py-2 dark:text-white font-semibold">
                              ${stock.pricePerShare.toFixed(2)}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b dark:border-gray-600">
                          <td className="py-2 text-gray-600 dark:text-gray-300">Market Cap</td>
                          {selectedStocks.map(stock => (
                            <td key={stock.id} className="text-center py-2 dark:text-white">
                              {stock.marketCap}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b dark:border-gray-600">
                          <td className="py-2 text-gray-600 dark:text-gray-300">P/E Ratio</td>
                          {selectedStocks.map(stock => (
                            <td key={stock.id} className="text-center py-2 dark:text-white">
                              {stock.peRatio}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b dark:border-gray-600">
                          <td className="py-2 text-gray-600 dark:text-gray-300">1Y Return</td>
                          {selectedStocks.map(stock => (
                            <td key={stock.id} className="text-center py-2">
                              <div className={`flex items-center justify-center gap-1 ${
                                stock.oneYearReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                              }`}>
                                {stock.oneYearReturn >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {stock.oneYearReturn > 0 ? '+' : ''}{stock.oneYearReturn.toFixed(1)}%
                              </div>
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-2 text-gray-600 dark:text-gray-300">Dividend Yield</td>
                          {selectedStocks.map(stock => (
                            <td key={stock.id} className="text-center py-2 dark:text-white">
                              {stock.dividendYield.toFixed(2)}%
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Visual Comparison Chart */}
              <Card className="dark:bg-gray-700 dark:border-gray-600">
                <CardHeader>
                  <CardTitle className="text-lg dark:text-white">Performance Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="metric" 
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          interval={0}
                        />
                        <YAxis />
                        <Tooltip />
                        {selectedStocks.map((stock, index) => (
                          <Bar 
                            key={stock.id}
                            dataKey={`stock${index}`}
                            fill={COLORS[index]}
                            name={stock.ticker}
                          />
                        ))}
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Comparison Insights */}
          {selectedStocks.length >= 2 && (
            <Card className="dark:bg-gray-700 dark:border-gray-600">
              <CardHeader>
                <CardTitle className="text-lg dark:text-white">Comparison Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Best Performer (1Y)</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {(() => {
                        const bestStock = selectedStocks.reduce((best, current) => 
                          current.oneYearReturn > best.oneYearReturn ? current : best
                        );
                        return `${bestStock.companyName} (${bestStock.ticker}) leads with ${bestStock.oneYearReturn > 0 ? '+' : ''}${bestStock.oneYearReturn.toFixed(1)}% return`;
                      })()}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">Highest Dividend</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {(() => {
                        const bestDividend = selectedStocks.reduce((best, current) => 
                          current.dividendYield > best.dividendYield ? current : best
                        );
                        return `${bestDividend.companyName} (${bestDividend.ticker}) offers ${bestDividend.dividendYield.toFixed(2)}% dividend yield`;
                      })()}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">Lowest Risk</h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      {(() => {
                        const lowestRisk = selectedStocks.find(s => s.riskLevel === 'low') || 
                                          selectedStocks.find(s => s.riskLevel === 'medium') || 
                                          selectedStocks[0];
                        return `${lowestRisk.companyName} (${lowestRisk.ticker}) has ${lowestRisk.riskLevel} risk profile`;
                      })()}
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Best Value</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      {(() => {
                        const bestValue = selectedStocks.reduce((best, current) => 
                          current.peRatio < best.peRatio ? current : best
                        );
                        return `${bestValue.companyName} (${bestValue.ticker}) has lowest P/E ratio at ${bestValue.peRatio}`;
                      })()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedStocks.length < 2 && (
            <Card className="dark:bg-gray-700 dark:border-gray-600">
              <CardContent className="p-8 text-center">
                <Scale className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Select Stocks to Compare</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Choose at least 2 stocks from your watchlist or available stocks to see detailed comparisons.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StockComparison;
