import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import UserProfileForm from '@/components/UserProfileForm';
import StockMatcher from '@/components/StockMatcher';
import Watchlist from '@/components/Watchlist';
import Matches from '@/components/Matches';
import Analytics from '@/components/Analytics';
import NotificationSystem from '@/components/NotificationSystem';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { UserProfile } from '@/types/stock-matcher';
import { Moon, BarChart, Eye, Heart } from 'lucide-react';

const IndexContent = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentStep, setCurrentStep] = useState<'welcome' | 'profile' | 'matching' | 'matches' | 'watchlist' | 'analytics'>('welcome');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const { isDarkMode, toggleDarkMode } = useApp();

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

  // Header for app navigation
  const AppHeader = () => (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setCurrentStep('matching')}
            variant={currentStep === 'matching' ? 'default' : 'ghost'}
            size="sm"
            disabled={!userProfile}
            className="flex items-center gap-2"
          >
            <Heart className="w-4 h-4" />
            Match
          </Button>
          <Button
            onClick={() => setCurrentStep('matches')}
            variant={currentStep === 'matches' ? 'default' : 'ghost'}
            size="sm"
            disabled={!userProfile}
            className="flex items-center gap-2"
          >
            <Heart className="w-4 h-4 fill-current" />
            Matches
          </Button>
          <Button
            onClick={() => setCurrentStep('watchlist')}
            variant={currentStep === 'watchlist' ? 'default' : 'ghost'}
            size="sm"
            disabled={!userProfile}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Watchlist
          </Button>
          <Button
            onClick={() => setCurrentStep('analytics')}
            variant={currentStep === 'analytics' ? 'default' : 'ghost'}
            size="sm"
            disabled={!userProfile}
            className="flex items-center gap-2"
          >
            <BarChart className="w-4 h-4" />
            Analytics
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <NotificationSystem />
          <Button
            onClick={toggleDarkMode}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
          >
            <Moon className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  if (currentStep === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center shadow-xl dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Stock Matcher AI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Get personalized stock recommendations based on your profile, risk tolerance, and preferences.
            </p>
            <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
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
            <Button
              onClick={toggleDarkMode}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 dark:border-gray-600 dark:text-gray-300"
            >
              <Moon className="w-4 h-4" />
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 'profile') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <UserProfileForm 
          onComplete={handleProfileComplete} 
          existingProfile={userProfile || undefined}
          isUpdate={isUpdatingProfile}
        />
      </div>
    );
  }

  if (currentStep === 'matching') {
    return (
      <>
        <AppHeader />
        <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
          <StockMatcher userProfile={userProfile!} onReset={handleUpdateProfile} />
        </div>
      </>
    );
  }

  if (currentStep === 'matches') {
    return (
      <>
        <AppHeader />
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 p-4">
          <div className="max-w-6xl mx-auto pt-8">
            <Matches />
          </div>
        </div>
      </>
    );
  }

  if (currentStep === 'watchlist') {
    return (
      <>
        <AppHeader />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
          <div className="max-w-4xl mx-auto pt-8">
            <Watchlist />
          </div>
        </div>
      </>
    );
  }

  if (currentStep === 'analytics') {
    return (
      <>
        <AppHeader />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
          <div className="max-w-4xl mx-auto pt-8">
            <Analytics />
          </div>
        </div>
      </>
    );
  }

  return null;
};

const Index = () => {
  return (
    <AppProvider>
      <IndexContent />
    </AppProvider>
  );
};

export default Index;
