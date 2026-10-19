
export interface UserProfile {
  age: number;
  gender: string;
  salary: number;
  experience: string;
  riskTolerance: string;
  sectorPreference: string;
  investmentGoal: string;
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
}
