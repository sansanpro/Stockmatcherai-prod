
import { UserProfile, StockRecommendation } from '@/types/stock-matcher';

export const generatePersonalizedExplanation = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile
): string => {
  const reasons = [];

  // Risk alignment
  if (stock.riskLevel === profile.riskTolerance) {
    reasons.push(`Perfect ${stock.riskLevel}-risk match for your comfort level`);
  }

  // Sector preference
  if (profile.sectorPreference !== 'any' && stock.sector.toLowerCase() === profile.sectorPreference.toLowerCase()) {
    reasons.push(`Matches your ${profile.sectorPreference} sector preference`);
  }

  // Age-based recommendations
  if (profile.age < 30) {
    if (stock.oneYearReturn > 10) {
      reasons.push('Strong growth potential for young investors');
    }
    if (stock.sector === 'Technology') {
      reasons.push('Tech exposure ideal for long-term wealth building');
    }
  } else if (profile.age > 50) {
    if (stock.dividendYield > 2) {
      reasons.push('Reliable dividend income for pre-retirement planning');
    }
    if (stock.riskLevel === 'low') {
      reasons.push('Conservative choice suitable for wealth preservation');
    }
  }

  // Experience level
  if (profile.experience === 'none' || profile.experience === 'beginner') {
    if (stock.riskLevel === 'low') {
      reasons.push('Safe choice for new investors to learn with');
    }
    if (['AAPL', 'MSFT', 'KO', 'JNJ'].includes(stock.ticker)) {
      reasons.push('Well-known, stable company perfect for beginners');
    }
  }

  // Investment goal alignment
  if (profile.investmentGoal === 'income' && stock.dividendYield > 2) {
    reasons.push(`${stock.dividendYield.toFixed(1)}% dividend yield provides regular income`);
  }
  if (profile.investmentGoal === 'growth' && stock.oneYearReturn > 15) {
    reasons.push('Excellent growth track record with strong future potential');
  }

  // CEO leadership quality
  if (stock.ceoName) {
    reasons.push('Proven leadership with strong track record of success');
  }

  // Affordability
  const monthlyInvestmentCapacity = profile.salary / 12 * 0.1; // 10% of monthly income
  if (stock.pricePerShare < monthlyInvestmentCapacity) {
    reasons.push('Affordable price point fits your budget');
  }

  // Default reasons if none match
  if (reasons.length === 0) {
    reasons.push('Solid fundamentals and strong market position');
    reasons.push('Good balance of risk and return potential');
  }

  return reasons.slice(0, 3).join('. ') + '.';
};
