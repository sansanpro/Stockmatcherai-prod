import { UserProfile, StockRecommendation } from '@/types/stock-matcher';

// Track used catchy phrases to ensure uniqueness
const usedCatchyPhrases = new Set<string>();

export const generatePersonalizedExplanation = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile,
  isFirstInBatch: boolean = false
): string => {
  // Reset used phrases for new batch of recommendations
  if (isFirstInBatch) {
    usedCatchyPhrases.clear();
  }

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

  // Select the best reasons and format them with unique catchy hooks first
  const selectedReasons = uniqueReasons.slice(0, 3);
  const reformattedReasons = selectedReasons.map(reason => reformatWithUniqueCatchyHook(reason, stock));
  
  return reformattedReasons.join(' ') + '.';
};

const reformatWithUniqueCatchyHook = (reason: string, stock: Omit<StockRecommendation, 'whyItFits'>): string => {
  // Extract the catchiest part and put it first, followed by stats
  const catchyHooks = extractUniqueCatchyElements(reason, stock);
  const stats = extractStatistics(reason, stock);
  const context = extractContextualInfo(reason);
  
  // Combine with catchy hook first
  let reformatted = catchyHooks;
  if (stats) reformatted += ` - ${stats}`;
  if (context && !catchyHooks.includes(context)) reformatted += ` ${context}`;
  
  return reformatted;
};

const extractUniqueCatchyElements = (text: string, stock: Omit<StockRecommendation, 'whyItFits'>): string => {
  // Define unique catchy phrases for each stock ticker
  const uniqueStockPhrases: Record<string, string[]> = {
    'AAPL': [
      `The fruit that never spoils financially`,
      `Your iPhone's parent company wants to share profits`,
      `The bitten apple that bites back with returns`,
      `Steve Jobs' legacy machine keeps printing money`
    ],
    'MSFT': [
      `The office suite of financial success`,
      `Windows to wealth creation`,
      `The cloud castle everyone rents from`,
      `Bill Gates' gift that keeps on giving`
    ],
    'GOOGL': [
      `The search engine for your financial future`,
      `They know your secrets AND your investment potential`,
      `The alphabet soup of stock returns`,
      `Where 'I'm feeling lucky' actually pays off`
    ],
    'AMZN': [
      `The everything store includes everything profits`,
      `Prime delivery for your retirement fund`,
      `Jeff's rocket ship for your portfolio`,
      `The warehouse of wealth accumulation`
    ],
    'TSLA': [
      `Electric dreams meet electric returns`,
      `Elon's rollercoaster with potentially massive rewards`,
      `The future drives itself to your bank account`,
      `Space-age gains from earthbound innovation`
    ],
    'JNJ': [
      `Band-Aids for market wounds, aspirin for volatility`,
      `The family medicine cabinet of investments`,
      `Healing portfolios since before your grandparents`,
      `Medical magic for your financial health`
    ],
    'V': [
      `Every swipe is a slice of the profits`,
      `The plastic fantastic revenue machine`,
      `Your credit card's parent wants to pay you back`,
      `The toll booth on the highway of commerce`
    ],
    'MA': [
      `The other half of the credit card empire`,
      `Priceless returns from priceless transactions`,
      `The payment twin that doubles your opportunities`,
      `What's in your wallet could be in your portfolio`
    ],
    'NVDA': [
      `The brains behind every smart machine`,
      `Graphics that paint profit pictures`,
      `AI's favorite hardware supplier`,
      `The chip that powers the future`
    ],
    'JPM': [
      `The money vault with an open door policy`,
      `Wall Street's landlord collecting rent`,
      `The banker's bank banking on your success`,
      `Too big to fail, just right to profit`
    ],
    'KO': [
      `The fizz that never goes flat`,
      `Santa's favorite stock pick`,
      `Happiness in a bottle, wealth in a share`,
      `The pause that refreshes your portfolio`
    ],
    'PEP': [
      `Snack attack on market mediocrity`,
      `The crunch heard 'round the stock exchange`,
      `Thirsty for profits, hungry for growth`,
      `Pop, fizz, clink of dividend coins`
    ],
    'WMT': [
      `Always low prices, always high possibilities`,
      `The smiley face of steady returns`,
      `Everyday low risk, everyday steady growth`,
      `Where America shops for both groceries and gains`
    ],
    'UNH': [
      `Healthcare's heavyweight champion`,
      `The pulse of profitable medicine`,
      `Wellness for your wealth`,
      `The stethoscope that listens to money`
    ]
  };

  // Get available phrases for this stock
  const stockPhrases = uniqueStockPhrases[stock.ticker] || [];
  
  // Find an unused phrase for this stock
  let selectedPhrase = '';
  for (const phrase of stockPhrases) {
    if (!usedCatchyPhrases.has(phrase)) {
      selectedPhrase = phrase;
      usedCatchyPhrases.add(phrase);
      break;
    }
  }

  // If no unique phrase available, create a unique one based on company characteristics
  if (!selectedPhrase) {
    selectedPhrase = generateUniquePhrase(stock);
    usedCatchyPhrases.add(selectedPhrase);
  }

  return selectedPhrase;
};

