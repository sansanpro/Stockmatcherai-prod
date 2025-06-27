
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
        return Math.abs(stock.oneYearReturn) > 5; // Reduced threshold for short-term
      case 'retirement':
        return stock.riskLevel === 'low' || stock.dividendYield > 2;
      case 'balance':
        return stock.dividendYield > 0.5 && stock.oneYearReturn > -10;
      default:
        return true;
    }
  };

  // Multi-tiered filtering approach with more lenient thresholds
  let filteredStocks = stocks;
  const affordabilityThreshold = getAffordabilityThreshold(profile.experience, profile.salary);

  // Tier 1: Moderately strict filtering
  filteredStocks = stocks.filter(stock => {
    // Sector preference (allow if 'any' or matches)
    if (profile.sectorPreference !== 'any' && 
        stock.sector.toLowerCase() !== profile.sectorPreference.toLowerCase()) {
      return false;
    }

    // Risk tolerance (moderately strict)
    if (!isRiskCompatible(stock.riskLevel, profile.riskTolerance, false)) {
      return false;
    }

    // Experience appropriateness (relaxed)
    if (profile.experience === 'none' && stock.riskLevel === 'high' && 
        ['NKLA', 'SNAP'].includes(stock.ticker)) {
      return false;
    }

    // Goal alignment (relaxed)
    if (!isGoalAligned(stock, profile.investmentGoal)) {
      return false;
    }

    // Affordability (generous threshold)
    if (stock.pricePerShare > affordabilityThreshold * 2) {
      return false;
    }

    return true;
  });

  console.log(`Tier 1 filtering: ${filteredStocks.length} stocks`);

  // Tier 2: Relax sector preference if needed
  if (filteredStocks.length < 25) {
    filteredStocks = stocks.filter(stock => {
      // More relaxed risk tolerance
      if (profile.riskTolerance === 'low' && stock.riskLevel === 'high') {
        return false;
      }
      if (profile.riskTolerance === 'high' && stock.riskLevel === 'low') {
        // Allow some low-risk stocks for high-risk users for diversification
        return Math.random() > 0.7; // Include 30% of low-risk stocks
      }

      // Basic experience safety
      if (profile.experience === 'none' && stock.riskLevel === 'high' && 
          stock.oneYearReturn < -30) {
        return false;
      }

      // Very generous affordability
      if (stock.pricePerShare > affordabilityThreshold * 3) {
        return false;
      }

      return true;
    });
    console.log(`Tier 2 filtering: ${filteredStocks.length} stocks`);
  }

  // Tier 3: Basic safety only
  if (filteredStocks.length < 20) {
    filteredStocks = stocks.filter(stock => {
      // Only exclude extremely problematic stocks
      if (stock.oneYearReturn < -50) {
        return false;
      }

      // Only exclude unaffordable stocks
      if (stock.pricePerShare > profile.salary) {
        return false;
      }

      return true;
    });
    console.log(`Tier 3 filtering: ${filteredStocks.length} stocks`);
  }

  // Final fallback: Use most stocks with minimal filtering
  if (filteredStocks.length < 15) {
    filteredStocks = stocks.filter(stock => {
      // Only exclude stocks with severe issues
      if (stock.peRatio < -50 || stock.pricePerShare > profile.salary * 2) {
        return false;
      }
      return true;
    });
    console.log(`Final fallback filtering: ${filteredStocks.length} stocks`);
  }

  // Absolute last resort
  if (filteredStocks.length < 10) {
    filteredStocks = stocks.slice(0, Math.min(35, stocks.length));
    console.warn('Using minimal filtering - taking first available stocks');
  }

  return filteredStocks;
};
