import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigate } from 'react-router-dom';
import UserProfileForm from '@/components/UserProfileForm';
import StockMatcher from '@/components/StockMatcher';
import Matches from '@/components/Matches';
import AIAssistantWidget from '@/components/AIAssistantWidget';
import Settings from '@/components/Settings';
import NotificationSystem from '@/components/NotificationSystem';
import ProtectedRoute from '@/components/ProtectedRoute';
import UserMenu from '@/components/UserMenu';
import StockDetailsModal from '@/components/StockDetailsModal';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { SubscriptionProvider, useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, StockRecommendation } from '@/types/stock-matcher';
import { Heart, Sparkles, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { User as UserIcon, Heart as HeartIcon, Home } from 'lucide-react';

const IndexContent = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentStep, setCurrentStep] = useState<'welcome' | 'profile' | 'matching' | 'matches' | 'settings'>('welcome');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [selectedStockForDetails, setSelectedStockForDetails] = useState<StockRecommendation | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const { isDarkMode, toggleDarkMode, addToWatchlist, passStock } = useApp();
  const { user, loading } = useAuth();
  const { subscribed } = useSubscription();
  const isMobile = useIsMobile();

  // Check for existing user profile when user logs in
  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!user) {
        setIsLoadingProfile(false);
        setCurrentStep('welcome');
        setUserProfile(null); // Clear profile when no user
        return;
      }
      
      console.log('Checking profile for user:', user.id);
      setIsLoadingProfile(true);
      
      try {
        const { data: profileData, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        console.log('Profile query result:', { profileData, error });

        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "no rows returned" - that's expected for new users
          console.error('Unexpected error fetching user profile:', error);
          setCurrentStep('profile');
          setIsLoadingProfile(false);
          return;
        }

        if (profileData) {
          console.log('Found existing profile, converting to UserProfile format:', profileData);
          console.log('Database fields available:', Object.keys(profileData));
          
          // Convert database format to UserProfile format using actual stored values
          const profile: UserProfile = {
            age: profileData.age || (profileData.age_range ? parseInt(profileData.age_range.split('-')[0]) : 25),
            gender: profileData.gender || 'prefer-not-to-say',
            salary: profileData.salary || (profileData.income_level ? parseInt(profileData.income_level.replace(/[^\d]/g, '')) : null),
            experience: profileData.investment_experience || 'beginner',
            riskTolerance: profileData.risk_tolerance || 'medium',
            sectorPreference: profileData.sectors_of_interest?.[0] || 'any',
            investmentGoal: profileData.investment_goals?.[0] || 'growth'
          };
          
          console.log('Converted profile from database:', profile);
          setUserProfile(profile);
          setCurrentStep('matching');
        } else {
          console.log('No profile found for user, showing profile form');
          setCurrentStep('profile');
        }
      } catch (error) {
        console.error('Error checking user profile:', error);
        // Only show profile form if we have a user, otherwise stay on welcome
        if (user) {
          setCurrentStep('profile');
        }
      } finally {
        setIsLoadingProfile(false);
      }
    };

    if (!loading) {
      checkExistingProfile();
    }
  }, [user, loading]);

  const handleProfileComplete = async (profile: UserProfile) => {
    if (!user) {
      console.error('No user found when trying to save profile');
      toast.error('Please log in to save your profile');
      return;
    }

    console.log('Saving profile for user:', user.id, profile);

    try {
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

      console.log('Profile data to save:', profileData);

      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(profileData, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving user profile:', error);
        toast.error('Failed to save profile. Please try again.');
        return;
      }

      console.log('Profile saved successfully:', data);
      toast.success('Profile saved successfully!');
      
      setUserProfile(profile);
      setCurrentStep('matching');
      setIsUpdatingProfile(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile. Please try again.');
    }
  };

  const resetApp = () => {
    setUserProfile(null);
    setCurrentStep('welcome');
    setIsUpdatingProfile(false);
    setSelectedStockForDetails(null);
    setIsDetailsModalOpen(false);
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

  // Clear state when user signs out
  useEffect(() => {
    if (!user && !loading) {
      resetApp();
    }
  }, [user, loading]);

  // Show loading while checking authentication or profile
  if (loading || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirect unauthenticated users straight into the onboarding flow
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Header for authenticated app navigation (desktop)
  const AppHeader = () => (
    <div className="bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 w-full pt-[env(safe-area-inset-top)] sticky top-0 z-40">
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          <span className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mr-3">
            StockMatch
          </span>
          <Button
            onClick={() => setCurrentStep('matching')}
            variant={currentStep === 'matching' ? 'default' : 'ghost'}
            className={`flex items-center gap-2 px-5 py-2.5 min-h-[44px] text-sm rounded-xl ${currentStep === 'matching' ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-md shadow-primary/20' : ''}`}
          >
            <Heart className="w-4 h-4" />
            Match
          </Button>
          <Button
            onClick={() => setCurrentStep('matches')}
            variant={currentStep === 'matches' ? 'default' : 'ghost'}
            className={`flex items-center gap-2 px-5 py-2.5 min-h-[44px] text-sm rounded-xl ${currentStep === 'matches' ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/20' : ''}`}
          >
            <Heart className="w-4 h-4 fill-current" />
            Likes
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <NotificationSystem />
          <UserMenu onOpenSettings={handleOpenSettings} />
        </div>
      </div>
    </div>
  );

  // Bottom navigation bar for mobile
  const BottomNavBar = () => {
    const navItems = [
      { step: 'matching' as const, icon: Home, label: 'Match' },
      { step: 'matches' as const, icon: HeartIcon, label: 'Likes' },
      { step: 'settings' as const, icon: UserIcon, label: 'Profile' },
    ];
    return (
      <nav className="fixed bottom-0 left-0 w-full z-50 pb-safe-area-inset-bottom"
        style={{ fontFamily: 'SF Pro Text, SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif' }}>
        <div className="mx-3 mb-3 rounded-2xl bg-black/70 backdrop-blur-xl border border-white/10 shadow-2xl flex justify-around items-center py-2 px-2">
          {navItems.map(({ step, icon: Icon, label }) => {
            const active = currentStep === step;
            return (
              <button key={step} onClick={() => setCurrentStep(step)}
                className={`flex flex-col items-center min-h-[44px] min-w-[52px] justify-center rounded-xl transition-all duration-200 ${
                  active ? 'bg-primary/20 text-primary scale-105' : 'text-white/40 hover:text-white/70'
                }`}>
                <Icon className={`w-5 h-5 mb-0.5 ${active && step === 'matches' ? 'fill-current' : ''}`} />
                <span className={`text-[10px] font-semibold ${active ? 'text-primary' : ''}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  };

  // Show profile setup for authenticated users without profile
  if (currentStep === 'welcome' || currentStep === 'profile') {
    return (
      <ProtectedRoute>
        <div className="min-h-screen w-full bg-gradient-to-br from-[#0f0a1e] via-[#130d2a] to-[#0a0614] pt-[env(safe-area-inset-top)] overflow-auto">
          {currentStep === 'profile' && <AppHeader />}
          <UserProfileForm
            onComplete={handleProfileComplete}
            existingProfile={userProfile || undefined}
            isUpdate={isUpdatingProfile}
          />
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
        {!isMobile && <AppHeader />}
        <div className="min-h-screen w-full bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 pt-[env(safe-area-inset-top)] overflow-auto pb-24 md:pb-4">
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
        {isMobile && user && <BottomNavBar />}
        <AIAssistantWidget />
      </ProtectedRoute>
    );
  }

  if (currentStep === 'matches') {
    return (
      <ProtectedRoute>
        {!isMobile && <AppHeader />}
        <div className={`min-h-screen w-full min-w-0 bg-gradient-to-br from-[#0f0a1e] via-[#130d2a] to-[#0a0614] dark:from-[#0f0a1e] dark:via-[#130d2a] dark:to-[#0a0614] px-4 pt-[env(safe-area-inset-top)] overflow-auto ${isMobile ? 'pb-28' : 'pb-4'}`}>
          <div className="w-full pt-4">
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
        {isMobile && user && <BottomNavBar />}
        <AIAssistantWidget />
      </ProtectedRoute>
    );
  }

  return null;
};

const Index = () => {
  return (
    <AppProvider>
      <SubscriptionProvider>
        <IndexContent />
      </SubscriptionProvider>
    </AppProvider>
  );
};

export default Index;