const generateUniquePhrase = (stock: Omit<StockRecommendation, 'whyItFits'>): string => {
  const uniqueId = Math.random().toString(36).substr(2, 3);
  
  const phrases = [
    `The ${stock.sector.toLowerCase()} maverick of market success`,
    `${stock.companyName}'s secret sauce for financial flavor`,
    `The ${stock.ticker} express to profit town`,
    `Market magic from the ${stock.sector.toLowerCase()} wizard`,
    `The golden goose wearing a ${stock.ticker} name tag`,
    `Your portfolio's new best friend named ${stock.ticker}`,
    `The ${stock.sector.toLowerCase()} champion of your dreams`,
    `${stock.companyName}: where innovation meets compensation`
  ];
  
  // Select a phrase and make it unique with the ID if needed
  const basePhrase = phrases[Math.floor(Math.random() * phrases.length)];
  const uniquePhrase = usedCatchyPhrases.has(basePhrase) ? `${basePhrase} (${uniqueId})` : basePhrase;
  
  return uniquePhrase;
};

const extractStatistics = (text: string, stock: Omit<StockRecommendation, 'whyItFits'>): string => {
  const stats: string[] = [];
  
  // Extract percentage returns
  const returnMatch = text.match(/(\d+\.?\d*)% (returns?|growth|performance|annual|volatility)/gi);
  if (returnMatch) {
    stats.push(...returnMatch);
  }
  
  // Extract P/E ratios
  const peMatch = text.match(/(\d+\.?\d*)x P\/E/gi);
  if (peMatch) {
    stats.push(...peMatch);
  }
  
  // Extract dividend yields
  const dividendMatch = text.match(/(\d+\.?\d*)% dividend/gi);
  if (dividendMatch) {
    stats.push(...dividendMatch);
  }
  
  // Add key metrics if not mentioned
  if (!stats.length) {
    if (stock.oneYearReturn !== 0) {
      stats.push(`${Math.abs(stock.oneYearReturn).toFixed(1)}% annual performance`);
    }
    if (stock.dividendYield > 0) {
      stats.push(`${stock.dividendYield.toFixed(1)}% dividend yield`);
    }
  }
  
  return stats.join(', ');
};

const extractContextualInfo = (text: string): string => {
  // Extract supportive context that isn't already catchy or statistical
  const contextPatterns = [
    /perfect(ly)? (match|align|suit)/gi,
    /your (generation|life stage|age|preference)/gi,
    /beginner-friendly/gi,
    /recession-proof/gi,
    /diversified/gi,
    /sustainable/gi
  ];
  
  for (const pattern of contextPatterns) {
    const match = text.match(pattern);
    if (match) {
      const sentences = text.split(/[.!]/);
      const contextSentence = sentences.find(s => pattern.test(s));
      if (contextSentence) {
        return contextSentence.trim();
      }
    }
  }
  
  return '';
};

