// Enhanced explanation generation that incorporates FMP company data and news
import { UserProfile, StockRecommendation } from '@/types/stock-matcher';
import { generatePersonalizedExplanation, clearUsedExplanations } from './explanationGenerator';
import { FMPClientService, FMPCompanyProfile, FMPNewsItem } from '@/services/fmpService';

export interface EnhancedExplanationData {
  companyProfile?: FMPCompanyProfile | null;
  companyNews?: FMPNewsItem[];
  newsContext?: {
    sentiment: 'positive' | 'neutral' | 'negative';
    latestHeadline: string;
    newsContext: string;
  };
  companyInsights?: {
    businessFocus: string;
    employeeScale: string;
    marketPosition: string;
    industryContext: string;
  };
}

// Templates that use company description data
const companyDescriptionTemplates = [
  "{company}, {marketPosition} in {industryContext}, aligns with your {goal} strategy.",
  "As a {employeeScale} with {marketPosition} status, {ticker} fits your {risk}-risk profile.",
  "{company} — {businessFocus}. At {price}, accessible for your portfolio.",
  "This {marketPosition} in {industryContext} delivered {return} returns.",
  "{ticker} stands out: {businessFocus}.",
  "With {employeeScale} scale, {company} offers stability you're looking for.",
  "{company}, known for {industryContext} leadership, shows {return} momentum.",
];

// Templates that use news sentiment
const newsSentimentTemplates = {
  positive: [
    "{ticker} is {newsContext} — good timing for your {goal} goals.",
    "Recent headlines favor {company}: momentum aligns with your strategy.",
    "{ticker} making moves {newsContext}. Worth watching for {goal}.",
    "Positive sentiment around {company} supports your {risk}-risk approach.",
  ],
  neutral: [
    "{ticker} trading steady {newsContext}. Solid for {goal} focus.",
    "{company} maintains course {newsContext} — consistent with your needs.",
    "Stable news flow around {ticker} suits your {risk}-risk preference.",
  ],
  negative: [
    "{ticker} {newsContext} — potential value entry for patient investors.",
    "Headlines challenging {company}, but fundamentals at {pe}x earnings remain.",
    "{ticker} under pressure could mean opportunity for {goal} strategy.",
  ],
};

// Wrapper function to maintain backward compatibility
export const generateExplanation = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile
): string => {
  return generatePersonalizedExplanation(stock, profile, false);
};

// Combine base explanation with company/news context
export const generateEnhancedExplanation = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile,
  enhancedData?: EnhancedExplanationData,
  isFirstInBatch: boolean = false
): string => {
  // If no enhanced data, use standard generator
  if (!enhancedData || (!enhancedData.companyInsights && !enhancedData.newsContext)) {
    return generatePersonalizedExplanation(stock, profile, isFirstInBatch);
  }

  // Decide which enhanced approach to use
  const useCompanyData = enhancedData.companyInsights && Math.random() > 0.4;
  const useNewsData = enhancedData.newsContext && enhancedData.newsContext.latestHeadline && Math.random() > 0.5;

  // 30% chance to use enhanced template when data available
  if (useCompanyData && Math.random() > 0.7) {
    const template = companyDescriptionTemplates[Math.floor(Math.random() * companyDescriptionTemplates.length)];
    return fillEnhancedTemplate(template, stock, profile, enhancedData);
  }

  if (useNewsData && Math.random() > 0.7) {
    const sentiment = enhancedData.newsContext!.sentiment;
    const templates = newsSentimentTemplates[sentiment];
    const template = templates[Math.floor(Math.random() * templates.length)];
    return fillEnhancedTemplate(template, stock, profile, enhancedData);
  }

  // Default to standard generator (most of the time)
  return generatePersonalizedExplanation(stock, profile, isFirstInBatch);
};

const fillEnhancedTemplate = (
  template: string,
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile,
  data: EnhancedExplanationData
): string => {
  let result = template;
  
  // Stock basics
  result = result.replace(/{ticker}/g, stock.ticker || 'Stock');
  result = result.replace(/{company}/g, stock.companyName || stock.ticker || 'Company');
  result = result.replace(/{sector}/g, stock.sector || 'sector');
  result = result.replace(/{price}/g, stock.pricePerShare > 0 ? `$${stock.pricePerShare.toFixed(0)}` : 'accessible price');
  result = result.replace(/{return}/g, Math.abs(stock.oneYearReturn) >= 1 ? `${stock.oneYearReturn >= 0 ? '+' : ''}${stock.oneYearReturn.toFixed(1)}%` : 'positive');
  result = result.replace(/{pe}/g, stock.peRatio > 0 && stock.peRatio < 500 ? stock.peRatio.toFixed(1) : 'attractive');
  result = result.replace(/{risk}/g, stock.riskLevel || 'moderate');
  
  // User profile
  result = result.replace(/{goal}/g, profile.investmentGoal || 'growth');
  
  // Company insights
  if (data.companyInsights) {
    result = result.replace(/{businessFocus}/g, data.companyInsights.businessFocus);
    result = result.replace(/{employeeScale}/g, data.companyInsights.employeeScale);
    result = result.replace(/{marketPosition}/g, data.companyInsights.marketPosition);
    result = result.replace(/{industryContext}/g, data.companyInsights.industryContext);
  } else {
    result = result.replace(/{businessFocus}/g, `leading ${stock.sector} company`);
    result = result.replace(/{employeeScale}/g, 'established company');
    result = result.replace(/{marketPosition}/g, 'significant player');
    result = result.replace(/{industryContext}/g, `the ${stock.sector?.toLowerCase() || 'market'}`);
  }
  
  // News context
  if (data.newsContext) {
    result = result.replace(/{newsContext}/g, data.newsContext.newsContext);
  } else {
    result = result.replace(/{newsContext}/g, 'in recent trading');
  }
  
  return result;
};

// Fetch enhanced data for a stock (call this before generating explanations)
export const fetchEnhancedStockData = async (
  ticker: string,
  fmpService: FMPClientService
): Promise<EnhancedExplanationData> => {
  try {
    const [profile, news] = await Promise.all([
      fmpService.getCompanyProfile(ticker),
      fmpService.getCompanyNews(ticker, 3),
    ]);
    
    const data: EnhancedExplanationData = {};
    
    if (profile) {
      data.companyProfile = profile;
      data.companyInsights = fmpService.extractCompanyInsights(profile);
    }
    
    if (news && news.length > 0) {
      data.companyNews = news;
      data.newsContext = fmpService.extractNewsSentiment(news);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching enhanced stock data:', error);
    return {};
  }
};

// Re-export for convenience
export { clearUsedExplanations };
