import { UserProfile, StockRecommendation } from '@/types/stock-matcher';

export const generatePersonalizedExplanation = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile,
  isFirstInBatch: boolean = false
): string => {
  const reasons: string[] = [];

  // Risk alignment - most important factor
  const riskReason = getRiskReason(stock, profile);
  if (riskReason) reasons.push(riskReason);

  // Investment goal alignment
  const goalReason = getGoalReason(stock, profile);
  if (goalReason) reasons.push(goalReason);

  // Age-based reasoning
  const ageReason = getAgeReason(stock, profile);
  if (ageReason) reasons.push(ageReason);

  // Sector preference
  const sectorReason = getSectorReason(stock, profile);
  if (sectorReason) reasons.push(sectorReason);

  // Pick the 2 most relevant reasons
  const selectedReasons = reasons.slice(0, 2);
  
  if (selectedReasons.length === 0) {
    return getDefaultReason(stock, profile);
  }

  return selectedReasons.join(' ');
};

const getRiskReason = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile
): string | null => {
  const stockRisk = stock.riskLevel;
  const userRisk = profile.riskTolerance;

  if (stockRisk === userRisk) {
    if (stockRisk === 'low') {
      return `Stable and steady — matches your preference for lower-risk investments.`;
    }
    if (stockRisk === 'medium') {
      return `Balanced risk profile that fits your moderate investment approach.`;
    }
    if (stockRisk === 'high') {
      return `Higher growth potential for investors comfortable with volatility like you.`;
    }
  }

  // Stock risk is close to user preference
  if (
    (stockRisk === 'medium' && userRisk === 'low') ||
    (stockRisk === 'medium' && userRisk === 'high')
  ) {
    return `Moderate risk level offers a good balance for your portfolio.`;
  }

  return null;
};

const getGoalReason = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile
): string | null => {
  const goal = profile.investmentGoal;

  if (goal === 'growth') {
    if (stock.oneYearReturn > 15) {
      return `Strong ${stock.oneYearReturn.toFixed(0)}% annual returns align with your growth goals.`;
    }
    if (stock.oneYearReturn > 0) {
      return `Positive growth trajectory supports your wealth-building strategy.`;
    }
  }

  if (goal === 'income') {
    if (stock.dividendYield > 2) {
      return `${stock.dividendYield.toFixed(1)}% dividend yield provides the passive income you're looking for.`;
    }
    if (stock.dividendYield > 0) {
      return `Pays dividends to help generate the income stream you want.`;
    }
  }

  if (goal === 'balance') {
    if (stock.dividendYield > 1 && stock.oneYearReturn > 5) {
      return `Offers both growth (${stock.oneYearReturn.toFixed(0)}%) and income (${stock.dividendYield.toFixed(1)}% dividend) — perfect for balance.`;
    }
    return `Well-rounded stock that supports your balanced investment approach.`;
  }

  if (goal === 'preservation') {
    if (stock.riskLevel === 'low') {
      return `Low volatility helps protect your capital, matching your preservation focus.`;
    }
    if (stock.dividendYield > 2) {
      return `Steady dividends provide reliable returns while protecting your investment.`;
    }
  }

  return null;
};

const getAgeReason = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile
): string | null => {
  const age = profile.age;

  if (age < 30) {
    if (stock.oneYearReturn > 10) {
      return `With time on your side, this growth stock can compound over decades.`;
    }
    if (stock.riskLevel === 'high') {
      return `Your long investment horizon means you can ride out volatility for higher returns.`;
    }
  }

  if (age >= 30 && age < 50) {
    if (stock.riskLevel === 'medium') {
      return `Good fit for your career stage — growth potential with manageable risk.`;
    }
    if (stock.dividendYield > 1 && stock.oneYearReturn > 0) {
      return `Combines growth and income as you build wealth in your peak earning years.`;
    }
  }

  if (age >= 50) {
    if (stock.dividendYield > 2) {
      return `Strong dividend yield supports income needs as you approach retirement.`;
    }
    if (stock.riskLevel === 'low') {
      return `Stable investment that helps protect what you've built.`;
    }
  }

  return null;
};

const getSectorReason = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile
): string | null => {
  const preferredSector = profile.sectorPreference?.toLowerCase();
  const stockSector = stock.sector.toLowerCase();

  if (preferredSector === 'any' || !preferredSector) {
    return null;
  }

  if (stockSector.includes(preferredSector) || preferredSector.includes(stockSector)) {
    return `Matches your interest in the ${stock.sector} sector.`;
  }

  return null;
};

const getDefaultReason = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile
): string => {
  // Fallback based on stock characteristics
  if (stock.dividendYield > 3) {
    return `Offers a solid ${stock.dividendYield.toFixed(1)}% dividend yield for steady returns.`;
  }
  
  if (stock.oneYearReturn > 15) {
    return `Strong performer with ${stock.oneYearReturn.toFixed(0)}% annual returns.`;
  }

  if (stock.riskLevel === 'low') {
    return `A stable choice from the ${stock.sector} sector.`;
  }

  if (stock.peRatio > 0 && stock.peRatio < 20) {
    return `Reasonably valued at ${stock.peRatio.toFixed(0)}x earnings in the ${stock.sector} sector.`;
  }

  return `A ${stock.riskLevel}-risk option in the ${stock.sector} sector.`;
};
