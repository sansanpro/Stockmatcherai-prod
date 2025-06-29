import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UserProfile, StockRecommendation } from '@/types/stock-matcher';
import TinderStockCard from '@/components/TinderStockCard';
import { generateStockRecommendations } from '@/utils/stockMatcher';
import { useApp } from '@/contexts/AppContext';
import { Heart, X, RotateCcw, TrendingUp, Plus } from 'lucide-react';

interface StockMatcherProps {
  userProfile: UserProfile;
  onReset: () => void;
  onViewDetails?: (stock: StockRecommendation) => void;
}

const StockMatcher = ({ userProfile, onReset, onViewDetails }: StockMatcherProps) => {
  const [allRecommendations, setAllRecommendations] = useState<StockRecommendation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<StockRecommendation[]>([]);
  const [passes, setPasses] = useState<StockRecommendation[]>([]);
  const [animatingCard, setAnimatingCard] = useState(false);
  const [seenStockTickers, setSeenStockTickers] = useState<Set<string>>(new Set());
  
  const { addToWatchlist, isInWatchlist, updateSwipeStats } = useApp();

  // Pre-load all recommendations once
  useEffect(() => {
    const loadAllRecommendations = async () => {
      setLoading(true);
      // Convert Set to Array for the exclusions parameter
      const exclusionsArray = Array.from(seenStockTickers);
      console.log(`Loading recommendations, excluding ${exclusionsArray.length} previously seen stocks:`, exclusionsArray);
      
      const stocks = await generateStockRecommendations(userProfile, exclusionsArray);
      
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
  }, [userProfile, seenStockTickers]);

  const handleMatch = () => {
    if (animatingCard || currentIndex >= allRecommendations.length) return;
    
    setAnimatingCard(true);
    const currentStock = allRecommendations[currentIndex];
    
    // Add to seen stocks
    setSeenStockTickers(prev => new Set(prev).add(currentStock.ticker));
    setMatches(prev => [...prev, currentStock]);
    
    // Add to watchlist if not already there
    if (!isInWatchlist(currentStock.ticker)) {
      addToWatchlist(currentStock);
    }
    
    // Update swipe statistics
    updateSwipeStats(true);
    
    console.log(`Matched ${currentStock.ticker}, adding to seen stocks`);
    
    // Delay to allow exit animation
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setAnimatingCard(false);
    }, 400);
  };

  const handlePass = () => {
    if (animatingCard || currentIndex >= allRecommendations.length) return;
    
    setAnimatingCard(true);
    const currentStock = allRecommendations[currentIndex];
    
    // Add to seen stocks
    setSeenStockTickers(prev => new Set(prev).add(currentStock.ticker));
    setPasses(prev => [...prev, currentStock]);
    
    // Update swipe statistics
    updateSwipeStats(false);
    
    console.log(`Passed ${currentStock.ticker}, adding to seen stocks`);
    
    // Delay to allow exit animation
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setAnimatingCard(false);
    }, 400);
  };

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

  const loadMoreRecommendations = async () => {
    setLoading(true);
    
    // Keep all seen stock tickers for exclusion
    const exclusionsArray = Array.from(seenStockTickers);
    console.log(`Loading more recommendations, excluding ${exclusionsArray.length} seen stocks`);
    
    // Load fresh recommendations excluding all previously seen stocks
    const newStocks = await generateStockRecommendations(userProfile, exclusionsArray);
    
    // Filter out invalid stocks
    const validStocks = newStocks.filter(stock => {
      if (!stock.companyName || stock.companyName.trim() === '' || stock.companyName === 'Unknown Company') {
        console.log(`Filtering out stock with invalid company name: ${stock.ticker} - "${stock.companyName}"`);
        return false;
      }
      return true;
    });
    
    setTimeout(() => {
      // Reset to beginning with new stocks, but keep seen stocks memory
      setAllRecommendations(validStocks);
      setCurrentIndex(0);
      // Don't reset matches and passes - keep the user's history
      setLoading(false);
    }, 300);
  };

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
        <div className="max-w-md mx-auto pt-8">
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
              onClick={loadMoreRecommendations}
              className="w-full bg-white/20 hover:bg-white/30 text-white border-0 h-12 rounded-xl backdrop-blur-lg transform hover:scale-105 transition-all duration-200"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Get More Recommendations
            </Button>
            <Button 
              onClick={onReset}
              variant="outline"
              className="w-full bg-transparent border-white/30 text-white hover:bg-white/10 h-12 rounded-xl transform hover:scale-105 transition-all duration-200"
            >
              Update Profile
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
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6 pt-4 animate-fade-in">
          <h1 className="text-2xl font-bold text-white mb-2">
            Stock Matcher 💕
          </h1>
          <div className="flex items-center justify-center gap-2 text-white/80 text-sm">
            <span>{userProfile.age}yo • {userProfile.riskTolerance} risk • {userProfile.sectorPreference}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-4 mb-6 animate-fade-in delay-200">
          <div className="bg-green-500/20 backdrop-blur-lg rounded-xl px-4 py-2 flex items-center gap-2 border border-green-400/30 transform hover:scale-105 transition-all duration-200">
            <Heart className="w-4 h-4 text-green-300 fill-current" />
            <span className="text-white font-medium">{matches.length}</span>
          </div>
          <div className="bg-red-500/20 backdrop-blur-lg rounded-xl px-4 py-2 flex items-center gap-2 border border-red-400/30 transform hover:scale-105 transition-all duration-200">
            <X className="w-4 h-4 text-red-300" />
            <span className="text-white font-medium">{passes.length}</span>
          </div>
        </div>

        {/* Stock Cards Stack */}
        {allRecommendations.length > 0 && currentStock && (
          <div className="mb-8 relative h-[600px] animate-fade-in delay-300">
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
                  onViewDetails={isActiveCard && onViewDetails ? onViewDetails : undefined}
                  isVisible={true}
                  zIndex={zIndex}
                  scale={scale}
                />
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center items-center gap-6 animate-fade-in delay-400">
          <Button
            onClick={handlePass}
            disabled={animatingCard}
            className="w-16 h-16 rounded-full bg-white/20 hover:bg-red-500/30 border-2 border-red-400/50 backdrop-blur-lg disabled:opacity-50 transform hover:scale-110 active:scale-95 transition-all duration-200"
            variant="ghost"
          >
            <X className="w-8 h-8 text-red-400" />
          </Button>

          <Button
            onClick={handleUndo}
            disabled={currentIndex === 0 || animatingCard}
            className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-50 backdrop-blur-lg transform hover:scale-110 active:scale-95 transition-all duration-200"
            variant="ghost"
          >
            <RotateCcw className="w-5 h-5 text-white" />
          </Button>

          <Button
            onClick={handleMatch}
            disabled={animatingCard}
            className="w-16 h-16 rounded-full bg-white/20 hover:bg-green-500/30 border-2 border-green-400/50 backdrop-blur-lg disabled:opacity-50 transform hover:scale-110 active:scale-95 transition-all duration-200"
            variant="ghost"
          >
            <Heart className="w-8 h-8 text-green-400 fill-current" />
          </Button>
        </div>

        {/* Quick Add to Watchlist */}
        {currentStock && !isInWatchlist(currentStock.ticker) && (
          <div className="mt-6 text-center animate-fade-in delay-500">
            <Button
              onClick={() => addToWatchlist(currentStock)}
              variant="ghost"
              className="text-white/70 hover:text-white hover:bg-white/10 flex items-center gap-2 transform hover:scale-105 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Add to Watchlist
            </Button>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="mt-8 animate-fade-in delay-600">
          <Button 
            onClick={onReset}
            variant="ghost"
            className="w-full text-white/70 hover:text-white hover:bg-white/10 transform hover:scale-105 transition-all duration-200"
          >
            Update Profile
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StockMatcher;
