import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
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
import OnboardingTutorial from '@/components/OnboardingTutorial';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, StockRecommendation } from '@/types/stock-matcher';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { User as UserIcon, Heart as HeartIcon, Home } from 'lucide-react';
import { track } from '@/lib/analytics';

type MainStep = 'matching' | 'matches' | 'settings';

// Defined outside IndexContent so React sees a stable component type — prevents
// the nav bar from remounting (and flickering) on every parent re-render.
interface AppHeaderProps {
  currentStep: MainStep;
  onMatchTab: () => void;
  onLikesTab: () => void;
  onOpenSettings: () => void;
}
const AppHeader = ({ currentStep, onMatchTab, onLikesTab, onOpenSettings }: AppHeaderProps) => (
  <div className="bg-background/80 backdrop-blur-md border-b border-border px-4 pb-3 w-full sticky top-0 z-40" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}>
    <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-4">
      <div className="flex items-center gap-1">
        <span className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mr-3">
          StockMatch
        </span>
        <Button
          onClick={onMatchTab}
          variant={currentStep === 'matching' ? 'default' : 'ghost'}
          className={`flex items-center gap-2 px-5 py-2.5 min-h-[44px] text-sm rounded-xl ${currentStep === 'matching' ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-md shadow-primary/20' : ''}`}
        >
          <Heart className="w-4 h-4" />
          Match
        </Button>
        <Button
          onClick={onLikesTab}
          variant={currentStep === 'matches' ? 'default' : 'ghost'}
          className={`flex items-center gap-2 px-5 py-2.5 min-h-[44px] text-sm rounded-xl ${currentStep === 'matches' ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/20' : ''}`}
        >
          <Heart className="w-4 h-4 fill-current" />
          Likes
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <NotificationSystem />
        <UserMenu onOpenSettings={onOpenSettings} />
      </div>
    </div>
  </div>
);