const generateStockSpecificReasons = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile
): string[] => {
  const reasons: string[] = [];

  // Company-specific insights based on ticker
  const companyInsights: Record<string, (stock: any, profile: UserProfile) => string | null> = {
    'AAPL': (stock, profile) => {
      if (profile.age < 40) return `You probably already have an iPhone, so why not own the company too? Apple's ecosystem dominance and innovation pipeline aligns with your tech-forward generation delivering ${stock.oneYearReturn.toFixed(1)}% returns`;
      if (profile.investmentGoal === 'growth') return `Every new iPhone launch is basically a money printer - Apple's consistent product innovation drives sustained revenue growth at ${stock.oneYearReturn.toFixed(1)}%`;
      return `Apple's brand loyalty runs deeper than most relationships, with ${stock.dividendYield.toFixed(1)}% dividend yield rewarding your faith in Tim Cook's vision`;
    },
    'MSFT': (stock, profile) => {
      if (profile.sectorPreference === 'technology') return `Microsoft is basically the landlord of the internet - their cloud dominance with Azure captures enterprise digital transformation delivering ${stock.oneYearReturn.toFixed(1)}% growth`;
      if (profile.experience === 'none' || profile.experience === 'beginner') return `Microsoft is like the reliable friend who never lets you down - diversified business model provides beginner-friendly ${stock.oneYearReturn.toFixed(1)}% stability`;
      return `Microsoft's enterprise moat is stronger than your Wi-Fi password, with recurring subscription revenue delivering consistent ${stock.oneYearReturn.toFixed(1)}% returns`;
    },
    'GOOGL': (stock, profile) => {
      if (profile.age < 35) return `Google knows what you're thinking before you do (literally) - their AI leadership positions it perfectly for your generation's digital future with ${stock.oneYearReturn.toFixed(1)}% growth`;
      if (profile.investmentGoal === 'growth') return `Google's advertising dominance is like owning a toll booth on the information superhighway, driving ${stock.oneYearReturn.toFixed(1)}% growth`;
      return `You're investing in basically everything you use daily - Alphabet's diverse revenue streams span search, cloud, and YouTube delivering ${stock.oneYearReturn.toFixed(1)}% returns`;
    },
    'AMZN': (stock, profile) => {
      if (profile.investmentGoal === 'growth') return `You're betting on humanity's laziness and the cloud - both are pretty safe bets with Amazon's e-commerce and AWS dominance delivering ${stock.oneYearReturn.toFixed(1)}% growth`;
      if (profile.age < 40) return `Amazon feeds your generation's 'I want it now' mentality - innovation in logistics and cloud computing drives ${stock.oneYearReturn.toFixed(1)}% performance`;
      return `Amazon Web Services is like digital real estate - everyone needs it, few can provide it, delivering ${stock.oneYearReturn.toFixed(1)}% high-margin returns`;
    },
    'TSLA': (stock, profile) => {
      if (profile.riskTolerance === 'high') return `It's like dating Elon Musk's brain - wild but potentially rewarding! Tesla's electric vehicle leadership offers explosive growth with ${Math.abs(stock.oneYearReturn).toFixed(1)}% volatility`;
      if (profile.age < 30) return `Save the planet while making money - Tesla's sustainable transportation mission appeals to your environmentally conscious generation with ${stock.oneYearReturn.toFixed(1)}% performance`;
      return `Tesla is basically the cool kid of the stock market - not just cars, but tech company making vehicles, robots, and rockets with ${stock.oneYearReturn.toFixed(1)}% returns`;
    },
    'JNJ': (stock, profile) => {
      if (profile.age >= 50) return `Johnson & Johnson is like your family doctor - always there when you need them, providing ${stock.dividendYield.toFixed(1)}% dividend reliability`;
      if (profile.riskTolerance === 'low') return `J&J is recession-proof because people always need Band-Aids and baby shampoo - diversified healthcare portfolio delivers ${stock.oneYearReturn.toFixed(1)}% stability`;
      return `Johnson & Johnson keeps finding ways to help you live longer and prosper with ${stock.oneYearReturn.toFixed(1)}% growth from their pharmaceutical pipeline`;
    },
    'V': (stock, profile) => {
      if (profile.investmentGoal === 'growth') return `Visa owns a piece of every swipe, tap, and online purchase globally - payment processing monopoly delivers ${stock.oneYearReturn.toFixed(1)}% growth`;
      if (profile.age < 40) return `Every time you pay for avocado toast, Visa gets a cut - they capture your cashless lifestyle with ${stock.oneYearReturn.toFixed(1)}% returns`;
      return `Visa's toll-booth business model on global commerce is so simple it's genius - they make money every time money moves, delivering ${stock.oneYearReturn.toFixed(1)}% performance`;
    },
    'MA': (stock, profile) => {
      if (profile.investmentGoal === 'balance') return `Mastercard is like being the house in Vegas - you always win! Payment network delivers ${stock.oneYearReturn.toFixed(1)}% returns plus ${stock.dividendYield.toFixed(1)}% dividends`;
      return `Mastercard has basically cornered the 'how humans pay for stuff' market - duopoly with Visa delivers ${stock.oneYearReturn.toFixed(1)}% performance`;
    },
    'NVDA': (stock, profile) => {
      if (profile.riskTolerance === 'high' && profile.age < 35) return `You're betting on Skynet, but profitable! NVIDIA's AI chip dominance puts you at the center of the robot revolution with ${stock.oneYearReturn.toFixed(1)}% explosive growth`;
      if (profile.sectorPreference === 'technology') return `NVIDIA is literally powering the future while you sleep - GPU leadership spans gaming, data centers, and AI with ${stock.oneYearReturn.toFixed(1)}% performance`;
      return `NVIDIA's semiconductors are like the brains of the digital world - every AI breakthrough makes your investment smarter with ${stock.oneYearReturn.toFixed(1)}% returns`;
    },
    'JPM': (stock, profile) => {
      if (profile.sectorPreference === 'finance') return `JPMorgan is like the wise old banker who's survived every financial crisis and came out stronger, delivering ${stock.oneYearReturn.toFixed(1)}% performance`;
      if (profile.age >= 40) return `They've been making money from money since before your grandparents were born - JPM's dividend track record provides ${stock.dividendYield.toFixed(1)}% income`;
      return `JPMorgan has the ultimate 'always winning' business - diversified financial services profit whether markets go up, down, or sideways with ${stock.oneYearReturn.toFixed(1)}% returns`;
    }
  };

  const companyInsight = companyInsights[stock.ticker];
  if (companyInsight) {
    const insight = companyInsight(stock, profile);
    if (insight) reasons.push(insight);
  }

  // Performance-specific insights with personality-first approach
  if (stock.oneYearReturn > 30) {
    reasons.push(`This stock's performance is like finding a $20 bill in your old jeans, but consistently every year - ${stock.oneYearReturn.toFixed(1)}% annual returns`);
  } else if (stock.oneYearReturn > 15) {
    reasons.push(`It's the investing equivalent of having your cake and eating it too - delivering ${stock.oneYearReturn.toFixed(1)}% annual growth while maintaining reasonable valuation`);
  } else if (stock.oneYearReturn > 0 && stock.oneYearReturn <= 15) {
    reasons.push(`The tortoise wins the race approach to wealth building - steady ${stock.oneYearReturn.toFixed(1)}% returns compound over time`);
  }

  // Valuation-specific insights with fun analogies first
  if (stock.peRatio > 0 && stock.peRatio < 15) {
    reasons.push(`It's like finding a designer handbag at a thrift store - ${stock.companyName} at ${stock.peRatio.toFixed(1)}x P/E ratio represents undervalued quality`);
  } else if (stock.peRatio >= 15 && stock.peRatio < 25) {
    reasons.push(`No hype, just solid business fundamentals - ${stock.peRatio.toFixed(1)}x P/E valuation suggests realistic market expectations`);
  }

  // Dividend-specific insights with personality first
  if (stock.dividendYield > 4) {
    reasons.push(`It's like getting paid to hold hands with a reliable partner - ${stock.companyName}'s outstanding ${stock.dividendYield.toFixed(1)}% dividend yield`);
  } else if (stock.dividendYield > 2) {
    reasons.push(`Earning interest on your patience while the stock grows - ${stock.companyName} offers ${stock.dividendYield.toFixed(1)}% dividend yield`);
  }

  return reasons;
};

