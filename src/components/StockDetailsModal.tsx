import { Sheet, SheetContent, keepOpenForAIAssistant } from '@/components/ui/sheet';
import CoachMark from '@/components/CoachMark';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StockRecommendation } from '@/types/stock-matcher';
import {
  TrendingUp, TrendingDown, Globe, Heart, X,
  Building2, DollarSign, BarChart3, Newspaper, ExternalLink,
} from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import CompanySnapshot from '@/components/CompanySnapshot';
import { useCompanyNews } from '@/hooks/useCompanyNews';
import { usePricePerformance } from '@/hooks/usePricePerformance';
import { getMomentum } from '@/utils/momentum';
import { useLiveQuote } from '@/hooks/useLiveQuote';

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

const timeAgo = (dateString: string): string => {
  const diffHours = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60));
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffHours < 24 * 7) return `${Math.floor(diffHours / 24)}d ago`;
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const ReturnTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const value = Number(payload[0]?.value);
  return (
    <div className="bg-background/95 backdrop-blur-sm border border-border rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p className="font-bold text-foreground">{value > 0 ? '+' : ''}{value.toFixed(2)}%</p>
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

const StockDetailsModal = ({ stock, isOpen, onClose, onMatch, onPass }: StockDetailsModalProps) => {
  // Real data only: news and returns come from Finnhub via company-data (cached server-side)
  const { news, isLoading: newsLoading, error: newsError } = useCompanyNews(isOpen && stock ? stock.ticker : null, stock?.companyName);
  const { performance, isLoading: performanceLoading, error: performanceError } =
    usePricePerformance(stock?.ticker ?? null, isOpen);
  const live = useLiveQuote(stock?.ticker ?? '', stock?.pricePerShare ?? 0, stock?.lastUpdated, isOpen && !!stock);

  if (!stock) return null;

  const isPositive = stock.oneYearReturn >= 0;
  const momentum = getMomentum(stock.oneYearReturn);
  const rangeHigh = performance?.fiftyTwoWeekHigh;
  const rangeLow = performance?.fiftyTwoWeekLow;
  const rangePosition = rangeHigh && rangeLow && rangeHigh > rangeLow
    ? Math.min(100, Math.max(0, ((live.price - rangeLow) / (rangeHigh - rangeLow)) * 100))
    : null;

  return (
    // Non-modal so the AI assistant (drawn above this sheet) can still be tapped and typed in;
    // a modal sheet traps focus and pulls it back out of the chat input.
    <Sheet open={isOpen} onOpenChange={onClose} modal={false}>
      <SheetContent
        side="bottom"
        onInteractOutside={keepOpenForAIAssistant}
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
                <p className="text-white text-xl font-bold">${live.price.toFixed(2)}</p>
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

            {/* Risk + momentum badges */}
            <div className="flex gap-2 mt-3 flex-wrap">
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs font-semibold px-3 py-1">
                {getRiskEmoji(stock.riskLevel)} {stock.riskLevel.toUpperCase()} RISK
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs font-semibold px-3 py-1">
                {momentum.label}
              </Badge>
            </div>
          </div>
        </div>

        <CoachMark
          id="first_details"
          text="Here's the full picture: what the company does, how its stock has moved, and recent news. Take your time. You decide."
          className="mx-4 mt-3 max-w-none"
        />

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
              <BarChart3 className="w-3 h-3" />Returns
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

              {/* 1-year momentum (computed from price change, not analyst ratings) */}
              <div className="bg-muted/50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">1-Year Momentum</span>
                  <span className={`text-sm font-bold ${momentum.textColor}`}>{momentum.label}</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${momentum.barColor} transition-all duration-700`}
                    style={{ width: momentum.width }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Based on the past year's price change. Not a recommendation.
                </p>
              </div>
            </TabsContent>

            {/* ── Returns ──────────────────────────────────────────────────── */}
            <TabsContent value="performance" className="mt-0 px-4 pt-4 space-y-4">
              <div className="bg-muted/40 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Current Price</p>
                    <p className="text-2xl font-bold">${live.price.toFixed(2)}</p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-xl text-sm font-semibold ${
                    isPositive
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                  }`}>
                    {isPositive ? '▲' : '▼'} {Math.abs(stock.oneYearReturn).toFixed(1)}% past year
                  </div>
                </div>

                {performanceLoading && <div className="h-48 rounded-xl bg-muted animate-pulse" />}
                {!performanceLoading && (performanceError || !performance?.returns.length) && (
                  <p className="text-sm text-muted-foreground text-center py-12">
                    {performanceError ?? 'No return data available for this stock.'}
                  </p>
                )}
                {!performanceLoading && performance && performance.returns.length > 0 && (
                  <div className="h-48" aria-label="Price returns by period">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={performance.returns} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <XAxis
                          dataKey="period"
                          tick={{ fontSize: 11, fill: 'currentColor' }}
                          axisLine={false}
                          tickLine={false}
                          className="text-muted-foreground"
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: 'currentColor' }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v: number) => `${v}%`}
                          className="text-muted-foreground"
                        />
                        <ReferenceLine y={0} stroke="currentColor" strokeOpacity={0.25} />
                        <Tooltip content={<ReturnTooltip />} cursor={{ fill: 'currentColor', fillOpacity: 0.05 }} />
                        <Bar dataKey="percent" radius={[6, 6, 6, 6]} isAnimationActive={false}>
                          {performance.returns.map((r) => (
                            <Cell key={r.period} fill={r.percent >= 0 ? '#10b981' : '#f43f5e'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* 52-week range */}
              {rangePosition !== null && (
                <div className="bg-muted/40 rounded-2xl p-4">
                  <p className="text-sm font-semibold mb-3">52-Week Range</p>
                  <div className="relative h-2 bg-gradient-to-r from-rose-400 via-yellow-400 to-emerald-500 rounded-full">
                    <div
                      className="absolute -top-1 w-4 h-4 rounded-full bg-background border-2 border-foreground shadow"
                      style={{ left: `calc(${rangePosition}% - 8px)` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>Low ${rangeLow!.toFixed(2)}</span>
                    <span>High ${rangeHigh!.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground text-center">
                Price returns from market data. Past performance doesn't predict future results.
              </p>
            </TabsContent>

            {/* ── News ───────────────────────────────────────────────────── */}
            <TabsContent value="news" className="mt-0 px-4 pt-4 space-y-4">
              {/* News */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Recent News
                </p>
                {newsLoading && (
                  <div className="space-y-2">
                    {[0, 1, 2].map(i => <div key={i} className="h-20 rounded-2xl bg-muted/50 animate-pulse" />)}
                  </div>
                )}
                {!newsLoading && (newsError || news.length === 0) && (
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-2xl p-4">
                    {newsError ? 'News is unavailable right now.' : 'No recent news for this company.'}
                  </p>
                )}
                {!newsLoading && news.length > 0 && (
                  <div className="space-y-2">
                    {news.map((item) => (
                      <a
                        key={item.url}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-muted/50 rounded-2xl p-4 hover:bg-muted/80 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold leading-snug line-clamp-2">{item.title}</p>
                            {item.text && (
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{item.text}</p>
                            )}
                            <div className="flex gap-2 mt-2 text-[11px] text-muted-foreground">
                              <span>{item.site}</span>
                              <span>·</span>
                              <span>{timeAgo(item.publishedDate)}</span>
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        </div>
                      </a>
                    ))}
                  </div>
                )}
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