interface BottomNavBarProps {
  currentStep: MainStep;
  onStepChange: (step: MainStep) => void;
  watchlistLength: number;
}
const BottomNavBar = ({ currentStep, onStepChange, watchlistLength }: BottomNavBarProps) => {
  const navItems = [
    { step: 'matching' as const, icon: Home, label: 'Match' },
    { step: 'matches' as const, icon: HeartIcon, label: 'Likes' },
    { step: 'settings' as const, icon: UserIcon, label: 'Profile' },
  ];
  return (
    <nav
      className="fixed bottom-0 left-0 w-full z-50 pb-safe-area-inset-bottom"
      style={{ fontFamily: 'SF Pro Text, SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif' }}
    >
      <div className="mx-3 mb-3 rounded-2xl bg-black/70 backdrop-blur-xl border border-white/10 shadow-2xl flex justify-around items-center py-2 px-2">
        {navItems.map(({ step, icon: Icon, label }) => {
          const active = currentStep === step;
          return (
            <button
              key={step}
              onClick={() => onStepChange(step)}
              className={`flex flex-col items-center min-h-[44px] min-w-[52px] justify-center rounded-xl transition-all duration-200 ${
                active ? 'bg-primary/20 text-primary scale-105' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 mb-0.5 ${active && step === 'matches' ? 'fill-current' : ''}`} />
                {step === 'matches' && watchlistLength > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-pink-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {watchlistLength > 99 ? '99+' : watchlistLength}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-semibold ${active ? 'text-primary' : ''}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

const IndexContent = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentStep, setCurrentStep] = useState<'welcome' | 'profile' | MainStep>('welcome');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [selectedStockForDetails, setSelectedStockForDetails] = useState<StockRecommendation | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  // Stores the advance callback provided by StockMatcher when a card's
  // "View Details" is tapped — used to advance the card from the modal.
  const advanceCardRef = useRef<((liked: boolean) => void) | null>(null);
  const { addToWatchlist, passStock, watchlist } = useApp();
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();

  // Check for existing user profile when user logs in
  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!user) {
        setIsLoadingProfile(false);
        setCurrentStep('welcome');
        setUserProfile(null);
        return;
      }

      setIsLoadingProfile(true);

      try {
        const { data: profileData, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Unexpected error fetching user profile:', error);
          setCurrentStep('profile');
          setIsLoadingProfile(false);
          return;
        }

        if (profileData) {
          const profile: UserProfile = {
            age: profileData.age || (profileData.age_range ? parseInt(profileData.age_range.split('-')[0]) : 25),
            gender: profileData.gender || 'prefer-not-to-say',
            salary: profileData.salary || (profileData.income_level ? parseInt(profileData.income_level.replace(/[^\d]/g, '')) : null),
            experience: profileData.investment_experience || 'beginner',
            riskTolerance: profileData.risk_tolerance || 'medium',
            sectorPreference: profileData.sectors_of_interest?.[0] || 'any',
            investmentGoal: profileData.investment_goals?.[0] || 'growth'
          };
          setUserProfile(profile);
          setCurrentStep('matching');
        } else {
          setCurrentStep('profile');
        }
      } catch (error) {
        console.error('Error checking user profile:', error);
        if (user) setCurrentStep('profile');
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
      toast.error('Please log in to save your profile');
      return;
    }

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
        age_range: `${profile.age}-${profile.age + 10}`,
        income_level: profile.salary?.toString() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('user_profiles')
        .upsert(profileData, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        console.error('Error saving user profile:', error);
        toast.error('Failed to save profile. Please try again.');
        return;
      }

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

  const handleOpenSettings = () => setCurrentStep('settings');

  const handleBackFromSettings = () => {
    setCurrentStep(userProfile ? 'matching' : 'welcome');
  };

  const handleViewStockDetails = (stock: StockRecommendation, advance?: (liked: boolean) => void) => {
    track('details_opened', { ticker: stock.ticker });
    setSelectedStockForDetails(stock);
    advanceCardRef.current = advance ?? null;
    setIsDetailsModalOpen(true);
  };

  // Delegate to StockMatcher's own handlers so the card advances and all
  // side-effects (watchlist add, toast, swipe recording) happen exactly once.
  const handleMatchFromModal = (_stock: StockRecommendation) => {
    advanceCardRef.current?.(true);
    advanceCardRef.current = null;
  };
  const handlePassFromModal = (_stock: StockRecommendation) => {
    advanceCardRef.current?.(false);
    advanceCardRef.current = null;
  };

  // Clear state when user signs out
  useEffect(() => {
    if (!user && !loading) resetApp();
  }, [user, loading]);

  if (loading || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Profile setup (welcome / profile step)
  if (currentStep === 'welcome' || currentStep === 'profile') {
    return (
      <ProtectedRoute>
        <div className={`min-h-screen w-full bg-gradient-to-br from-[#0f0a1e] via-[#130d2a] to-[#0a0614] overflow-auto ${currentStep === 'welcome' ? 'pt-[env(safe-area-inset-top)]' : ''}`}>
          {currentStep === 'profile' && (
            <AppHeader
              currentStep="matching"
              onMatchTab={() => setCurrentStep('matching')}
              onLikesTab={() => setCurrentStep('matches')}
              onOpenSettings={handleOpenSettings}
            />
          )}
          <UserProfileForm
            onComplete={handleProfileComplete}
            existingProfile={userProfile || undefined}
            isUpdate={isUpdatingProfile}
          />
        </div>
      </ProtectedRoute>
    );
  }

  // Settings — separate full-page render (matches/matching stay unmounted here,
  // which is fine: settings is visited infrequently)
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

  // Main app — both tabs are ALWAYS mounted so switching tabs never resets
  // StockMatcher's card position or triggers a fresh data fetch.
  const mainStep = currentStep as MainStep;

  return (
    <ProtectedRoute>
      {!isMobile && (
        <AppHeader
          currentStep={mainStep}
          onMatchTab={() => setCurrentStep('matching')}
          onLikesTab={() => setCurrentStep('matches')}
          onOpenSettings={handleOpenSettings}
        />
      )}

      {/* Matching tab — hidden but mounted when not active */}
      <div
        aria-hidden={currentStep !== 'matching'}
        style={{ display: currentStep === 'matching' ? 'flex' : 'none', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}
      >
        <StockMatcher
          userProfile={userProfile!}
          onReset={handleUpdateProfile}
          onViewDetails={handleViewStockDetails}
        />
      </div>

      {/* Matches tab — hidden but mounted when not active */}
      <div
        aria-hidden={currentStep !== 'matches'}
        style={{ display: currentStep === 'matches' ? 'block' : 'none' }}
      >
        <div className="min-h-[100dvh] w-full min-w-0 bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 px-4 overflow-auto pb-[max(env(safe-area-inset-bottom),6.5rem)]" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="w-full pt-4">
            <Matches onViewDetails={handleViewStockDetails} />
          </div>
        </div>
      </div>

      <StockDetailsModal
        stock={selectedStockForDetails}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onMatch={handleMatchFromModal}
        onPass={handlePassFromModal}
      />
      {isMobile && user && (
        <BottomNavBar
          currentStep={mainStep}
          onStepChange={(step) => setCurrentStep(step)}
          watchlistLength={watchlist.length}
        />
      )}
      <AIAssistantWidget />
      <OnboardingTutorial />
    </ProtectedRoute>
  );
};

const Index = () => (
  <AppProvider>
    <SubscriptionProvider>
      <IndexContent />
    </SubscriptionProvider>
  </AppProvider>
);

export default Index;
