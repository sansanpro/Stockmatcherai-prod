import { UserProfile, StockRecommendation } from '@/types/stock-matcher';
import { 
  analyzeStockFactors, 
  FactorAnalysis, 
  getPerformanceComparison, 
  getYieldComparison 
} from './stockFactorAnalyzer';
import { 
  getAllTemplates, 
  ExplanationTemplate,
  strengthLeadTemplates,
  userLeadTemplates,
  comparisonTemplates,
  ceoLeadTemplates,
  affordabilityTemplates,
  timeHorizonTemplates,
  combinationTemplates,
  personalLeadTemplates,
  trajectoryTemplates,
} from './explanationTemplates';

// Track used template IDs and explanation hashes for uniqueness
const usedTemplateIds = new Set<string>();
const usedExplanationHashes = new Set<string>();

export const clearUsedExplanations = () => {
  usedTemplateIds.clear();
  usedExplanationHashes.clear();
};

// Simple hash function for explanation uniqueness
const hashExplanation = (text: string): string => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
};

export const generatePersonalizedExplanation = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile,
  isFirstInBatch: boolean = false
): string => {
  // Clear cache at start of new batch
  if (isFirstInBatch) {
    clearUsedExplanations();
  }

  // Analyze the stock-user combination
  const analysis = analyzeStockFactors(stock, profile);
  
  // Get candidate templates based on analysis
  const candidateTemplates = selectCandidateTemplates(analysis, profile, stock);
  
  // Try each candidate template until we find a unique explanation
  for (const template of candidateTemplates) {
    // Skip if template ID already used
    if (usedTemplateIds.has(template.id)) continue;
    
    // Fill in the template with actual data
    const explanation = fillTemplate(template, stock, profile, analysis);
    
    // Check if this exact explanation was already generated
    const hash = hashExplanation(explanation);
    if (usedExplanationHashes.has(hash)) continue;
    
    // Mark as used and return
    usedTemplateIds.add(template.id);
    usedExplanationHashes.add(hash);
    return explanation;
  }
  
  // Fallback: generate a unique ticker-specific explanation
  return generateFallback(stock, profile, analysis);
};

const selectCandidateTemplates = (
  analysis: FactorAnalysis,
  profile: UserProfile,
  stock: Omit<StockRecommendation, 'whyItFits'>
): ExplanationTemplate[] => {
  const candidates: ExplanationTemplate[] = [];
  const topFactorNames = analysis.topFactors.map(f => f.name);
  
  // First: Prioritize personal/trajectory templates for better personalization
  const matchingPersonalTemplates = personalLeadTemplates.filter(t =>
    t.requiredFactors.every(f => hasFactorData(f, stock, profile, analysis))
  );
  candidates.push(...shuffleArray(matchingPersonalTemplates).slice(0, 3));
  
  // Second: Add trajectory templates for stock direction reasoning
  const matchingTrajectoryTemplates = trajectoryTemplates.filter(t =>
    t.requiredFactors.every(f => hasFactorData(f, stock, profile, analysis))
  );
  candidates.push(...shuffleArray(matchingTrajectoryTemplates).slice(0, 2));
  
  // Third: Add combination templates that match multiple top factors
  const matchingCombos = combinationTemplates.filter(t => {
    const matchCount = t.requiredFactors.filter(f => 
      topFactorNames.includes(f) || hasFactorData(f, stock, profile, analysis)
    ).length;
    return matchCount >= 2;
  });
  candidates.push(...shuffleArray(matchingCombos));
  
  // Fourth: Add user-lead templates if goal/risk/sector are strong
  if (analysis.scores.goalAlignment >= 70 || analysis.scores.riskAlignment >= 80 || analysis.scores.sectorMatch === 100) {
    const matchingUserTemplates = userLeadTemplates.filter(t =>
      t.requiredFactors.every(f => hasFactorData(f, stock, profile, analysis))
    );
    candidates.push(...shuffleArray(matchingUserTemplates));
  }
  
  // Fifth: Add strength-lead templates based on top factors
  const matchingStrengthTemplates = strengthLeadTemplates.filter(t =>
    t.requiredFactors.some(f => topFactorNames.includes(f)) &&
    t.requiredFactors.every(f => hasFactorData(f, stock, profile, analysis))
  );
  candidates.push(...shuffleArray(matchingStrengthTemplates));
  
  // Sixth: Add comparison templates
  const matchingComparisonTemplates = comparisonTemplates.filter(t =>
    t.requiredFactors.every(f => hasFactorData(f, stock, profile, analysis))
  );
  candidates.push(...shuffleArray(matchingComparisonTemplates));
  
  // Seventh: Add time-horizon templates based on age
  const timeTemplates = getTimeHorizonTemplates(profile.age);
  const matchingTimeTemplates = timeTemplates.filter(t =>
    t.requiredFactors.every(f => hasFactorData(f, stock, profile, analysis))
  );
  candidates.push(...shuffleArray(matchingTimeTemplates));
  
  // Eighth: Add CEO templates if we have CEO data
  if (analysis.ceoKeyword && stock.ceoName) {
    candidates.push(...shuffleArray(ceoLeadTemplates));
  }
  
  // Tenth: Add affordability templates if price is accessible
  if (analysis.scores.affordabilityScore >= 70) {
    candidates.push(...shuffleArray(affordabilityTemplates));
  }
  
  // Add remaining templates as fallback
  const allTemplates = getAllTemplates();
  const remainingTemplates = allTemplates.filter(t => 
    !candidates.some(c => c.id === t.id) &&
    t.requiredFactors.every(f => hasFactorData(f, stock, profile, analysis))
  );
  candidates.push(...shuffleArray(remainingTemplates));
  
  return candidates;
};

