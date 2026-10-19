import { UserProfile, StockRecommendation } from '@/types/stock-matcher';

export interface FactorScores {
  riskAlignment: number;      // 0-100: How well stock risk matches user tolerance
  goalAlignment: number;      // 0-100: How well stock fits investment goals
  performanceStrength: number; // 0-100: Recent performance quality
  valueScore: number;         // 0-100: Valuation attractiveness
  incomeScore: number;        // 0-100: Dividend income potential
  affordabilityScore: number; // 0-100: Price accessibility for user
  sectorMatch: number;        // 0-100: Sector preference alignment
}

export interface FactorAnalysis {
  scores: FactorScores;
  topFactors: TopFactor[];
  marketCapTier: 'mega' | 'large' | 'mid' | 'small' | 'micro';
  performanceTier: 'exceptional' | 'strong' | 'moderate' | 'weak' | 'negative';
  valueTier: 'deep-value' | 'value' | 'fair' | 'growth' | 'expensive';
  incomeTier: 'high-yield' | 'moderate-yield' | 'low-yield' | 'no-yield';
  ceoKeyword: string | null;
}

export interface TopFactor {
  name: string;
  score: number;
  dataPoint: string;
  context: string;
}

export const analyzeStockFactors = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile
): FactorAnalysis => {
  const scores = calculateFactorScores(stock, profile);
  const topFactors = identifyTopFactors(stock, profile, scores);
  
  return {
    scores,
    topFactors,
    marketCapTier: categorizeMarketCap(stock.marketCap),
    performanceTier: categorizePerformance(stock.oneYearReturn),
    valueTier: categorizeValue(stock.peRatio),
    incomeTier: categorizeIncome(stock.dividendYield),
    ceoKeyword: extractCeoKeyword(stock.ceoHighlights),
  };
};

const calculateFactorScores = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile
): FactorScores => {
  return {
    riskAlignment: calculateRiskAlignment(stock.riskLevel, profile.riskTolerance),
    goalAlignment: calculateGoalAlignment(stock, profile.investmentGoal),
    performanceStrength: calculatePerformanceStrength(stock.oneYearReturn),
    valueScore: calculateValueScore(stock.peRatio),
    incomeScore: calculateIncomeScore(stock.dividendYield, profile.investmentGoal),
    affordabilityScore: calculateAffordability(stock.pricePerShare, profile.salary),
    sectorMatch: profile.sectorPreference === stock.sector || profile.sectorPreference === 'any' ? 100 : 40,
  };
};

const calculateRiskAlignment = (stockRisk: string, userRisk: string): number => {
  const riskMap: Record<string, number> = { low: 1, medium: 2, high: 3 };
  const stockLevel = riskMap[stockRisk] || 2;
  const userLevel = riskMap[userRisk] || 2;
  const diff = Math.abs(stockLevel - userLevel);
  
  if (diff === 0) return 100;
  if (diff === 1) return 70;
  return 40;
};

const calculateGoalAlignment = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  goal: string
): number => {
  switch (goal) {
    case 'growth':
      return stock.oneYearReturn > 20 ? 100 : stock.oneYearReturn > 10 ? 80 : stock.oneYearReturn > 0 ? 60 : 30;
    case 'income':
      return stock.dividendYield > 4 ? 100 : stock.dividendYield > 2 ? 80 : stock.dividendYield > 0.5 ? 50 : 20;
    case 'balance':
      const growthPart = stock.oneYearReturn > 5 ? 50 : 25;
      const incomePart = stock.dividendYield > 1.5 ? 50 : 25;
      return growthPart + incomePart;
    case 'preservation':
      return stock.riskLevel === 'low' ? 100 : stock.riskLevel === 'medium' ? 60 : 30;
    default:
      return 50;
  }
};

const calculatePerformanceStrength = (oneYearReturn: number): number => {
  if (oneYearReturn > 50) return 100;
  if (oneYearReturn > 30) return 90;
  if (oneYearReturn > 15) return 75;
  if (oneYearReturn > 5) return 60;
  if (oneYearReturn > 0) return 50;
  if (oneYearReturn > -10) return 35;
  return 20;
};

const calculateValueScore = (peRatio: number): number => {
  if (peRatio <= 0) return 30; // Negative earnings
  if (peRatio < 10) return 100; // Deep value
  if (peRatio < 15) return 90;
  if (peRatio < 20) return 75;
  if (peRatio < 30) return 60;
  if (peRatio < 50) return 45;
  return 30; // Expensive
};

const calculateIncomeScore = (dividend: number, goal: string): number => {
  const baseScore = dividend > 5 ? 100 : dividend > 3 ? 85 : dividend > 2 ? 70 : dividend > 1 ? 50 : dividend > 0 ? 30 : 10;
  return goal === 'income' ? Math.min(100, baseScore + 15) : baseScore;
};

const calculateAffordability = (price: number, salary: number): number => {
  const monthlyIncome = salary / 12;
  const affordablePrice = monthlyIncome * 0.1; // 10% of monthly income
  
  if (price <= affordablePrice * 0.5) return 100;
  if (price <= affordablePrice) return 85;
  if (price <= affordablePrice * 2) return 70;
  if (price <= affordablePrice * 5) return 50;
  return 30;
};

