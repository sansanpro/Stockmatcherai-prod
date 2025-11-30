import { UserProfile, StockRecommendation } from '@/types/stock-matcher';

// Track used explanations to ensure uniqueness within a session
const usedExplanations = new Set<string>();

export const clearUsedExplanations = () => {
  usedExplanations.clear();
};

export const generatePersonalizedExplanation = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile,
  isFirstInBatch: boolean = false
): string => {
  // Clear cache at start of new batch
  if (isFirstInBatch) {
    usedExplanations.clear();
  }

  // Generate multiple candidate explanations and pick a unique one
  const candidates = generateAllCandidates(stock, profile);
  
  // Find the first unused explanation
  for (const candidate of candidates) {
    if (!usedExplanations.has(candidate)) {
      usedExplanations.add(candidate);
      return candidate;
    }
  }
  
  // Fallback: generate a ticker-specific explanation
  const fallback = `${stock.ticker} shows ${stock.oneYearReturn > 0 ? 'positive' : 'resilient'} momentum at $${stock.pricePerShare.toFixed(0)}/share.`;
  usedExplanations.add(fallback);
  return fallback;
};

const generateAllCandidates = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile
): string[] => {
  const candidates: string[] = [];
  
  // Performance-based explanations
  candidates.push(...getPerformanceReasons(stock, profile));
  
  // Value-based explanations
  candidates.push(...getValueReasons(stock, profile));
  
  // Income-based explanations
  candidates.push(...getIncomeReasons(stock, profile));
  
  // Risk-aligned explanations
  candidates.push(...getRiskReasons(stock, profile));
  
  // Goal-based explanations
  candidates.push(...getGoalReasons(stock, profile));
  
  // Shuffle to add variety
  return candidates.sort(() => Math.random() - 0.5);
};

const getPerformanceReasons = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile
): string[] => {
  const reasons: string[] = [];
  const ret = stock.oneYearReturn;
  
  if (ret > 50) {
    reasons.push(`Up ${ret.toFixed(0)}% this year — ${stock.companyName} is on a tear.`);
    reasons.push(`${stock.ticker} surged ${ret.toFixed(0)}% in 12 months. Strong momentum play.`);
  } else if (ret > 25) {
    reasons.push(`${ret.toFixed(0)}% annual gain shows ${stock.companyName} is outperforming the market.`);
    reasons.push(`Solid ${ret.toFixed(0)}% yearly return from ${stock.ticker}. Growth is real.`);
  } else if (ret > 10) {
    reasons.push(`${stock.ticker} delivered ${ret.toFixed(0)}% returns — beating most savings accounts.`);
    reasons.push(`Steady ${ret.toFixed(0)}% growth from ${stock.companyName}. Consistent performer.`);
  } else if (ret > 0) {
    reasons.push(`${stock.companyName} held positive at +${ret.toFixed(1)}% when others dropped.`);
    reasons.push(`${stock.ticker} staying green (+${ret.toFixed(1)}%) in a tough market.`);
  } else if (ret > -10) {
    reasons.push(`${stock.ticker} dipped ${ret.toFixed(1)}% — potential entry point for believers.`);
    reasons.push(`${stock.companyName} down slightly (${ret.toFixed(1)}%). Could be undervalued.`);
  } else {
    reasons.push(`${stock.ticker} is down ${Math.abs(ret).toFixed(0)}% — high risk, potential rebound.`);
  }
  
  return reasons;
};

const getValueReasons = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile
): string[] => {
  const reasons: string[] = [];
  const pe = stock.peRatio;
  const price = stock.pricePerShare;
  
  if (pe > 0 && pe < 15) {
    reasons.push(`P/E of ${pe.toFixed(1)} suggests ${stock.ticker} may be undervalued.`);
    reasons.push(`Trading at just ${pe.toFixed(1)}x earnings. Value investors take note.`);
  } else if (pe >= 15 && pe < 25) {
    reasons.push(`${stock.ticker} at ${pe.toFixed(1)}x earnings — fairly valued with room to grow.`);
  } else if (pe >= 25 && pe < 40) {
    reasons.push(`Higher P/E (${pe.toFixed(1)}) reflects market confidence in ${stock.companyName}.`);
  }
  
  if (price < 50) {
    reasons.push(`At $${price.toFixed(0)}/share, ${stock.ticker} is accessible for building positions.`);
  } else if (price > 500) {
    reasons.push(`Premium stock at $${price.toFixed(0)} — ${stock.companyName} commands investor confidence.`);
  }
  
  return reasons;
};

