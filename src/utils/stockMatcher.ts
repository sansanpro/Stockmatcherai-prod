
import { UserProfile, StockRecommendation } from '@/types/stock-matcher';
import { getStocksFromSupabase } from './supabaseStockManager';
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
    
    // Get stocks from Supabase - single source of truth
    if (userProfile.sectorPreference && userProfile.sectorPreference !== 'any') {
      console.log(`Fetching stocks from ${userProfile.sectorPreference} sector table`);
      stocksToFilter = await getStocksFromSupabase(userProfile.sectorPreference);
      console.log(`Found ${stocksToFilter.length} stocks in ${userProfile.sectorPreference} sector`);
    } else {
      // Get all stocks from all sector tables
      console.log('No specific sector preference, fetching from all sectors');
      stocksToFilter = await getStocksFromSupabase();
      console.log(`Found ${stocksToFilter.length} total stocks from all sectors`);
    }

    // If no stocks found, return empty array
    if (stocksToFilter.length === 0) {
      console.log('No stocks found in Supabase. Database may need expansion.');
      return [];
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
    
    // Return empty array if Supabase fails - no static fallback
    console.log('Supabase error - returning empty recommendations. Database may need expansion.');
    return [];
  }
};
