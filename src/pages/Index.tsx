
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import UserProfileForm from '@/components/UserProfileForm';
import StockMatcher from '@/components/StockMatcher';
import Watchlist from '@/components/Watchlist';
import Matches from '@/components/Matches';
import Analytics from '@/components/Analytics';
import Settings from '@/components/Settings';
import NotificationSystem from '@/components/NotificationSystem';
import ProtectedRoute from '@/components/ProtectedRoute';
import UserMenu from '@/components/UserMenu';
import StockDetailsModal from '@/components/StockDetailsModal';
import StockComparison from '@/components/StockComparison';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile, StockRecommendation } from '@/types/stock-matcher';
import { Moon, BarChart, Eye, Heart, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';

const IndexContent = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentStep, setCurrentStep] = useState<'welcome' | 'profile' | 'matching' | 'matches' | 'watchlist' | 'analytics' | 'settings'>('welcome');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [selectedStockForDetails, setSelectedStockForDetails] = useState<StockRecommendation | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const { isDarkMode, toggleDarkMode, addToWatchlist, passStock } = useApp();
  const { user, loading } = useAuth();

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

  const handleOpenSettings = () => {
    setCurrentStep('settings');
  };

  const handleBackFromSettings = () => {
    setCurrentStep(userProfile ? 'matching' : 'welcome');
  };

  const handleViewStockDetails = (stock: StockRecommendation) => {
    setSelectedStockForDetails(stock);
    setIsDetailsModalOpen(true);
  };

  const handleMatchFromModal = (stock: StockRecommendation) => {
    addToWatchlist(stock);
  };

  const handlePassFromModal = (stock: StockRecommendation) => {
    passStock(stock);
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show welcome screen for unauthenticated users
  if (!user) {
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
            <div className="space-y-3">
              <Link to="/auth">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105">
                  Get Started 🚀
                </Button>
              </Link>
              <Button
                onClick={toggleDarkMode}
                variant="outline"
                className="w-full flex items-center justify-center gap-2 dark:border-gray-600 dark:text-gray-300"
              >
                <Moon className="w-4 h-4" />
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Header for authenticated app navigation
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
          <StockComparison availableStocks={[]} />
          <NotificationSystem />
          <Button
            onClick={toggleDarkMode}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
          >
            <Moon className="w-4 h-4" />
          </Button>
          <UserMenu onOpenSettings={handleOpenSettings} />
        </div>
      </div>
    </div>
  );

  // Show profile setup for authenticated users without profile
  if (currentStep === 'welcome' || currentStep === 'profile') {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
          {currentStep === 'profile' && <AppHeader />}
          <div className="pt-8">
            <UserProfileForm 
              onComplete={handleProfileComplete} 
              existingProfile={userProfile || undefined}
              isUpdate={isUpdatingProfile}
            />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Show settings page
  if (currentStep === 'settings') {
    return (
      <ProtectedRoute>
        <Settings 
          onBack={handleBackFromSettings}
          userProfile={userProfile}
          onProfileUpdate={handleProfileComplete}
        />
      </ProtectedRoute>
    );
  }

  // Show main app sections for authenticated users with profile
  if (currentStep === 'matching') {
    return (
      <ProtectedRoute>
        <AppHeader />
        <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
          <StockMatcher 
            userProfile={userProfile!} 
            onReset={handleUpdateProfile}
            onViewDetails={handleViewStockDetails}
          />
        </div>
        <StockDetailsModal
          stock={selectedStockForDetails}
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          onMatch={handleMatchFromModal}
          onPass={handlePassFromModal}
        />
      </ProtectedRoute>
    );
  }

  if (currentStep === 'matches') {
    return (
      <ProtectedRoute>
        <AppHeader />
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 p-4">
          <div className="max-w-6xl mx-auto pt-8">
            <Matches onViewDetails={handleViewStockDetails} />
          </div>
        </div>
        <StockDetailsModal
          stock={selectedStockForDetails}
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          onMatch={handleMatchFromModal}
          onPass={handlePassFromModal}
        />
      </ProtectedRoute>
    );
  }

  if (currentStep === 'watchlist') {
    return (
      <ProtectedRoute>
        <AppHeader />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
          <div className="max-w-4xl mx-auto pt-8">
            <Watchlist onViewDetails={handleViewStockDetails} />
          </div>
        </div>
        <StockDetailsModal
          stock={selectedStockForDetails}
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          onMatch={handleMatchFromModal}
          onPass={handlePassFromModal}
        />
      </ProtectedRoute>
    );
  }

  if (currentStep === 'analytics') {
    return (
      <ProtectedRoute>
        <AppHeader />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
          <div className="max-w-4xl mx-auto pt-8">
            <Analytics />
          </div>
        </div>
      </ProtectedRoute>
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
