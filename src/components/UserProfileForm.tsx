
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserProfile } from '@/types/stock-matcher';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserProfileFormProps {
  onComplete: (profile: UserProfile) => void;
  existingProfile?: UserProfile;
  isUpdate?: boolean;
}

const UserProfileForm = ({ onComplete, existingProfile, isUpdate = false }: UserProfileFormProps) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Partial<UserProfile>>(existingProfile || {});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error('You must be logged in to save your profile');
      return;
    }

    if (!isProfileComplete(profile)) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    try {
      // Use the same saving logic as Index.tsx to avoid conflicts
      const profileData = {
        user_id: user.id,
        age: profile.age,
        gender: profile.gender,
        salary: profile.salary,
        investment_experience: profile.experience,
        risk_tolerance: profile.riskTolerance,
        sectors_of_interest: [profile.sectorPreference],
        investment_goals: [profile.investmentGoal],
        // Keep backward compatibility
        age_range: `${profile.age}-${profile.age + 10}`,
        income_level: profile.salary?.toString() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(profileData, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        toast.error('Failed to save profile. Please try again.');
        return;
      }

      toast.success(isUpdate ? 'Profile updated successfully!' : 'Profile saved successfully!');
      onComplete(profile as UserProfile);
    } catch (error) {
      
      // Provide more specific error messages
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('Validation failed')) {
        toast.error(`Please check your inputs: ${errorMessage.replace('Validation failed: ', '')}`);
      } else if (errorMessage.includes('row-level security')) {
        toast.error('Permission denied. Please refresh the page and try again.');
      } else if (errorMessage.includes('duplicate')) {
        toast.error('Profile already exists. Refreshing page...');
        window.location.reload();
      } else {
        toast.error(`Failed to update profile: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const isProfileComplete = (p: Partial<UserProfile>): p is UserProfile => {
    return !!(p.age && p.gender && (p.salary || p.salary === 0) && p.experience && p.riskTolerance && p.sectorPreference && p.investmentGoal);
  };

  // Map income ranges to representative values for database storage
  const incomeRangeMap: { [key: string]: number } = {
    '0-50000': 25000,
    '50000-85000': 67500,
    '85000-100000': 92500,
    '100000-150000': 125000,
    '150000-200000': 175000,
    '200000+': 250000,
  };

  const getIncomeRangeFromSalary = (salary: number | null | undefined): string => {
    if (!salary) return '';
    if (salary < 50000) return '0-50000';
    if (salary < 85000) return '50000-85000';
    if (salary < 100000) return '85000-100000';
    if (salary < 150000) return '100000-150000';
    if (salary < 200000) return '150000-200000';
    return '200000+';
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card className="border-border/50">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-3xl font-bold text-center">
            {isUpdate ? 'Update your profile' : 'Tell us about yourself'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min="18"
                  max="100"
                  value={profile.age || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    let numValue: number | null = null;
                    
                    if (value !== '') {
                      const parsed = parseInt(value, 10);
                      numValue = isNaN(parsed) ? null : parsed;
                    }
                    
                    setProfile(prev => ({ ...prev, age: numValue }));
                  }}
                  placeholder="29"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select 
                  onValueChange={(value) => setProfile(prev => ({ ...prev, gender: value }))}
                  value={profile.gender}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Annual Income</Label>
              <Select 
                onValueChange={(value) => {
                  const salaryValue = incomeRangeMap[value];
                  setProfile(prev => ({ ...prev, salary: salaryValue }));
                }}
                value={getIncomeRangeFromSalary(profile.salary)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your income range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-50000">$0 - $50,000</SelectItem>
                  <SelectItem value="50000-85000">$50,000 - $85,000</SelectItem>
                  <SelectItem value="85000-100000">$85,000 - $100,000</SelectItem>
                  <SelectItem value="100000-150000">$100,000 - $150,000</SelectItem>
                  <SelectItem value="150000-200000">$150,000 - $200,000</SelectItem>
                  <SelectItem value="200000+">$200,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Investment Experience</Label>
              <Select 
                onValueChange={(value) => setProfile(prev => ({ ...prev, experience: value }))}
                value={profile.experience}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No experience</SelectItem>
                  <SelectItem value="beginner">Beginner (less than 1 year)</SelectItem>
                  <SelectItem value="intermediate">Intermediate (1-5 years)</SelectItem>
                  <SelectItem value="advanced">Advanced (5+ years)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Risk Tolerance</Label>
              <Select 
                onValueChange={(value) => setProfile(prev => ({ ...prev, riskTolerance: value }))}
                value={profile.riskTolerance}
              >
                <SelectTrigger>
                  <SelectValue placeholder="How much risk are you comfortable with?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Stable, predictable returns</SelectItem>
                  <SelectItem value="medium">Medium - Some volatility acceptable</SelectItem>
                  <SelectItem value="high">High - Maximum growth potential</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Preferred Sector</Label>
              <Select 
                onValueChange={(value) => setProfile(prev => ({ ...prev, sectorPreference: value }))}
                value={profile.sectorPreference}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Which sector interests you most?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="energy">Energy</SelectItem>
                  <SelectItem value="consumer">Consumer Goods</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="any">No preference</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Investment Goal</Label>
              <Select 
                onValueChange={(value) => setProfile(prev => ({ ...prev, investmentGoal: value }))}
                value={profile.investmentGoal}
              >
                <SelectTrigger>
                  <SelectValue placeholder="What's your primary goal?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="growth">Long-term growth</SelectItem>
                  <SelectItem value="income">Regular income (dividends)</SelectItem>
                  <SelectItem value="balance">Balanced growth and income</SelectItem>
                  <SelectItem value="retirement">Retirement planning</SelectItem>
                  <SelectItem value="short-term">Short-term gains</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit" 
              className="w-full"
              size="lg"
              disabled={!isProfileComplete(profile) || loading}
            >
              {loading ? 'Saving...' : (isUpdate ? 'Update Profile' : 'Find My Stock Matches')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfileForm;