const generatePersonalityBasedReasons = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile
): string | null => {
  // Risk personality matching with catchy hooks first
  if (profile.riskTolerance === 'high' && stock.oneYearReturn > 20) {
    return `You're the type who orders the spiciest dish on the menu - ${stock.companyName}'s ${stock.oneYearReturn.toFixed(1)}% volatility matches your appetite for financial adventure`;
  }
  
  if (profile.riskTolerance === 'low' && stock.riskLevel === 'low') {
    return `Like choosing a cozy coffee shop over a loud nightclub - ${stock.companyName}'s stable profile suits your preference for peaceful wealth building`;
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
      low: `Perfect match for your conservative approach - ${stock.companyName}'s low-risk profile delivers stable ${stock.oneYearReturn.toFixed(1)}% returns`,
      medium: `Balanced approach meets balanced returns - ${stock.companyName}'s moderate risk level offers growth potential with manageable ${Math.abs(stock.oneYearReturn).toFixed(1)}% volatility`,
      high: `Aggressive strategy meets aggressive potential - ${stock.companyName}'s high-growth trajectory aligns with your risk tolerance delivering ${stock.oneYearReturn.toFixed(1)}% returns`
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
      technology: `Innovation trends captured perfectly - ${stock.companyName}'s technology leadership in your preferred sector delivers ${stock.oneYearReturn.toFixed(1)}% performance`,
      healthcare: `Defensive characteristics with income potential - ${stock.companyName}'s healthcare focus provides ${stock.dividendYield.toFixed(1)}% dividend in your target sector`,
      finance: `Economic growth cycle benefits - ${stock.companyName}'s financial services position in your preferred sector delivers ${stock.oneYearReturn.toFixed(1)}% returns`,
      energy: `Commodity recovery potential captured - ${stock.companyName}'s energy sector exposure delivers ${stock.oneYearReturn.toFixed(1)}% returns`,
      consumer: `Stable demand patterns with income - ${stock.companyName}'s consumer business model provides ${stock.dividendYield.toFixed(1)}% dividend yield`,
      utilities: `Recession resistance with income - ${stock.companyName}'s utility operations offer ${stock.dividendYield.toFixed(1)}% dividend yield`
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
    return `Time is your superpower - ${stock.companyName}'s ${stock.oneYearReturn.toFixed(1)}% growth trajectory gives you decades to compound wealth`;
  }
  
  if (profile.age >= 30 && profile.age < 50 && stock.dividendYield > 1 && stock.oneYearReturn > 5) {
    return `Perfect for your life stage sweet spot - ${stock.companyName} delivers ${stock.dividendYield.toFixed(1)}% income now, ${stock.oneYearReturn.toFixed(1)}% growth for later`;
  }
  
  if (profile.age >= 50 && stock.dividendYield > 3) {
    return `Transition from 'making money' to 'money making money' - ${stock.companyName}'s ${stock.dividendYield.toFixed(1)}% dividend yield supports your phase`;
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
        return `Income generation objective met - ${stock.companyName}'s exceptional ${stock.dividendYield.toFixed(1)}% dividend yield directly supports your goals`;
      }
      break;
    case 'growth':
      if (stock.oneYearReturn > 20) {
        return `Capital appreciation goals perfectly aligned - ${stock.companyName}'s superior ${stock.oneYearReturn.toFixed(1)}% growth performance delivers`;
      }
      break;
    case 'balance':
      if (stock.dividendYield > 1 && stock.oneYearReturn > 5) {
        return `Balanced approach delivered - ${stock.companyName} provides ${stock.dividendYield.toFixed(1)}% income plus ${stock.oneYearReturn.toFixed(1)}% growth`;
      }
      break;
    case 'retirement':
      if (stock.riskLevel === 'low' && stock.dividendYield > 2) {
        return `Retirement planning strategy supported - ${stock.companyName}'s conservative profile delivers ${stock.dividendYield.toFixed(1)}% dividend income`;
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
    return `Investing training wheels that actually work - ${stock.companyName}'s established business model provides ${stock.oneYearReturn.toFixed(1)}% track record to learn from`;
  }
  
  if (profile.experience === 'advanced' && stock.oneYearReturn > 20) {
    return `Advanced risk management skills meet high-growth potential - ${stock.companyName}'s ${stock.oneYearReturn.toFixed(1)}% performance, you can handle the ride`;
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
    return `Build meaningful positions without breaking the bank - at $${stock.pricePerShare.toFixed(2)} per share, ${stock.companyName} is dollar-cost averaging friendly`;
  }
  
  if (stock.peRatio > 0 && stock.peRatio < 20) {
    return `Attractive value without premium pricing - ${stock.companyName}'s ${stock.peRatio.toFixed(1)}x P/E ratio for ${stock.oneYearReturn.toFixed(1)}% performance`;
  }
  
  return null;
};

