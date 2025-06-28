import { UserProfile, StockRecommendation } from '@/types/stock-matcher';

export const generatePersonalizedExplanation = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile
): string => {
  const reasons: string[] = [];

  // Stock-specific characteristics first
  const stockSpecificReasons = generateStockSpecificReasons(stock, profile);
  reasons.push(...stockSpecificReasons);

  // Fun personality-based matches
  const personalityReasons = generatePersonalityBasedReasons(stock, profile);
  if (personalityReasons) reasons.push(personalityReasons);

  // Risk alignment with stock-specific context
  const riskReasons = generateRiskAlignmentReasons(stock, profile);
  if (riskReasons) reasons.push(riskReasons);

  // Sector-specific insights with company context
  const sectorReasons = generateSectorSpecificReasons(stock, profile);
  if (sectorReasons) reasons.push(sectorReasons);

  // Age-based recommendations with stock context
  const ageReasons = generateAgeSpecificReasons(stock, profile);
  if (ageReasons) reasons.push(ageReasons);

  // Investment goal alignment with specific metrics
  const goalReasons = generateGoalSpecificReasons(stock, profile);
  if (goalReasons) reasons.push(goalReasons);

  // Experience-based insights with company-specific context
  const experienceReasons = generateExperienceSpecificReasons(stock, profile);
  if (experienceReasons) reasons.push(experienceReasons);

  // Financial health with specific metrics
  const financialReasons = generateFinancialHealthReasons(stock, profile);
  if (financialReasons) reasons.push(financialReasons);

  // Fun lifestyle and behavioral matches
  const lifestyleReasons = generateLifestyleReasons(stock, profile);
  if (lifestyleReasons) reasons.push(lifestyleReasons);

  // Ensure we have unique, specific reasons
  const uniqueReasons = [...new Set(reasons)];
  
  // If we don't have enough unique reasons, add stock-specific fallbacks
  if (uniqueReasons.length < 2) {
    const fallbackReasons = generateFallbackReasons(stock, profile);
    uniqueReasons.push(...fallbackReasons);
  }

  // Select 3-4 most relevant and unique reasons
  const selectedReasons = uniqueReasons.slice(0, 4);
  return selectedReasons.join('. ') + '.';
};

