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
  esgLeadTemplates,
  affordabilityTemplates,
  timeHorizonTemplates,
  combinationTemplates,
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
  
  // Prioritize templates based on top factors
  const allTemplates = getAllTemplates();
  
  // First: Add combination templates that match multiple top factors
  const matchingCombos = combinationTemplates.filter(t => {
    const matchCount = t.requiredFactors.filter(f => 
      topFactorNames.includes(f) || hasFactorData(f, stock, profile, analysis)
    ).length;
    return matchCount >= 2;
  });
  candidates.push(...shuffleArray(matchingCombos));
  
  // Second: Add user-lead templates if goal/risk/sector are strong
  if (analysis.scores.goalAlignment >= 70 || analysis.scores.riskAlignment >= 80) {
    const matchingUserTemplates = userLeadTemplates.filter(t =>
      t.requiredFactors.every(f => hasFactorData(f, stock, profile, analysis))
    );
    candidates.push(...shuffleArray(matchingUserTemplates));
  }
  
  // Third: Add strength-lead templates based on top factors
  const matchingStrengthTemplates = strengthLeadTemplates.filter(t =>
    t.requiredFactors.some(f => topFactorNames.includes(f)) &&
    t.requiredFactors.every(f => hasFactorData(f, stock, profile, analysis))
  );
  candidates.push(...shuffleArray(matchingStrengthTemplates));
  
  // Fourth: Add comparison templates
  const matchingComparisonTemplates = comparisonTemplates.filter(t =>
    t.requiredFactors.every(f => hasFactorData(f, stock, profile, analysis))
  );
  candidates.push(...shuffleArray(matchingComparisonTemplates));
  
  // Fifth: Add time-horizon templates based on age
  const timeTemplates = getTimeHorizonTemplates(profile.age);
  const matchingTimeTemplates = timeTemplates.filter(t =>
    t.requiredFactors.every(f => hasFactorData(f, stock, profile, analysis))
  );
  candidates.push(...shuffleArray(matchingTimeTemplates));
  
  // Sixth: Add CEO templates if we have CEO data
  if (analysis.ceoKeyword && stock.ceoName) {
    candidates.push(...shuffleArray(ceoLeadTemplates));
  }
  
  // Seventh: Add ESG templates if score is good
  if (analysis.scores.esgScore >= 75 && stock.esgScore) {
    candidates.push(...shuffleArray(esgLeadTemplates));
  }
  
  // Eighth: Add affordability templates if price is accessible
  if (analysis.scores.affordabilityScore >= 70) {
    candidates.push(...shuffleArray(affordabilityTemplates));
  }
  
  // Add remaining templates as fallback
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
      // Only use performance templates if return is meaningful (not 0 or near-zero)
      return Math.abs(stock.oneYearReturn) >= 1;
    case 'value':
      // Only use value templates if PE ratio is valid and positive
      return stock.peRatio > 0 && stock.peRatio < 500;
    case 'income':
      // Only use income templates if dividend yield is meaningful
      return stock.dividendYield >= 1;
    case 'risk':
      // Always have risk data if risk level is defined
      return !!stock.riskLevel && ['low', 'medium', 'high'].includes(stock.riskLevel);
    case 'goal':
      // Only use goal templates if user has set a goal
      return !!profile.investmentGoal && profile.investmentGoal !== '';
    case 'sector':
      // Only use sector templates if there's a meaningful sector match
      return !!stock.sector && (profile.sectorPreference === stock.sector || profile.sectorPreference === 'any');
    case 'affordability':
      // Only use affordability templates if score is decent and price is valid
      return analysis.scores.affordabilityScore >= 50 && stock.pricePerShare > 0;
    case 'esg':
      // Only use ESG templates if we have a valid ESG score
      return !!stock.esgScore && stock.esgScore >= 70 && stock.esgScore <= 100;
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
  
  // Only show ESG if valid
  const esgText = stock.esgScore && stock.esgScore >= 50 && stock.esgScore <= 100 
    ? stock.esgScore.toString() 
    : 'strong';
  result = result.replace(/{esg}/g, esgText);
  
  // User data replacements
  result = result.replace(/{goal}/g, profile.investmentGoal || 'growth');
  
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
  // Generate unique fallback based on top factors
  const topFactor = analysis.topFactors[0];
  
  if (topFactor) {
    switch (topFactor.name) {
      case 'performance':
        return `${stock.ticker} delivered ${formatReturn(stock.oneYearReturn)} — ${topFactor.context} in ${stock.sector}.`;
      case 'income':
        return `${stock.dividendYield.toFixed(1)}% yield from ${stock.companyName} provides steady income.`;
      case 'value':
        return `${stock.ticker} at ${stock.peRatio.toFixed(1)}x earnings looks ${topFactor.context}.`;
      case 'risk':
        return `${stock.companyName} offers ${stock.riskLevel}-risk exposure to ${stock.sector}.`;
      case 'goal':
        return `${stock.ticker} aligns with your ${profile.investmentGoal} investment strategy.`;
      default:
        break;
    }
  }
  
  // Ultimate fallback
  const direction = stock.oneYearReturn > 0 ? 'positive momentum' : 'value opportunity';
  return `${stock.companyName} (${stock.ticker}) shows ${direction} at $${stock.pricePerShare.toFixed(0)}/share.`;
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
