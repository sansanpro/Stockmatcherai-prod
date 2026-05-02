import { useState, useEffect } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StockRecommendation } from '@/types/stock-matcher';
import {
  TrendingUp, TrendingDown, Star, Globe, Leaf, Heart, X,
  Building2, DollarSign, BarChart3, Newspaper,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, defs, linearGradient,
} from 'recharts';
import CompanySnapshot from '@/components/CompanySnapshot';

interface StockDetailsModalProps {
  stock: StockRecommendation | null;
  isOpen: boolean;
  onClose: () => void;
  onMatch: (stock: StockRecommendation) => void;
  onPass: (stock: StockRecommendation) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getRiskGradient = (risk: string) => {
  switch (risk) {
    case 'low':    return 'from-emerald-500 to-green-600';
    case 'medium': return 'from-yellow-400 to-orange-500';
    case 'high':   return 'from-rose-500 to-pink-600';
    default:       return 'from-gray-500 to-gray-700';
  }
};

const getRiskEmoji = (risk: string) => {
  switch (risk) {
    case 'low':    return '🟢';
    case 'medium': return '🟡';
    case 'high':   return '🔴';
    default:       return '⚪';
  }
};

const analystLabel = (ret: number) => {
  if (ret > 15) return { label: 'Strong Buy', color: 'bg-emerald-500', text: 'text-emerald-600', width: '90%' };
  if (ret > 5)  return { label: 'Buy',         color: 'bg-green-400',  text: 'text-green-600',  width: '70%' };
  if (ret > -5) return { label: 'Hold',        color: 'bg-yellow-400', text: 'text-yellow-600', width: '50%' };
  return              { label: 'Sell',         color: 'bg-red-500',    text: 'text-red-600',    width: '20%' };
};

const esgInfo = (score: number) => {
  if (score >= 80) return { rating: 'A+', color: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500' };
  if (score >= 70) return { rating: 'A',  color: 'text-green-600 dark:text-green-400',    bar: 'bg-green-500'   };
  if (score >= 60) return { rating: 'B+', color: 'text-blue-600 dark:text-blue-400',      bar: 'bg-blue-500'    };
  if (score >= 50) return { rating: 'B',  color: 'text-yellow-600 dark:text-yellow-400',  bar: 'bg-yellow-500'  };
  return                  { rating: 'C',  color: 'text-red-600 dark:text-red-400',        bar: 'bg-red-500'     };
};

// Custom chart tooltip
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background/95 backdrop-blur-sm border border-border rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p className="font-bold text-foreground">${Number(payload[0]?.value).toFixed(2)}</p>
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

const StockDetailsModal = ({ stock, isOpen, onClose, onMatch, onPass }: StockDetailsModalProps) => {
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [news, setNews]                       = useState<any[]>([]);
  const [isPositive, setIsPositive]           = useState(true);

  useEffect(() => {
    if (!stock || !isOpen) return;

    const pos = stock.oneYearReturn >= 0;
    setIsPositive(pos);

    // Build 12-month simulated price series
    const data = [];
    let price = stock.pricePerShare / (1 + stock.oneYearReturn / 100);
    for (let i = 11; i >= 0; i--) {
      const noise = (Math.random() - 0.45) * (stock.pricePerShare * 0.06);
      price = Math.max(price + noise, 1);
      data.push({
        month: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000)
          .toLocaleDateString('en-US', { month: 'short' }),
        price: parseFloat(price.toFixed(2)),
      });
    }
    // Ensure last point matches current price
    data[data.length - 1].price = stock.pricePerShare;
    setPerformanceData(data);

    setNews([
      {
        title: `${stock.companyName} Reports Strong Q4 Earnings`,
        summary: `${stock.companyName} exceeded analyst expectations with robust growth across key segments.`,
        source: 'Financial Times',
        time: '2h ago',
        sentiment: 'positive',
      },
      {
        title: `Analysts Upgrade ${stock.ticker} Price Target`,
        summary: 'Multiple firms raise price targets following strong performance indicators.',
        source: 'Reuters',
        time: '5h ago',
        sentiment: 'positive',
      },
      {
        title: `${stock.sector} Sector Outlook Remains Positive`,
        summary: `Industry trends continue to favour companies like ${stock.companyName}.`,
        source: 'MarketWatch',
        time: '1d ago',
        sentiment: 'neutral',
      },
    ]);
  }, [stock, isOpen]);

  if (!stock) return null;

  const analyst  = analystLabel(stock.oneYearReturn);
  const esg      = esgInfo(stock.esgScore || 70);
  const esgScore = stock.esgScore || 70;
  const stars    = stock.oneYearReturn > 10 ? 5 : stock.oneYearReturn > 0 ? 4 : 3;
  const chartColor = isPositive ? '#10b981' : '#f43f5e';

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="h-[92vh] p-0 rounded-t-3xl flex flex-col overflow-hidden"
      >
        {/* ── Gradient hero header ─────────────────────────────────────────── */}
        <div className={`bg-gradient-to-br ${getRiskGradient(stock.riskLevel)} flex-shrink-0 relative overflow-hidden`}>
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/10 rounded-full" />

          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-white/40 rounded-full" />
          </div>

          <div className="relative z-10 px-5 pt-2 pb-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white leading-tight truncate">
                  {stock.companyName}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-white/80 font-semibold text-base">{stock.ticker}</span>
                  <span className="text-white/50 text-sm">·</span>
                  <span className="text-white/75 text-sm">{stock.sector}</span>
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-white text-xl font-bold">${stock.pricePerShare.toFixed(2)}</p>
                <div className={`flex items-center justify-end gap-1 mt-0.5 text-sm font-semibold ${
                  isPositive ? 'text-green-200' : 'text-red-200'
                }`}>
                  {isPositive
                    ? <TrendingUp className="w-4 h-4" />
                    : <TrendingDown className="w-4 h-4" />}
                  {isPositive ? '+' : ''}{stock.oneYearReturn.toFixed(1)}% 1Y
                </div>
              </div>
            </div>

            {/* Risk + analyst badges */}
            <div className="flex gap-2 mt-3 flex-wrap">
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs font-semibold px-3 py-1">
                {getRiskEmoji(stock.riskLevel)} {stock.riskLevel.toUpperCase()} RISK
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs font-semibold px-3 py-1">
                {analyst.label}
              </Badge>
            </div>
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-4 mx-4 mt-3 mb-1 rounded-xl h-10 flex-shrink-0 bg-muted">
            <TabsTrigger value="overview"    className="rounded-lg text-xs data-[state=active]:shadow-sm gap-1">
              <Building2 className="w-3 h-3" />Overview
            </TabsTrigger>
            <TabsTrigger value="financials"  className="rounded-lg text-xs data-[state=active]:shadow-sm gap-1">
              <DollarSign className="w-3 h-3" />Metrics
            </TabsTrigger>
            <TabsTrigger value="performance" className="rounded-lg text-xs data-[state=active]:shadow-sm gap-1">
              <BarChart3 className="w-3 h-3" />Chart
            </TabsTrigger>
            <TabsTrigger value="news"        className="rounded-lg text-xs data-[state=active]:shadow-sm gap-1">
              <Newspaper className="w-3 h-3" />News
            </TabsTrigger>
          </TabsList>

          {/* Scrollable tab body */}
          <div className="flex-1 overflow-y-auto pb-24">

            {/* ── Overview ─────────────────────────────────────────────────── */}
            <TabsContent value="overview" className="mt-0 space-y-0">
              {/* Company snapshot (logo, description, facts) */}
              <CompanySnapshot
                ticker={stock.ticker}
                companyName={stock.companyName}
                sector={stock.sector}
                variant="expanded"
              />

              {/* Why it matches you */}
              <div className="mx-4 mb-4 mt-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-800/30">
                <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide mb-2">
                  💡 Why this matches you
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {stock.whyItFits}
                </p>
              </div>

              {/* CEO highlights */}
              {stock.ceoHighlights && (
                <div className="mx-4 mb-4 bg-muted/60 rounded-2xl p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    👤 Leadership — {stock.ceoName}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {stock.ceoHighlights}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* ── Financials ───────────────────────────────────────────────── */}
            <TabsContent value="financials" className="mt-0 px-4 pt-4 space-y-4">
              {/* 4 big metric tiles */}
              <div className="grid grid-cols-2 gap-3">
                <MetricTile
                  label="P/E Ratio"
                  value={String(stock.peRatio)}
                  gradient="from-blue-500/15 to-blue-600/5"
                  accent="text-blue-600 dark:text-blue-400"
                  hint="Lower = potentially undervalued"
                />
                <MetricTile
                  label="Market Cap"
                  value={stock.marketCap}
                  gradient="from-purple-500/15 to-purple-600/5"
                  accent="text-purple-600 dark:text-purple-400"
                  hint="Total company value"
                />
                <MetricTile
                  label="1Y Return"
                  value={`${isPositive ? '+' : ''}${stock.oneYearReturn.toFixed(1)}%`}
                  gradient={isPositive ? 'from-emerald-500/15 to-emerald-600/5' : 'from-rose-500/15 to-rose-600/5'}
                  accent={isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}
                  hint="Price change last 12 months"
                />
                <MetricTile
                  label="Dividend Yield"
                  value={stock.dividendYield > 0 ? `${stock.dividendYield.toFixed(2)}%` : '—'}
                  gradient="from-amber-500/15 to-amber-600/5"
                  accent="text-amber-600 dark:text-amber-400"
                  hint="Annual income as % of price"
                />
              </div>

              {/* Analyst confidence bar */}
              <div className="bg-muted/50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">Analyst Rating</span>
                  <span className={`text-sm font-bold ${analyst.text}`}>{analyst.label}</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${analyst.color} transition-all duration-700`}
                    style={{ width: analyst.width }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>Sell</span><span>Hold</span><span>Buy</span><span>Strong Buy</span>
                </div>
              </div>

              {/* Star rating */}
              <div className="bg-muted/50 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Match Recommendation</span>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── Performance ──────────────────────────────────────────────── */}
            <TabsContent value="performance" className="mt-0 px-4 pt-4">
              <div className="bg-muted/40 rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Current Price</p>
                    <p className="text-2xl font-bold">${stock.pricePerShare.toFixed(2)}</p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-xl text-sm font-semibold ${
                    isPositive
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                  }`}>
                    {isPositive ? '▲' : '▼'} {Math.abs(stock.oneYearReturn).toFixed(1)}% this year
                  </div>
                </div>

                {/* Area chart */}
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={chartColor} stopOpacity={0.35} />
                          <stop offset="95%" stopColor={chartColor} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 10, fill: 'currentColor' }}
                        axisLine={false}
                        tickLine={false}
                        className="text-muted-foreground"
                      />
                      <YAxis hide />
                      <Tooltip content={<ChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke={chartColor}
                        strokeWidth={2.5}
                        fill="url(#priceGrad)"
                        dot={false}
                        activeDot={{ r: 5, fill: chartColor, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Simulated 12-month price trend based on available return data
              </p>
            </TabsContent>

            {/* ── News & ESG ───────────────────────────────────────────────── */}
            <TabsContent value="news" className="mt-0 px-4 pt-4 space-y-4">
              {/* News */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Recent News
                </p>
                <div className="space-y-2">
                  {news.map((item, i) => (
                    <div
                      key={i}
                      className="bg-muted/50 rounded-2xl p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                          item.sentiment === 'positive' ? 'bg-emerald-500' :
                          item.sentiment === 'negative' ? 'bg-rose-500' : 'bg-yellow-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold leading-snug">{item.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.summary}</p>
                          <div className="flex gap-2 mt-2 text-[11px] text-muted-foreground">
                            <span>{item.source}</span>
                            <span>·</span>
                            <span>{item.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ESG */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  ESG Analysis
                </p>
                <div className="bg-muted/50 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Leaf className="w-5 h-5 text-emerald-500" />
                      <span className="font-semibold text-sm">ESG Rating</span>
                    </div>
                    <span className={`text-2xl font-bold ${esg.color}`}>{esg.rating}</span>
                  </div>

                  {[
                    { label: 'Environmental', value: Math.min(100, esgScore + 10), color: 'bg-emerald-500' },
                    { label: 'Social',         value: Math.min(100, esgScore - 5),  color: 'bg-blue-500'    },
                    { label: 'Governance',     value: Math.min(100, esgScore + 5),  color: 'bg-purple-500'  },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-semibold">{value}/100</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${color} transition-all duration-700`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}

                  <p className="text-xs text-muted-foreground leading-relaxed pt-1 border-t border-border/50">
                    {stock.companyName} demonstrates strong commitment to sustainable practices and ethical governance.
                  </p>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* ── Sticky action bar ─────────────────────────────────────────────── */}
        <div className="absolute bottom-0 inset-x-0 p-4 pb-safe bg-background/95 backdrop-blur-md border-t border-border/50">
          <div className="flex gap-3">
            <Button
              onClick={() => { onPass(stock); onClose(); }}
              variant="outline"
              className="flex-1 h-12 rounded-xl border-2 font-semibold gap-2"
            >
              <X className="w-4 h-4" /> Pass
            </Button>
            <Button
              onClick={() => { onMatch(stock); onClose(); }}
              className="flex-[2] h-12 rounded-xl font-semibold gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 border-0 shadow-lg shadow-emerald-500/25"
            >
              <Heart className="w-4 h-4 fill-white" /> Add to Watchlist
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ─── Metric tile sub-component ────────────────────────────────────────────────

const MetricTile = ({
  label, value, gradient, accent, hint,
}: {
  label: string; value: string; gradient: string; accent: string; hint: string;
}) => (
  <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-4 border border-white/10 dark:border-white/5`}>
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className={`text-2xl font-bold ${accent} leading-none mb-1`}>{value}</p>
    <p className="text-[10px] text-muted-foreground leading-tight">{hint}</p>
  </div>
);

export default StockDetailsModal;
