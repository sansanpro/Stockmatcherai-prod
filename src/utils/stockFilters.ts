import { UserProfile, StockRecommendation } from '@/types/stock-matcher';

export const filterStocksByProfile = (
  stocks: Omit<StockRecommendation, 'whyItFits'>[],
  profile: UserProfile
): Omit<StockRecommendation, 'whyItFits'>[] => {
  // First pass: strict filtering based on preferences
  let filteredStocks = stocks.filter(stock => {
    // Sector preference (only filter if not 'any')
    if (profile.sectorPreference !== 'any' && stock.sector.toLowerCase() !== profile.sectorPreference.toLowerCase()) {
      return false;
    }

    // Strict risk tolerance filtering for experienced users
    if (profile.experience === 'advanced') {
      if (profile.riskTolerance === 'low' && stock.riskLevel === 'high') {
        return false;
      }
      if (profile.riskTolerance === 'high' && stock.riskLevel === 'low') {
        return false;
      }
    }

    // Price affordability for beginners (stricter for new investors)
    if (profile.experience === 'none' || profile.experience === 'beginner') {
      const affordabilityThreshold = profile.salary * 0.15; // 15% of annual salary
      if (stock.pricePerShare > affordabilityThreshold) {
        return false;
      }
    }

    return true;
  });

  // Second pass: if we have fewer than 5 stocks, relax some constraints
  if (filteredStocks.length < 5) {
    filteredStocks = stocks.filter(stock => {
      // Keep sector preference if specified
      if (profile.sectorPreference !== 'any' && stock.sector.toLowerCase() !== profile.sectorPreference.toLowerCase()) {
        return false;
      }

      // Relax risk tolerance for medium risk users
      if (profile.riskTolerance === 'medium') {
        return true; // Accept all risk levels for medium tolerance
      }

      // For low risk tolerance, exclude only high risk
      if (profile.riskTolerance === 'low' && stock.riskLevel === 'high') {
        return false;
      }

      // For high risk tolerance, exclude only low risk
      if (profile.riskTolerance === 'high' && stock.riskLevel === 'low') {
        return false;
      }

      // Relax price constraints for experienced users
      if (profile.experience === 'intermediate' || profile.experience === 'advanced') {
        return true;
      }

      // Slightly higher affordability threshold for beginners
      const affordabilityThreshold = profile.salary * 0.25; // 25% of annual salary
      return stock.pricePerShare <= affordabilityThreshold;
    });
  }

  // Third pass: if still fewer than 5, only filter by sector preference and basic safety
  if (filteredStocks.length < 5) {
    filteredStocks = stocks.filter(stock => {
      // Keep sector preference if specified
      if (profile.sectorPreference !== 'any' && stock.sector.toLowerCase() !== profile.sectorPreference.toLowerCase()) {
        return false;
      }

      // For complete beginners, avoid very high risk stocks
      if ((profile.experience === 'none' || profile.experience === 'beginner') && 
          profile.riskTolerance === 'low' && 
          stock.riskLevel === 'high') {
        return false;
      }

      return true;
    });
  }

  // Final fallback: if still fewer than 5, ignore sector preference but keep basic safety
  if (filteredStocks.length < 5) {
    filteredStocks = stocks.filter(stock => {
      // Only filter out high-risk stocks for complete beginners with low risk tolerance
      if (profile.experience === 'none' && 
          profile.riskTolerance === 'low' && 
          stock.riskLevel === 'high') {
        return false;
      }
      return true;
    });
  }

  // Absolute fallback: return all stocks if we still don't have enough
  if (filteredStocks.length < 5) {
    filteredStocks = stocks;
  }

  return filteredStocks;
};
