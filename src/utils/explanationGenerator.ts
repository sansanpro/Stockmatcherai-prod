
import { UserProfile, StockRecommendation } from '@/types/stock-matcher';

export const generatePersonalizedExplanation = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile
): string => {
  const reasons: string[] = [];

  // Stock-specific characteristics first
  const stockSpecificReasons = generateStockSpecificReasons(stock, profile);
  reasons.push(...stockSpecificReasons);

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
      if (profile.age < 40) return `Apple's ecosystem dominance and innovation pipeline aligns with your tech-forward generation`;
      if (profile.investmentGoal === 'growth') return `Apple's consistent product innovation drives sustained revenue growth at ${stock.oneYearReturn.toFixed(1)}%`;
      return `Apple's brand loyalty and recurring services revenue provide stability with ${stock.dividendYield.toFixed(1)}% dividend yield`;
    },
    'MSFT': (stock, profile) => {
      if (profile.sectorPreference === 'technology') return `Microsoft's cloud dominance with Azure captures the enterprise digital transformation trend`;
      if (profile.experience === 'none' || profile.experience === 'beginner') return `Microsoft's diversified business model from Office to cloud provides beginner-friendly stability`;
      return `Microsoft's enterprise moat and recurring subscription revenue model offers consistent ${stock.oneYearReturn.toFixed(1)}% returns`;
    },
    'GOOGL': (stock, profile) => {
      if (profile.age < 35) return `Google's AI leadership and search monopoly positions it perfectly for the next decade of digital growth`;
      if (profile.investmentGoal === 'growth') return `Google's advertising dominance and AI investments drive exceptional ${stock.oneYearReturn.toFixed(1)}% growth potential`;
      return `Alphabet's diverse revenue streams from search to cloud to YouTube provide multiple growth catalysts`;
    },
    'AMZN': (stock, profile) => {
      if (profile.investmentGoal === 'growth') return `Amazon's e-commerce dominance and AWS cloud leadership create multiple expansion opportunities`;
      if (profile.age < 40) return `Amazon's innovation in logistics and cloud computing aligns with changing consumer behaviors`;
      return `Amazon Web Services' high-margin business model drives improving profitability with ${stock.oneYearReturn.toFixed(1)}% returns`;
    },
    'TSLA': (stock, profile) => {
      if (profile.riskTolerance === 'high') return `Tesla's electric vehicle leadership and energy storage potential offer explosive growth despite ${Math.abs(stock.oneYearReturn).toFixed(1)}% volatility`;
      if (profile.age < 30) return `Tesla's sustainable transportation mission and autonomous driving technology appeal to environmentally conscious young investors`;
      return `Tesla's manufacturing scale advantages and software capabilities differentiate it in the EV transition`;
    },
    'JNJ': (stock, profile) => {
      if (profile.age >= 50) return `Johnson & Johnson's healthcare essentials and ${stock.dividendYield.toFixed(1)}% dividend provide recession-resistant income`;
      if (profile.riskTolerance === 'low') return `J&J's diversified healthcare portfolio from pharmaceuticals to consumer products offers defensive stability`;
      return `Johnson & Johnson's pharmaceutical pipeline and consumer brand strength ensure steady ${stock.oneYearReturn.toFixed(1)}% growth`;
    },
    'V': (stock, profile) => {
      if (profile.investmentGoal === 'growth') return `Visa's payment processing monopoly benefits from every digital transaction with ${stock.oneYearReturn.toFixed(1)}% growth`;
      if (profile.age < 40) return `Visa captures the global shift to cashless payments with minimal capital requirements`;
      return `Visa's toll-booth business model on global commerce provides consistent fee-based revenue growth`;
    },
    'MA': (stock, profile) => {
      if (profile.investmentGoal === 'balance') return `Mastercard's payment network generates ${stock.oneYearReturn.toFixed(1)}% returns while paying ${stock.dividendYield.toFixed(1)}% dividends`;
      return `Mastercard's duopoly with Visa in global payments creates sustainable competitive advantages`;
    },
    'NVDA': (stock, profile) => {
      if (profile.riskTolerance === 'high' && profile.age < 35) return `NVIDIA's AI chip dominance positions it at the center of the artificial intelligence revolution with ${stock.oneYearReturn.toFixed(1)}% explosive growth`;
      if (profile.sectorPreference === 'technology') return `NVIDIA's GPU leadership in gaming, data centers, and AI creates multiple high-growth market exposures`;
      return `NVIDIA's semiconductor innovation cycle and AI infrastructure demand drive significant growth potential`;
    },
    'JPM': (stock, profile) => {
      if (profile.sectorPreference === 'finance') return `JPMorgan's banking leadership and trading expertise benefit from rising interest rates with ${stock.oneYearReturn.toFixed(1)}% performance`;
      if (profile.age >= 40) return `JPM's dividend track record and financial strength provide ${stock.dividendYield.toFixed(1)}% income with capital appreciation`;
      return `JPMorgan's diversified financial services and credit card business create multiple revenue streams`;
    }
  };

  const companyInsight = companyInsights[stock.ticker];
  if (companyInsight) {
    const insight = companyInsight(stock, profile);
    if (insight) reasons.push(insight);
  }

  // Performance-specific insights
  if (stock.oneYearReturn > 30) {
    reasons.push(`Exceptional ${stock.oneYearReturn.toFixed(1)}% annual performance demonstrates strong market momentum and investor confidence`);
  } else if (stock.oneYearReturn > 15) {
    reasons.push(`Solid ${stock.oneYearReturn.toFixed(1)}% annual growth outpaces market averages while maintaining reasonable valuation`);
  } else if (stock.oneYearReturn > 0 && stock.oneYearReturn <= 15) {
    reasons.push(`Steady ${stock.oneYearReturn.toFixed(1)}% returns provide consistent growth without excessive volatility risk`);
  }

  // Valuation-specific insights
  if (stock.peRatio > 0 && stock.peRatio < 15) {
    reasons.push(`Attractive ${stock.peRatio.toFixed(1)}x P/E ratio suggests the market hasn't fully recognized ${stock.companyName}'s value potential`);
  } else if (stock.peRatio >= 15 && stock.peRatio < 25) {
    reasons.push(`Reasonable ${stock.peRatio.toFixed(1)}x P/E valuation reflects balanced market expectations for ${stock.companyName}'s growth`);
  }

  // Dividend-specific insights
  if (stock.dividendYield > 4) {
    reasons.push(`Outstanding ${stock.dividendYield.toFixed(1)}% dividend yield from ${stock.companyName} provides substantial passive income generation`);
  } else if (stock.dividendYield > 2) {
    reasons.push(`${stock.companyName}'s ${stock.dividendYield.toFixed(1)}% dividend yield offers reliable income while maintaining growth potential`);
  }

  return reasons;
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
    return `${stock.companyName}'s ${stock.oneYearReturn.toFixed(1)}% growth trajectory maximizes your long-term wealth building potential in your 20s`;
  }
  
  if (profile.age >= 30 && profile.age < 50 && stock.dividendYield > 1 && stock.oneYearReturn > 5) {
    return `${stock.companyName} provides career-stage appropriate balance with ${stock.dividendYield.toFixed(1)}% income and ${stock.oneYearReturn.toFixed(1)}% appreciation`;
  }
  
  if (profile.age >= 50 && stock.dividendYield > 3) {
    return `${stock.companyName}'s ${stock.dividendYield.toFixed(1)}% dividend yield supports pre-retirement income planning with capital preservation`;
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
    return `${stock.companyName} serves as an ideal learning investment with established business model and ${stock.oneYearReturn.toFixed(1)}% track record`;
  }
  
  if (profile.experience === 'advanced' && stock.oneYearReturn > 20) {
    return `${stock.companyName}'s ${stock.oneYearReturn.toFixed(1)}% high-growth potential matches your advanced risk management capabilities`;
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
    return `${stock.companyName}'s $${stock.pricePerShare.toFixed(2)} share price enables regular accumulation within your comfortable investment budget`;
  }
  
  if (stock.peRatio > 0 && stock.peRatio < 20) {
    return `${stock.companyName}'s ${stock.peRatio.toFixed(1)}x P/E ratio represents attractive value relative to its ${stock.oneYearReturn.toFixed(1)}% performance`;
  }
  
  return null;
};

const generateFallbackReasons = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile
): string[] => {
  const fallbacks: string[] = [];
  
  fallbacks.push(`${stock.companyName}'s market position in ${stock.sector} provides exposure to long-term industry trends`);
  
  if (stock.oneYearReturn > 0) {
    fallbacks.push(`${stock.companyName}'s positive ${stock.oneYearReturn.toFixed(1)}% momentum indicates strong business execution`);
  }
  
  if (stock.marketCap.includes('B') && parseFloat(stock.marketCap) > 10) {
    fallbacks.push(`${stock.companyName}'s ${stock.marketCap} market capitalization provides institutional-quality stability`);
  }
  
  return fallbacks.slice(0, 2);
};
