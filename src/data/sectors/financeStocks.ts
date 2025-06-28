
import { StockRecommendation } from '@/types/stock-matcher';

export const financeStocks: Omit<StockRecommendation, 'whyItFits'>[] = [
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
  },
  {
    id: 'MA',
    companyName: 'Mastercard Inc.',
    ticker: 'MA',
    sector: 'Finance',
    ceoName: 'Michael Miebach',
    ceoHighlights: '10+ years with Mastercard, leading digital payments innovation and global expansion. Focus on cybersecurity and blockchain technologies.',
    peRatio: 34.2,
    marketCap: '$380B',
    oneYearReturn: 16.5,
    riskLevel: 'medium',
    pricePerShare: 395.40,
    dividendYield: 0.5,
    esgScore: 84
  },
  {
    id: 'GS',
    companyName: 'The Goldman Sachs Group, Inc.',
    ticker: 'GS',
    sector: 'Finance',
    ceoName: 'David Solomon',
    ceoHighlights: 'Former investment banker leading Goldman Sachs through digital transformation. Focus on consumer banking and technology-driven financial services.',
    peRatio: 11.4,
    marketCap: '$125B',
    oneYearReturn: 15.2,
    riskLevel: 'medium',
    pricePerShare: 365.85,
    dividendYield: 2.8,
    esgScore: 74
  }
];
