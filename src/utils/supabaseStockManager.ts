
import { supabase } from '@/integrations/supabase/client';
import { StockRecommendation } from '@/types/stock-matcher';

export interface SupabaseStock {
  id: string;
  ticker: string;
  company_name: string;
  sector: string;
  ceo_name: string;
  ceo_highlights: string;
  pe_ratio: number;
  market_cap: string;
  one_year_return: number;
  risk_level: 'low' | 'medium' | 'high';
  price_per_share: number;
  dividend_yield: number;
  esg_score: number;
  created_at?: string;
  updated_at?: string;
}

export const insertStocksToSupabase = async (
  stocks: Omit<StockRecommendation, 'whyItFits'>[]
): Promise<boolean> => {
  try {
    const supabaseStocks: Omit<SupabaseStock, 'created_at' | 'updated_at'>[] = stocks.map(stock => ({
      id: stock.id,
      ticker: stock.ticker,
      company_name: stock.companyName,
      sector: stock.sector,
      ceo_name: stock.ceoName,
      ceo_highlights: stock.ceoHighlights,
      pe_ratio: stock.peRatio,
      market_cap: stock.marketCap,
      one_year_return: stock.oneYearReturn,
      risk_level: stock.riskLevel,
      price_per_share: stock.pricePerShare,
      dividend_yield: stock.dividendYield,
      esg_score: stock.esgScore || 75
    }));

    const { error } = await supabase
      .from('stocks')
      .upsert(supabaseStocks, { onConflict: 'ticker' });

    if (error) {
      console.error('Error inserting stocks to Supabase:', error);
      return false;
    }

    console.log(`Successfully inserted ${stocks.length} stocks to Supabase`);
    return true;
  } catch (error) {
    console.error('Error in insertStocksToSupabase:', error);
    return false;
  }
};

export const getStocksFromSupabase = async (): Promise<Omit<StockRecommendation, 'whyItFits'>[]> => {
  try {
    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .order('ticker');

    if (error) {
      console.error('Error fetching stocks from Supabase:', error);
      return [];
    }

    // Convert Supabase format back to our format
    const stocks: Omit<StockRecommendation, 'whyItFits'>[] = (data || []).map((stock: SupabaseStock) => ({
      id: stock.id,
      companyName: stock.company_name,
      ticker: stock.ticker,
      sector: stock.sector,
      ceoName: stock.ceo_name,
      ceoHighlights: stock.ceo_highlights,
      peRatio: stock.pe_ratio,
      marketCap: stock.market_cap,
      oneYearReturn: stock.one_year_return,
      riskLevel: stock.risk_level,
      pricePerShare: stock.price_per_share,
      dividendYield: stock.dividend_yield,
      esgScore: stock.esg_score
    }));

    return stocks;
  } catch (error) {
    console.error('Error in getStocksFromSupabase:', error);
    return [];
  }
};

export const syncStaticDataToSupabase = async (): Promise<boolean> => {
  const { stockDatabase } = await import('@/data/stockDatabase');
  return await insertStocksToSupabase(stockDatabase);
};