const hasFactorData = (
  factor: string,
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile,
  analysis: FactorAnalysis
): boolean => {
  switch (factor) {
    case 'performance':
      return Math.abs(stock.oneYearReturn) >= 1;
    case 'value':
      return stock.peRatio > 0 && stock.peRatio < 500;
    case 'income':
      return stock.dividendYield >= 1;
    case 'risk':
      return !!stock.riskLevel && ['low', 'medium', 'high'].includes(stock.riskLevel);
    case 'goal':
      return !!profile.investmentGoal && profile.investmentGoal !== '';
    case 'sector':
      return !!stock.sector && (profile.sectorPreference === stock.sector || profile.sectorPreference === 'any');
    case 'affordability':
      return analysis.scores.affordabilityScore >= 50 && stock.pricePerShare > 0;
    default:
      return true;
  }
};

const getTimeHorizonTemplates = (age: number): ExplanationTemplate[] => {
  if (age < 35) {
    return timeHorizonTemplates.filter(t => 
      t.id.includes('young') || t.id.includes('mid-1')
    );
  } else if (age < 50) {
    return timeHorizonTemplates.filter(t => t.id.includes('mid'));
  } else {
    return timeHorizonTemplates.filter(t => t.id.includes('mature'));
  }
};

// Generate investor type based on profile
const getInvestorType = (profile: UserProfile): string => {
  const riskPart = profile.riskTolerance === 'low' ? 'conservative' : 
                   profile.riskTolerance === 'high' ? 'aggressive' : 'balanced';
  const goalPart = profile.investmentGoal === 'income' ? 'income-focused' :
                   profile.investmentGoal === 'growth' ? 'growth-oriented' :
                   profile.investmentGoal === 'preservation' ? 'capital-preservation' : 'balanced';
  
  return `${riskPart}, ${goalPart} investor`;
};

// Generate salary context
const getSalaryContext = (salary: number, price: number): string => {
  const monthlyIncome = salary / 12;
  const affordableAmount = monthlyIncome * 0.1;
  
  if (price <= affordableAmount * 0.3) {
    return 'Well within your investment budget';
  } else if (price <= affordableAmount) {
    return 'Fits comfortably in your monthly investment allocation';
  } else if (price <= affordableAmount * 2) {
    return 'A reasonable stretch for your income level';
  } else {
    return 'Consider dollar-cost averaging to build your position';
  }
};

// Generate affordability context based on salary
const getAffordabilityContext = (salary: number, price: number): string => {
  const monthlyIncome = salary / 12;
  const affordableAmount = monthlyIncome * 0.1;
  
  if (price <= affordableAmount * 0.3) {
    return 'very accessible for your budget';
  } else if (price <= affordableAmount * 0.5) {
    return 'budget-friendly for regular investing';
  } else if (price <= affordableAmount) {
    return 'fits your monthly investment capacity';
  } else if (price <= affordableAmount * 2) {
    return 'achievable with planned savings';
  } else {
    return 'consider building position over time';
  }
};

