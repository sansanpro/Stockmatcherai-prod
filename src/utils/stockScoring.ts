
import { UserProfile, StockRecommendation } from '@/types/stock-matcher';

export const sortStocksByRelevance = (
  stocks: Omit<StockRecommendation, 'whyItFits'>[],
  profile: UserProfile
): Omit<StockRecommendation, 'whyItFits'>[] => {
  return stocks.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    // Perfect risk tolerance match gets high priority
    if ((profile.riskTolerance === 'low' && a.riskLevel === 'low') ||
        (profile.riskTolerance === 'medium' && a.riskLevel === 'medium') ||
        (profile.riskTolerance === 'high' && a.riskLevel === 'high')) {
      scoreA += 15;
    }
    if ((profile.riskTolerance === 'low' && b.riskLevel === 'low') ||
        (profile.riskTolerance === 'medium' && b.riskLevel === 'medium') ||
        (profile.riskTolerance === 'high' && b.riskLevel === 'high')) {
      scoreB += 15;
    }

    // Compatible risk tolerance (medium can accept low/high)
    if (profile.riskTolerance === 'medium') {
      if (a.riskLevel === 'low' || a.riskLevel === 'high') scoreA += 8;
      if (b.riskLevel === 'low' || b.riskLevel === 'high') scoreB += 8;
    }

    // Sector preference match
    if (profile.sectorPreference !== 'any') {
      if (a.sector.toLowerCase() === profile.sectorPreference.toLowerCase()) scoreA += 12;
      if (b.sector.toLowerCase() === profile.sectorPreference.toLowerCase()) scoreB += 12;
    }

    // Investment goal alignment
    if (profile.investmentGoal === 'income' || profile.investmentGoal === 'balance') {
      scoreA += a.dividendYield * 3; // Higher weight for dividend yield
      scoreB += b.dividendYield * 3;
    }

    if (profile.investmentGoal === 'growth' || profile.investmentGoal === 'short-term') {
      scoreA += Math.max(0, a.oneYearReturn) * 0.8; // Higher weight for positive returns
      scoreB += Math.max(0, b.oneYearReturn) * 0.8;
    }

    // Age-based preferences
    if (profile.age < 30) {
      // Young investors prefer growth
      scoreA += Math.max(0, a.oneYearReturn) * 0.6;
      scoreB += Math.max(0, b.oneYearReturn) * 0.6;
      
      // Prefer tech sector for young investors
      if (a.sector === 'Technology') scoreA += 5;
      if (b.sector === 'Technology') scoreB += 5;
    } else if (profile.age > 50) {
      // Older investors prefer stability and income
      scoreA += a.dividendYield * 2;
      scoreB += b.dividendYield * 2;
      
      // Prefer low-risk stocks
      if (a.riskLevel === 'low') scoreA += 8;
      if (b.riskLevel === 'low') scoreB += 8;
    }

    // Experience level considerations
    if (profile.experience === 'none' || profile.experience === 'beginner') {
      // Prefer well-known, stable companies
      const blueChipTickers = ['AAPL', 'MSFT', 'JNJ', 'KO', 'PEP', 'WMT', 'JPM'];
      if (blueChipTickers.includes(a.ticker)) scoreA += 10;
      if (blueChipTickers.includes(b.ticker)) scoreB += 10;
      
      // Prefer dividend-paying stocks for stability
      if (a.dividendYield > 1) scoreA += 5;
      if (b.dividendYield > 1) scoreB += 5;
    } else if (profile.experience === 'advanced') {
      // Advanced investors may prefer higher growth potential
      scoreA += Math.max(0, a.oneYearReturn - 10) * 0.5; // Bonus for returns above 10%
      scoreB += Math.max(0, b.oneYearReturn - 10) * 0.5;
    }

    // Affordability consideration
    const monthlyInvestmentCapacity = profile.salary / 12 * 0.1; // 10% of monthly income
    if (a.pricePerShare <= monthlyInvestmentCapacity) scoreA += 5;
    if (b.pricePerShare <= monthlyInvestmentCapacity) scoreB += 5;

    // ESG score bonus for ethical investors (implied from young age + certain sectors)
    if (profile.age < 40 && (profile.sectorPreference === 'any' || profile.sectorPreference === 'technology')) {
      if (a.esgScore && a.esgScore > 75) scoreA += 3;
      if (b.esgScore && b.esgScore > 75) scoreB += 3;
    }

    return scoreB - scoreA;
  });
};
