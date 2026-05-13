import { useState, useEffect, useRef } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Button } from '@/components/ui/button';
import { UserProfile, StockRecommendation } from '@/types/stock-matcher';
import TinderStockCard from '@/components/TinderStockCard';
import { generateStockRecommendations } from '@/utils/stockMatcher';
import { useApp } from '@/contexts/AppContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { recordSwipe } from '@/utils/recentlySwipedService';
import UpgradeModal from '@/components/UpgradeModal';
import MatchOverlay from '@/components/MatchOverlay';
import { calculateCompatibilityScore, isHighCompatibilityMatch } from '@/utils/stockCompatibility';
import { Heart, X, RotateCcw, TrendingUp, Plus, Crown, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

interface StockMatcherProps {
  userProfile: UserProfile;
  onReset: () => void;
  // advance(liked) is called by the details modal when the user taps
  // "Add to Watchlist" (liked=true) or "Pass" (liked=false), so the
  // card advances without requiring a second swipe gesture.
  onViewDetails?: (stock: StockRecommendation, advance: (liked: boolean) => void) => void;
}

const StockMatcher = ({ userProfile, onReset, onViewDetails }: StockMatcherProps) => {
  const [allRecommendations, setAllRecommendations] = useState<StockRecommendation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<StockRecommendation[]>([]);
  const [passes, setPasses] = useState<StockRecommendation[]>([]);
  const [animatingCard, setAnimatingCard] = useState(false);
  const [seenStockTickers, setSeenStockTickers] = useState<Set<string>>(new Set());
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [matchOverlayStock, setMatchOverlayStock] = useState<StockRecommendation | null>(null);
  const [matchOverlayScore, setMatchOverlayScore] = useState(0);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [hasSwipedOnce, setHasSwipedOnce] = useState(false);
  const swipeCountRef = useRef(0);
  // Refs to the latest match/pass handlers — keeps the view-details advance
  // callback from going stale across re-renders.
  const handleMatchRef = useRef<() => void>(() => {});
  const handlePassRef  = useRef<() => void>(() => {});

  const { addToWatchlist, isInWatchlist, updateSwipeStats } = useApp();
  const { canSwipe, incrementSwipeCount, dailySwipesUsed, dailySwipeLimit, subscribed } = useSubscription();
  const { user } = useAuth();

  // Auto-hide swipe hint after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowSwipeHint(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Pre-load all recommendations once
  useEffect(() => {
    const loadAllRecommendations = async () => {
      setLoading(true);
      console.log('StockMatcher: Loading recommendations for profile:', userProfile);
      
      const stocks = await generateStockRecommendations(userProfile, []);
      
      // Filter out any stocks with "Unknown Company" or missing data
      const validStocks = stocks.filter(stock => {
        if (!stock.companyName || stock.companyName.trim() === '' || stock.companyName === 'Unknown Company') {
          console.log(`Filtering out stock with invalid company name: ${stock.ticker} - "${stock.companyName}"`);
          return false;
        }
        if (!stock.ticker || stock.ticker.trim() === '') {
          console.log(`Filtering out stock with invalid ticker: ${stock.companyName}`);
          return false;
        }
        return true;
      });
      
      console.log(`Filtered ${stocks.length} stocks to ${validStocks.length} valid stocks`);
      
      // Add staggered entrance animation
      setTimeout(() => {
        setAllRecommendations(validStocks);
        setLoading(false);
      }, 300);
    };
    
    loadAllRecommendations();
  }, [userProfile]);

  const handleMatch = async () => {
    console.log('handleMatch called', { animatingCard, currentIndex, allRecommendationsLength: allRecommendations.length, canSwipe, dailySwipesUsed, dailySwipeLimit });
    
    if (animatingCard || currentIndex >= allRecommendations.length) {
      console.log('Returning early due to animation or no more cards');
      return;
    }
    
    // Check swipe limit
    if (!canSwipe) {
      console.log('User hit swipe limit, showing upgrade modal');
      setShowUpgradeModal(true);
      return;
    }
    
    setAnimatingCard(true);
    if (!hasSwipedOnce) setHasSwipedOnce(true);
    const currentStock = allRecommendations[currentIndex];
    
    // Increment swipe count for free users
    await incrementSwipeCount();
    
    // Record swipe to backend (for 24-hour cooldown)
    if (user) {
      const stockData = {
        ticker: currentStock.ticker,
        companyName: currentStock.companyName,
        sector: currentStock.sector,
        pricePerShare: currentStock.pricePerShare,
        oneYearReturn: currentStock.oneYearReturn
      } as Json;
      await recordSwipe(user.id, currentStock.ticker, currentStock.companyName, true, stockData, currentStock.whyItFits);
    }
    
    // Add to seen stocks
    setSeenStockTickers(prev => new Set(prev).add(currentStock.ticker));
    setMatches(prev => [...prev, currentStock]);
    
    // Add to watchlist if not already there
    if (!isInWatchlist(currentStock.ticker)) {
      addToWatchlist(currentStock);
    }
    
    // Update swipe statistics
    updateSwipeStats(true);
    
    // Check if this is a high-compatibility match
    const score = calculateCompatibilityScore(currentStock, userProfile);
    if (isHighCompatibilityMatch(currentStock, userProfile)) {
      setMatchOverlayStock(currentStock);
      setMatchOverlayScore(score);
    } else {
      toast(`👍 ${currentStock.ticker} liked`, {
        description: `${currentStock.companyName} added to watchlist`,
        duration: 2000,
      });
    }

    swipeCountRef.current += 1;

    console.log(`Matched ${currentStock.ticker} (compatibility: ${score}%), adding to seen stocks`);
    
    // Delay to allow exit animation
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setAnimatingCard(false);
    }, 400);
  };

  const handlePass = async () => {
    console.log('handlePass called', { animatingCard, currentIndex, allRecommendationsLength: allRecommendations.length, canSwipe, dailySwipesUsed, dailySwipeLimit });
    
    if (animatingCard || currentIndex >= allRecommendations.length) {
      console.log('Returning early due to animation or no more cards');
      return;
    }
    
    // Check swipe limit
    if (!canSwipe) {
      console.log('User hit swipe limit, showing upgrade modal');
      setShowUpgradeModal(true);
      return;
    }
    
    setAnimatingCard(true);
    if (!hasSwipedOnce) setHasSwipedOnce(true);
    const currentStock = allRecommendations[currentIndex];
    
    // Increment swipe count for free users
    await incrementSwipeCount();
    
    // Record swipe to backend (for 24-hour cooldown)
    if (user) {
      const stockData = {
        ticker: currentStock.ticker,
        companyName: currentStock.companyName,
        sector: currentStock.sector,
        pricePerShare: currentStock.pricePerShare,
        oneYearReturn: currentStock.oneYearReturn
      } as Json;
      await recordSwipe(user.id, currentStock.ticker, currentStock.companyName, false, stockData);
    }
    
    // Add to seen stocks
    setSeenStockTickers(prev => new Set(prev).add(currentStock.ticker));
    setPasses(prev => [...prev, currentStock]);
    
    // Update swipe statistics
    updateSwipeStats(false);
    
    swipeCountRef.current += 1;

    console.log(`Passed ${currentStock.ticker}, adding to seen stocks`);
    
    // Delay to allow exit animation
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setAnimatingCard(false);
    }, 400);
  };

  // Keep refs pointing at the latest closures
  useEffect(() => { handleMatchRef.current = handleMatch; });
  useEffect(() => { handlePassRef.current  = handlePass;  });

  const handleUndo = () => {
    if (currentIndex === 0 || animatingCard) return;
    
    const previousIndex = currentIndex - 1;
    const previousStock = allRecommendations[previousIndex];
    
    // Remove from seen stocks
    setSeenStockTickers(prev => {
      const newSet = new Set(prev);
      newSet.delete(previousStock.ticker);
      return newSet;
    });
    
    // Remove from matches or passes
    setMatches(prev => prev.filter(stock => stock.ticker !== previousStock.ticker));
    setPasses(prev => prev.filter(stock => stock.ticker !== previousStock.ticker));
    
    console.log(`Undoing ${previousStock.ticker}, removing from seen stocks`);
    
    setCurrentIndex(previousIndex);
  };

  const loadMoreRecommendations = async (relaxed: boolean = false) => {
    setLoading(true);
    
    // Keep all seen stock tickers for exclusion
    const exclusionsArray = Array.from(seenStockTickers);
    console.log(`Loading more recommendations, excluding ${exclusionsArray.length} seen stocks, relaxed: ${relaxed}`);
    
    // Load fresh recommendations excluding all previously seen stocks
    const newStocks = await generateStockRecommendations(userProfile, exclusionsArray, relaxed);
    
    // Filter out invalid stocks
    const validStocks = newStocks.filter(stock => {
      if (!stock.companyName || stock.companyName.trim() === '' || stock.companyName === 'Unknown Company') {
        console.log(`Filtering out stock with invalid company name: ${stock.ticker} - "${stock.companyName}"`);
        return false;
      }
      return true;
    });
    
    // If no stocks found with current exclusions, try with relaxed filters
    if (validStocks.length === 0 && !relaxed) {
      console.log('No stocks found, retrying with relaxed filters...');
      return loadMoreRecommendations(true);
    }
    
    // If still no stocks even with relaxed filters, reset seen stocks and try again
    if (validStocks.length === 0 && relaxed) {
      console.log('No stocks even with relaxed filters, resetting seen stocks...');
      setSeenStockTickers(new Set());
      const freshStocks = await generateStockRecommendations(userProfile, [], false);
      const freshValid = freshStocks.filter(stock => 
        stock.companyName && stock.companyName.trim() !== '' && stock.companyName !== 'Unknown Company'
      );
      setTimeout(() => {
        setAllRecommendations(freshValid);
        setCurrentIndex(0);
        setLoading(false);
        if (freshValid.length > 0) {
          toast('Fresh recommendations loaded!', { description: 'We\'ve refreshed your stock pool.' });
        }
      }, 300);
      return;
    }
    
    setTimeout(() => {
      setAllRecommendations(validStocks);
      setCurrentIndex(0);
      setLoading(false);
      if (relaxed) {
        toast('More stocks found!', { description: 'We expanded the filters to find you more matches.' });
      }
    }, 300);
  };

  // Auto-reload when stocks run out
  useEffect(() => {
    if (!loading && allRecommendations.length > 0 && currentIndex >= allRecommendations.length) {
      console.log('Auto-reloading: user has swiped through all recommendations');
      loadMoreRecommendations(false);
    }
  }, [currentIndex, allRecommendations.length, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative animate-pulse">
            <div className="animate-spin w-16 h-16 border-4 border-white/30 border-t-white rounded-full mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white animate-bounce" />
            </div>
          </div>
          <div className="text-white space-y-2 animate-fade-in">
            <h2 className="text-2xl font-bold">Finding Your Perfect Matches</h2>
            <p className="text-pink-100">Analyzing market data and your preferences...</p>
            <div className="flex justify-center space-x-1 mt-4">
              <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isFinished = currentIndex >= allRecommendations.length;

  if (isFinished) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 p-4 animate-fade-in">
        <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto pt-8">
          <div className="text-center mb-8 animate-scale-in">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Heart className="w-10 h-10 text-white fill-current" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">All Done! 🎉</h1>
            <p className="text-white/80">You've reviewed all available recommendations</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 dark:bg-gray-800/50 animate-fade-in delay-200 border border-white/20">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-green-500/20 rounded-xl p-4 transform hover:scale-105 transition-all duration-200">
                <Heart className="w-8 h-8 text-green-300 mx-auto mb-2 fill-current animate-pulse" />
                <div className="text-2xl font-bold text-white">{matches.length}</div>
                <div className="text-green-200 text-sm">Matches</div>
              </div>
              <div className="bg-red-500/20 rounded-xl p-4 transform hover:scale-105 transition-all duration-200">
                <X className="w-8 h-8 text-red-300 mx-auto mb-2 animate-pulse" />
                <div className="text-2xl font-bold text-white">{passes.length}</div>
                <div className="text-red-200 text-sm">Passes</div>
              </div>
            </div>
          </div>

          {matches.length > 0 && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 dark:bg-gray-800/50 animate-fade-in delay-300 border border-white/20">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 fill-current animate-pulse" />
                Your Matches (Added to Watchlist)
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {matches.map((stock, index) => (
                  <div key={index} className="bg-white/10 rounded-lg p-3 transform hover:scale-[1.02] transition-all duration-200 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-white font-medium">{stock.ticker}</div>
                        <div className="text-white/70 text-sm">{stock.companyName}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-300 font-semibold">
                          {stock.oneYearReturn > 0 ? '+' : ''}{stock.oneYearReturn.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3 animate-fade-in delay-400">
            <Button 
              onClick={() => loadMoreRecommendations(false)}
              className="w-full bg-white/20 hover:bg-white/30 text-white border-0 h-12 rounded-xl backdrop-blur-lg transform hover:scale-105 transition-all duration-200"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Get More Recommendations
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate visible cards for stacking effect
  const visibleCards = allRecommendations.slice(currentIndex, currentIndex + 3);
  const currentStock = allRecommendations[currentIndex];

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl mx-auto flex flex-col flex-1 min-h-0 px-4 lg:px-2">
        {/* Header with profile chips */}
        <div className="text-center mb-2 pt-3 flex-shrink-0 animate-fade-in">
          <h1 className="hidden sm:block text-xl sm:text-2xl font-bold text-white mb-3">
            Stock Matcher 💕
          </h1>
          <TooltipProvider>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Avatar className="w-7 h-7 border-2 border-white/30">
                <AvatarFallback className="bg-white/20 text-white text-xs font-bold">
                  {user?.email?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={onReset}>
                    <Badge className="bg-blue-500/30 text-white border-blue-300/40 hover:bg-blue-500/50 cursor-pointer transition-colors text-xs">
                      {userProfile.age}yo
                    </Badge>
                  </button>
                </TooltipTrigger>
                <TooltipContent>Tap to update your profile</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={onReset}>
                    <Badge className={`border-white/30 hover:opacity-80 cursor-pointer transition-colors text-xs ${
                      userProfile.riskTolerance === 'high' ? 'bg-red-500/30 text-white border-red-300/40' :
                      userProfile.riskTolerance === 'medium' ? 'bg-yellow-500/30 text-white border-yellow-300/40' :
                      'bg-green-500/30 text-white border-green-300/40'
                    }`}>
                      {userProfile.riskTolerance} risk
                    </Badge>
                  </button>
                </TooltipTrigger>
                <TooltipContent>Tap to update your profile</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={onReset}>
                    <Badge className="bg-purple-500/30 text-white border-purple-300/40 hover:bg-purple-500/50 cursor-pointer transition-colors text-xs">
                      {userProfile.sectorPreference}
                    </Badge>
                  </button>
                </TooltipTrigger>
                <TooltipContent>Tap to update your profile</TooltipContent>
              </Tooltip>
              {userProfile.investmentGoal && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={onReset}>
                      <Badge className="bg-emerald-500/30 text-white border-emerald-300/40 hover:bg-emerald-500/50 cursor-pointer transition-colors text-xs">
                        {userProfile.investmentGoal}
                      </Badge>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Tap to update your profile</TooltipContent>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>
        </div>


        {/* Card counter removed - tracking still happens in backend */}

        {/* Stock Cards Stack */}
        {allRecommendations.length > 0 && currentStock && (
          <div className="flex-1 min-h-0 relative mb-2 animate-fade-in delay-300">
            {/* Swipe direction chevrons */}
            {!hasSwipedOnce && (
              <>
                <div className="absolute left-2 top-1/2 -translate-y-1/2 z-20 opacity-30 animate-bounce pointer-events-none">
                  <ChevronLeft className="w-8 h-8 text-white" />
                </div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 opacity-30 animate-bounce pointer-events-none">
                  <ChevronRight className="w-8 h-8 text-white" />
                </div>
              </>
            )}
            {visibleCards.map((stock, stackIndex) => {
              const cardIndex = currentIndex + stackIndex;
              const isActiveCard = stackIndex === 0;
              const scale = 1 - stackIndex * 0.05;
              const zIndex = visibleCards.length - stackIndex;
              
              return (
                <TinderStockCard 
                  key={`${stock.ticker}-${cardIndex}`}
                  stock={stock} 
                  onMatch={isActiveCard ? handleMatch : () => {}}
                  onPass={isActiveCard ? handlePass : () => {}}
                  onViewDetails={isActiveCard && onViewDetails
                    ? (s) => onViewDetails(s, (liked) => liked ? handleMatchRef.current() : handlePassRef.current())
                    : undefined}
                  isVisible={true}
                  zIndex={zIndex}
                  scale={scale}
                  isHighMatch={isActiveCard ? isHighCompatibilityMatch(stock, userProfile) : false}
                />
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        {allRecommendations.length > 0 && currentStock && (
          <div className="flex-shrink-0 px-4 pb-[max(env(safe-area-inset-bottom),6rem)] animate-fade-in delay-400">
            {/* Running-low swipes banner */}
            {!subscribed && canSwipe && dailySwipesUsed >= dailySwipeLimit - 3 && (
              <div className="flex justify-center mb-3">
                <span className="inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-medium px-3 py-1.5 rounded-full">
                  <Crown className="w-3 h-3" />
                  {dailySwipeLimit - dailySwipesUsed} swipe{dailySwipeLimit - dailySwipesUsed !== 1 ? 's' : ''} left — upgrade for unlimited
                </span>
              </div>
            )}
            <div className="flex justify-center gap-6 mb-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      onClick={() => { Haptics.impact({ style: ImpactStyle.Light }).catch(() => {}); handlePass(); }}
                      disabled={animatingCard || !canSwipe}
                      aria-label="Pass"
                      className="w-16 h-16 rounded-full bg-red-500/80 hover:bg-red-600 border-0 text-white shadow-2xl transform hover:scale-110 active:scale-90 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
                    >
                      <X className="w-8 h-8" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {!canSwipe ? "Daily limit reached — upgrade for unlimited swipes" : "Pass"}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      onClick={handleUndo}
                      disabled={currentIndex === 0 || animatingCard}
                      aria-label="Undo last swipe"
                      className="w-12 h-12 rounded-full bg-gray-500/80 hover:bg-gray-600 border-0 text-white shadow-xl transform hover:scale-110 active:scale-90 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {currentIndex === 0 ? "Nothing to undo yet" : "Undo last swipe"}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      onClick={() => { Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {}); handleMatch(); }}
                      disabled={animatingCard || !canSwipe}
                      aria-label="Like this stock"
                      className="w-16 h-16 rounded-full bg-green-500/80 hover:bg-green-600 border-0 text-white shadow-2xl transform hover:scale-110 active:scale-90 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
                    >
                      <Heart className="w-8 h-8" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {!canSwipe ? "Daily limit reached — upgrade for unlimited swipes" : "Like this stock"}
                </TooltipContent>
              </Tooltip>
            </div>
            {/* Swipe hint text */}
            {showSwipeHint && (
              <p className="text-center text-white/40 text-xs transition-opacity duration-500">
                ← Swipe left to pass · Swipe right to like →
              </p>
            )}
            {/* Swipe counter for free users */}
            {!subscribed && (
              <p className="text-center text-white/50 text-xs mt-1">
                {dailySwipesUsed} / {dailySwipeLimit} swipes used today
              </p>
            )}
            {/* Financial disclaimer */}
            <p className="text-center text-white/30 text-xs mt-2">
              For educational purposes only. Not financial advice.
            </p>
          </div>
        )}


      </div>
      
      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => {
          console.log('Upgrade modal closed');
          setShowUpgradeModal(false);
        }}
      />

      {/* Match Overlay - high compatibility */}
      {matchOverlayStock && (
        <MatchOverlay
          stock={matchOverlayStock}
          compatibilityScore={matchOverlayScore}
          onClose={() => setMatchOverlayStock(null)}
          onViewDetails={onViewDetails}
        />
      )}

    </div>
  );
};

export default StockMatcher;
