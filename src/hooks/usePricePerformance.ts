import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PricePerformance {
  symbol: string;
  returns: { period: string; percent: number }[];
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  beta: number | null;
}

// Real returns over 5D..1Y and the 52-week range (cached server-side for 6 hours)
export function usePricePerformance(ticker: string | null, enabled = true) {
  const [performance, setPerformance] = useState<PricePerformance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker || !enabled) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    supabase.functions
      .invoke('company-data', { body: { action: 'price_performance', symbol: ticker } })
      .then(({ data, error: fnError }) => {
        if (cancelled) return;
        if (fnError || !data?.data) {
          setError('Performance data is unavailable right now.');
          setPerformance(null);
        } else {
          setPerformance(data.data as PricePerformance);
        }
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => { cancelled = true; };
  }, [ticker, enabled]);

  return { performance, isLoading, error };
}
