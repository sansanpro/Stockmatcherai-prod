
import { StockRecommendation } from '@/types/stock-matcher';

export const consumerStocks: Omit<StockRecommendation, 'whyItFits'>[] = [
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
  }
];
