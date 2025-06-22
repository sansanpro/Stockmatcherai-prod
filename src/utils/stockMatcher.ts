
import { UserProfile, StockRecommendation } from '@/types/stock-matcher';
import { stockDatabase } from '@/data/stockDatabase';
import { filterStocksByProfile } from '@/utils/stockFilters';
import { sortStocksByRelevance } from '@/utils/stockScoring';
import { generatePersonalizedExplanation } from '@/utils/explanationGenerator';

export const generateStockRecommendations = async (profile: UserProfile): Promise<StockRecommendation[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Filter stocks based on user preferences with fallback strategies
  const filteredStocks = filterStocksByProfile(stockDatabase, profile);

  // Sort by relevance to user profile
  const sortedStocks = sortStocksByRelevance(filteredStocks, profile);
  
  // Ensure we have at least 5 recommendations, take up to 15
  const minRecommendations = 5;
  const maxRecommendations = 15;
  const recommendationCount = Math.max(minRecommendations, Math.min(maxRecommendations, sortedStocks.length));
  const selectedStocks = sortedStocks.slice(0, recommendationCount);

  // Add personalized explanations
  const recommendations = selectedStocks.map(stock => ({
    ...stock,
    whyItFits: generatePersonalizedExplanation(stock, profile)
  }));

  console.log(`Generated ${recommendations.length} recommendations for user profile:`, {
    age: profile.age,
    experience: profile.experience,
    riskTolerance: profile.riskTolerance,
    sector: profile.sectorPreference,
    goal: profile.investmentGoal
  });

  return recommendations;
};