// Generate risk profile description
const getRiskProfile = (riskTolerance: string, goal: string): string => {
  if (riskTolerance === 'low') {
    return goal === 'preservation' ? 'Your cautious approach prioritizes capital safety' :
           goal === 'income' ? 'You prefer steady income over volatility' :
           'You value stability in your portfolio';
  } else if (riskTolerance === 'high') {
    return goal === 'growth' ? 'Your aggressive stance targets maximum returns' :
           'You\'re comfortable with volatility for potential gains';
  } else {
    return goal === 'balance' ? 'Your balanced approach seeks growth with managed risk' :
           'You prefer moderate risk with reasonable upside';
  }
};

// Generate trajectory context
const getTrajectoryContext = (oneYearReturn: number): string => {
  if (oneYearReturn > 50) {
    return 'exceptional momentum suggests strong market confidence';
  } else if (oneYearReturn > 30) {
    return 'strong upward trajectory indicates robust fundamentals';
  } else if (oneYearReturn > 15) {
    return 'solid growth trajectory outpacing market averages';
  } else if (oneYearReturn > 5) {
    return 'steady positive trajectory shows resilience';
  } else if (oneYearReturn > 0) {
    return 'modest gains reflect stable business execution';
  } else if (oneYearReturn > -10) {
    return 'current dip may present entry opportunity';
  } else {
    return 'value opportunity as fundamentals remain intact';
  }
};

// Generate sector interest reasoning
const getSectorInterest = (sector: string, sectorPreference: string, goal: string): string => {
  if (sectorPreference === sector) {
    const sectorBenefits: Record<string, string> = {
      'Technology': 'Tech exposure offers innovation-driven growth potential',
      'Healthcare': 'Healthcare provides defensive stability with growth upside',
      'Finance': 'Financial sector benefits from economic cycles',
      'Energy': 'Energy sector offers inflation protection and dividends',
      'Consumer': 'Consumer sector tracks spending trends and demographics',
      'Utilities': 'Utilities deliver steady income with low volatility',
    };
    return sectorBenefits[sector] || `Your ${sector} focus positions you for sector-specific opportunities`;
  } else if (sectorPreference === 'any') {
    return `${sector} diversification strengthens your portfolio mix`;
  }
  return `${sector} adds balance to your sector allocation`;
};

// Generate goal-specific reasoning
const getGoalReason = (goal: string, stock: Omit<StockRecommendation, 'whyItFits'>): string => {
  switch (goal) {
    case 'growth':
      if (stock.oneYearReturn > 20) {
        return 'Strong returns align with your growth objectives';
      } else if (stock.oneYearReturn > 10) {
        return 'Solid growth trajectory matches your wealth-building goals';
      }
      return 'Growth potential fits your long-term wealth accumulation';
    case 'income':
      if (stock.dividendYield > 3) {
        return 'High yield delivers the income stream you\'re seeking';
      } else if (stock.dividendYield > 1.5) {
        return 'Reliable dividends support your income strategy';
      }
      return 'Dividend history aligns with your income focus';
    case 'balance':
      return 'Mix of growth and stability matches your balanced approach';
    case 'preservation':
      if (stock.riskLevel === 'low') {
        return 'Low volatility protects your capital as intended';
      }
      return 'Defensive characteristics support capital preservation';
    default:
      return 'Fundamentals align with your investment objectives';
  }
};

