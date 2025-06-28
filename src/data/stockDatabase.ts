
import { StockRecommendation } from '@/types/stock-matcher';
import { technologyStocks } from './sectors/technologyStocks';
import { healthcareStocks } from './sectors/healthcareStocks';
import { financeStocks } from './sectors/financeStocks';
import { energyStocks } from './sectors/energyStocks';
import { consumerStocks } from './sectors/consumerStocks';
import { utilitiesStocks } from './sectors/utilitiesStocks';

// Combine all sector stocks into one database
export const stockDatabase: Omit<StockRecommendation, 'whyItFits'>[] = [
  ...technologyStocks,
  ...healthcareStocks,
  ...financeStocks,
  ...energyStocks,
  ...consumerStocks,
  ...utilitiesStocks
];

// Export individual sectors for targeted filtering
export {
  technologyStocks,
  healthcareStocks,
  financeStocks,
  energyStocks,
  consumerStocks,
  utilitiesStocks
};
