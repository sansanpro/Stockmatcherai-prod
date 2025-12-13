import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

const COOLDOWN_DAYS = 7;

export const getRecentlySwipedTickers = async (userId: string): Promise<string[]> => {
  const cutoffTime = new Date();
  cutoffTime.setDate(cutoffTime.getDate() - COOLDOWN_DAYS);
  
  try {
    const { data, error } = await supabase
      .from('user_matches')
      .select('ticker')
      .eq('user_id', userId)
      .gte('matched_at', cutoffTime.toISOString());
    
    if (error) {
      console.error('Error fetching recently swiped stocks:', error);
      return [];
    }
    
    return data?.map(item => item.ticker) || [];
  } catch (error) {
    console.error('Error in getRecentlySwipedTickers:', error);
    return [];
  }
};

export const recordSwipe = async (
  userId: string,
  ticker: string,
  companyName: string,
  isMatch: boolean,
  stockData?: Json,
  matchReason?: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_matches')
      .insert([{
        user_id: userId,
        ticker,
        company_name: companyName,
        is_match: isMatch,
        stock_data: stockData || null,
        match_reason: matchReason || null
      }]);
    
    if (error) {
      console.error('Error recording swipe:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in recordSwipe:', error);
    return false;
  }
};
