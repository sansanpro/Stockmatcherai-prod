
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/stock-matcher';
import { validateUserProfile, sanitizeProfileData } from './profileValidation';

// Map our internal UserProfile type to Supabase user_profiles table structure
const mapToSupabaseProfile = (profile: UserProfile, userId: string) => ({
  user_id: userId,
  age: profile.age,
  gender: profile.gender,
  salary: profile.salary,
  investment_experience: profile.experience || null,
  risk_tolerance: profile.riskTolerance || null,
  investment_goals: profile.investmentGoal ? [profile.investmentGoal] : null,
  sectors_of_interest: profile.sectorPreference ? [profile.sectorPreference] : null,
  // Keep backward compatibility
  age_range: profile.age ? `${profile.age}` : null,
  income_level: profile.salary ? `${profile.salary}` : null,
  time_horizon: 'medium-term' // Default value since it's not in UserProfile
});

// Map Supabase user_profiles data back to our UserProfile type
const mapFromSupabaseProfile = (data: any): UserProfile | null => {
  if (!data) return null;
  
  return {
    age: data.age || (data.age_range ? parseInt(data.age_range.split('-')[0]) : null),
    gender: data.gender || 'prefer-not-to-say',
    salary: data.salary || (data.income_level ? parseInt(data.income_level) : null),
    experience: data.investment_experience || 'beginner',
    riskTolerance: data.risk_tolerance || 'medium',
    sectorPreference: data.sectors_of_interest?.[0] || 'technology',
    investmentGoal: data.investment_goals?.[0] || 'growth'
  };
};

export const saveUserProfile = async (profile: UserProfile, userId: string): Promise<boolean> => {
  try {
    // Validate the profile data first
    const validation = validateUserProfile(profile);
    if (!validation.isValid) {
      console.error('Profile validation failed:', validation.errors);
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Sanitize the data to ensure it's within valid ranges
    const sanitizedProfile = sanitizeProfileData(profile);
    const supabaseProfile = mapToSupabaseProfile(sanitizedProfile, userId);
    
    console.log('Saving profile for user:', userId);
    
    // Use upsert operation - this handles both insert and update automatically
    const { error } = await supabase
      .from('user_profiles')
      .upsert(supabaseProfile, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Error saving user profile:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('Profile saved successfully');
    return true;
  } catch (error) {
    console.error('Error in saveUserProfile:', error);
    throw error; // Re-throw to let the UI handle the specific error
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
