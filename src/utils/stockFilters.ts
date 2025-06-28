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

  // ENHANCED SECTOR PREFERENCE HANDLING - Strict healthcare prioritization
  let filteredStocks: Omit<StockRecommendation, 'whyItFits'>[] = [];
  
  if (profile.sectorPreference !== 'any') {
    const normalizedUserSector = normalizeSector(profile.sectorPreference);
    console.log(`STRICT SECTOR FILTERING: Looking for ${normalizedUserSector} (original: ${profile.sectorPreference})`);
    
    const availableSectors = [...new Set(stocks.map(stock => stock.sector))];
    console.log('Available sectors in database:', availableSectors);
    
    // Get ALL stocks from the preferred sector with very lenient filtering
    const sectorStocks = stocks.filter(stock => {
      const normalizedStockSector = normalizeSector(stock.sector);
      const isMatch = normalizedStockSector === normalizedUserSector || 
                     normalizedStockSector.includes(normalizedUserSector) ||
                     normalizedUserSector.includes(normalizedStockSector);
      
      if (isMatch) {
        console.log(`SECTOR MATCH: ${stock.ticker} (${stock.sector}) matches ${profile.sectorPreference}`);
      }
      return isMatch;
    });
    
    console.log(`Found ${sectorStocks.length} stocks in preferred sector: ${profile.sectorPreference}`);
    
    // For healthcare specifically, be even more aggressive
    if (normalizedUserSector === 'healthcare') {
      const healthcareStocks = sectorStocks.filter(stock => {
        // Only exclude if completely unaffordable or catastrophic performance
        return stock.pricePerShare <= affordabilityThreshold * 10 && stock.oneYearReturn > -90;
      });
      
      console.log(`HEALTHCARE PRIORITY: ${healthcareStocks.length} healthcare stocks after lenient filtering`);
      
      if (healthcareStocks.length >= 10) {
        // Prioritize healthcare stocks heavily
        filteredStocks = [...healthcareStocks];
        
        // Add a few other stocks for diversity, but healthcare first
        const otherStocks = stocks.filter(stock => {
          const normalizedStockSector = normalizeSector(stock.sector);
          return normalizedStockSector !== 'healthcare' && 
                 stock.pricePerShare <= affordabilityThreshold * 5 && 
                 stock.oneYearReturn > -70;
        }).slice(0, 20); // Maximum 20 non-healthcare stocks
        
        filteredStocks = [...healthcareStocks, ...otherStocks];
        console.log(`HEALTHCARE FOCUSED PORTFOLIO: ${healthcareStocks.length} healthcare + ${otherStocks.length} others`);
      } else {
        // Fallback if very few healthcare stocks
        filteredStocks = sectorStocks;
      }
    } else {
      // For other sectors, use existing logic
      const filteredSectorStocks = sectorStocks.filter(stock => {
        return stock.pricePerShare <= affordabilityThreshold * 3 && stock.oneYearReturn > -80;
      });

      if (filteredSectorStocks.length >= 20) {
        filteredStocks = filteredSectorStocks;
      } else {
        // Mixed portfolio approach for other sectors
        filteredStocks = [...filteredSectorStocks];
        
        const otherSectorStocks = stocks.filter(stock => {
          const normalizedStockSector = normalizeSector(stock.sector);
          const isPreferredSector = normalizedStockSector === normalizedUserSector || 
                                   normalizedStockSector.includes(normalizedUserSector) ||
                                   normalizedUserSector.includes(normalizedStockSector);
          
          return !isPreferredSector && 
                 stock.pricePerShare <= affordabilityThreshold * 5 && 
                 stock.oneYearReturn > -80;
        });
        
        const targetCount = 40;
        const remainingSlots = Math.max(0, targetCount - filteredStocks.length);
        
        if (otherSectorStocks.length > 0) {
          const sortedOtherStocks = otherSectorStocks.sort((a, b) => {
            let scoreA = 0, scoreB = 0;
            
            if (profile.experience === 'beginner' || profile.experience === 'none') {
              if (a.riskLevel === 'low') scoreA += 10;
              if (b.riskLevel === 'low') scoreB += 10;
            }
            
            if (a.oneYearReturn > 0) scoreA += a.oneYearReturn * 0.1;
            if (b.oneYearReturn > 0) scoreB += b.oneYearReturn * 0.1;
            
            scoreA += a.dividendYield * 2;
            scoreB += b.dividendYield * 2;
            
            return scoreB - scoreA;
          });
          
          filteredStocks = filteredStocks.concat(sortedOtherStocks.slice(0, remainingSlots));
        }
      }
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

  console.log(`FINAL FILTERING RESULT: ${filteredStocks.length} stocks from ${stocks.length} total`);
  console.log('Final stock sectors:', [...new Set(filteredStocks.map(s => s.sector))]);

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
