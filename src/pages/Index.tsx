
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import UserProfileForm from '@/components/UserProfileForm';
import StockMatcher from '@/components/StockMatcher';
import { UserProfile } from '@/types/stock-matcher';

const Index = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentStep, setCurrentStep] = useState<'welcome' | 'profile' | 'matching'>('welcome');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const handleProfileComplete = (profile: UserProfile) => {
    setUserProfile(profile);
    setCurrentStep('matching');
    setIsUpdatingProfile(false);
  };

  const resetApp = () => {
    setUserProfile(null);
    setCurrentStep('welcome');
    setIsUpdatingProfile(false);
  };

  const handleUpdateProfile = () => {
    setCurrentStep('profile');
    setIsUpdatingProfile(true);
  };

  if (currentStep === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center shadow-xl">
          <CardHeader className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Stock Matcher AI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg text-gray-600">
              Get personalized stock recommendations based on your profile, risk tolerance, and preferences.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center justify-center gap-2">
                <span>✨</span>
                <span>AI-powered matching</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span>👤</span>
                <span>Executive insights</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span>📊</span>
                <span>Visual risk indicators</span>
              </div>
            </div>
            <Button 
              onClick={() => setCurrentStep('profile')}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              Get Started 🚀
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 'profile') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <UserProfileForm 
          onComplete={handleProfileComplete} 
          existingProfile={userProfile || undefined}
          isUpdate={isUpdatingProfile}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <StockMatcher userProfile={userProfile!} onReset={handleUpdateProfile} />
    </div>
  );
};

export default Index;