const generateStockSpecificReasons = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile
): string[] => {
  const reasons: string[] = [];

  // Company-specific insights based on ticker
  const companyInsights: Record<string, (stock: any, profile: UserProfile) => string | null> = {
    'AAPL': (stock, profile) => {
      if (profile.age < 40) return `Apple's ecosystem dominance and innovation pipeline aligns with your tech-forward generation - you probably already have an iPhone, so why not own the company too?`;
      if (profile.investmentGoal === 'growth') return `Apple's consistent product innovation drives sustained revenue growth at ${stock.oneYearReturn.toFixed(1)}% - every new iPhone launch is basically a money printer`;
      return `Apple's brand loyalty runs deeper than most relationships, with ${stock.dividendYield.toFixed(1)}% dividend yield rewarding your faith in Tim Cook's vision`;
    },
    'MSFT': (stock, profile) => {
      if (profile.sectorPreference === 'technology') return `Microsoft's cloud dominance with Azure captures the enterprise digital transformation trend - they're basically the landlord of the internet`;
      if (profile.experience === 'none' || profile.experience === 'beginner') return `Microsoft is like the reliable friend who never lets you down - diversified business model provides beginner-friendly ${stock.oneYearReturn.toFixed(1)}% stability`;
      return `Microsoft's enterprise moat is stronger than your Wi-Fi password, with recurring subscription revenue delivering consistent ${stock.oneYearReturn.toFixed(1)}% returns`;
    },
    'GOOGL': (stock, profile) => {
      if (profile.age < 35) return `Google's AI leadership positions it perfectly for your generation's digital future - they know what you're thinking before you do (literally)`;
      if (profile.investmentGoal === 'growth') return `Google's advertising dominance is like owning a toll booth on the information superhighway, driving ${stock.oneYearReturn.toFixed(1)}% growth`;
      return `Alphabet's diverse revenue streams from search to cloud to YouTube mean you're investing in basically everything you use daily`;
    },
    'AMZN': (stock, profile) => {
      if (profile.investmentGoal === 'growth') return `Amazon's e-commerce and AWS dominance means you're betting on humanity's laziness and the cloud - both are pretty safe bets`;
      if (profile.age < 40) return `Amazon's innovation in logistics and cloud computing aligns with your generation's 'I want it now' mentality`;
      return `Amazon Web Services' high-margin business is like digital real estate - everyone needs it, few can provide it, delivering ${stock.oneYearReturn.toFixed(1)}% returns`;
    },
    'TSLA': (stock, profile) => {
      if (profile.riskTolerance === 'high') return `Tesla's electric vehicle leadership offers explosive growth potential - it's like dating Elon Musk's brain, wild but potentially rewarding with ${Math.abs(stock.oneYearReturn).toFixed(1)}% volatility`;
      if (profile.age < 30) return `Tesla's sustainable transportation mission appeals to your environmentally conscious generation - save the planet while making money`;
      return `Tesla's not just a car company, it's a tech company that happens to make cars, robots, and rockets - basically the cool kid of the stock market`;
    },
    'JNJ': (stock, profile) => {
      if (profile.age >= 50) return `Johnson & Johnson is like your family doctor - always there when you need them, providing ${stock.dividendYield.toFixed(1)}% dividend reliability`;
      if (profile.riskTolerance === 'low') return `J&J's diversified healthcare portfolio is recession-proof because people always need Band-Aids and baby shampoo`;
      return `Johnson & Johnson's pharmaceutical pipeline ensures they'll keep finding ways to help you live longer and prosper with ${stock.oneYearReturn.toFixed(1)}% growth`;
    },
    'V': (stock, profile) => {
      if (profile.investmentGoal === 'growth') return `Visa's payment processing monopoly is like owning a piece of every swipe, tap, and online purchase globally with ${stock.oneYearReturn.toFixed(1)}% growth`;
      if (profile.age < 40) return `Visa captures your cashless lifestyle - every time you pay for avocado toast, Visa gets a cut`;
      return `Visa's toll-booth business model on global commerce is so simple it's genius - they make money every time money moves`;
    },
    'MA': (stock, profile) => {
      if (profile.investmentGoal === 'balance') return `Mastercard's payment network is like being the house in Vegas - you always win, delivering ${stock.oneYearReturn.toFixed(1)}% returns plus ${stock.dividendYield.toFixed(1)}% dividends`;
      return `Mastercard's duopoly with Visa means they've basically cornered the 'how humans pay for stuff' market - pretty solid business model`;
    },
    'NVDA': (stock, profile) => {
      if (profile.riskTolerance === 'high' && profile.age < 35) return `NVIDIA's AI chip dominance puts you at the center of the robot revolution with ${stock.oneYearReturn.toFixed(1)}% explosive growth - basically betting on Skynet, but profitable`;
      if (profile.sectorPreference === 'technology') return `NVIDIA's GPU leadership spans gaming, data centers, and AI - they're literally powering the future while you sleep`;
      return `NVIDIA's semiconductors are like the brains of the digital world - every AI breakthrough makes your investment smarter`;
    },
    'JPM': (stock, profile) => {
      if (profile.sectorPreference === 'finance') return `JPMorgan is like the wise old banker who's survived every financial crisis and came out stronger, delivering ${stock.oneYearReturn.toFixed(1)}% performance`;
      if (profile.age >= 40) return `JPM's dividend track record and financial strength provide ${stock.dividendYield.toFixed(1)}% income - they've been making money from money since before your grandparents were born`;
      return `JPMorgan's diversified financial services mean they profit whether markets go up, down, or sideways - the ultimate 'always winning' business`;
    }
  };

  const companyInsight = companyInsights[stock.ticker];
  if (companyInsight) {
    const insight = companyInsight(stock, profile);
    if (insight) reasons.push(insight);
  }

  // Performance-specific insights with personality
  if (stock.oneYearReturn > 30) {
    reasons.push(`This stock's ${stock.oneYearReturn.toFixed(1)}% annual performance is like finding a $20 bill in your old jeans, but consistently every year`);
  } else if (stock.oneYearReturn > 15) {
    reasons.push(`Delivering ${stock.oneYearReturn.toFixed(1)}% annual growth while maintaining reasonable valuation - it's the investing equivalent of having your cake and eating it too`);
  } else if (stock.oneYearReturn > 0 && stock.oneYearReturn <= 15) {
    reasons.push(`Steady ${stock.oneYearReturn.toFixed(1)}% returns provide the tortoise-wins-the-race approach to wealth building`);
  }

  // Valuation-specific insights with fun analogies
  if (stock.peRatio > 0 && stock.peRatio < 15) {
    reasons.push(`At ${stock.peRatio.toFixed(1)}x P/E ratio, ${stock.companyName} is like finding a designer handbag at a thrift store - undervalued quality`);
  } else if (stock.peRatio >= 15 && stock.peRatio < 25) {
    reasons.push(`${stock.peRatio.toFixed(1)}x P/E valuation suggests the market has realistic expectations - no hype, just solid business fundamentals`);
  }

  // Dividend-specific insights with personality
  if (stock.dividendYield > 4) {
    reasons.push(`Outstanding ${stock.dividendYield.toFixed(1)}% dividend yield from ${stock.companyName} is like getting paid to hold hands with a reliable partner`);
  } else if (stock.dividendYield > 2) {
    reasons.push(`${stock.companyName}'s ${stock.dividendYield.toFixed(1)}% dividend yield is like earning interest on your patience while the stock grows`);
  }

  return reasons;
};

