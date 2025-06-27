
import { UserProfile, StockRecommendation } from '@/types/stock-matcher';
import { stockDatabase } from '@/data/stockDatabase';
import { filterStocksByProfile } from '@/utils/stockFilters';
import { sortStocksByRelevance } from '@/utils/stockScoring';
import { generatePersonalizedExplanation } from '@/utils/explanationGenerator';

export const generateStockRecommendations = async (profile: UserProfile): Promise<StockRecommendation[]> => {
  try {
    console.log('Starting stock recommendation generation for profile:', {
      age: profile.age,
      experience: profile.experience,
      riskTolerance: profile.riskTolerance,
      sector: profile.sectorPreference,
      goal: profile.investmentGoal,
      salary: profile.salary
    });

    // Simulate API delay for realistic UX
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Validate input
    if (!profile || !stockDatabase || stockDatabase.length === 0) {
      throw new Error('Invalid profile or stock database');
    }

    // Filter stocks based on user preferences with robust fallback strategies
    const filteredStocks = filterStocksByProfile(stockDatabase, profile);
    console.log(`Filtered ${filteredStocks.length} stocks from ${stockDatabase.length} total stocks`);

    if (filteredStocks.length === 0) {
      console.warn('No stocks passed filtering - using fallback selection');
      throw new Error('No suitable stocks found for profile');
    }

    // Sort by relevance to user profile using sophisticated scoring
    const sortedStocks = sortStocksByRelevance(filteredStocks, profile);
    console.log('Stocks sorted by relevance score');

    // Ensure we provide comprehensive recommendations (50-60 stocks)
    const minRecommendations = 50;
    const maxRecommendations = Math.min(60, sortedStocks.length);
    const recommendationCount = Math.max(
      Math.min(minRecommendations, sortedStocks.length), 
      Math.min(maxRecommendations, sortedStocks.length)
    );
    
    const selectedStocks = sortedStocks.slice(0, recommendationCount);
    console.log(`Selected ${selectedStocks.length} stocks for recommendations`);

    // Generate personalized explanations for each recommendation
    const recommendations = selectedStocks.map((stock, index) => {
      try {
        const explanation = generatePersonalizedExplanation(stock, profile);
        return {
          ...stock,
          whyItFits: explanation
        };
      } catch (error) {
        console.error(`Error generating explanation for stock ${stock.ticker}:`, error);
        return {
          ...stock,
          whyItFits: 'Solid investment choice with good fundamentals and market position.'
        };
      }
    });

    // Validate recommendations
    const validRecommendations = recommendations.filter(rec => 
      rec.ticker && rec.companyName && rec.whyItFits
    );

    if (validRecommendations.length < 10) {
      console.warn('Insufficient valid recommendations generated');
    }

    console.log(`Successfully generated ${validRecommendations.length} personalized recommendations`);
    
    // Log summary statistics
    const riskDistribution = validRecommendations.reduce((acc, rec) => {
      acc[rec.riskLevel] = (acc[rec.riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const sectorsIncluded = [...new Set(validRecommendations.map(rec => rec.sector))];
    
    console.log('Recommendation summary:', {
      total: validRecommendations.length,
      riskDistribution,
      sectorsIncluded: sectorsIncluded.length,
      avgDividendYield: (validRecommendations.reduce((sum, rec) => sum + rec.dividendYield, 0) / validRecommendations.length).toFixed(2),
      avgReturn: (validRecommendations.reduce((sum, rec) => sum + rec.oneYearReturn, 0) / validRecommendations.length).toFixed(2)
    });

    return validRecommendations;

  } catch (error) {
    console.error('Error generating stock recommendations:', error);
    
    // Fallback: Return a basic set of diverse stocks
    const fallbackStocks = stockDatabase.slice(0, 20).map(stock => ({
      ...stock,
      whyItFits: 'Diversified investment option with solid market fundamentals.'
    }));
    
    console.log('Returning fallback recommendations');
    return fallbackStocks;
  }
};
