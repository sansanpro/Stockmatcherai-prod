
import { UserProfile, StockRecommendation } from '@/types/stock-matcher';

export const sortStocksByRelevance = (
  stocks: Omit<StockRecommendation, 'whyItFits'>[],
  profile: UserProfile
): Omit<StockRecommendation, 'whyItFits'>[] => {
  if (!stocks || stocks.length === 0) {
    return [];
  }

  return stocks.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    // Perfect risk tolerance match (high priority)
    const getRiskScore = (stock: any, userRisk: string) => {
      if (stock.riskLevel === userRisk) return 20;
      if (userRisk === 'medium') {
        return stock.riskLevel === 'low' ? 15 : 12; // Prefer low risk for medium tolerance
      }
      if (userRisk === 'low' && stock.riskLevel === 'medium') return 8;
      if (userRisk === 'high' && stock.riskLevel === 'medium') return 10;
      return 0;
    };

    scoreA += getRiskScore(a, profile.riskTolerance);
    scoreB += getRiskScore(b, profile.riskTolerance);

    // Sector preference matching
    if (profile.sectorPreference !== 'any') {
      if (a.sector.toLowerCase() === profile.sectorPreference.toLowerCase()) scoreA += 18;
      if (b.sector.toLowerCase() === profile.sectorPreference.toLowerCase()) scoreB += 18;
    }

    // Investment goal alignment (enhanced)
    const getGoalScore = (stock: any, goal: string) => {
      switch (goal) {
        case 'income':
          if (stock.dividendYield > 4) return 15;
          if (stock.dividendYield > 2) return 12;
          if (stock.dividendYield > 1) return 8;
          return 0;
        case 'growth':
          if (stock.oneYearReturn > 25) return 15;
          if (stock.oneYearReturn > 15) return 12;
          if (stock.oneYearReturn > 8) return 8;
          return Math.max(0, stock.oneYearReturn * 0.3);
        case 'short-term':
          return Math.abs(stock.oneYearReturn) * 0.4; // Reward volatility
        case 'retirement':
          let retirementScore = 0;
          if (stock.riskLevel === 'low') retirementScore += 10;
          if (stock.dividendYield > 2) retirementScore += 8;
          if (stock.oneYearReturn > 0 && stock.oneYearReturn < 15) retirementScore += 5;
          return retirementScore;
        case 'balance':
          let balanceScore = 0;
          if (stock.dividendYield > 1) balanceScore += 6;
          if (stock.oneYearReturn > 5 && stock.oneYearReturn < 20) balanceScore += 8;
          if (stock.riskLevel === 'medium') balanceScore += 4;
          return balanceScore;
        default:
          return 0;
      }
    };

    scoreA += getGoalScore(a, profile.investmentGoal);
    scoreB += getGoalScore(b, profile.investmentGoal);

    // Age-based sophisticated scoring
    const getAgeScore = (stock: any, age: number) => {
      let ageScore = 0;
      
      if (age < 25) {
        // Very young: aggressive growth
        ageScore += Math.max(0, stock.oneYearReturn) * 0.8;
        if (stock.sector === 'Technology') ageScore += 8;
        if (stock.riskLevel === 'high') ageScore += 5;
      } else if (age < 35) {
        // Young: growth with some stability
        ageScore += Math.max(0, stock.oneYearReturn) * 0.6;
        if (stock.sector === 'Technology') ageScore += 6;
        if (stock.dividendYield > 1) ageScore += 3;
      } else if (age < 50) {
        // Middle-aged: balanced approach
        ageScore += Math.max(0, stock.oneYearReturn) * 0.4;
        ageScore += stock.dividendYield * 2;
        if (stock.riskLevel === 'medium') ageScore += 5;
      } else {
        // Older: stability and income
        ageScore += stock.dividendYield * 3;
        if (stock.riskLevel === 'low') ageScore += 10;
        if (stock.oneYearReturn > 0 && stock.oneYearReturn < 12) ageScore += 6;
      }
      
      return ageScore;
    };

    scoreA += getAgeScore(a, profile.age);
    scoreB += getAgeScore(b, profile.age);

    // Experience level scoring (enhanced)
    const getExperienceScore = (stock: any, experience: string) => {
      const blueChipTickers = ['AAPL', 'MSFT', 'JNJ', 'KO', 'PEP', 'WMT', 'JPM', 'V', 'MA', 'UNH'];
      const growthTickers = ['GOOGL', 'AMZN', 'TSLA', 'NVDA', 'NFLX', 'ADBE', 'CRM'];
      
      switch (experience) {
        case 'none':
          if (blueChipTickers.includes(stock.ticker)) return 15;
          if (stock.riskLevel === 'low') return 10;
          if (stock.dividendYield > 2) return 8;
          return 0;
        case 'beginner':
          if (blueChipTickers.includes(stock.ticker)) return 12;
          if (stock.riskLevel === 'low') return 8;
          if (stock.dividendYield > 1.5) return 6;
          return 0;
        case 'intermediate':
          if (stock.riskLevel === 'medium') return 6;
          if (growthTickers.includes(stock.ticker)) return 4;
          return 0;
        case 'advanced':
          if (stock.oneYearReturn > 20) return 8;
          if (stock.riskLevel === 'high') return 5;
          if (growthTickers.includes(stock.ticker)) return 6;
          return 0;
        default:
          return 0;
      }
    };

    scoreA += getExperienceScore(a, profile.experience);
    scoreB += getExperienceScore(b, profile.experience);

    // Salary-based affordability scoring
    const getAffordabilityScore = (stock: any, salary: number) => {
      const monthlyIncome = salary / 12;
      const investmentCapacity = monthlyIncome * 0.15; // 15% of monthly income
      
      if (stock.pricePerShare <= investmentCapacity * 0.5) return 8; // Very affordable
      if (stock.pricePerShare <= investmentCapacity) return 5; // Affordable
      if (stock.pricePerShare <= investmentCapacity * 2) return 2; // Somewhat affordable
      return 0; // Expensive
    };

    scoreA += getAffordabilityScore(a, profile.salary);
    scoreB += getAffordabilityScore(b, profile.salary);

    // ESG and sustainability bonus
    const getESGScore = (stock: any, age: number) => {
      if (!stock.esgScore) return 0;
      
      // Younger investors care more about ESG
      const ageFactor = age < 40 ? 1.5 : age < 55 ? 1.0 : 0.5;
      
      if (stock.esgScore > 80) return 6 * ageFactor;
      if (stock.esgScore > 70) return 4 * ageFactor;
      if (stock.esgScore > 60) return 2 * ageFactor;
      return 0;
    };

    scoreA += getESGScore(a, profile.age);
    scoreB += getESGScore(b, profile.age);

    // Financial health indicators
    const getFinancialHealthScore = (stock: any) => {
      let healthScore = 0;
      
      // P/E ratio scoring (reasonable valuations)
      if (stock.peRatio > 0 && stock.peRatio < 15) healthScore += 4;
      else if (stock.peRatio >= 15 && stock.peRatio < 25) healthScore += 2;
      else if (stock.peRatio >= 25 && stock.peRatio < 35) healthScore += 1;
      
      // Performance consistency
      if (stock.oneYearReturn > 0 && stock.oneYearReturn < 30) healthScore += 3;
      
      return healthScore;
    };

    scoreA += getFinancialHealthScore(a);
    scoreB += getFinancialHealthScore(b);

    // Diversification bonus (prefer different sectors)
    // This would require tracking already selected stocks, simplified for now
    
    return scoreB - scoreA;
  });
};
