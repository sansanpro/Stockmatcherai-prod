import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { BarChart, Heart, X, TrendingUp, PieChart, Shield, Target, TrendingDown } from 'lucide-react';
import { PieChart as RechartsPieChart, Cell, ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Pie } from 'recharts';

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

  // Portfolio diversification analysis
  const sectorChartData = Object.entries(sectorDistribution).map(([sector, count]) => ({
    name: sector,
    value: count,
    percentage: ((count / watchlist.length) * 100).toFixed(1)
  }));

  const riskChartData = Object.entries(riskDistribution).map(([risk, count]) => ({
    name: risk.charAt(0).toUpperCase() + risk.slice(1),
    value: count,
    percentage: ((count / watchlist.length) * 100).toFixed(1)
  }));

  const COLORS = {
    sector: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316'],
    risk: { Low: '#10B981', Medium: '#F59E0B', High: '#EF4444' }
  };

  const diversificationScore = Math.min(100, (Object.keys(sectorDistribution).length * 20));
  const riskScore = riskDistribution.low ? 85 : riskDistribution.medium ? 65 : 35;

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

      {/* Portfolio Analysis Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <PieChart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold dark:text-white">Diversification</span>
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              {diversificationScore}/100
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300">
              {diversificationScore >= 80 ? 'Excellent' : diversificationScore >= 60 ? 'Good' : 'Needs Improvement'}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="font-semibold dark:text-white">Risk Score</span>
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
              {riskScore}/100
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300">
              {riskScore >= 80 ? 'Conservative' : riskScore >= 50 ? 'Moderate' : 'Aggressive'}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="font-semibold dark:text-white">Avg Return</span>
            </div>
            <div className={`text-2xl font-bold mb-1 ${
              avgReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {avgReturn > 0 ? '+' : ''}{avgReturn.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300">1-Year Performance</div>
          </CardContent>
        </Card>
      </div>

      {/* Diversification Charts */}
      {watchlist.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Sector Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={sectorChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {sectorChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.sector[index % COLORS.sector.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} stocks`, name]} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {sectorChartData.map((sector, index) => (
                  <div key={sector.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: COLORS.sector[index % COLORS.sector.length] }}
                      />
                      <span className="dark:text-gray-300">{sector.name}</span>
                    </div>
                    <span className="font-semibold dark:text-white">{sector.percentage}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Risk Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={riskChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} stocks`]} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {riskChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.risk[entry.name as keyof typeof COLORS.risk]} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                  {avgReturn >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {avgReturn > 0 ? '+' : ''}{avgReturn.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">Sectors Covered</span>
                <span className="font-semibold dark:text-white">{Object.keys(sectorDistribution).length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Portfolio Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Diversification:</strong> {diversificationScore >= 80 
                    ? 'Your portfolio shows excellent sector diversification.' 
                    : diversificationScore >= 60 
                    ? 'Consider adding stocks from different sectors for better diversification.'
                    : 'Your portfolio needs more diversification across sectors.'}
                </p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-300">
                  <strong>Risk Profile:</strong> {riskScore >= 80 
                    ? 'Conservative approach with focus on stable investments.' 
                    : riskScore >= 50 
                    ? 'Balanced risk profile with moderate growth potential.'
                    : 'Aggressive strategy with higher risk and potential returns.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {watchlist.length === 0 && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-8 text-center">
            <PieChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Data Yet</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Start swiping on stocks to see your portfolio analytics and diversification insights.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Analytics;
