
import { UserProfile, StockRecommendation } from '@/types/stock-matcher';
import { stockDatabase } from '@/data/stockDatabase';
import { filterStocksByProfile } from './stockFilters';
import { generateExplanation } from './explanationGenerator';

export const generateStockRecommendations = async (
  userProfile: UserProfile,
  excludedStocks: string[] = []
): Promise<StockRecommendation[]> => {
  console.log('Generating stock recommendations using static database');
  console.log('User profile:', userProfile);
  console.log('Excluded stocks:', excludedStocks);

  try {
    // Filter stocks based on user profile
    const filteredStocks = filterStocksByProfile(stockDatabase, userProfile);
    console.log(`Filtered to ${filteredStocks.length} stocks from ${stockDatabase.length} total`);

    // Remove excluded stocks
    const availableStocks = filteredStocks.filter(stock => 
      !excludedStocks.includes(stock.ticker)
    );
    console.log(`Available stocks after exclusions: ${availableStocks.length}`);

    // Shuffle and limit to 50 recommendations
    const shuffled = availableStocks.sort(() => Math.random() - 0.5);
    const selectedStocks = shuffled.slice(0, 50);

    // Convert to full recommendations with explanations
    const recommendations: StockRecommendation[] = selectedStocks.map(stock => ({
      ...stock,
      whyItFits: generateExplanation(stock, userProfile)
    }));

    console.log(`Returning ${recommendations.length} stock recommendations`);
    return recommendations;

  } catch (error) {
    console.error('Error generating stock recommendations:', error);
    
    // Fallback to basic recommendations
    const fallbackStocks = stockDatabase
      .filter(stock => !excludedStocks.includes(stock.ticker))
      .sort(() => Math.random() - 0.5)
      .slice(0, 20);

    return fallbackStocks.map(stock => ({
      ...stock,
      whyItFits: generateExplanation(stock, userProfile)
    }));
  }
};