const generatePersonalityBasedReasons = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile
): string | null => {
  // Risk personality matching
  if (profile.riskTolerance === 'high' && stock.oneYearReturn > 20) {
    return `You're the type who orders the spiciest dish on the menu - ${stock.companyName}'s ${stock.oneYearReturn.toFixed(1)}% volatility matches your appetite for financial adventure`;
  }
  
  if (profile.riskTolerance === 'low' && stock.riskLevel === 'low') {
    return `Like choosing a cozy coffee shop over a loud nightclub, ${stock.companyName}'s stable profile suits your preference for peaceful wealth building`;
  }

  if (profile.experience === 'none' && ['AAPL', 'MSFT', 'JNJ', 'KO'].includes(stock.ticker)) {
    return `${stock.companyName} is like learning to drive in your neighborhood - familiar, safe, and you already understand what they do`;
  }

  return null;
};

const generateRiskAlignmentReasons = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile
): string | null => {
  if (stock.riskLevel === profile.riskTolerance) {
    const riskMessages = {
      low: `${stock.companyName}'s low-risk profile with stable ${stock.oneYearReturn.toFixed(1)}% returns perfectly matches your conservative approach`,
      medium: `${stock.companyName}'s moderate risk level balances growth potential with manageable ${Math.abs(stock.oneYearReturn).toFixed(1)}% volatility`,
      high: `${stock.companyName}'s high-growth potential with ${stock.oneYearReturn.toFixed(1)}% returns aligns with your aggressive investment strategy`
    };
    return riskMessages[stock.riskLevel as keyof typeof riskMessages];
  }
  return null;
};

const generateSectorSpecificReasons = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile
): string | null => {
  if (profile.sectorPreference !== 'any' && stock.sector.toLowerCase() === profile.sectorPreference.toLowerCase()) {
    const sectorInsights: Record<string, string> = {
      technology: `${stock.companyName}'s technology leadership and ${stock.oneYearReturn.toFixed(1)}% performance capture your preferred sector's innovation trends`,
      healthcare: `${stock.companyName}'s healthcare focus provides defensive characteristics with ${stock.dividendYield.toFixed(1)}% dividend in your preferred sector`,
      finance: `${stock.companyName}'s financial services position benefits from economic growth cycles in your target sector`,
      energy: `${stock.companyName}'s energy sector exposure with ${stock.oneYearReturn.toFixed(1)}% returns captures commodity recovery potential`,
      consumer: `${stock.companyName}'s consumer business model provides stable demand patterns with ${stock.dividendYield.toFixed(1)}% income`,
      utilities: `${stock.companyName}'s utility operations offer ${stock.dividendYield.toFixed(1)}% dividend income with recession resistance`
    };
    return sectorInsights[profile.sectorPreference.toLowerCase()];
  }
  return null;
};

const generateAgeSpecificReasons = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile
): string | null => {
  if (profile.age < 30 && stock.oneYearReturn > 15) {
    return `At your age, time is your superpower - ${stock.companyName}'s ${stock.oneYearReturn.toFixed(1)}% growth trajectory gives you decades to compound wealth`;
  }
  
  if (profile.age >= 30 && profile.age < 50 && stock.dividendYield > 1 && stock.oneYearReturn > 5) {
    return `${stock.companyName} hits the sweet spot for your life stage - ${stock.dividendYield.toFixed(1)}% income now, ${stock.oneYearReturn.toFixed(1)}% growth for later`;
  }
  
  if (profile.age >= 50 && stock.dividendYield > 3) {
    return `${stock.companyName}'s ${stock.dividendYield.toFixed(1)}% dividend yield supports your transition from 'making money' to 'money making money' phase`;
  }
  
  return null;
};

