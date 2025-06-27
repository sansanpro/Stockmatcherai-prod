
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { BarChart, Heart, X, TrendingUp } from 'lucide-react';

const Analytics = () => {
  const { swipeStats, watchlist } = useApp();

  const sectorDistribution = watchlist.reduce((acc, stock) => {
    acc[stock.sector] = (acc[stock.sector] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const riskDistribution = watchlist.reduce((acc, stock) => {
    acc[stock.riskLevel] = (acc[stock.riskLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgReturn = watchlist.length > 0 
    ? watchlist.reduce((sum, stock) => sum + stock.oneYearReturn, 0) / watchlist.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Analytics</h2>
      </div>

      {/* Swipe Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              {swipeStats.totalSwipes}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Total Swipes</div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Heart className="w-5 h-5 text-green-600 dark:text-green-400 fill-current" />
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                {swipeStats.matches}
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Matches</div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <X className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                {swipeStats.passes}
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Passes</div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
              {swipeStats.matchRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Match Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Watchlist Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">Total Stocks</span>
                <span className="font-semibold dark:text-white">{watchlist.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">Avg. 1-Year Return</span>
                <span className={`font-semibold flex items-center gap-1 ${
                  avgReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  <TrendingUp className="w-4 h-4" />
                  {avgReturn > 0 ? '+' : ''}{avgReturn.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sector Distribution */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Sector Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(sectorDistribution).map(([sector, count]) => (
                <div key={sector} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">{sector}</span>
                  <span className="font-semibold dark:text-white">{count}</span>
                </div>
              ))}
              {Object.keys(sectorDistribution).length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                  No stocks in watchlist yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
