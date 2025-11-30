import { UserProfile, StockRecommendation } from '@/types/stock-matcher';
import { getStocksFromSupabase } from './supabaseStockManager';
import { filterStocksByProfile } from './stockFilters';
import { generatePersonalizedExplanation, clearUsedExplanations } from './explanationGenerator';
import { getRecentlySwipedTickers } from './recentlySwipedService';
import { supabase } from '@/integrations/supabase/client';

export const generateStockRecommendations = async (
  userProfile: UserProfile,
  excludedStocks: string[] = []
): Promise<StockRecommendation[]> => {
  console.log('Generating stock recommendations for user profile:', userProfile);
  console.log('Excluded stocks:', excludedStocks);

  try {
    // Get recently swiped stocks (within 24 hours) to exclude
    let recentlySwipedTickers: string[] = [];
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      recentlySwipedTickers = await getRecentlySwipedTickers(user.id);
      console.log(`Found ${recentlySwipedTickers.length} recently swiped stocks to exclude`);
    }
    
    // Combine exclusions
    const allExclusions = [...new Set([...excludedStocks, ...recentlySwipedTickers])];
    
    let stocksToFilter: Omit<StockRecommendation, 'whyItFits'>[] = [];
    
    // Get stocks from preferred sector first
    if (userProfile.sectorPreference && userProfile.sectorPreference !== 'any') {
      console.log(`Fetching stocks from ${userProfile.sectorPreference} sector table`);
      stocksToFilter = await getStocksFromSupabase(userProfile.sectorPreference);
      console.log(`Found ${stocksToFilter.length} stocks in ${userProfile.sectorPreference} sector`);
    }
    
    // If we don't have enough stocks from preferred sector, add from other sectors
    if (stocksToFilter.length < 20) {
      console.log('Not enough stocks from preferred sector, adding from other sectors');
      const allStocks = await getStocksFromSupabase();
      console.log(`Found ${allStocks.length} total stocks from all sectors`);
      
      // Add stocks from other sectors that aren't already included
      const existingTickers = new Set(stocksToFilter.map(s => s.ticker));
      const additionalStocks = allStocks.filter(stock => !existingTickers.has(stock.ticker));
      stocksToFilter = [...stocksToFilter, ...additionalStocks];
      console.log(`Total stocks after adding from other sectors: ${stocksToFilter.length}`);
    }

    // If still no stocks found, return empty array
    if (stocksToFilter.length === 0) {
      console.log('No stocks found in Supabase. Database may need expansion.');
      return [];
    }

    // Filter stocks based on user profile
    const filteredStocks = filterStocksByProfile(stocksToFilter, userProfile);
    console.log(`Filtered to ${filteredStocks.length} stocks from ${stocksToFilter.length} total`);

    // Remove excluded stocks (including recently swiped within 24 hours)
    const availableStocks = filteredStocks.filter(stock => 
      !allExclusions.includes(stock.ticker)
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
