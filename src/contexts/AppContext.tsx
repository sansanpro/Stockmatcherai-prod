
import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { MatchedCause, StockRecommendation } from '@/types/stock-matcher';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { fetchCauses, type CauseInfo } from '@/lib/matchFeed';

interface SwipeStats {
  totalSwipes: number;
  matches: number;
  passes: number;
  matchRate: number;
}

interface AppContextType {
  watchlist: StockRecommendation[];
  addToWatchlist: (stock: StockRecommendation) => void;
  removeFromWatchlist: (ticker: string) => void;
  isInWatchlist: (ticker: string) => boolean;
  reloadWatchlist: () => Promise<void>;
  passStock: (stock: StockRecommendation) => void;
  swipeStats: SwipeStats;
  updateSwipeStats: (isMatch: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const DEVICE_WATCHLIST_KEY = 'stockMatcher_watchlist';

const readDeviceWatchlist = (): StockRecommendation[] => {
  try {
    const saved = localStorage.getItem(DEVICE_WATCHLIST_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const writeDeviceWatchlist = (list: StockRecommendation[]) => {
  try { localStorage.setItem(DEVICE_WATCHLIST_KEY, JSON.stringify(list)); } catch { /* storage blocked */ }
};

const num = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0);

// Liked companies saved to the account (user_matches), newest first, with current stock data
async function loadAccountWatchlist(userId: string): Promise<StockRecommendation[]> {
  const { data: matches, error } = await supabase
    .from('user_matches')
    .select('ticker, match_reason, matched_at')
    .eq('user_id', userId)
    .eq('is_match', true)
    .order('matched_at', { ascending: false });
  if (error) throw error;
  const tickers = [...new Set((matches ?? []).map(m => m.ticker))];
  if (tickers.length === 0) return [];
  const [{ data: stocks }, { data: missions }, causes] = await Promise.all([
    supabase
      .from('stocks')
      .select('ticker, company_name, sector, price_per_share, one_year_return, pe_ratio, market_cap, dividend_yield, risk_level, updated_at, logo_url, mission_story, proof, proof_source_url, things_to_know, ceo_name')
      .in('ticker', tickers),
    supabase.from('stock_missions').select('ticker, cause, exposure, why_line').eq('status', 'approved').in('ticker', tickers).neq('exposure', 'peripheral'),
    fetchCauses().catch(() => [] as CauseInfo[]),
  ]);
  const byTicker = new Map((stocks ?? []).map(s => [s.ticker, s]));
  const causeInfo = new Map(causes.map(c => [c.id, c]));
  const causesOf = (ticker: string): MatchedCause[] => (missions ?? [])
    .filter(m => m.ticker === ticker && causeInfo.has(m.cause))
    .map(m => ({
      cause: m.cause,
      label: causeInfo.get(m.cause)!.label,
      icon: causeInfo.get(m.cause)!.icon,
      exposure: m.exposure as MatchedCause['exposure'],
      whyLine: m.why_line,
    }));
  const reasons = new Map<string, string | null>();
  for (const m of matches ?? []) if (!reasons.has(m.ticker)) reasons.set(m.ticker, m.match_reason);
  return tickers.filter(t => byTicker.has(t)).map(t => {
    const s = byTicker.get(t)!;
    const risk = s.risk_level === 'low' || s.risk_level === 'high' ? s.risk_level : 'medium';
    return {
      id: t,
      ticker: t,
      companyName: s.company_name ?? t,
      sector: s.sector ?? '',
      ceoName: s.ceo_name ?? '',
      ceoHighlights: '',
      peRatio: num(s.pe_ratio),
      marketCap: s.market_cap ?? '',
      oneYearReturn: num(s.one_year_return),
      riskLevel: risk,
      pricePerShare: num(s.price_per_share),
      dividendYield: num(s.dividend_yield),
      whyItFits: reasons.get(t) || s.mission_story || '',
      lastUpdated: s.updated_at ?? undefined,
      logoUrl: s.logo_url ?? undefined,
      missionStory: s.mission_story ?? undefined,
      proof: s.proof ?? undefined,
      proofSourceUrl: s.proof_source_url ?? undefined,
      thingsToKnow: s.things_to_know ?? [],
      matchedCauses: causesOf(t),
    };
  });
}

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<StockRecommendation[]>([]);
  const [swipeStats, setSwipeStats] = useState<SwipeStats>({
    totalSwipes: 0,
    matches: 0,
    passes: 0,
    matchRate: 0
  });

  // Likes follow the account when signed in; before sign-in they live on this device
  const reloadWatchlist = useCallback(async () => {
    if (!user) {
      setWatchlist(readDeviceWatchlist());
      return;
    }
    try {
      setWatchlist(await loadAccountWatchlist(user.id));
    } catch (error) {
      console.error('[AppContext] could not load likes:', error);
    }
  }, [user]);

  useEffect(() => { reloadWatchlist(); }, [reloadWatchlist]);

  useEffect(() => {
    const savedStats = localStorage.getItem('stockMatcher_swipeStats');
    if (savedStats) {
      setSwipeStats(JSON.parse(savedStats));
    }
  }, []);

  // Signed in, match-feed saves the like to the account; this only updates what's on screen
  const addToWatchlist = (stock: StockRecommendation) => {
    setWatchlist(prev => {
      if (prev.some(s => s.ticker === stock.ticker)) return prev;
      const next = [stock, ...prev];
      if (!user) writeDeviceWatchlist(next);
      return next;
    });
  };

  const removeFromWatchlist = (ticker: string) => {
    setWatchlist(prev => {
      const next = prev.filter(stock => stock.ticker !== ticker);
      if (!user) writeDeviceWatchlist(next);
      return next;
    });
  };

  const isInWatchlist = (ticker: string) => {
    return watchlist.some(stock => stock.ticker === ticker);
  };

  const passStock = (stock: StockRecommendation) => {
    // This function can be used to track passed stocks if needed
    console.log('Passed stock:', stock.ticker);
  };

  const updateSwipeStats = (isMatch: boolean) => {
    const newStats = {
      totalSwipes: swipeStats.totalSwipes + 1,
      matches: swipeStats.matches + (isMatch ? 1 : 0),
      passes: swipeStats.passes + (isMatch ? 0 : 1),
      matchRate: 0
    };
    newStats.matchRate = newStats.totalSwipes > 0 ? (newStats.matches / newStats.totalSwipes) * 100 : 0;

    setSwipeStats(newStats);
    localStorage.setItem('stockMatcher_swipeStats', JSON.stringify(newStats));
  };

  return (
    <AppContext.Provider value={{
      watchlist,
      addToWatchlist,
      removeFromWatchlist,
      isInWatchlist,
      reloadWatchlist,
      passStock,
      swipeStats,
      updateSwipeStats,
    }}>
      {children}
    </AppContext.Provider>
  );
};
