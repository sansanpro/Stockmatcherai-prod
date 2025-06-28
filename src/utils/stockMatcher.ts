
import { UserProfile, StockRecommendation } from '@/types/stock-matcher';
import { createStockDataService } from '@/services/stockDataService';
import { filterStocksByProfile } from '@/utils/stockFilters';
import { sortStocksByRelevance } from '@/utils/stockScoring';
import { generatePersonalizedExplanation } from '@/utils/explanationGenerator';

// Fallback to static data if API fails
import { stockDatabase } from '@/data/stockDatabase';

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
    await new Promise(resolve => setTimeout(resolve, 1000));

    let stockData: Omit<StockRecommendation, 'whyItFits'>[] = [];

    // Try to get live data from Alpha Vantage
    try {
      const alphaVantageApiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;
      
      if (alphaVantageApiKey) {
        console.log('Using Alpha Vantage API for live stock data');
        const stockDataService = createStockDataService(alphaVantageApiKey);
        stockData = await stockDataService.getStockData();
        console.log(`Retrieved ${stockData.length} live stocks from Alpha Vantage`);
      } else {
        console.warn('Alpha Vantage API key not found, using static data');
        stockData = stockDatabase;
      }
    } catch (error) {
      console.error('Alpha Vantage API failed, falling back to static data:', error);
      stockData = stockDatabase;
    }

    // Validate input
    if (!profile || !stockData || stockData.length === 0) {
      throw new Error('Invalid profile or stock database');
    }

    // Filter stocks based on user preferences with robust fallback strategies
    const filteredStocks = filterStocksByProfile(stockData, profile);
    console.log(`Filtered ${filteredStocks.length} stocks from ${stockData.length} total stocks`);

    if (filteredStocks.length === 0) {
      console.warn('No stocks passed filtering - using fallback selection');
      throw new Error('No suitable stocks found for profile');
    }

    // Sort by relevance to user profile using sophisticated scoring
    const sortedStocks = sortStocksByRelevance(filteredStocks, profile);
    console.log('Stocks sorted by relevance score');

    // Ensure we provide at least 30 recommendations (target 30-35)
    const minRecommendations = 30;
    const maxRecommendations = Math.min(35, sortedStocks.length);
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

    if (validRecommendations.length < 20) {
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
      avgReturn: (validRecommendations.reduce((sum, rec) => sum + rec.oneYearReturn, 0) / validRecommendations.length).toFixed(2),
      dataSource: stockData === stockDatabase ? 'Static' : 'Alpha Vantage API'
    });

    return validRecommendations;

  } catch (error) {
    console.error('Error generating stock recommendations:', error);
    
    // Fallback: Return a basic set of diverse stocks from static data
    const fallbackStocks = stockDatabase.slice(0, 30).map(stock => ({
      ...stock,
      whyItFits: 'Diversified investment option with solid market fundamentals.'
    }));
    
    console.log('Returning fallback recommendations from static data');
    return fallbackStocks;
  }
};