const generateGoalSpecificReasons = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile
): string | null => {
  switch (profile.investmentGoal) {
    case 'income':
      if (stock.dividendYield > 4) {
        return `${stock.companyName}'s exceptional ${stock.dividendYield.toFixed(1)}% dividend yield directly supports your income generation objective`;
      }
      break;
    case 'growth':
      if (stock.oneYearReturn > 20) {
        return `${stock.companyName}'s superior ${stock.oneYearReturn.toFixed(1)}% growth performance aligns perfectly with your capital appreciation goals`;
      }
      break;
    case 'balance':
      if (stock.dividendYield > 1 && stock.oneYearReturn > 5) {
        return `${stock.companyName} delivers your balanced approach with ${stock.dividendYield.toFixed(1)}% income plus ${stock.oneYearReturn.toFixed(1)}% growth`;
      }
      break;
    case 'retirement':
      if (stock.riskLevel === 'low' && stock.dividendYield > 2) {
        return `${stock.companyName}'s conservative profile and ${stock.dividendYield.toFixed(1)}% dividend support your retirement planning strategy`;
      }
      break;
  }
  return null;
};

const generateExperienceSpecificReasons = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile
): string | null => {
  const blueChipTickers = ['AAPL', 'MSFT', 'JNJ', 'KO', 'PEP', 'WMT', 'JPM', 'V', 'MA', 'UNH'];
  
  if (profile.experience === 'none' && blueChipTickers.includes(stock.ticker)) {
    return `${stock.companyName} is like investing training wheels - established business model with ${stock.oneYearReturn.toFixed(1)}% track record to learn from`;
  }
  
  if (profile.experience === 'advanced' && stock.oneYearReturn > 20) {
    return `${stock.companyName}'s ${stock.oneYearReturn.toFixed(1)}% high-growth potential matches your advanced risk management skills - you can handle the ride`;
  }
  
  return null;
};

const generateFinancialHealthReasons = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile
): string | null => {
  const monthlyIncome = profile.salary / 12;
  const investmentCapacity = monthlyIncome * 0.15;
  
  if (stock.pricePerShare <= investmentCapacity * 0.5) {
    return `At $${stock.pricePerShare.toFixed(2)} per share, you can build a meaningful position in ${stock.companyName} without breaking the bank - dollar-cost averaging friendly`;
  }
  
  if (stock.peRatio > 0 && stock.peRatio < 20) {
    return `${stock.companyName}'s ${stock.peRatio.toFixed(1)}x P/E ratio represents attractive value - you're not paying a premium for the ${stock.oneYearReturn.toFixed(1)}% performance`;
  }
  
  return null;
};

const generateLifestyleReasons = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile
): string | null => {
  const lifestyleMatches: Record<string, Record<string, string>> = {
    'AAPL': {
      young: "You probably own multiple Apple devices and complain about dongles - might as well profit from your ecosystem addiction",
      tech: "Apple's design philosophy matches your appreciation for things that 'just work' - premium products for premium returns"
    },
    'AMZN': {
      busy: "Amazon basically runs your life already - groceries, streaming, cloud storage - why not own a piece of your digital dependency?",
      convenience: "Your 'add to cart' habits are funding this company's growth - time to get paid back"
    },
    'TSLA': {
      environmental: "Tesla aligns with your values while potentially funding your early retirement - doing good while doing well",
      innovative: "You're the person who gets excited about new tech - Tesla's innovation pipeline matches your curiosity"
    },
    'V': {
      travel: "Every coffee purchase, vacation booking, and impulse buy flows through Visa - own the infrastructure of your spending habits",
      digital: "Visa processes your digital lifestyle - from app purchases to online shopping, they're your invisible financial partner"
    }
  };

  const stockMatches = lifestyleMatches[stock.ticker];
  if (stockMatches) {
    if (profile.age < 35 && stockMatches.young) return stockMatches.young;
    if (profile.sectorPreference === 'technology' && stockMatches.tech) return stockMatches.tech;
    if (stockMatches.busy) return stockMatches.busy;
  }

  return null;
};

const generateFallbackReasons = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile
): string[] => {
  const fallbacks: string[] = [];
  
  fallbacks.push(`${stock.companyName}'s market position in ${stock.sector} is like having a VIP pass to long-term industry trends`);
  
  if (stock.oneYearReturn > 0) {
    fallbacks.push(`${stock.companyName}'s positive ${stock.oneYearReturn.toFixed(1)}% momentum suggests they're doing something right - and the market agrees`);
  }
  
  if (stock.marketCap.includes('B') && parseFloat(stock.marketCap) > 10) {
    fallbacks.push(`${stock.companyName}'s ${stock.marketCap} market cap means you're investing alongside institutions - you're in good company`);
  }
  
  return fallbacks.slice(0, 2);
};
