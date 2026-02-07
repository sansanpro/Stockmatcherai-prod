import { UserProfile, StockRecommendation } from '@/types/stock-matcher';

/**
 * Calculates a compatibility score (0-100) between a stock and a user profile.
 * Used to determine if a "It's a Match!" overlay should appear on right swipe.
 */
export const calculateCompatibilityScore = (
  stock: StockRecommendation,
  profile: UserProfile
): number => {
  let score = 0;
  let maxScore = 0;

  // 1. Risk tolerance match (max 25 points)
  maxScore += 25;
  if (stock.riskLevel === profile.riskTolerance) {
    score += 25;
  } else if (
    (profile.riskTolerance === 'medium' && (stock.riskLevel === 'low' || stock.riskLevel === 'high')) ||
    (profile.riskTolerance === 'low' && stock.riskLevel === 'medium') ||
    (profile.riskTolerance === 'high' && stock.riskLevel === 'medium')
  ) {
    score += 12;
  }

  // 2. Sector preference match (max 20 points)
  maxScore += 20;
  if (profile.sectorPreference === 'any') {
    score += 15; // Neutral bonus for "any"
  } else if (stock.sector.toLowerCase().includes(profile.sectorPreference.toLowerCase())) {
    score += 20;
  }

  // 3. Investment goal alignment (max 20 points)
  maxScore += 20;
  switch (profile.investmentGoal) {
    case 'income':
      if (stock.dividendYield > 4) score += 20;
      else if (stock.dividendYield > 2.5) score += 15;
      else if (stock.dividendYield > 1) score += 8;
      break;
    case 'growth':
      if (stock.oneYearReturn > 25) score += 20;
      else if (stock.oneYearReturn > 15) score += 15;
      else if (stock.oneYearReturn > 8) score += 10;
      else if (stock.oneYearReturn > 0) score += 5;
      break;
    case 'short-term':
      if (Math.abs(stock.oneYearReturn) > 20) score += 18;
      else if (Math.abs(stock.oneYearReturn) > 10) score += 12;
      break;
    case 'retirement':
      if (stock.riskLevel === 'low' && stock.dividendYield > 2) score += 20;
      else if (stock.riskLevel === 'low') score += 14;
      else if (stock.dividendYield > 2) score += 12;
      break;
    case 'balance':
      if (stock.dividendYield > 1 && stock.oneYearReturn > 5 && stock.oneYearReturn < 20) score += 20;
      else if (stock.riskLevel === 'medium') score += 12;
      break;
    default:
      score += 10;
  }

  // 4. Age-appropriate (max 15 points)
  maxScore += 15;
  if (profile.age < 30) {
    if (stock.riskLevel === 'high' || stock.oneYearReturn > 15) score += 15;
    else if (stock.riskLevel === 'medium') score += 10;
    else score += 5;
  } else if (profile.age < 45) {
    if (stock.riskLevel === 'medium') score += 15;
    else score += 8;
  } else {
    if (stock.riskLevel === 'low' && stock.dividendYield > 1.5) score += 15;
    else if (stock.riskLevel === 'low') score += 12;
    else if (stock.dividendYield > 2) score += 10;
    else score += 4;
  }

  // 5. Affordability (max 10 points)
  maxScore += 10;
  const monthlyInvestment = (profile.salary / 12) * 0.15;
  if (stock.pricePerShare <= monthlyInvestment * 0.3) score += 10;
  else if (stock.pricePerShare <= monthlyInvestment * 0.6) score += 7;
  else if (stock.pricePerShare <= monthlyInvestment) score += 4;

  // 6. Financial health / valuation (max 10 points)
  maxScore += 10;
  if (stock.peRatio > 0 && stock.peRatio < 20) score += 10;
  else if (stock.peRatio >= 20 && stock.peRatio < 30) score += 6;
  else if (stock.peRatio >= 30 && stock.peRatio < 50) score += 3;

  // Calculate percentage
  return Math.round((score / maxScore) * 100);
};

/** Threshold above which a stock triggers the "It's a Match!" overlay */
export const MATCH_THRESHOLD = 75;

/** Determines if a stock is a high-compatibility match */
export const isHighCompatibilityMatch = (
  stock: StockRecommendation,
  profile: UserProfile
): boolean => {
  return calculateCompatibilityScore(stock, profile) >= MATCH_THRESHOLD;
};
