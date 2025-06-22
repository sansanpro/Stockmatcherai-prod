
import { UserProfile, StockRecommendation } from '@/types/stock-matcher';

export const filterStocksByProfile = (
  stocks: Omit<StockRecommendation, 'whyItFits'>[],
  profile: UserProfile
): Omit<StockRecommendation, 'whyItFits'>[] => {
  let filteredStocks = stocks.filter(stock => {
    // Sector preference
    if (profile.sectorPreference !== 'any' && stock.sector.toLowerCase() !== profile.sectorPreference.toLowerCase()) {
      return false;
    }

    // Risk tolerance
    if (profile.riskTolerance === 'low' && stock.riskLevel === 'high') {
      return false;
    }
    if (profile.riskTolerance === 'high' && stock.riskLevel === 'low') {
      return false;
    }

    // Price affordability (rough estimate based on salary)
    const affordabilityThreshold = profile.salary * 0.1; // 10% of annual salary
    if (stock.pricePerShare > affordabilityThreshold && profile.experience === 'none') {
      return false;
    }

    return true;
  });

  // If no matches, include some broader recommendations
  if (filteredStocks.length === 0) {
    filteredStocks = stocks.filter(stock => stock.riskLevel !== 'high');
  }

  return filteredStocks;
};
