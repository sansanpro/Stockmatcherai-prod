
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile } from '@/types/stock-matcher';
import { toast } from 'sonner';
import { User, Save, ArrowLeft } from 'lucide-react';
import { saveUserProfile, getUserProfile } from '@/utils/profileManager';

interface SettingsProps {
  onBack: () => void;
  userProfile: UserProfile | null;
  onProfileUpdate: (profile: UserProfile) => void;
}

const Settings = ({ onBack, userProfile, onProfileUpdate }: SettingsProps) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(userProfile);
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setProfile(userProfile);
    } else if (user?.id) {
      // Load profile from database if not provided
      loadUserProfile();
    }
  }, [userProfile, user?.id]);

  const loadUserProfile = async () => {
    if (!user?.id) return;
    
    try {
      const loadedProfile = await getUserProfile(user.id);
      if (loadedProfile) {
        setProfile(loadedProfile);
        onProfileUpdate(loadedProfile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleProfileSave = async () => {
    if (!profile || !user?.id) return;
    
    setLoading(true);
    try {
      const success = await saveUserProfile(profile, user.id);
      if (success) {
        onProfileUpdate(profile);
        toast.success('Profile updated successfully!');
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
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

  const handleInputChange = (field: keyof UserProfile, value: string | number) => {
    if (!profile) return;
    
    setProfile(prev => ({
      ...prev!,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen w-full min-w-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 overflow-x-hidden">
      <div className="w-full pt-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={onBack}
            variant="ghost"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        </div>

        <div className="space-y-6">
            {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-100 dark:bg-gray-800"
                />
                <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
              </div>
            </CardContent>
          </Card>

          {/* Investment Profile */}
          {profile && (
            <Card>
              <CardHeader>
                <CardTitle>Investment Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={profile.age}
                      onChange={(e) => handleInputChange('age', parseInt(e.target.value))}
                      min="18"
                      max="100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="salary">Annual Income</Label>
                    <Select 
                      value={getIncomeRangeFromSalary(profile.salary)} 
                      onValueChange={(value) => {
                        const salaryValue = incomeRangeMap[value];
                        handleInputChange('salary', salaryValue);
                      }}
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
                </div>

                <div>
                  <Label htmlFor="experience">Investment Experience</Label>
                  <Select 
                    value={profile.experience} 
                    onValueChange={(value) => handleInputChange('experience', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner (0-2 years)</SelectItem>
                      <SelectItem value="intermediate">Intermediate (3-7 years)</SelectItem>
                      <SelectItem value="advanced">Advanced (8+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="riskTolerance">Risk Tolerance</Label>
                  <Select 
                    value={profile.riskTolerance} 
                    onValueChange={(value) => handleInputChange('riskTolerance', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select risk tolerance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - Prefer stable returns</SelectItem>
                      <SelectItem value="medium">Medium - Balanced approach</SelectItem>
                      <SelectItem value="high">High - Aggressive growth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sectorPreference">Preferred Sector</Label>
                  <Select 
                    value={profile.sectorPreference} 
                    onValueChange={(value) => handleInputChange('sectorPreference', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select preferred sector" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="energy">Energy</SelectItem>
                      <SelectItem value="consumer">Consumer Goods</SelectItem>
                      <SelectItem value="mixed">Mixed Portfolio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="investmentGoal">Investment Goal</Label>
                  <Select 
                    value={profile.investmentGoal} 
                    onValueChange={(value) => handleInputChange('investmentGoal', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select investment goal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="growth">Growth - Capital appreciation</SelectItem>
                      <SelectItem value="income">Income - Regular dividends</SelectItem>
                      <SelectItem value="balanced">Balanced - Growth + Income</SelectItem>
                      <SelectItem value="retirement">Retirement planning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select 
                    value={profile.gender} 
                    onValueChange={(value) => handleInputChange('gender', value)}
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
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleProfileSave}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
          </div>
        </div>
    </div>
  );
};

export default Settings;
