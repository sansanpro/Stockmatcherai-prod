
// One of the user's causes that a company matches (from match-feed)
export interface MatchedCause {
  cause: string;
  label: string;
  icon: string;
  exposure: 'core' | 'partial' | 'peripheral';
  whyLine?: string | null;
}

export interface StockCaution {
  headline: string;
  reason: string | null;
  sourceUrl: string | null;
}

export interface StockRecommendation {
  id: string;
  companyName: string;
  ticker: string;
  sector: string;
  ceoName: string;
  ceoHighlights: string;
  peRatio: number;
  marketCap: string;
  oneYearReturn: number;
  riskLevel: 'low' | 'medium' | 'high';
  pricePerShare: number;
  dividendYield: number;
  whyItFits: string;
  esgScore?: number;
  lastUpdated?: string;
  // Values-first fields (cards from match-feed)
  logoUrl?: string;
  cardType?: 'company' | 'update';
  cause?: string;
  matchedCauses?: MatchedCause[];
  missionStory?: string;
  proof?: string;
  proofSourceUrl?: string;
  thingsToKnow?: string[];
  // "Big swings" caution: a large recent move, why it happened (null until explained) and the source
  caution?: StockCaution;
  // Update cards: news about a company the user already liked
  update?: { headline: string; source?: string; url?: string; publishedAt?: string };
}
