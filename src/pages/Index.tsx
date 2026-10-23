import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import StockMatcher from '@/components/StockMatcher';
import Matches from '@/components/Matches';
import AIAssistantWidget from '@/components/AIAssistantWidget';
import Settings from '@/components/Settings';
import NotificationSystem from '@/components/NotificationSystem';
import ProtectedRoute from '@/components/ProtectedRoute';
import UserMenu from '@/components/UserMenu';
import StockDetailsModal from '@/components/StockDetailsModal';
import OnboardingFlow, { type OnboardingMode } from '@/components/onboarding/OnboardingFlow';
import SavePrompt, { FREE_LIKES_WITHOUT_ACCOUNT } from '@/components/SavePrompt';
import { AppProvider, DEVICE_WATCHLIST_KEY, useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';
import { StockRecommendation } from '@/types/stock-matcher';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { User as UserIcon, Heart as HeartIcon, Home } from 'lucide-react';
import { track } from '@/lib/analytics';
import { requestTrackingOnce } from '@/lib/att';
import {
  clearAnswers, isComplete, loadAnswers, profileToAnswers, toProfileRow, type OnboardingAnswers,
} from '@/lib/onboarding';
import { clearDeviceFeed, importDeviceSwipes, loadDeviceFeed } from '@/lib/matchFeed';

type MainStep = 'matching' | 'matches' | 'settings';
// What the screen shows: deciding, onboarding questions, or the app itself
type Gate = 'loading' | 'onboarding' | 'app';

// Defined outside IndexContent so React sees a stable component type — prevents
// the nav bar from remounting (and flickering) on every parent re-render.
interface AppHeaderProps {
  currentStep: MainStep;
  signedIn: boolean;
  onMatchTab: () => void;
  onLikesTab: () => void;
  onOpenSettings: () => void;
  onSaveMatches: () => void;
}
const AppHeader = ({ currentStep, signedIn, onMatchTab, onLikesTab, onOpenSettings, onSaveMatches }: AppHeaderProps) => (
  <div className="bg-cream/85 backdrop-blur-md border-b border-line px-4 pb-3 w-full sticky top-0 z-40" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}>
    <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-4">
      <div className="flex items-center gap-1">
        <span className="text-lg font-bold text-ink mr-3">
          Stock<span className="text-primary">Match</span>
        </span>
        <Button
          onClick={onMatchTab}
          variant={currentStep === 'matching' ? 'default' : 'ghost'}
          className={`flex items-center gap-2 px-5 py-2.5 min-h-[44px] text-sm rounded-xl ${currentStep === 'matching' ? 'bg-primary text-white shadow-md shadow-[#B54A22]/20' : 'text-ink-soft'}`}
        >
          <Heart className="w-4 h-4" />
          Match
        </Button>
        <Button
          onClick={onLikesTab}
          variant={currentStep === 'matches' ? 'default' : 'ghost'}
          className={`flex items-center gap-2 px-5 py-2.5 min-h-[44px] text-sm rounded-xl ${currentStep === 'matches' ? 'bg-primary text-white shadow-md shadow-[#B54A22]/20' : 'text-ink-soft'}`}
        >
          <Heart className="w-4 h-4 fill-current" />
          Likes
        </Button>
      </div>
      <div className="flex items-center gap-3">
        {signedIn ? (
          <>
            <NotificationSystem />
            <UserMenu onOpenSettings={onOpenSettings} />
          </>
        ) : (
          <Button onClick={onSaveMatches} className="min-h-[44px] rounded-xl">Save my matches</Button>
        )}
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
      <div className="mx-3 mb-3 rounded-2xl bg-white/90 backdrop-blur-xl border border-line shadow-[0_8px_30px_rgba(60,40,20,0.12)] flex justify-around items-center py-2 px-2">
        {navItems.map(({ step, icon: Icon, label }) => {
          const active = currentStep === step;
          return (
            <button
              key={step}
              onClick={() => onStepChange(step)}
              className={`flex flex-col items-center min-h-[44px] min-w-[52px] justify-center rounded-xl transition-all duration-200 ${
                active ? 'bg-clay-tint text-primary scale-105' : 'text-ink-faint hover:text-ink'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 mb-0.5 ${active && step === 'matches' ? 'fill-current' : ''}`} />
                {step === 'matches' && watchlistLength > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
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

// Device swipes made before sign-in: keep those companies out of the account's next decks and
// move the likes to the account. The device copy is cleared only once the server has them.
async function syncDeviceSwipes(): Promise<boolean> {
  const device = loadDeviceFeed();
  if (device.liked.length === 0 && device.passed.length === 0) {
    clearDeviceFeed();
    return true;
  }
  try {
    await importDeviceSwipes(device.liked, device.passed);
    clearDeviceFeed();
    try { localStorage.removeItem(DEVICE_WATCHLIST_KEY); } catch { /* storage blocked */ }
    return true;
  } catch (error) {
    console.error('[Index] could not move device swipes to the account:', error);
    return false;
  }
}

const IndexContent = () => {
  const { user, loading } = useAuth();
  const { watchlist, reloadWatchlist } = useApp();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [gate, setGate] = useState<Gate>('loading');
  const [onboardingMode, setOnboardingMode] = useState<OnboardingMode>('new');
  const [answers, setAnswers] = useState<OnboardingAnswers | null>(null);
  const [currentStep, setCurrentStep] = useState<MainStep>('matching');
  const [causesVersion, setCausesVersion] = useState(0);
  const [savePromptOpen, setSavePromptOpen] = useState(false);
  const [deviceLikes, setDeviceLikes] = useState(() => loadDeviceFeed().liked.length);
  const [selectedStockForDetails, setSelectedStockForDetails] = useState<StockRecommendation | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  // Stores the advance callback provided by StockMatcher when a card's
  // "View Details" is tapped — used to advance the card from the modal.
  const advanceCardRef = useRef<((liked: boolean) => void) | null>(null);

  const saveProfile = async (next: OnboardingAnswers) => {
    if (!user) return false;
    const { error } = await supabase.from('user_profiles').upsert(toProfileRow(next, user.id), { onConflict: 'user_id' });
    if (error) {
      console.error('Error saving profile:', error);
      toast.error("We couldn't save your answers. Please try again.");
      return false;
    }
    return true;
  };

  // Decide what to show whenever sign-in state settles
  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    (async () => {
      const local = loadAnswers();
      if (!user) {
        setAnswers(local);
        setDeviceLikes(loadDeviceFeed().liked.length);
        if (isComplete(local)) {
          setGate('app');
        } else {
          setOnboardingMode('new');
          setGate('onboarding');
        }
        return;
      }

      setGate('loading');
      const { data: profile, error } = await supabase.from('user_profiles').select('*').eq('user_id', user.id).maybeSingle();
      if (cancelled) return;
      if (error) console.error('Unexpected error fetching user profile:', error);

      // Just signed in after onboarding on this device: the answers and swipes move to the account
      if (isComplete(local)) {
        if (await saveProfile(local)) {
          clearAnswers();
          track('profile_complete', { version: 2, source: 'device_onboarding' });
        }
        await syncDeviceSwipes();
        await reloadWatchlist();
        if (cancelled) return;
        setAnswers(local);
        setGate('app');
        return;
      }

      await syncDeviceSwipes(); // retries a sync that failed last time, if any
      const fromProfile = profile ? profileToAnswers(profile) : null;
      if (fromProfile && fromProfile.causes.length > 0) {
        setAnswers(fromProfile);
        setGate('app');
      } else if (profile) {
        // An account from before values matching: ask for causes once
        setAnswers(fromProfile);
        setOnboardingMode('causes_only');
        setGate('onboarding');
      } else {
        setAnswers(null);
        setOnboardingMode('new_signed_in');
        setGate('onboarding');
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tracking permission comes after onboarding (a no-op once asked)
  useEffect(() => {
    if (gate === 'app') requestTrackingOnce();
  }, [gate]);

  // Back to the deck when someone signs out from any tab
  useEffect(() => {
    if (!user && !loading) {
      setCurrentStep('matching');
      setIsDetailsModalOpen(false);
      setSelectedStockForDetails(null);
    }
  }, [user, loading]);

  const handleOnboardingComplete = async (final: OnboardingAnswers) => {
    if (onboardingMode === 'new') {
      setAnswers(final); // already on the device; saved to the account at sign-in
      setCurrentStep('matching');
      setGate('app');
      return;
    }
    const merged = onboardingMode === 'causes_only' && answers
      ? { ...answers, causes: final.causes, dealbreakers: final.dealbreakers }
      : final;
    if (!(await saveProfile(merged))) return;
    if (onboardingMode === 'causes_only') {
      track('causes_updated', { source: 'existing_user', causes: merged.causes });
    } else {
      track('profile_complete', { version: 2, source: 'signed_in_onboarding' });
    }
    setAnswers(merged);
    setCurrentStep('matching');
    setGate('app');
  };

  const handleCausesSaved = (next: OnboardingAnswers) => {
    setAnswers(next);
    setCausesVersion(v => v + 1);
  };

  const openSavePrompt = () => setSavePromptOpen(true);

  // Signed out: offer to save after the first like, and again (required to keep them) at the third
  const handleLikedOnDevice = (likes: number) => {
    setDeviceLikes(likes);
    const prompt = likes === 1 || likes === FREE_LIKES_WITHOUT_ACCOUNT;
    if (prompt) setSavePromptOpen(true);
    return prompt;
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

  const goToStep = (step: MainStep) => {
    // Signed out, the Profile tab is where you save your matches
    if (step === 'settings' && !user) {
      openSavePrompt();
      return;
    }
    setCurrentStep(step);
  };

  if (loading || gate === 'loading') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary" />
      </div>
    );
  }

  if (gate === 'onboarding') {
    return (
      <OnboardingFlow
        key={onboardingMode}
        mode={onboardingMode}
        initial={onboardingMode === 'new' ? loadAnswers() : answers}
        onComplete={handleOnboardingComplete}
        onSignIn={() => navigate('/auth?mode=signin')}
      />
    );
  }

  const myAnswers = answers!;

  if (currentStep === 'settings') {
    return (
      <ProtectedRoute>
        <Settings
          onBack={() => setCurrentStep('matching')}
          answers={myAnswers}
          onCausesSaved={handleCausesSaved}
        />
      </ProtectedRoute>
    );
  }

  // Main app — both tabs are ALWAYS mounted so switching tabs never resets
  // StockMatcher's card position or triggers a fresh data fetch.
  const signedIn = !!user;
  return (
    <>
      {!isMobile && (
        <AppHeader
          currentStep={currentStep}
          signedIn={signedIn}
          onMatchTab={() => setCurrentStep('matching')}
          onLikesTab={() => setCurrentStep('matches')}
          onOpenSettings={() => setCurrentStep('settings')}
          onSaveMatches={openSavePrompt}
        />
      )}

      {/* Matching tab — hidden but mounted when not active */}
      <div
        aria-hidden={currentStep !== 'matching'}
        style={{ display: currentStep === 'matching' ? 'flex' : 'none', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}
      >
        <StockMatcher
          answers={myAnswers}
          signedIn={signedIn}
          causesVersion={causesVersion}
          onEditCauses={() => (signedIn ? setCurrentStep('settings') : openSavePrompt())}
          onNeedsCauses={() => { setOnboardingMode('causes_only'); setGate('onboarding'); }}
          onLikedOnDevice={handleLikedOnDevice}
          onSaveMatches={openSavePrompt}
          onViewDetails={handleViewStockDetails}
        />
      </div>

      {/* Matches tab — hidden but mounted when not active */}
      <div
        aria-hidden={currentStep !== 'matches'}
        style={{ display: currentStep === 'matches' ? 'block' : 'none' }}
      >
        <div className="min-h-[100dvh] w-full min-w-0 bg-cream px-4 overflow-auto pb-[max(env(safe-area-inset-bottom),6.5rem)]" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="w-full pt-4">
            <Matches onViewDetails={handleViewStockDetails} signedIn={signedIn} onSaveMatches={openSavePrompt} />
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
      {isMobile && (
        <BottomNavBar
          currentStep={currentStep}
          onStepChange={goToStep}
          watchlistLength={watchlist.length}
        />
      )}
      {signedIn && <AIAssistantWidget />}
      {!signedIn && <SavePrompt open={savePromptOpen} likes={deviceLikes} onClose={() => setSavePromptOpen(false)} />}
    </>
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
