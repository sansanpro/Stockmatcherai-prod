
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StockRecommendation } from '@/types/stock-matcher';
import { TrendingUp, TrendingDown, Star, Globe, Leaf, Users, Eye, Heart, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StockDetailsModalProps {
  stock: StockRecommendation | null;
  isOpen: boolean;
  onClose: () => void;
  onMatch: (stock: StockRecommendation) => void;
  onPass: (stock: StockRecommendation) => void;
}

const StockDetailsModal = ({ stock, isOpen, onClose, onMatch, onPass }: StockDetailsModalProps) => {
  const [news, setNews] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);

  useEffect(() => {
    if (stock && isOpen) {
      // Generate mock performance data
      const data = [];
      for (let i = 11; i >= 0; i--) {
        const baseReturn = stock.oneYearReturn;
        const monthReturn = baseReturn + (Math.random() - 0.5) * 20;
        data.push({
          month: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short' }),
          return: monthReturn,
          price: stock.pricePerShare * (1 + monthReturn / 100)
        });
      }
      setPerformanceData(data);

      // Generate mock news
      const mockNews = [
        {
          title: `${stock.companyName} Reports Strong Q4 Earnings`,
          summary: `${stock.companyName} exceeded analyst expectations with robust growth across key segments.`,
          source: 'Financial Times',
          time: '2 hours ago',
          sentiment: 'positive'
        },
        {
          title: `Analysts Upgrade ${stock.ticker} Price Target`,
          summary: `Multiple firms raise price targets following strong performance indicators.`,
          source: 'Reuters',
          time: '5 hours ago',
          sentiment: 'positive'
        },
        {
          title: `${stock.sector} Sector Outlook Remains Positive`,
          summary: `Industry trends continue to favor companies like ${stock.companyName}.`,
          source: 'MarketWatch',
          time: '1 day ago',
          sentiment: 'neutral'
        }
      ];
      setNews(mockNews);
    }
  }, [stock, isOpen]);

  if (!stock) return null;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'high': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400';
    }
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between dark:text-white">
            <div className="flex items-center gap-3">
              <span>{stock.companyName}</span>
              <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                {stock.ticker}
              </Badge>
              <Badge className={getRiskColor(stock.riskLevel)}>
                {stock.riskLevel.toUpperCase()}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 dark:bg-gray-700">
            <TabsTrigger value="overview" className="dark:data-[state=active]:bg-gray-600">Overview</TabsTrigger>
            <TabsTrigger value="financials" className="dark:data-[state=active]:bg-gray-600">Financials</TabsTrigger>
            <TabsTrigger value="performance" className="dark:data-[state=active]:bg-gray-600">Performance</TabsTrigger>
            <TabsTrigger value="news" className="dark:data-[state=active]:bg-gray-600">News & ESG</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="dark:bg-gray-700 dark:border-gray-600">
                <CardHeader>
                  <CardTitle className="text-lg dark:text-white">Company Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Sector</span>
                    <span className="font-semibold dark:text-white">{stock.sector}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">CEO</span>
                    <span className="font-semibold dark:text-white">{stock.ceoName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Market Cap</span>
                    <span className="font-semibold dark:text-white">{stock.marketCap}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Current Price</span>
                    <span className="font-semibold dark:text-white">${stock.pricePerShare.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-700 dark:border-gray-600">
                <CardHeader>
                  <CardTitle className="text-lg dark:text-white">Expert Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Analyst Rating</span>
                    <Badge className={`${analystRating.includes('Buy') ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 
                      analystRating === 'Hold' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' : 
                      'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>
                      {analystRating}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">ESG Rating</span>
                    <div className="flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className={`font-bold ${esgRating.color}`}>{esgRating.rating}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Recommendation</span>
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(i => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i <= (stock.oneYearReturn > 10 ? 5 : stock.oneYearReturn > 0 ? 4 : 3) 
                            ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`} 
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="dark:bg-gray-700 dark:border-gray-600">
              <CardHeader>
                <CardTitle className="text-lg dark:text-white">Why This Matches You</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{stock.whyItFits}</p>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-700 dark:border-gray-600">
              <CardHeader>
                <CardTitle className="text-lg dark:text-white">CEO Leadership</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{stock.ceoHighlights}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financials" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="dark:bg-gray-700 dark:border-gray-600">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">P/E Ratio</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stock.peRatio}</p>
                </CardContent>
              </Card>
              <Card className="dark:bg-gray-700 dark:border-gray-600">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Market Cap</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stock.marketCap}</p>
                </CardContent>
              </Card>
              <Card className="dark:bg-gray-700 dark:border-gray-600">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Dividend Yield</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stock.dividendYield.toFixed(2)}%</p>
                </CardContent>
              </Card>
              <Card className="dark:bg-gray-700 dark:border-gray-600">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">1Y Return</p>
                  <p className={`text-2xl font-bold ${stock.oneYearReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {stock.oneYearReturn > 0 ? '+' : ''}{stock.oneYearReturn.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card className="dark:bg-gray-700 dark:border-gray-600">
              <CardHeader>
                <CardTitle className="text-lg dark:text-white">12-Month Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: any, name: string) => [
                          name === 'return' ? `${value.toFixed(1)}%` : `$${value.toFixed(2)}`,
                          name === 'return' ? 'Return' : 'Price'
                        ]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="news" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="dark:bg-gray-700 dark:border-gray-600">
                <CardHeader>
                  <CardTitle className="text-lg dark:text-white flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Recent News
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {news.map((item, index) => (
                    <div key={index} className="border-b dark:border-gray-600 pb-3 last:border-b-0">
                      <h4 className="font-semibold text-sm dark:text-white mb-1">{item.title}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">{item.summary}</p>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 dark:text-gray-400">{item.source}</span>
                        <span className="text-gray-500 dark:text-gray-400">{item.time}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-700 dark:border-gray-600">
                <CardHeader>
                  <CardTitle className="text-lg dark:text-white flex items-center gap-2">
                    <Leaf className="w-5 h-5" />
                    ESG Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Environmental</span>
                      <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${Math.min(100, (stock.esgScore || 70) + 10)}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Social</span>
                      <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${Math.min(100, (stock.esgScore || 70) - 5)}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Governance</span>
                      <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full" 
                          style={{ width: `${Math.min(100, (stock.esgScore || 70) + 5)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-300">
                      <strong>ESG Highlight:</strong> {stock.companyName} demonstrates strong commitment to sustainable practices and ethical governance standards.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-center gap-4 pt-4 border-t dark:border-gray-600">
          <Button
            onClick={() => {
              onPass(stock);
              onClose();
            }}
            variant="outline"
            className="flex items-center gap-2 dark:border-gray-600 dark:text-gray-300"
          >
            <X className="w-4 h-4" />
            Pass
          </Button>
          <Button
            onClick={() => {
              onMatch(stock);
              onClose();
            }}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Heart className="w-4 h-4" />
            Add to Watchlist
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StockDetailsModal;
