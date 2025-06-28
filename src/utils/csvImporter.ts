
import { StockRecommendation } from '@/types/stock-matcher';

interface CSVStockData {
  ticker: string;
  companyName: string;
  sector: string;
  peRatio: number;
  marketCap: string;
  pricePerShare: number;
  dividendYield: number;
  oneYearReturn: number;
  riskLevel: 'low' | 'medium' | 'high';
  ceoName?: string;
  ceoHighlights?: string;
  esgScore?: number;
}

export const parseCSVStockData = (csvContent: string): Omit<StockRecommendation, 'whyItFits'>[] => {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  const stocks: Omit<StockRecommendation, 'whyItFits'>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const stockData: any = {};
    
    headers.forEach((header, index) => {
      stockData[header] = values[index];
    });
    
    // Convert to our stock format
    const stock: Omit<StockRecommendation, 'whyItFits'> = {
      id: stockData.ticker || `STOCK_${i}`,
      companyName: stockData.companyName || stockData.name || 'Unknown Company',
      ticker: stockData.ticker || `TICK${i}`,
      sector: stockData.sector || 'Technology',
      ceoName: stockData.ceoName || 'Leadership Team',
      ceoHighlights: stockData.ceoHighlights || 'Experienced leadership driving company growth and innovation.',
      peRatio: parseFloat(stockData.peRatio) || 20,
      marketCap: stockData.marketCap || '$1B',
      oneYearReturn: parseFloat(stockData.oneYearReturn) || 10,
      riskLevel: (stockData.riskLevel as 'low' | 'medium' | 'high') || 'medium',
      pricePerShare: parseFloat(stockData.pricePerShare) || 100,
      dividendYield: parseFloat(stockData.dividendYield) || 2,
      esgScore: parseInt(stockData.esgScore) || 75
    };
    
    stocks.push(stock);
  }
  
  return stocks;
};

export const downloadSampleCSV = () => {
  const sampleCSV = `ticker,companyName,sector,peRatio,marketCap,pricePerShare,dividendYield,oneYearReturn,riskLevel,ceoName,ceoHighlights,esgScore
SAMPLE,Sample Corporation,Technology,25.5,$100B,150.00,2.5,15.2,medium,John Smith,Innovative leader with 15+ years experience,78
TEST,Test Industries,Healthcare,18.2,$50B,85.25,3.1,8.7,low,Jane Doe,Healthcare veteran leading digital transformation,82`;
  
  const blob = new Blob([sampleCSV], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sample_stocks.csv';
  a.click();
  window.URL.revokeObjectURL(url);
};

// Function to import from JSON file
export const parseJSONStockData = (jsonContent: string): Omit<StockRecommendation, 'whyItFits'>[] => {
  try {
    const data = JSON.parse(jsonContent);
    
    if (Array.isArray(data)) {
      return data.map((item: any, index: number) => ({
        id: item.ticker || item.id || `STOCK_${index}`,
        companyName: item.companyName || item.name || 'Unknown Company',
        ticker: item.ticker || item.symbol || `TICK${index}`,
        sector: item.sector || 'Technology',
        ceoName: item.ceoName || 'Leadership Team',
        ceoHighlights: item.ceoHighlights || 'Experienced leadership driving company growth and innovation.',
        peRatio: parseFloat(item.peRatio || item.pe) || 20,
        marketCap: item.marketCap || '$1B',
        oneYearReturn: parseFloat(item.oneYearReturn || item.return) || 10,
        riskLevel: (item.riskLevel || 'medium') as 'low' | 'medium' | 'high',
        pricePerShare: parseFloat(item.pricePerShare || item.price) || 100,
        dividendYield: parseFloat(item.dividendYield || item.dividend) || 2,
        esgScore: parseInt(item.esgScore || item.esg) || 75
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error parsing JSON stock data:', error);
    return [];
  }
};