const getIncomeReasons = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile
): string[] => {
  const reasons: string[] = [];
  const div = stock.dividendYield;
  
  if (div > 4) {
    reasons.push(`${div.toFixed(1)}% dividend yield — ${stock.ticker} pays you while you wait.`);
    reasons.push(`High ${div.toFixed(1)}% yield from ${stock.companyName}. Real passive income.`);
    if (profile.investmentGoal === 'income') {
      reasons.push(`${div.toFixed(1)}% dividends align perfectly with your income goals.`);
    }
  } else if (div > 2) {
    reasons.push(`${stock.ticker} pays ${div.toFixed(1)}% dividends — beat inflation while growing.`);
    reasons.push(`${div.toFixed(1)}% yield plus ${stock.oneYearReturn > 0 ? 'growth' : 'recovery potential'} from ${stock.companyName}.`);
  } else if (div > 0) {
    reasons.push(`Small ${div.toFixed(1)}% dividend, but ${stock.companyName} reinvests for growth.`);
  }
  
  return reasons;
};

const getRiskReasons = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile
): string[] => {
  const reasons: string[] = [];
  const risk = stock.riskLevel;
  const userRisk = profile.riskTolerance;
  
  if (risk === 'low' && userRisk === 'low') {
    reasons.push(`${stock.ticker}'s stability matches your conservative approach.`);
    reasons.push(`Low volatility ${stock.sector} stock for your risk-averse portfolio.`);
  } else if (risk === 'low') {
    reasons.push(`${stock.companyName} offers a stable anchor for any portfolio.`);
  }
  
  if (risk === 'medium') {
    reasons.push(`${stock.ticker} balances growth opportunity with manageable risk.`);
    reasons.push(`Mid-risk ${stock.sector} play — not too wild, not too boring.`);
  }
  
  if (risk === 'high' && userRisk === 'high') {
    reasons.push(`${stock.ticker}'s volatility could reward your high-risk tolerance.`);
    reasons.push(`High-growth potential in ${stock.sector} — built for aggressive investors like you.`);
  } else if (risk === 'high') {
    reasons.push(`${stock.companyName} is volatile but could deliver outsized returns.`);
  }
  
  return reasons;
};

const getGoalReasons = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile
): string[] => {
  const reasons: string[] = [];
  const goal = profile.investmentGoal;
  
  if (goal === 'growth') {
    if (stock.oneYearReturn > 15) {
      reasons.push(`${stock.oneYearReturn.toFixed(0)}% returns prove ${stock.ticker} can deliver the growth you want.`);
    }
    reasons.push(`${stock.companyName} in ${stock.sector} — positioned for the growth you're seeking.`);
  }
  
  if (goal === 'income') {
    if (stock.dividendYield > 2) {
      reasons.push(`${stock.dividendYield.toFixed(1)}% yield supports your passive income strategy.`);
    }
    reasons.push(`${stock.ticker} can contribute to your income-generating portfolio.`);
  }
  
  if (goal === 'balance') {
    if (stock.dividendYield > 1 && stock.oneYearReturn > 5) {
      reasons.push(`${stock.ticker} offers both ${stock.oneYearReturn.toFixed(0)}% growth and ${stock.dividendYield.toFixed(1)}% income.`);
    }
    reasons.push(`${stock.companyName} fits your balanced approach — growth with some stability.`);
  }
  
  if (goal === 'preservation') {
    if (stock.riskLevel === 'low') {
      reasons.push(`${stock.ticker}'s low volatility protects what you've built.`);
    }
    reasons.push(`${stock.sector} sector stability helps preserve your capital.`);
  }
  
  // Age-based reasoning
  if (profile.age < 30 && stock.oneYearReturn > 10) {
    reasons.push(`Time is on your side — ${stock.ticker}'s growth can compound for decades.`);
  }
  if (profile.age >= 50 && stock.dividendYield > 2) {
    reasons.push(`${stock.dividendYield.toFixed(1)}% dividends support your retirement income needs.`);
  }
  
  return reasons;
};
