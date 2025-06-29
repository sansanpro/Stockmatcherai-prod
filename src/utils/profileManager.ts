
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/stock-matcher';

// Map our internal UserProfile type to Supabase user_profiles table structure
const mapToSupabaseProfile = (profile: UserProfile, userId: string) => ({
  user_id: userId,
  age_range: profile.age ? `${profile.age}` : null,
  investment_experience: profile.experience || null,
  risk_tolerance: profile.riskTolerance || null,
  investment_goals: profile.investmentGoal ? [profile.investmentGoal] : null,
  income_level: profile.salary ? `${profile.salary}` : null,
  sectors_of_interest: profile.sectorPreference ? [profile.sectorPreference] : null,
  time_horizon: 'medium-term' // Default value since it's not in UserProfile
});

// Map Supabase user_profiles data back to our UserProfile type
const mapFromSupabaseProfile = (data: any): UserProfile | null => {
  if (!data) return null;
  
  return {
    age: data.age_range ? parseInt(data.age_range) : 25,
    gender: 'prefer-not-to-say', // Default since not stored in DB
    salary: data.income_level ? parseInt(data.income_level) : 50000,
    experience: data.investment_experience || 'beginner',
    riskTolerance: data.risk_tolerance || 'medium',
    sectorPreference: data.sectors_of_interest?.[0] || 'technology',
    investmentGoal: data.investment_goals?.[0] || 'growth'
  };
};

export const saveUserProfile = async (profile: UserProfile, userId: string): Promise<boolean> => {
  try {
    const supabaseProfile = mapToSupabaseProfile(profile, userId);
    
    const { error } = await supabase
      .from('user_profiles')
      .upsert(supabaseProfile, { onConflict: 'user_id' });

    if (error) {
      console.error('Error saving user profile:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in saveUserProfile:', error);
    return false;
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return mapFromSupabaseProfile(data);
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
};