const identifyTopFactors = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile,
  scores: FactorScores
): TopFactor[] => {
  const factors: TopFactor[] = [];
  
  // Performance factor - only if return is meaningful (not near zero)
  if (scores.performanceStrength >= 60 && Math.abs(stock.oneYearReturn) >= 1) {
    factors.push({
      name: 'performance',
      score: scores.performanceStrength,
      dataPoint: `${stock.oneYearReturn > 0 ? '+' : ''}${stock.oneYearReturn.toFixed(1)}%`,
      context: stock.oneYearReturn > 20 ? 'exceptional growth' : stock.oneYearReturn > 10 ? 'strong returns' : 'steady gains',
    });
  }
  
  // Risk alignment factor - only if risk level is valid
  if (scores.riskAlignment >= 70 && stock.riskLevel && ['low', 'medium', 'high'].includes(stock.riskLevel)) {
    factors.push({
      name: 'risk',
      score: scores.riskAlignment,
      dataPoint: stock.riskLevel,
      context: stock.riskLevel === 'low' ? 'stability' : stock.riskLevel === 'medium' ? 'balanced' : 'growth potential',
    });
  }
  
  // Value factor - only if PE is valid and meaningful
  if (scores.valueScore >= 70 && stock.peRatio > 0 && stock.peRatio < 500) {
    factors.push({
      name: 'value',
      score: scores.valueScore,
      dataPoint: `${stock.peRatio.toFixed(1)}x`,
      context: stock.peRatio < 15 ? 'undervalued' : 'fairly priced',
    });
  }
  
  // Income factor - only if dividend is meaningful (>= 1%)
  if (scores.incomeScore >= 60 && stock.dividendYield >= 1) {
    factors.push({
      name: 'income',
      score: scores.incomeScore,
      dataPoint: `${stock.dividendYield.toFixed(1)}%`,
      context: stock.dividendYield > 3 ? 'high yield' : 'steady income',
    });
  }
  
  // Affordability factor - only if price is valid
  if (scores.affordabilityScore >= 70 && stock.pricePerShare > 0) {
    factors.push({
      name: 'affordability',
      score: scores.affordabilityScore,
      dataPoint: `$${stock.pricePerShare.toFixed(0)}`,
      context: stock.pricePerShare < 50 ? 'accessible entry' : 'within reach',
    });
  }
  
  // Goal alignment factor - only if goal is set
  if (scores.goalAlignment >= 75 && profile.investmentGoal) {
    factors.push({
      name: 'goal',
      score: scores.goalAlignment,
      dataPoint: profile.investmentGoal,
      context: `${profile.investmentGoal} strategy`,
    });
  }
  
  // Sector match factor
  if (scores.sectorMatch === 100 && stock.sector) {
    factors.push({
      name: 'sector',
      score: scores.sectorMatch,
      dataPoint: stock.sector,
      context: 'preferred sector',
    });
  }
  
  // Sort by score and return top 3
  return factors.sort((a, b) => b.score - a.score).slice(0, 3);
};

const categorizeMarketCap = (marketCap: string): 'mega' | 'large' | 'mid' | 'small' | 'micro' => {
  const cap = marketCap.toLowerCase();
  if (cap.includes('t') || (cap.includes('b') && parseFloat(cap) > 200)) return 'mega';
  if (cap.includes('b') && parseFloat(cap) > 10) return 'large';
  if (cap.includes('b')) return 'mid';
  if (cap.includes('m') && parseFloat(cap) > 300) return 'small';
  return 'micro';
};

const categorizePerformance = (ret: number): 'exceptional' | 'strong' | 'moderate' | 'weak' | 'negative' => {
  if (ret > 40) return 'exceptional';
  if (ret > 15) return 'strong';
  if (ret > 0) return 'moderate';
  if (ret > -15) return 'weak';
  return 'negative';
};

const categorizeValue = (pe: number): 'deep-value' | 'value' | 'fair' | 'growth' | 'expensive' => {
  if (pe <= 0) return 'expensive'; // No earnings
  if (pe < 10) return 'deep-value';
  if (pe < 15) return 'value';
  if (pe < 25) return 'fair';
  if (pe < 40) return 'growth';
  return 'expensive';
};

const categorizeIncome = (dividend: number): 'high-yield' | 'moderate-yield' | 'low-yield' | 'no-yield' => {
  if (dividend > 4) return 'high-yield';
  if (dividend > 2) return 'moderate-yield';
  if (dividend > 0) return 'low-yield';
  return 'no-yield';
};

const extractCeoKeyword = (highlights: string): string | null => {
  if (!highlights) return null;
  
  const keywords = [
    'innovation', 'growth', 'sustainability', 'transformation', 'leadership',
    'expansion', 'efficiency', 'technology', 'customer', 'global',
    'digital', 'strategic', 'profitable', 'market leader', 'pioneer'
  ];
  
  const lowerHighlights = highlights.toLowerCase();
  for (const keyword of keywords) {
    if (lowerHighlights.includes(keyword)) return keyword;
  }
  
  return null;
};

// Utility function to get relative comparison text
export const getPerformanceComparison = (ret: number): string => {
  if (ret > 50) return 'crushing the market';
  if (ret > 30) return 'significantly outperforming';
  if (ret > 15) return 'beating the S&P 500';
  if (ret > 8) return 'outpacing most stocks';
  if (ret > 0) return 'holding positive';
  if (ret > -10) return 'weathering volatility';
  return 'facing headwinds';
};

export const getYieldComparison = (dividend: number): string => {
  if (dividend > 5) return 'among the highest yields in its class';
  if (dividend > 3) return 'above-average income';
  if (dividend > 2) return 'competitive yield';
  if (dividend > 1) return 'modest but growing dividends';
  if (dividend > 0) return 'token dividend';
  return 'reinvesting for growth';
};