const fillTemplate = (
  template: ExplanationTemplate,
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile,
  analysis: FactorAnalysis
): string => {
  let result = template.template;
  
  // Stock data replacements with validation
  result = result.replace(/{ticker}/g, stock.ticker || 'Stock');
  result = result.replace(/{company}/g, stock.companyName || stock.ticker || 'Company');
  result = result.replace(/{sector}/g, stock.sector || 'sector');
  
  // Only show return if meaningful
  const returnText = Math.abs(stock.oneYearReturn) >= 1 
    ? formatReturn(stock.oneYearReturn) 
    : 'positive momentum';
  result = result.replace(/{return}/g, returnText);
  
  // Only show PE if valid
  const peText = stock.peRatio > 0 && stock.peRatio < 500 
    ? stock.peRatio.toFixed(1) 
    : 'attractive';
  result = result.replace(/{pe}/g, peText);
  
  // Only show dividend if meaningful
  const dividendText = stock.dividendYield >= 0.5 
    ? stock.dividendYield.toFixed(1) + '%' 
    : 'growing';
  result = result.replace(/{dividend}/g, dividendText);
  
  // Format price properly
  const priceText = stock.pricePerShare > 0 
    ? '$' + stock.pricePerShare.toFixed(0) 
    : 'accessible price';
  result = result.replace(/{price}/g, priceText);
  
  result = result.replace(/{risk}/g, stock.riskLevel || 'moderate');
  result = result.replace(/{marketCap}/g, analysis.marketCapTier);
  result = result.replace(/{ceoName}/g, stock.ceoName || 'leadership');
  result = result.replace(/{ceoKeyword}/g, analysis.ceoKeyword || 'innovation');
  
  // User data replacements
  result = result.replace(/{goal}/g, profile.investmentGoal || 'growth');
  
  // NEW: Personal context replacements
  result = result.replace(/{investorType}/g, getInvestorType(profile));
  result = result.replace(/{salaryContext}/g, getSalaryContext(profile.salary, stock.pricePerShare));
  result = result.replace(/{affordabilityContext}/g, getAffordabilityContext(profile.salary, stock.pricePerShare));
  result = result.replace(/{riskProfile}/g, getRiskProfile(profile.riskTolerance, profile.investmentGoal));
  result = result.replace(/{trajectoryContext}/g, getTrajectoryContext(stock.oneYearReturn));
  result = result.replace(/{sectorInterest}/g, getSectorInterest(stock.sector, profile.sectorPreference, profile.investmentGoal));
  result = result.replace(/{goalReason}/g, getGoalReason(profile.investmentGoal, stock));
  
  // Comparison text replacements
  result = result.replace(/{comparison}/g, getPerformanceComparison(stock.oneYearReturn));
  result = result.replace(/{yieldComparison}/g, getYieldComparison(stock.dividendYield));
  
  return result;
};

const formatReturn = (ret: number): string => {
  if (ret >= 0) {
    return '+' + ret.toFixed(1) + '%';
  }
  return ret.toFixed(1) + '%';
};

const generateFallback = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile,
  analysis: FactorAnalysis
): string => {
  // Generate rich fallback with personal context
  const investorType = getInvestorType(profile);
  const trajectoryContext = getTrajectoryContext(stock.oneYearReturn);
  const goalReason = getGoalReason(profile.investmentGoal, stock);
  
  // Check if sector matches preference
  const sectorMatch = profile.sectorPreference === stock.sector || profile.sectorPreference === 'any';
  
  if (sectorMatch && profile.sectorPreference !== 'any') {
    return `As a ${investorType}, ${stock.ticker} in your preferred ${stock.sector} sector offers ${trajectoryContext}. ${goalReason}.`;
  }
  
  const topFactor = analysis.topFactors[0];
  
  if (topFactor) {
    switch (topFactor.name) {
      case 'performance':
        return `${stock.ticker} delivered ${formatReturn(stock.oneYearReturn)} — ${trajectoryContext}. ${goalReason}.`;
      case 'income':
        return `${stock.dividendYield.toFixed(1)}% yield from ${stock.companyName} supports your ${profile.investmentGoal} strategy. ${getRiskProfile(profile.riskTolerance, profile.investmentGoal)}.`;
      case 'value':
        return `${stock.ticker} at ${stock.peRatio.toFixed(1)}x earnings looks ${topFactor.context}. ${goalReason}.`;
      case 'risk':
        return `${stock.companyName} offers ${stock.riskLevel}-risk exposure to ${stock.sector}. ${getRiskProfile(profile.riskTolerance, profile.investmentGoal)}.`;
      case 'goal':
        return `${stock.ticker} aligns with your ${profile.investmentGoal} investment strategy. ${trajectoryContext}.`;
      default:
        break;
    }
  }
  
  // Ultimate fallback with personal context
  const direction = stock.oneYearReturn > 0 ? trajectoryContext : 'value opportunity as fundamentals remain intact';
  return `${stock.companyName} (${stock.ticker}) shows ${direction}. ${goalReason} as a ${investorType}.`;
};

// Fisher-Yates shuffle
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};