import { UserProfile, StockRecommendation } from '@/types/stock-matcher';

export const filterStocksByProfile = (
  stocks: Omit<StockRecommendation, 'whyItFits'>[],
  profile: UserProfile
): Omit<StockRecommendation, 'whyItFits'>[] => {
  // Validate input
  if (!stocks || stocks.length === 0) {
    console.warn('No stocks provided for filtering');
    return [];
  }

  // Calculate affordability thresholds based on experience and salary
  const getAffordabilityThreshold = (experience: string, salary: number) => {
    switch (experience) {
      case 'none':
        return salary * 0.10; // 10% for complete beginners
      case 'beginner':
        return salary * 0.15; // 15% for beginners
      case 'intermediate':
        return salary * 0.25; // 25% for intermediate
      case 'advanced':
        return salary * 0.35; // 35% for advanced
      default:
        return salary * 0.15;
    }
  };

  // Risk compatibility scoring
  const isRiskCompatible = (stockRisk: string, userRisk: string, strict: boolean = true) => {
    if (userRisk === 'medium') return true; // Medium risk accepts all
    if (strict) {
      return stockRisk === userRisk; // Exact match only
    } else {
      // Relaxed matching
      if (userRisk === 'low') return stockRisk !== 'high';
      if (userRisk === 'high') return stockRisk !== 'low';
      return true;
    }
  };

  // Experience-based filtering
  const isExperienceAppropriate = (stock: any, experience: string) => {
    const volatileStocks = ['TSLA', 'NVDA', 'NKLA', 'SNAP', 'SPOT', 'SQ', 'LYFT'];
    const beginnerFriendly = ['AAPL', 'MSFT', 'JNJ', 'KO', 'PEP', 'WMT', 'JPM', 'V', 'MA'];
    
    if (experience === 'none' || experience === 'beginner') {
      return beginnerFriendly.includes(stock.ticker) || stock.riskLevel === 'low';
    }
    
    if (experience === 'advanced') {
      return true; // Advanced users can handle any stock
    }
    
    // Intermediate users - avoid only the most volatile
    return !volatileStocks.includes(stock.ticker) || stock.riskLevel !== 'high';
  };

  // Goal-based filtering
  const isGoalAligned = (stock: any, goal: string) => {
    switch (goal) {
      case 'income':
        return stock.dividendYield > 1.5; // Focus on dividend-paying stocks
      case 'growth':
        return stock.oneYearReturn > 5; // Focus on growth stocks
      case 'short-term':
        return Math.abs(stock.oneYearReturn) > 10; // High volatility for short-term
      case 'retirement':
        return stock.riskLevel === 'low' || stock.dividendYield > 2;
      case 'balance':
        return stock.dividendYield > 0.5 && stock.oneYearReturn > 0;
      default:
        return true;
    }
  };

  // Multi-tiered filtering approach
  let filteredStocks = stocks;
  const affordabilityThreshold = getAffordabilityThreshold(profile.experience, profile.salary);

  // Tier 1: Strict filtering
  filteredStocks = stocks.filter(stock => {
    // Sector preference (strict)
    if (profile.sectorPreference !== 'any' && 
        stock.sector.toLowerCase() !== profile.sectorPreference.toLowerCase()) {
      return false;
    }

    // Risk tolerance (strict)
    if (!isRiskCompatible(stock.riskLevel, profile.riskTolerance, true)) {
      return false;
    }

    // Experience appropriateness
    if (!isExperienceAppropriate(stock, profile.experience)) {
      return false;
    }

    // Goal alignment
    if (!isGoalAligned(stock, profile.investmentGoal)) {
      return false;
    }

    // Affordability
    if (stock.pricePerShare > affordabilityThreshold) {
      return false;
    }

    return true;
  });

  console.log(`Tier 1 filtering: ${filteredStocks.length} stocks`);

  // Tier 2: Relax goal alignment if not enough stocks
  if (filteredStocks.length < 20) {
    filteredStocks = stocks.filter(stock => {
      // Keep sector preference
      if (profile.sectorPreference !== 'any' && 
          stock.sector.toLowerCase() !== profile.sectorPreference.toLowerCase()) {
        return false;
      }

      // Relaxed risk tolerance
      if (!isRiskCompatible(stock.riskLevel, profile.riskTolerance, false)) {
        return false;
      }

      // Keep experience appropriateness
      if (!isExperienceAppropriate(stock, profile.experience)) {
        return false;
      }

      // Relaxed affordability (increase by 50%)
      if (stock.pricePerShare > affordabilityThreshold * 1.5) {
        return false;
      }

      return true;
    });
    console.log(`Tier 2 filtering: ${filteredStocks.length} stocks`);
  }

  // Tier 3: Relax risk tolerance further
  if (filteredStocks.length < 15) {
    filteredStocks = stocks.filter(stock => {
      // Keep sector preference
      if (profile.sectorPreference !== 'any' && 
          stock.sector.toLowerCase() !== profile.sectorPreference.toLowerCase()) {
        return false;
      }

      // Very relaxed experience check - only filter out truly inappropriate stocks
      if (profile.experience === 'none' && stock.riskLevel === 'high' && 
          ['TSLA', 'NKLA', 'SNAP'].includes(stock.ticker)) {
        return false;
      }

      // Double affordability threshold
      if (stock.pricePerShare > affordabilityThreshold * 2) {
        return false;
      }

      return true;
    });
    console.log(`Tier 3 filtering: ${filteredStocks.length} stocks`);
  }

  // Tier 4: Keep only sector preference and basic safety
  if (filteredStocks.length < 10) {
    filteredStocks = stocks.filter(stock => {
      // Keep sector preference if specified
      if (profile.sectorPreference !== 'any' && 
          stock.sector.toLowerCase() !== profile.sectorPreference.toLowerCase()) {
        return false;
      }

      // Only exclude extremely risky stocks for complete beginners
      if (profile.experience === 'none' && profile.riskTolerance === 'low' && 
          stock.riskLevel === 'high' && stock.oneYearReturn < -20) {
        return false;
      }

      return true;
    });
    console.log(`Tier 4 filtering: ${filteredStocks.length} stocks`);
  }

  // Final fallback: Use all stocks but prioritize safer ones
  if (filteredStocks.length < 5) {
    filteredStocks = stocks.filter(stock => {
      // Only exclude stocks with major red flags
      if (stock.oneYearReturn < -40 || stock.pricePerShare > profile.salary) {
        return false;
      }
      return true;
    });
    console.log(`Final fallback filtering: ${filteredStocks.length} stocks`);
  }

  // Absolute last resort
  if (filteredStocks.length === 0) {
    filteredStocks = stocks.slice(0, 50); // Take first 50 stocks
    console.warn('Using fallback stock selection');
  }

  return filteredStocks;
};
