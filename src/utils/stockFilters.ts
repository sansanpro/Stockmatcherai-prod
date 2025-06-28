
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

  // SECTOR PREFERENCE HANDLING - Much more lenient
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
    
    if (sectorStocks.length > 0) {
      // Apply VERY lenient filtering to sector stocks
      let filteredSectorStocks = sectorStocks.filter(stock => {
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

      console.log(`After very lenient sector filtering: ${filteredSectorStocks.length} stocks`);

      // If we have enough sector stocks, return them
      if (filteredSectorStocks.length >= 15) {
        return filteredSectorStocks;
      }
      
      // If not enough, include ALL sector stocks regardless of other filters
      if (sectorStocks.length > 0) {
        console.log(`Using all ${sectorStocks.length} sector stocks with minimal filtering`);
        return sectorStocks.filter(stock => stock.pricePerShare < profile.salary * 5); // Only exclude extremely expensive stocks
      }
    }

    console.warn(`No suitable stocks found in preferred sector: ${profile.sectorPreference}`);
  }

  // MIXED PORTFOLIO APPROACH - Very lenient filtering
  console.log('Applying mixed portfolio filtering with lenient criteria');

  // Apply minimal filtering to get a large diverse set
  let filteredStocks = stocks.filter(stock => {
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

  console.log(`After minimal filtering: ${filteredStocks.length} stocks from ${stocks.length} total`);

  // If we still don't have enough stocks, be even more lenient
  if (filteredStocks.length < 50) {
    filteredStocks = stocks.filter(stock => {
      // Only exclude stocks that cost more than entire salary
      if (stock.pricePerShare > profile.salary * 10) {
        return false;
      }
      return true;
    });
    console.log(`After ultra-lenient filtering: ${filteredStocks.length} stocks`);
  }

  // Final safety net - if we still don't have enough, use most of the stocks
  if (filteredStocks.length < 30) {
    filteredStocks = stocks.slice(0, Math.min(100, stocks.length));
    console.log(`Using fallback selection: ${filteredStocks.length} stocks`);
  }

  return filteredStocks;
};
