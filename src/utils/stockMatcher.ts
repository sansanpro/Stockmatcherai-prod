
import { UserProfile, StockRecommendation } from '@/types/stock-matcher';
import { stockDatabase } from '@/data/stockDatabase';
import { filterStocksByProfile } from '@/utils/stockFilters';
import { sortStocksByRelevance } from '@/utils/stockScoring';
import { generatePersonalizedExplanation } from '@/utils/explanationGenerator';

export const generateStockRecommendations = async (profile: UserProfile): Promise<StockRecommendation[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Filter stocks based on user preferences
  const filteredStocks = filterStocksByProfile(stockDatabase, profile);

  // Sort by relevance and take top 15
  const sortedStocks = sortStocksByRelevance(filteredStocks, profile);
  const selectedStocks = sortedStocks.slice(0, 15);

  // Add personalized explanations
  return selectedStocks.map(stock => ({
    ...stock,
    whyItFits: generatePersonalizedExplanation(stock, profile)
  }));
};
