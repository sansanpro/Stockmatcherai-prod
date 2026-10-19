import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface NewsItem {
  title: string;
  url: string;
  publishedDate: string;
  site: string;
  text?: string;
  symbol?: string;
}

interface NewsCache {
  data: NewsItem[];
  timestamp: number;
}

const newsCache = new Map<string, NewsCache>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export function useCompanyNews(ticker: string | null, companyName?: string) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    if (!ticker) return;

    // Check cache first
    const cached = newsCache.get(ticker);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setNews(cached.data);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('company-data', {
        body: { action: 'company_news', symbol: ticker, limit: 5, companyName }
      });

      if (fnError) throw fnError;

      const newsData = data?.data || [];
      setNews(newsData);
      
      // Cache the result
      newsCache.set(ticker, { data: newsData, timestamp: Date.now() });
    } catch (err) {
      console.error('Error fetching company news:', err);
      setError('Failed to load news');
      setNews([]);
    } finally {
      setIsLoading(false);
    }
  }, [ticker, companyName]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  return { news, isLoading, error, refetch: fetchNews };
}
