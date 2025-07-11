
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserProfile } from '@/types/stock-matcher';
import { useAuth } from '@/contexts/AuthContext';
import { saveUserProfile } from '@/utils/profileManager';
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
      const success = await saveUserProfile(profile as UserProfile, user.id);
      
      if (success) {
        toast.success(isUpdate ? 'Profile updated successfully!' : 'Profile saved successfully!');
        onComplete(profile as UserProfile);
      } else {
        toast.error('Failed to save profile. Please try again.');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('An error occurred while saving your profile');
    } finally {
      setLoading(false);
    }
  };

  const isProfileComplete = (p: Partial<UserProfile>): p is UserProfile => {
    return !!(p.age && p.gender && p.salary && p.experience && p.riskTolerance && p.sectorPreference && p.investmentGoal);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {isUpdate ? 'Update your profile 📝' : 'Tell us about yourself 📋'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age 🎂</Label>
                <Input
                  id="age"
                  type="number"
                  min="18"
                  max="100"
                  value={profile.age || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                  placeholder="25"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender 👤</Label>
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
              <Label htmlFor="salary">Annual Salary 💰</Label>
              <Input
                id="salary"
                type="number"
                min="0"
                value={profile.salary || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, salary: parseInt(e.target.value) }))}
                placeholder="60000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Investment Experience 📚</Label>
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
              <Label>Risk Tolerance ⚖️</Label>
              <Select 
                onValueChange={(value) => setProfile(prev => ({ ...prev, riskTolerance: value }))}
                value={profile.riskTolerance}
              >
                <SelectTrigger>
                  <SelectValue placeholder="How much risk are you comfortable with?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - I prefer stable, predictable returns</SelectItem>
                  <SelectItem value="medium">Medium - I can handle some volatility</SelectItem>
                  <SelectItem value="high">High - I want maximum growth potential</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Preferred Sector 🏢</Label>
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
              <Label>Investment Goal 🎯</Label>
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
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105"
              disabled={!isProfileComplete(profile) || loading}
            >
              {loading ? 'Saving...' : (isUpdate ? 'Update Profile ✨' : 'Find My Stock Matches ✨')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfileForm;
