
import { UserProfile, StockRecommendation } from '@/types/stock-matcher';
import { stockDatabase } from '@/data/stockDatabase';
import { getStocksFromSupabase, syncStaticDataToSupabase } from './supabaseStockManager';
import { filterStocksByProfile } from './stockFilters';
import { generatePersonalizedExplanation } from './explanationGenerator';

export const generateStockRecommendations = async (
  userProfile: UserProfile,
  excludedStocks: string[] = []
): Promise<StockRecommendation[]> => {
  console.log('Generating stock recommendations for user profile:', userProfile);
  console.log('Excluded stocks:', excludedStocks);

  try {
    let stocksToFilter: Omit<StockRecommendation, 'whyItFits'>[] = [];
    
    // If user has a specific sector preference (not 'any'), get stocks from that sector table
    if (userProfile.sectorPreference && userProfile.sectorPreference !== 'any') {
      console.log(`Fetching stocks from ${userProfile.sectorPreference} sector table`);
      stocksToFilter = await getStocksFromSupabase(userProfile.sectorPreference);
      console.log(`Found ${stocksToFilter.length} stocks in ${userProfile.sectorPreference} sector`);
      
      // If no stocks found in Supabase for the specific sector, sync data first
      if (stocksToFilter.length === 0) {
        console.log(`No stocks found in ${userProfile.sectorPreference} table. Syncing data...`);
        await syncStaticDataToSupabase();
        // Try fetching again after sync
        stocksToFilter = await getStocksFromSupabase(userProfile.sectorPreference);
        console.log(`After sync: Found ${stocksToFilter.length} stocks in ${userProfile.sectorPreference} sector`);
      }
      
      // If still no stocks after sync, fallback to static data for that sector only
      if (stocksToFilter.length === 0) {
        console.log(`Still no stocks in Supabase, filtering static database for ${userProfile.sectorPreference} sector`);
        stocksToFilter = stockDatabase.filter(stock => 
          stock.sector.toLowerCase() === userProfile.sectorPreference.toLowerCase()
        );
        console.log(`Found ${stocksToFilter.length} stocks in static ${userProfile.sectorPreference} data`);
      }
    } else {
      // If no preference or 'any', get all stocks from all sector tables
      console.log('No specific sector preference, fetching from all sectors');
      stocksToFilter = await getStocksFromSupabase();
      console.log(`Found ${stocksToFilter.length} total stocks from all sectors`);
      
      // Fallback to static database if no stocks found in Supabase
      if (stocksToFilter.length === 0) {
        console.log('No stocks found in Supabase, falling back to static database');
        stocksToFilter = stockDatabase;
      }
    }

    // Filter stocks based on user profile
    const filteredStocks = filterStocksByProfile(stocksToFilter, userProfile);
    console.log(`Filtered to ${filteredStocks.length} stocks from ${stocksToFilter.length} total`);

    // Remove excluded stocks
    const availableStocks = filteredStocks.filter(stock => 
      !excludedStocks.includes(stock.ticker)
    );
    console.log(`Available stocks after exclusions: ${availableStocks.length}`);

    // Shuffle and limit to 50 recommendations
    const shuffled = availableStocks.sort(() => Math.random() - 0.5);
    const selectedStocks = shuffled.slice(0, 50);

    // Convert to full recommendations with explanations
    const recommendations: StockRecommendation[] = selectedStocks.map((stock, index) => ({
      ...stock,
      whyItFits: generatePersonalizedExplanation(stock, userProfile, index === 0)
    }));

    console.log(`Returning ${recommendations.length} stock recommendations`);
    return recommendations;

  } catch (error) {
    console.error('Error generating stock recommendations:', error);
    
    // Fallback to basic recommendations from static database, filtered by sector if specified
    let fallbackStocks = stockDatabase;
    
    if (userProfile.sectorPreference && userProfile.sectorPreference !== 'any') {
      fallbackStocks = stockDatabase.filter(stock => 
        stock.sector.toLowerCase() === userProfile.sectorPreference.toLowerCase()
      );
    }
    
    const finalFallback = fallbackStocks
      .filter(stock => !excludedStocks.includes(stock.ticker))
      .sort(() => Math.random() - 0.5)
      .slice(0, 20);

    return finalFallback.map((stock, index) => ({
      ...stock,
      whyItFits: generatePersonalizedExplanation(stock, userProfile, index === 0)
    }));
  }
};
