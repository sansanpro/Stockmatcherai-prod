
import { UserProfile, StockRecommendation } from '@/types/stock-matcher';

export const generatePersonalizedExplanation = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile
): string => {
  const reasons = [];

  // Risk alignment explanations
  if (stock.riskLevel === profile.riskTolerance) {
    const riskMessages = {
      low: "Perfect low-risk match providing stability and peace of mind",
      medium: "Ideal medium-risk balance offering growth potential with manageable volatility",
      high: "Excellent high-risk choice for maximum growth potential"
    };
    reasons.push(riskMessages[stock.riskLevel as keyof typeof riskMessages]);
  } else if (profile.riskTolerance === 'medium') {
    if (stock.riskLevel === 'low') {
      reasons.push("Conservative choice that fits your moderate risk approach");
    } else if (stock.riskLevel === 'high') {
      reasons.push("Growth-oriented option within your risk tolerance range");
    }
  }

  // Sector-specific insights
  if (profile.sectorPreference !== 'any' && stock.sector.toLowerCase() === profile.sectorPreference.toLowerCase()) {
    const sectorInsights = {
      technology: "Leading tech company positioned for digital transformation trends",
      healthcare: "Essential healthcare provider with defensive characteristics",
      finance: "Strong financial institution benefiting from economic growth",
      energy: "Energy sector exposure with potential for commodity price recovery",
      consumer: "Consumer-focused business with stable demand patterns",
      utilities: "Utility company providing reliable income and stability"
    };
    const insight = sectorInsights[profile.sectorPreference.toLowerCase() as keyof typeof sectorInsights];
    if (insight) reasons.push(insight);
  }

  // Age-based personalized recommendations
  if (profile.age < 30) {
    if (stock.oneYearReturn > 15) {
      reasons.push("Strong growth trajectory ideal for long-term wealth building in your 20s");
    }
    if (stock.sector === 'Technology') {
      reasons.push("Tech exposure perfectly suited for young investors building future wealth");
    }
    if (stock.esgScore && stock.esgScore > 75) {
      reasons.push("High ESG rating aligns with values-based investing for your generation");
    }
  } else if (profile.age >= 30 && profile.age < 50) {
    if (stock.dividendYield > 1 && stock.oneYearReturn > 5) {
      reasons.push("Balanced growth and income approach perfect for your career-building years");
    }
    if (stock.riskLevel === 'medium') {
      reasons.push("Moderate risk profile matches your life stage and investment timeline");
    }
  } else if (profile.age >= 50) {
    if (stock.dividendYield > 3) {
      reasons.push(`Excellent ${stock.dividendYield.toFixed(1)}% dividend yield provides reliable income for pre-retirement planning`);
    }
    if (stock.riskLevel === 'low') {
      reasons.push("Conservative investment approach suitable for wealth preservation phase");
    }
    if (stock.oneYearReturn > 0 && stock.oneYearReturn < 15) {
      reasons.push("Steady, consistent returns without excessive volatility");
    }
  }

  // Experience-based insights
  const experienceInsights = {
    none: () => {
      if (['AAPL', 'MSFT', 'KO', 'JNJ', 'WMT'].includes(stock.ticker)) {
        reasons.push("Blue-chip company perfect for learning investment fundamentals");
      }
      if (stock.dividendYield > 2) {
        reasons.push("Dividend-paying stock provides income while you learn");
      }
      if (stock.riskLevel === 'low') {
        reasons.push("Low-risk choice ideal for building investment confidence");
      }
    },
    beginner: () => {
      if (stock.riskLevel === 'low' || stock.riskLevel === 'medium') {
        reasons.push("Appropriate risk level for developing investment skills");
      }
      if (stock.dividendYield > 1.5) {
        reasons.push("Dividend income helps offset learning curve volatility");
      }
    },
    intermediate: () => {
      if (stock.riskLevel === 'medium') {
        reasons.push("Moderate risk matches your growing investment experience");
      }
      if (stock.oneYearReturn > 10 && stock.oneYearReturn < 25) {
        reasons.push("Solid growth potential appropriate for your skill level");
      }
    },
    advanced: () => {
      if (stock.oneYearReturn > 20) {
        reasons.push("High-growth potential matching your advanced risk tolerance");
      }
      if (stock.riskLevel === 'high') {
        reasons.push("Higher-risk investment suitable for experienced portfolio");
      }
    }
  };

  const expInsight = experienceInsights[profile.experience as keyof typeof experienceInsights];
  if (expInsight) expInsight();

  // Investment goal alignment
  const goalInsights = {
    income: () => {
      if (stock.dividendYield > 4) {
        reasons.push(`Outstanding ${stock.dividendYield.toFixed(1)}% dividend yield for income generation`);
      } else if (stock.dividendYield > 2) {
        reasons.push(`Solid ${stock.dividendYield.toFixed(1)}% dividend yield supports income goals`);
      }
    },
    growth: () => {
      if (stock.oneYearReturn > 20) {
        reasons.push("Exceptional growth track record with strong future potential");
      } else if (stock.oneYearReturn > 10) {
        reasons.push("Strong growth performance aligned with your objectives");
      }
    },
    balance: () => {
      if (stock.dividendYield > 1 && stock.oneYearReturn > 5) {
        reasons.push("Perfect balance of income generation and capital appreciation");
      }
    },
    retirement: () => {
      if (stock.riskLevel === 'low' && stock.dividendYield > 2) {
        reasons.push("Conservative income generator ideal for retirement planning");
      }
    },
    'short-term': () => {
      if (Math.abs(stock.oneYearReturn) > 15) {
        reasons.push("High volatility provides short-term trading opportunities");
      }
    }
  };

  const goalInsight = goalInsights[profile.investmentGoal as keyof typeof goalInsights];
  if (goalInsight) goalInsight();

  // CEO and leadership quality
  if (stock.ceoName && stock.ceoHighlights) {
    const leadershipTerms = ['transformed', 'led', 'pioneered', 'revolutionized', 'built'];
    const hasStrongLeadership = leadershipTerms.some(term => 
      stock.ceoHighlights.toLowerCase().includes(term)
    );
    if (hasStrongLeadership) {
      reasons.push("Exceptional leadership with proven track record of value creation");
    }
  }

  // Affordability and accessibility
  const monthlyIncome = profile.salary / 12;
  const investmentCapacity = monthlyIncome * 0.15;
  
  if (stock.pricePerShare <= investmentCapacity * 0.5) {
    reasons.push("Highly affordable allowing for regular investment accumulation");
  } else if (stock.pricePerShare <= investmentCapacity) {
    reasons.push("Reasonable price point fits comfortably within your budget");
  }

  // Financial health indicators
  if (stock.peRatio > 0 && stock.peRatio < 20) {
    reasons.push("Attractive valuation with reasonable price-to-earnings ratio");
  }

  // Market position and stability
  const marketCapValue = stock.marketCap;
  if (marketCapValue.includes('T')) {
    reasons.push("Large-cap stability with trillion-dollar market presence");
  } else if (marketCapValue.includes('B') && parseFloat(marketCapValue) > 100) {
    reasons.push("Well-established company with strong market position");
  }

  // Default reasons for edge cases
  if (reasons.length === 0) {
    reasons.push("Solid fundamentals with balanced risk-return profile");
    reasons.push("Well-positioned company in growing market sector");
    if (stock.oneYearReturn > 0) {
      reasons.push("Positive performance trend indicates market confidence");
    }
  }

  // Limit to 3-4 most relevant reasons for readability
  const selectedReasons = reasons.slice(0, Math.min(4, reasons.length));
  return selectedReasons.join('. ') + '.';
};
