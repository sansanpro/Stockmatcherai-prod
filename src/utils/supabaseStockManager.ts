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

type SectorTableName = 'technology_stocks' | 'healthcare_stocks' | 'finance_stocks' | 'energy_stocks' | 'consumer_stocks' | 'utilities_stocks';

// Global storage for imported stocks
let importedStocks: Omit<StockRecommendation, 'whyItFits'>[] = [];

export const addImportedStocks = (stocks: Omit<StockRecommendation, 'whyItFits'>[]) => {
  importedStocks = [...importedStocks, ...stocks];
  console.log(`Added ${stocks.length} imported stocks. Total imported: ${importedStocks.length}`);
};

export const getImportedStocks = () => importedStocks;

export const clearImportedStocks = () => {
  importedStocks = [];
};

const convertToSupabaseFormat = (stock: Omit<StockRecommendation, 'whyItFits'>): SupabaseStock => ({
  id: stock.id,
  ticker: stock.ticker,
  company_name: stock.companyName || stock.ticker, // Fallback to ticker if company name is missing
  ceo_name: stock.ceoName || 'Management Team',
  ceo_highlights: stock.ceoHighlights || 'Experienced leadership driving company growth and strategic initiatives.',
  pe_ratio: stock.peRatio,
  market_cap: stock.marketCap,
  one_year_return: stock.oneYearReturn,
  risk_level: stock.riskLevel,
  price_per_share: stock.pricePerShare,
  dividend_yield: stock.dividendYield,
  esg_score: stock.esgScore || 75
});

const insertStocksToSectorTable = async (
  tableName: SectorTableName,
  stocks: Omit<StockRecommendation, 'whyItFits'>[]
): Promise<boolean> => {
  try {
    // Remove duplicates by ticker within the input array
    const uniqueStocks = stocks.reduce((acc, stock) => {
      const existingIndex = acc.findIndex(s => s.ticker === stock.ticker);
      if (existingIndex === -1) {
        acc.push(stock);
      } else {
        // Keep the imported stock over static stock (imported stocks usually have more recent data)
        console.log(`Duplicate ticker ${stock.ticker} found, keeping the imported version`);
        acc[existingIndex] = stock;
      }
      return acc;
    }, [] as Omit<StockRecommendation, 'whyItFits'>[]);

    console.log(`Inserting ${uniqueStocks.length} unique stocks to ${tableName} (removed ${stocks.length - uniqueStocks.length} duplicates)`);
    
    const supabaseStocks = uniqueStocks.map(convertToSupabaseFormat);
    
    const { error } = await supabase
      .from(tableName)
      .upsert(supabaseStocks, { onConflict: 'ticker' });

    if (error) {
      console.error(`Error inserting stocks to ${tableName}:`, error);
      return false;
    }

    console.log(`Successfully inserted ${uniqueStocks.length} stocks to ${tableName}`);
    return true;
  } catch (error) {
    console.error(`Error in insertStocksToSectorTable for ${tableName}:`, error);
    return false;
  }
};

const getSectorStocks = (sector: string): Omit<StockRecommendation, 'whyItFits'>[] => {
  const staticStocks = {
    technology: technologyStocks,
    healthcare: healthcareStocks,
    finance: financeStocks,
    energy: energyStocks,
    consumer: consumerStocks,
    utilities: utilitiesStocks
  };

  const sectorKey = sector.toLowerCase() as keyof typeof staticStocks;
  const static_stocks = staticStocks[sectorKey] || [];
  
  // Add imported stocks that match this sector
  const imported_stocks = importedStocks.filter(stock => 
    stock.sector.toLowerCase() === sector.toLowerCase()
  );
  
  // Combine and remove duplicates (imported stocks take precedence)
  const allStocks = [...static_stocks, ...imported_stocks];
  const uniqueStocks = allStocks.reduce((acc, stock) => {
    const existingIndex = acc.findIndex(s => s.ticker === stock.ticker);
    if (existingIndex === -1) {
      acc.push(stock);
    } else {
      // If it's an imported stock, it takes precedence
      if (imported_stocks.some(imp => imp.ticker === stock.ticker)) {
        acc[existingIndex] = stock;
      }
    }
    return acc;
  }, [] as Omit<StockRecommendation, 'whyItFits'>[]);
  
  console.log(`Sector ${sector}: ${static_stocks.length} static + ${imported_stocks.length} imported = ${uniqueStocks.length} unique total`);
  
  return uniqueStocks;
};

export const syncStaticDataToSupabase = async (): Promise<boolean> => {
  try {
    console.log('Starting sync of static + imported data to Supabase sector tables...');
    console.log(`Total imported stocks available: ${importedStocks.length}`);
    
    const syncResults = await Promise.all([
      insertStocksToSectorTable('technology_stocks', getSectorStocks('technology')),
      insertStocksToSectorTable('healthcare_stocks', getSectorStocks('healthcare')),
      insertStocksToSectorTable('finance_stocks', getSectorStocks('finance')),
      insertStocksToSectorTable('energy_stocks', getSectorStocks('energy')),
      insertStocksToSectorTable('consumer_stocks', getSectorStocks('consumer')),
      insertStocksToSectorTable('utilities_stocks', getSectorStocks('utilities'))
    ]);

    const allSuccessful = syncResults.every(result => result);
    
    if (allSuccessful) {
      console.log('All stock data (static + imported) synced successfully to Supabase!');
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
    let allStocks: any[] = [];
    
    if (sector) {
      // Get stocks from specific sector table
      const tableName = `${sector.toLowerCase()}_stocks` as SectorTableName;
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
      const sectorTables: SectorTableName[] = [
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
    
    // Convert back to our internal format with proper type casting and data validation
    const validStocks = allStocks
      .filter(stock => {
        // Filter out stocks with missing essential data
        if (!stock.ticker || !stock.company_name || stock.company_name.trim() === '') {
          console.log(`Filtering out invalid stock: ${stock.ticker} - "${stock.company_name}"`);
          return false;
        }
        return true;
      })
      .map(stock => ({
        id: stock.id,
        companyName: stock.company_name || stock.ticker,
        ticker: stock.ticker,
        sector: getSectorFromTableContext(sector) || 'Mixed',
        ceoName: stock.ceo_name || 'Management Team',
        ceoHighlights: stock.ceo_highlights || 'Experienced leadership driving company growth and strategic initiatives.',
        peRatio: stock.pe_ratio,
        marketCap: stock.market_cap,
        oneYearReturn: stock.one_year_return,
        riskLevel: stock.risk_level as 'low' | 'medium' | 'high',
        pricePerShare: stock.price_per_share,
        dividendYield: stock.dividend_yield,
        esgScore: stock.esg_score || 75
      }));
    
    console.log(`Retrieved ${validStocks.length} valid stocks from Supabase (filtered from ${allStocks.length} total)`);
    return validStocks;
  } catch (error) {
    console.error('Error in getStocksFromSupabase:', error);
    return [];
  }
};

// Helper function to determine sector from context
const getSectorFromTableContext = (sector?: string): string => {
  if (!sector) return 'Mixed';
  
  const sectorMap: Record<string, string> = {
    'technology': 'Technology',
    'healthcare': 'Healthcare',
    'finance': 'Finance',
    'energy': 'Energy',
    'consumer': 'Consumer',
    'utilities': 'Utilities'
  };
  
  return sectorMap[sector.toLowerCase()] || sector;
};

export const getStockCountsByType = async (): Promise<Record<string, number>> => {
  try {
    const sectorTables: SectorTableName[] = [
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
