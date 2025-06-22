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
    id: 'GOOGL',
    companyName: 'Alphabet Inc.',
    ticker: 'GOOGL',
    sector: 'Technology',
    ceoName: 'Sundar Pichai',
    ceoHighlights: 'Leading Google through AI revolution and cloud expansion. Former product management executive who became CEO in 2015, driving innovation in search and AI.',
    peRatio: 24.8,
    marketCap: '$1.7T',
    oneYearReturn: 18.3,
    riskLevel: 'medium',
    pricePerShare: 142.75,
    dividendYield: 0,
    esgScore: 79
  },
  {
    id: 'AMZN',
    companyName: 'Amazon.com Inc.',
    ticker: 'AMZN',
    sector: 'Technology',
    ceoName: 'Andy Jassy',
    ceoHighlights: 'Former AWS CEO leading Amazon\'s continued expansion in cloud services and e-commerce. 24+ years with company, architect of AWS business model.',
    peRatio: 45.2,
    marketCap: '$1.5T',
    oneYearReturn: 22.1,
    riskLevel: 'medium',
    pricePerShare: 151.20,
    dividendYield: 0,
    esgScore: 74
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
    id: 'UNH',
    companyName: 'UnitedHealth Group Inc.',
    ticker: 'UNH',
    sector: 'Healthcare',
    ceoName: 'Andrew Witty',
    ceoHighlights: 'Former GlaxoSmithKline CEO bringing global healthcare expertise. Focus on value-based care and healthcare innovation.',
    peRatio: 24.5,
    marketCap: '$520B',
    oneYearReturn: 14.7,
    riskLevel: 'low',
    pricePerShare: 545.30,
    dividendYield: 1.4,
    esgScore: 81
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
    id: 'PEP',
    companyName: 'PepsiCo, Inc.',
    ticker: 'PEP',
    sector: 'Consumer',
    ceoName: 'Ramon Laguarta',
    ceoHighlights: 'Leading PepsiCo\'s transformation into healthier snacks and beverages. 26+ years with company, focus on sustainability and digital innovation.',
    peRatio: 26.1,
    marketCap: '$230B',
    oneYearReturn: 7.2,
    riskLevel: 'low',
    pricePerShare: 168.40,
    dividendYield: 2.8,
    esgScore: 82
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
    id: 'JPM',
    companyName: 'JPMorgan Chase & Co.',
    ticker: 'JPM',
    sector: 'Finance',
    ceoName: 'Jamie Dimon',
    ceoHighlights: 'Led JPMorgan through multiple financial crises with consistent profitability. 18+ years as CEO, known for strong risk management and strategic vision.',
    peRatio: 12.8,
    marketCap: '$510B',
    oneYearReturn: 11.4,
    riskLevel: 'medium',
    pricePerShare: 175.85,
    dividendYield: 2.1,
    esgScore: 75
  },
  {
    id: 'BAC',
    companyName: 'Bank of America Corporation',
    ticker: 'BAC',
    sector: 'Finance',
    ceoName: 'Brian Moynihan',
    ceoHighlights: 'Transformed Bank of America post-2008 crisis into digital banking leader. 14+ years as CEO with focus on operational efficiency and customer experience.',
    peRatio: 14.2,
    marketCap: '$290B',
    oneYearReturn: 9.8,
    riskLevel: 'medium',
    pricePerShare: 36.75,
    dividendYield: 2.4,
    esgScore: 73
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
  },
  {
    id: 'T',
    companyName: 'AT&T Inc.',
    ticker: 'T',
    sector: 'Utilities',
    ceoName: 'John Stankey',
    ceoHighlights: '30+ year AT&T veteran leading company through media divestiture and 5G network expansion. Focus on core telecommunications and debt reduction.',
    peRatio: 7.1,
    marketCap: '$125B',
    oneYearReturn: 2.8,
    riskLevel: 'low',
    pricePerShare: 17.45,
    dividendYield: 7.1,
    esgScore: 71
  },
  {
    id: 'XOM',
    companyName: 'Exxon Mobil Corporation',
    ticker: 'XOM',
    sector: 'Energy',
    ceoName: 'Darren Woods',
    ceoHighlights: '30+ year ExxonMobil veteran leading company through energy transition. Focus on low-carbon solutions and operational efficiency.',
    peRatio: 14.5,
    marketCap: '$450B',
    oneYearReturn: 16.2,
    riskLevel: 'medium',
    pricePerShare: 108.30,
    dividendYield: 3.2,
    esgScore: 65
  },
  {
    id: 'CVX',
    companyName: 'Chevron Corporation',
    ticker: 'CVX',
    sector: 'Energy',
    ceoName: 'Mike Wirth',
    ceoHighlights: '35+ years with Chevron, leading company with disciplined capital allocation and strong shareholder returns. Focus on lower carbon intensity.',
    peRatio: 13.2,
    marketCap: '$295B',
    oneYearReturn: 12.7,
    riskLevel: 'medium',
    pricePerShare: 155.20,
    dividendYield: 3.5,
    esgScore: 68
  },
  {
    id: 'WMT',
    companyName: 'Walmart Inc.',
    ticker: 'WMT',
    sector: 'Consumer',
    ceoName: 'Doug McMillon',
    ceoHighlights: '30+ years with Walmart, leading digital transformation and e-commerce expansion. Focus on omnichannel retail and supply chain innovation.',
    peRatio: 28.4,
    marketCap: '$540B',
    oneYearReturn: 8.9,
    riskLevel: 'low',
    pricePerShare: 166.45,
    dividendYield: 2.3,
    esgScore: 77
  },
  {
    id: 'HD',
    companyName: 'The Home Depot, Inc.',
    ticker: 'HD',
    sector: 'Consumer',
    ceoName: 'Ted Decker',
    ceoHighlights: '25+ years with Home Depot, former COO leading company through digital innovation and supply chain optimization. Focus on professional customers.',
    peRatio: 24.7,
    marketCap: '$400B',
    oneYearReturn: 10.3,
    riskLevel: 'medium',
    pricePerShare: 385.75,
    dividendYield: 2.1,
    esgScore: 79
  },
  {
    id: 'V',
    companyName: 'Visa Inc.',
    ticker: 'V',
    sector: 'Finance',
    ceoName: 'Ryan McInerney',
    ceoHighlights: '10+ years with Visa, former president leading company through digital payments revolution. Focus on fintech partnerships and global expansion.',
    peRatio: 32.5,
    marketCap: '$520B',
    oneYearReturn: 13.8,
    riskLevel: 'medium',
    pricePerShare: 245.60,
    dividendYield: 0.7,
    esgScore: 83
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

  // Sort by relevance and take top 15
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

  const selectedStocks = sortedStocks.slice(0, 15);

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
