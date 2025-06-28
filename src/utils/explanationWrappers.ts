
import { UserProfile, StockRecommendation } from '@/types/stock-matcher';
import { generatePersonalizedExplanation } from './explanationGenerator';

// Wrapper function to maintain backward compatibility
export const generateExplanation = (
  stock: Omit<StockRecommendation, 'whyItFits'>,
  profile: UserProfile
): string => {
  return generatePersonalizedExplanation(stock, profile, false);
};
