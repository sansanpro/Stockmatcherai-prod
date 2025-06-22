
import { UserProfile, StockRecommendation } from '@/types/stock-matcher';

// Mock stock data - in a real app, this would come from an API
const stockDatabase: Omit<StockRecommendation, 'whyItFits'>[] = [
  {
    id: 'AAPL',
    companyName: 'Apple Inc.',
    ticker: 'AAPL',
    sector: 'Technology',
    ceoName: 'Tim Cook',
    ceoHighlights: 'Led Apple through its most profitable era with services expansion and iPhone evolution. 13+ years as CEO with consistent innovation and market leadership.',
    peRatio: 28.5,
    marketCap: '$2.8T',
    oneYearReturn: 12.4,
    riskLevel: 'medium',
    pricePerShare: 185.50,
    dividendYield: 0.5,
    esgScore: 82
  },
  {
    id: 'MSFT',
    companyName: 'Microsoft Corporation',
    ticker: 'MSFT',
    sector: 'Technology',
    ceoName: 'Satya Nadella',
    ceoHighlights: 'Transformed Microsoft into cloud computing leader. Increased market cap by 5x since becoming CEO in 2014. Strong focus on AI and enterprise solutions.',
    peRatio: 32.1,
    marketCap: '$2.7T',
    oneYearReturn: 15.8,
    riskLevel: 'medium',
    pricePerShare: 370.25,
    dividendYield: 0.7,
    esgScore: 85
  },
  {
    id: 'JNJ',
    companyName: 'Johnson & Johnson',
    ticker: 'JNJ',
    sector: 'Healthcare',
    ceoName: 'Joaquin Duato',
    ceoHighlights: 'Veteran pharmaceutical executive with 30+ years at J&J. Leading company through major restructuring and focus on innovative medicines.',
    peRatio: 15.8,
    marketCap: '$450B',
    oneYearReturn: 5.2,
    riskLevel: 'low',
    pricePerShare: 162.30,
    dividendYield: 2.9,
    esgScore: 78
  },
  {
    id: 'PFE',
    companyName: 'Pfizer Inc.',
    ticker: 'PFE',
    sector: 'Healthcare',
    ceoName: 'Albert Bourla',
    ceoHighlights: 'Led Pfizer through COVID-19 vaccine development, generating $100B+ in revenue. 25+ years in pharmaceutical leadership with focus on breakthrough therapies.',
    peRatio: 12.4,
    marketCap: '$210B',
    oneYearReturn: 8.2,
    riskLevel: 'low',
    pricePerShare: 37.85,
    dividendYield: 4.1,
    esgScore: 76
  },
  {
    id: 'TSLA',
    companyName: 'Tesla, Inc.',
    ticker: 'TSLA',
    sector: 'Technology',
    ceoName: 'Elon Musk',
    ceoHighlights: 'Revolutionized electric vehicle industry and autonomous driving. Built Tesla into most valuable automaker globally with expansion into energy storage.',
    peRatio: 65.2,
    marketCap: '$800B',
    oneYearReturn: 25.6,
    riskLevel: 'high',
    pricePerShare: 245.80,
    dividendYield: 0,
    esgScore: 72
  },
  {
    id: 'KO',
    companyName: 'The Coca-Cola Company',
    ticker: 'KO',
    sector: 'Consumer',
    ceoName: 'James Quincey',
    ceoHighlights: 'Modernized Coca-Cola with healthier beverage portfolio and sustainable packaging initiatives. 25+ years with company, focused on global market expansion.',
    peRatio: 25.3,
    marketCap: '$260B',
    oneYearReturn: 6.8,
    riskLevel: 'low',
    pricePerShare: 59.75,
    dividendYield: 3.1,
    esgScore: 80
  },
  {
    id: 'NVDA',
    companyName: 'NVIDIA Corporation',
    ticker: 'NVDA',
    sector: 'Technology',
    ceoName: 'Jensen Huang',
    ceoHighlights: 'Pioneered GPU computing and AI revolution. Led NVIDIA to become most valuable semiconductor company with breakthrough innovations in machine learning.',
    peRatio: 72.8,
    marketCap: '$1.8T',
    oneYearReturn: 45.2,
    riskLevel: 'high',
    pricePerShare: 725.40,
    dividendYield: 0.1,
    esgScore: 70
  },
  {
    id: 'VZ',
    companyName: 'Verizon Communications Inc.',
    ticker: 'VZ',
    sector: 'Utilities',
    ceoName: 'Hans Vestberg',
    ceoHighlights: 'Former Ericsson CEO leading Verizon\'s 5G transformation. Focus on network infrastructure and business solutions with consistent dividend payments.',
    peRatio: 8.9,
    marketCap: '$170B',
    oneYearReturn: 3.4,
    riskLevel: 'low',
    pricePerShare: 41.20,
    dividendYield: 6.2,
    esgScore: 74
  }
];

export const generateStockRecommendations = async (profile: UserProfile): Promise<StockRecommendation[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Filter stocks based on user preferences
  let filteredStocks = stockDatabase.filter(stock => {
    // Sector preference
    if (profile.sectorPreference !== 'any' && stock.sector.toLowerCase() !== profile.sectorPreference.toLowerCase()) {
      return false;
    }

    // Risk tolerance
    if (profile.riskTolerance === 'low' && stock.riskLevel === 'high') {
      return false;
    }
    if (profile.riskTolerance === 'high' && stock.riskLevel === 'low') {
      return false;
    }

    // Price affordability (rough estimate based on salary)
    const affordabilityThreshold = profile.salary * 0.1; // 10% of annual salary
    if (stock.pricePerShare > affordabilityThreshold && profile.experience === 'none') {
      return false;
    }

    return true;
  });

  // If no matches, include some broader recommendations
  if (filteredStocks.length === 0) {
    filteredStocks = stockDatabase.filter(stock => stock.riskLevel !== 'high');
  }

  // Sort by relevance and take top 3
  const sortedStocks = filteredStocks.sort((a, b) => {
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

  const selectedStocks = sortedStocks.slice(0, 3);

  // Add personalized explanations
  return selectedStocks.map(stock => ({
    ...stock,
    whyItFits: generatePersonalizedExplanation(stock, profile)
  }));
};

const generatePersonalizedExplanation = (stock: Omit<StockRecommendation, 'whyItFits'>, profile: UserProfile): string => {
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
