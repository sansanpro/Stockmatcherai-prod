
import { UserProfile, StockRecommendation } from '@/types/stock-matcher';

export const sortStocksByRelevance = (
  stocks: Omit<StockRecommendation, 'whyItFits'>[],
  profile: UserProfile
): Omit<StockRecommendation, 'whyItFits'>[] => {
  return stocks.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    // Prefer stocks matching risk tolerance exactly
    if ((profile.riskTolerance === 'low' && a.riskLevel === 'low') ||
        (profile.riskTolerance === 'medium' && a.riskLevel === 'medium') ||
        (profile.riskTolerance === 'high' && a.riskLevel === 'high')) {
      scoreA += 10;
    }
    if ((profile.riskTolerance === 'low' && b.riskLevel === 'low') ||
        (profile.riskTolerance === 'medium' && b.riskLevel === 'medium') ||
        (profile.riskTolerance === 'high' && b.riskLevel === 'high')) {
      scoreB += 10;
    }

    // Prefer dividend stocks for income-focused investors
    if (profile.investmentGoal === 'income' || profile.investmentGoal === 'balance') {
      scoreA += a.dividendYield * 2;
      scoreB += b.dividendYield * 2;
    }

    // Prefer growth stocks for young investors
    if (profile.age < 35 && profile.investmentGoal === 'growth') {
      scoreA += a.oneYearReturn * 0.5;
      scoreB += b.oneYearReturn * 0.5;
    }

    return scoreB - scoreA;
  });
};
