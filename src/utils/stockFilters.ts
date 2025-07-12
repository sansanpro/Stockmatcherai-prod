
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

  // Calculate affordability threshold based on experience
  const getAffordabilityThreshold = (experience: string, salary: number) => {
    switch (experience) {
      case 'none':
        return salary * 0.3; // 30% for complete beginners
      case 'beginner':
        return salary * 0.5; // 50% for beginners
      case 'intermediate':
        return salary * 0.75; // 75% for intermediate
      case 'advanced':
        return salary * 1.0; // 100% for advanced
      default:
        return salary * 0.5;
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

    // Risk tolerance filter - be more permissive for high risk tolerance users
    if (profile.riskTolerance === 'low' && stock.riskLevel === 'high') {
      return false;
    }
    if (profile.riskTolerance === 'medium' && stock.riskLevel === 'high' && stock.oneYearReturn < -30) {
      return false;
    }
    // For high risk tolerance, don't filter out any risk levels - let them see everything

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

    // Risk tolerance preference scoring
    if (profile.experience === 'beginner' || profile.experience === 'none') {
      if (a.riskLevel === 'low') scoreA += 20;
      if (b.riskLevel === 'low') scoreB += 20;
      if (a.riskLevel === 'medium') scoreA += 10;
      if (b.riskLevel === 'medium') scoreB += 10;
    } else if (profile.riskTolerance === 'high' && profile.experience === 'advanced') {
      // Favor high-risk stocks for advanced users with high risk tolerance
      if (a.riskLevel === 'high') scoreA += 25;
      if (b.riskLevel === 'high') scoreB += 25;
      if (a.riskLevel === 'medium') scoreA += 15;
      if (b.riskLevel === 'medium') scoreB += 15;
    } else if (profile.riskTolerance === 'high') {
      // Still favor high-risk for high tolerance users, but less aggressively
      if (a.riskLevel === 'high') scoreA += 20;
      if (b.riskLevel === 'high') scoreB += 20;
      if (a.riskLevel === 'medium') scoreA += 10;
      if (b.riskLevel === 'medium') scoreB += 10;
    } else if (profile.riskTolerance === 'medium') {
      // Favor medium risk for medium tolerance
      if (a.riskLevel === 'medium') scoreA += 15;
      if (b.riskLevel === 'medium') scoreB += 15;
      if (a.riskLevel === 'low') scoreA += 10;
      if (b.riskLevel === 'low') scoreB += 10;
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
