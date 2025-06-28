
import { supabase } from '@/integrations/supabase/client';
import { StockRecommendation } from '@/types/stock-matcher';
import { 
  technologyStocks,
  healthcareStocks,
  financeStocks,
  energyStocks,
  consumerStocks,
  utilitiesStocks
} from '@/data/stockDatabase';

export interface SupabaseStock {
  id: string;
  ticker: string;
  company_name: string;
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

const convertToSupabaseFormat = (stock: Omit<StockRecommendation, 'whyItFits'>): SupabaseStock => ({
  id: stock.id,
  ticker: stock.ticker,
  company_name: stock.companyName,
  ceo_name: stock.ceoName,
  ceo_highlights: stock.ceoHighlights,
  pe_ratio: stock.peRatio,
  market_cap: stock.marketCap,
  one_year_return: stock.oneYearReturn,
  risk_level: stock.riskLevel,
  price_per_share: stock.pricePerShare,
  dividend_yield: stock.dividendYield,
  esg_score: stock.esgScore || 75
});

const insertStocksToSectorTable = async (
  tableName: string,
  stocks: Omit<StockRecommendation, 'whyItFits'>[]
): Promise<boolean> => {
  try {
    const supabaseStocks = stocks.map(convertToSupabaseFormat);
    
    const { error } = await supabase
      .from(tableName)
      .upsert(supabaseStocks, { onConflict: 'ticker' });

    if (error) {
      console.error(`Error inserting stocks to ${tableName}:`, error);
      return false;
    }

    console.log(`Successfully inserted ${stocks.length} stocks to ${tableName}`);
    return true;
  } catch (error) {
    console.error(`Error in insertStocksToSectorTable for ${tableName}:`, error);
    return false;
  }
};

export const syncStaticDataToSupabase = async (): Promise<boolean> => {
  try {
    console.log('Starting sync of static data to Supabase sector tables...');
    
    const syncResults = await Promise.all([
      insertStocksToSectorTable('technology_stocks', technologyStocks),
      insertStocksToSectorTable('healthcare_stocks', healthcareStocks),
      insertStocksToSectorTable('finance_stocks', financeStocks),
      insertStocksToSectorTable('energy_stocks', energyStocks),
      insertStocksToSectorTable('consumer_stocks', consumerStocks),
      insertStocksToSectorTable('utilities_stocks', utilitiesStocks)
    ]);

    const allSuccessful = syncResults.every(result => result);
    
    if (allSuccessful) {
      console.log('All stock data synced successfully to Supabase!');
    } else {
      console.log('Some stock data failed to sync to Supabase');
    }
    
    return allSuccessful;
  } catch (error) {
    console.error('Error in syncStaticDataToSupabase:', error);
    return false;
  }
};

export const getStocksFromSupabase = async (sector?: string): Promise<Omit<StockRecommendation, 'whyItFits'>[]> => {
  try {
    let allStocks: SupabaseStock[] = [];
    
    if (sector) {
      // Get stocks from specific sector table
      const tableName = `${sector.toLowerCase()}_stocks`;
      const { data, error } = await supabase
        .from(tableName)
        .select('*');
      
      if (error) {
        console.error(`Error fetching from ${tableName}:`, error);
        return [];
      }
      
      allStocks = data || [];
    } else {
      // Get stocks from all sector tables
      const sectorTables = [
        'technology_stocks',
        'healthcare_stocks', 
        'finance_stocks',
        'energy_stocks',
        'consumer_stocks',
        'utilities_stocks'
      ];
      
      const fetchPromises = sectorTables.map(table => 
        supabase.from(table).select('*')
      );
      
      const results = await Promise.all(fetchPromises);
      
      for (const result of results) {
        if (result.data) {
          allStocks = [...allStocks, ...result.data];
        }
      }
    }
    
    // Convert back to our internal format
    return allStocks.map(stock => ({
      id: stock.id,
      companyName: stock.company_name,
      ticker: stock.ticker,
      sector: sector || 'Mixed', // Will be overridden by actual sector logic
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
  } catch (error) {
    console.error('Error in getStocksFromSupabase:', error);
    return [];
  }
};

export const getStockCountsByType = async (): Promise<Record<string, number>> => {
  try {
    const sectorTables = [
      'technology_stocks',
      'healthcare_stocks', 
      'finance_stocks',
      'energy_stocks',
      'consumer_stocks',
      'utilities_stocks'
    ];
    
    const countPromises = sectorTables.map(async (table) => {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error(`Error counting ${table}:`, error);
        return { table, count: 0 };
      }
      
      return { table, count: count || 0 };
    });
    
    const results = await Promise.all(countPromises);
    
    const counts: Record<string, number> = {};
    results.forEach(({ table, count }) => {
      const sectorName = table.replace('_stocks', '');
      counts[sectorName] = count;
    });
    
    return counts;
  } catch (error) {
    console.error('Error in getStockCountsByType:', error);
    return {};
  }
};

// Legacy function names for backward compatibility
export const insertStocksToSupabase = syncStaticDataToSupabase;
