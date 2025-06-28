
import { UserProfile, StockRecommendation } from '@/types/stock-matcher';

export const filterStocksByProfile = (
  stocks: Omit<StockRecommendation, 'whyItFits'>[],
  profile: UserProfile
): Omit<StockRecommendation, 'whyItFits'>[] => {
  // Validate input
  if (!stocks || stocks.length === 0) {
    console.warn('No stocks provided for filtering');
    return [];
  }

  // Normalize sector names for better matching
  const normalizeSector = (sector: string): string => {
    const normalized = sector.toLowerCase().replace(/[-_\s]/g, '');
    
    const sectorMappings: Record<string, string> = {
      'realestate': 'realestate',
      'reits': 'realestate',
      'property': 'realestate',
      'realestatepropertyreits': 'realestate',
      'technology': 'technology',
      'tech': 'technology',
      'it': 'technology',
      'software': 'technology',
      'information': 'technology',
      'healthcare': 'healthcare',
      'health': 'healthcare',
      'medical': 'healthcare',
      'pharma': 'healthcare',
      'pharmaceutical': 'healthcare',
      'biotech': 'healthcare',
      'finance': 'finance',
      'financial': 'finance',
      'banking': 'finance',
      'insurance': 'finance',
      'fintech': 'finance',
      'consumer': 'consumer',
      'retail': 'consumer',
      'discretionary': 'consumer',
      'staples': 'consumer',
      'consumerdiscretionary': 'consumer',
      'consumerstaples': 'consumer',
      'utilities': 'utilities',
      'utility': 'utilities',
      'power': 'utilities',
      'electric': 'utilities',
      'energy': 'energy',
      'oil': 'energy',
      'gas': 'energy',
      'petroleum': 'energy',
      'renewable': 'energy',
      'industrial': 'industrial',
      'industrials': 'industrial',
      'manufacturing': 'industrial',
      'construction': 'industrial',
      'materials': 'materials',
      'mining': 'materials',
      'metals': 'materials',
      'chemicals': 'materials'
    };

    return sectorMappings[normalized] || normalized;
  };

  // Calculate very generous affordability threshold
  const getAffordabilityThreshold = (experience: string, salary: number) => {
    // Much more generous thresholds - allow people to invest more
    switch (experience) {
      case 'none':
        return salary * 0.5; // 50% for complete beginners
      case 'beginner':
        return salary * 0.75; // 75% for beginners
      case 'intermediate':
        return salary * 1.0; // 100% for intermediate
      case 'advanced':
        return salary * 1.5; // 150% for advanced
      default:
        return salary * 0.75;
    }
  };

  const affordabilityThreshold = getAffordabilityThreshold(profile.experience, profile.salary);

  // SECTOR PREFERENCE HANDLING - More balanced approach
  let filteredStocks: Omit<StockRecommendation, 'whyItFits'>[] = [];
  
  if (profile.sectorPreference !== 'any') {
    const normalizedUserSector = normalizeSector(profile.sectorPreference);
    console.log(`Looking for normalized sector: ${normalizedUserSector} (original: ${profile.sectorPreference})`);
    
    const availableSectors = [...new Set(stocks.map(stock => stock.sector))];
    console.log('Available sectors in database:', availableSectors);
    
    // Get all stocks from the preferred sector
    const sectorStocks = stocks.filter(stock => {
      const normalizedStockSector = normalizeSector(stock.sector);
      return normalizedStockSector === normalizedUserSector || 
             normalizedStockSector.includes(normalizedUserSector) ||
             normalizedUserSector.includes(normalizedStockSector);
    });
    
    console.log(`Found ${sectorStocks.length} stocks in preferred sector: ${profile.sectorPreference}`);
    
    // Apply lenient filtering to sector stocks
    const filteredSectorStocks = sectorStocks.filter(stock => {
      // Only exclude stocks that are completely unaffordable (more than 3x threshold)
      if (stock.pricePerShare > affordabilityThreshold * 3) {
        return false;
      }
      
      // Only exclude stocks with catastrophic performance (worse than -80%)
      if (stock.oneYearReturn < -80) {
        return false;
      }
      
      return true;
    });

    console.log(`After sector filtering: ${filteredSectorStocks.length} stocks`);

    // If we have enough sector stocks, use them as primary recommendations
    if (filteredSectorStocks.length >= 20) {
      filteredStocks = filteredSectorStocks;
    } else {
      // Not enough sector stocks - create a mixed portfolio with sector preference
      console.log(`Only ${filteredSectorStocks.length} stocks in preferred sector, creating mixed portfolio`);
      
      // Start with all available sector stocks
      filteredStocks = [...filteredSectorStocks];
      
      // Add stocks from other sectors to reach target count
      const otherSectorStocks = stocks.filter(stock => {
        const normalizedStockSector = normalizeSector(stock.sector);
        const isPreferredSector = normalizedStockSector === normalizedUserSector || 
                                 normalizedStockSector.includes(normalizedUserSector) ||
                                 normalizedUserSector.includes(normalizedStockSector);
        
        return !isPreferredSector && 
               stock.pricePerShare <= affordabilityThreshold * 5 && 
               stock.oneYearReturn > -80;
      });
      
      // Add other sector stocks to reach at least 40 total recommendations
      const targetCount = 40;
      const remainingSlots = Math.max(0, targetCount - filteredStocks.length);
      
      if (otherSectorStocks.length > 0) {
        // Prioritize stocks with good fundamentals from other sectors
        const sortedOtherStocks = otherSectorStocks.sort((a, b) => {
          let scoreA = 0, scoreB = 0;
          
          // Prefer lower risk for beginners
          if (profile.experience === 'beginner' || profile.experience === 'none') {
            if (a.riskLevel === 'low') scoreA += 10;
            if (b.riskLevel === 'low') scoreB += 10;
          }
          
          // Prefer positive returns
          if (a.oneYearReturn > 0) scoreA += a.oneYearReturn * 0.1;
          if (b.oneYearReturn > 0) scoreB += b.oneYearReturn * 0.1;
          
          // Prefer dividend-paying stocks for income
          scoreA += a.dividendYield * 2;
          scoreB += b.dividendYield * 2;
          
          return scoreB - scoreA;
        });
        
        filteredStocks = filteredStocks.concat(sortedOtherStocks.slice(0, remainingSlots));
      }
      
      console.log(`Mixed portfolio created: ${filteredStocks.length} total stocks (${filteredSectorStocks.length} from preferred sector)`);
    }
  } else {
    // No sector preference - apply minimal filtering for diverse portfolio
    console.log('No sector preference - creating diverse portfolio');
    
    filteredStocks = stocks.filter(stock => {
      // Only exclude stocks that are completely unaffordable (more than 5x salary)
      if (stock.pricePerShare > profile.salary * 5) {
        return false;
      }
      
      // Only exclude stocks with catastrophic performance (worse than -90%)
      if (stock.oneYearReturn < -90) {
        return false;
      }
      
      // Only exclude stocks with extreme negative P/E ratios (data quality issues)
      if (stock.peRatio < -100) {
        return false;
      }
      
      return true;
    });
  }

  console.log(`Final filtered result: ${filteredStocks.length} stocks from ${stocks.length} total`);

  // Final safety net - ensure minimum variety
  if (filteredStocks.length < 30) {
    console.log('Applying final safety net to ensure minimum stock variety');
    filteredStocks = stocks.filter(stock => {
      // Only exclude stocks that cost more than entire salary
      if (stock.pricePerShare > profile.salary * 10) {
        return false;
      }
      return true;
    }).slice(0, Math.min(50, stocks.length));
    
    console.log(`Safety net result: ${filteredStocks.length} stocks`);
  }

  return filteredStocks;
};
