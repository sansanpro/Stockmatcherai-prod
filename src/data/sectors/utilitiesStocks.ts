
import { StockRecommendation } from '@/types/stock-matcher';

export const utilitiesStocks: Omit<StockRecommendation, 'whyItFits'>[] = [
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
    id: 'NEE',
    companyName: 'NextEra Energy, Inc.',
    ticker: 'NEE',
    sector: 'Utilities',
    ceoName: 'John Ketchum',
    ceoHighlights: '25+ years with NextEra, leading renewable energy expansion. Largest generator of wind and solar energy in North America.',
    peRatio: 22.8,
    marketCap: '$160B',
    oneYearReturn: 8.4,
    riskLevel: 'low',
    pricePerShare: 78.95,
    dividendYield: 2.8,
    esgScore: 85
  }
];
