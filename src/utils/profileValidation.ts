import { UserProfile } from '@/types/stock-matcher';

export const validateUserProfile = (profile: Partial<UserProfile>): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  // Check required fields
  if (!profile.age || profile.age < 18 || profile.age > 100) {
    errors.push('Age must be between 18 and 100');
  }

  if (!profile.gender) {
    errors.push('Gender is required');
  }

  if (!profile.salary || profile.salary < 0) {
    errors.push('Valid salary is required');
  }

  if (!profile.experience) {
    errors.push('Investment experience is required');
  }

  if (!profile.riskTolerance) {
    errors.push('Risk tolerance is required');
  }

  if (!profile.sectorPreference) {
    errors.push('Sector preference is required');
  }

  if (!profile.investmentGoal) {
    errors.push('Investment goal is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const sanitizeProfileData = (profile: UserProfile): UserProfile => {
  return {
    age: Math.max(18, Math.min(100, profile.age)),
    gender: profile.gender,
    salary: Math.max(0, profile.salary),
    experience: profile.experience,
    riskTolerance: profile.riskTolerance,
    sectorPreference: profile.sectorPreference,
    investmentGoal: profile.investmentGoal
  };
};