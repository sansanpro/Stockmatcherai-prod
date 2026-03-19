
import { UserProfile, StockRecommendation } from '@/types/stock-matcher';

export const filterStocksByProfile = (
  stocks: Omit<StockRecommendation, 'whyItFits'>[],
  profile: UserProfile,
  relaxed: boolean = false
): Omit<StockRecommendation, 'whyItFits'>[] => {
  // Validate input
  if (!stocks || stocks.length === 0) {
    console.warn('No stocks provided for filtering');
    return [];
  }

  console.log(`Starting with ${stocks.length} stocks for sector: ${profile.sectorPreference}`);

  // Calculate affordability threshold based on salary
  const getAffordabilityThreshold = (experience: string, salary: number) => {
    // Base affordability on annual salary - more realistic for actual investing
    const basePercentage = salary * 0.05; // 5% of annual salary per stock as base
    
    switch (experience) {
      case 'none':
        return Math.max(basePercentage * 0.3, 25); // 1.5% of salary, minimum $25
      case 'beginner':
        return Math.max(basePercentage * 0.5, 50); // 2.5% of salary, minimum $50
      case 'intermediate':
        return Math.max(basePercentage * 0.8, 100); // 4% of salary, minimum $100
      case 'advanced':
        return basePercentage; // Full 5% of salary
      default:
        return Math.max(basePercentage * 0.5, 50); // Default to beginner level
    }
  };

  const affordabilityThreshold = getAffordabilityThreshold(profile.experience, profile.salary);
  console.log(`Affordability threshold: $${affordabilityThreshold}`);

  // Since we're already getting sector-specific stocks from the database,
  // we don't need to filter by sector again - just apply other filters
  let filteredStocks = stocks.filter(stock => {
    // In relaxed mode, skip affordability filter entirely
    if (!relaxed && stock.pricePerShare > affordabilityThreshold) {
      return false;
    }

    // In relaxed mode, use a much more generous affordability threshold (10x)
    if (relaxed && stock.pricePerShare > affordabilityThreshold * 10) {
      return false;
    }

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
