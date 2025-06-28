
import { StockRecommendation } from '@/types/stock-matcher';

export const energyStocks: Omit<StockRecommendation, 'whyItFits'>[] = [
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
    id: 'COP',
    companyName: 'ConocoPhillips',
    ticker: 'COP',
    sector: 'Energy',
    ceoName: 'Ryan Lance',
    ceoHighlights: '20+ years with ConocoPhillips, leading company through shale revolution. Focus on low-cost oil production and shareholder returns.',
    peRatio: 12.8,
    marketCap: '$140B',
    oneYearReturn: 18.5,
    riskLevel: 'medium',
    pricePerShare: 112.40,
    dividendYield: 2.1,
    esgScore: 66
  }
];
