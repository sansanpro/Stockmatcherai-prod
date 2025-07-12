
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

  console.log(`Starting with ${stocks.length} stocks for sector: ${profile.sectorPreference}`);

  // Calculate affordability threshold - much more conservative for salary protection
  const getAffordabilityThreshold = (experience: string, salary: number) => {
    // Base affordability on annual salary divided by reasonable investment amounts
    const maxStockPrice = Math.min(salary * 0.02, 200); // Max 2% of annual salary per stock, capped at $200
    
    switch (experience) {
      case 'none':
        return Math.min(maxStockPrice, 50); // Very conservative for beginners
      case 'beginner':
        return Math.min(maxStockPrice, 100); // Conservative
      case 'intermediate':
        return maxStockPrice;
      case 'advanced':
        return maxStockPrice * 1.5; // Slightly more flexible for advanced
      default:
        return Math.min(maxStockPrice, 100);
    }
  };

  const affordabilityThreshold = getAffordabilityThreshold(profile.experience, profile.salary);
  console.log(`Affordability threshold: $${affordabilityThreshold}`);

  // Since we're already getting sector-specific stocks from the database,
  // we don't need to filter by sector again - just apply other filters
  let filteredStocks = stocks.filter(stock => {
    // Affordability filter - exclude stocks that cost more than threshold
    if (stock.pricePerShare > affordabilityThreshold) {
      return false;
    }

    // BALANCED Risk tolerance filtering - allow some adjacent risk levels
    if (profile.riskTolerance === 'low') {
      // Low risk users: mostly low-risk stocks, some medium risk
      if (stock.riskLevel === 'high') {
        return false; // Never show high risk to low tolerance users
      }
    } else if (profile.riskTolerance === 'medium') {
      // Medium risk users: mostly medium, some low risk, exclude high risk
      if (stock.riskLevel === 'high') {
        return false; // Never show high risk to medium tolerance users
      }
    }
    // High risk users: see all stocks (mostly high, some medium)

    // Performance filter - exclude stocks with catastrophic performance
    if (stock.oneYearReturn < -80) {
      return false;
    }

    // Data quality filter - exclude stocks with extreme negative P/E ratios
    if (stock.peRatio < -50) {
      return false;
    }

    return true;
  });

  console.log(`After filtering: ${filteredStocks.length} stocks remaining`);

  // Sort by preference based on investment goals and risk tolerance
  filteredStocks = filteredStocks.sort((a, b) => {
    let scoreA = 0, scoreB = 0;

    // PRIORITY 1: Risk tolerance preference scoring (HIGHEST weight)
    if (profile.riskTolerance === 'high') {
      // Heavily favor high-risk stocks for high tolerance users
      if (a.riskLevel === 'high') scoreA += 50;
      if (b.riskLevel === 'high') scoreB += 50;
      if (a.riskLevel === 'medium') scoreA += 15;
      if (b.riskLevel === 'medium') scoreB += 15;
      if (a.riskLevel === 'low') scoreA += 5;
      if (b.riskLevel === 'low') scoreB += 5;
    } else if (profile.riskTolerance === 'medium') {
      // Heavily favor medium risk for medium tolerance
      if (a.riskLevel === 'medium') scoreA += 50;
      if (b.riskLevel === 'medium') scoreB += 50;
      if (a.riskLevel === 'low') scoreA += 20;
      if (b.riskLevel === 'low') scoreB += 20;
    } else if (profile.riskTolerance === 'low') {
      // Heavily favor low-risk stocks for low risk tolerance users
      if (a.riskLevel === 'low') scoreA += 50;
      if (b.riskLevel === 'low') scoreB += 50;
    }

    // PRIORITY 2: Experience-based adjustments (lower weight)
    if (profile.experience === 'beginner' || profile.experience === 'none') {
      // Extra boost for low-risk regardless of tolerance for beginners
      if (a.riskLevel === 'low') scoreA += 10;
      if (b.riskLevel === 'low') scoreB += 10;
    } else if (profile.experience === 'advanced' && profile.riskTolerance === 'high') {
      // Extra boost for high-risk stocks for advanced + high tolerance
      if (a.riskLevel === 'high') scoreA += 15;
      if (b.riskLevel === 'high') scoreB += 15;
    }

    // Investment goal preferences
    if (profile.investmentGoal === 'income') {
      // Favor dividend-paying stocks
      scoreA += a.dividendYield * 5;
      scoreB += b.dividendYield * 5;
    } else if (profile.investmentGoal === 'growth') {
      // Favor stocks with good returns
      if (a.oneYearReturn > 0) scoreA += a.oneYearReturn * 0.5;
      if (b.oneYearReturn > 0) scoreB += b.oneYearReturn * 0.5;
    }

    // ESG preference (slight boost for better ESG scores)
    if (a.esgScore && b.esgScore) {
      scoreA += (a.esgScore - 50) * 0.1;
      scoreB += (b.esgScore - 50) * 0.1;
    }

    return scoreB - scoreA;
  });

  console.log(`Final result: ${filteredStocks.length} filtered and sorted stocks`);
  return filteredStocks;
};