const generateLifestyleReasons = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile
): string | null => {
  const lifestyleMatches: Record<string, Record<string, string>> = {
    'AAPL': {
      young: "Profit from your ecosystem addiction - you probably own multiple Apple devices and complain about dongles, might as well get paid back",
      tech: "Premium products for premium returns - Apple's design philosophy matches your appreciation for things that 'just work'"
    },
    'AMZN': {
      busy: "Get paid back for your digital dependency - Amazon basically runs your life with groceries, streaming, and cloud storage",
      convenience: "Your 'add to cart' habits fund growth - time to profit from your own spending patterns"
    },
    'TSLA': {
      environmental: "Doing good while doing well - Tesla aligns with your values while potentially funding your early retirement",
      innovative: "Curiosity meets innovation pipeline - Tesla's tech advancement matches your excitement about new developments"
    },
    'V': {
      travel: "Own the infrastructure of your spending - every coffee purchase, vacation booking, and impulse buy flows through Visa",
      digital: "Invisible financial partner profits - Visa processes your digital lifestyle from app purchases to online shopping"
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
  
  fallbacks.push(`VIP pass to long-term industry trends - ${stock.companyName}'s market position in ${stock.sector} sector`);
  
  if (stock.oneYearReturn > 0) {
    fallbacks.push(`Market agrees they're doing something right - ${stock.companyName}'s positive ${stock.oneYearReturn.toFixed(1)}% momentum`);
  }
  
  if (stock.marketCap.includes('B') && parseFloat(stock.marketCap) > 10) {
    fallbacks.push(`You're in good company with institutions - ${stock.companyName}'s ${stock.marketCap} market cap means professional backing`);
  }
  
  return fallbacks.slice(0, 2);
};
