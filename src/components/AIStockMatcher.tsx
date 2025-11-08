import React, { useState, useEffect, useCallback } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, StockRecommendation } from '@/types/stock-matcher';
import TinderStockCard from './TinderStockCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';

interface AIStockMatcherProps {
  userProfile: UserProfile;
  onReset: () => void;
  onViewDetails?: (stock: StockRecommendation) => void;
}

interface AIRecommendationResponse {
  recommendations: StockRecommendation[];
  sessionId: string;
  confidenceScore: number;
  diversificationScore: number;
  processingTimeMs: number;
  modelVersion: string;
}

export const AIStockMatcher: React.FC<AIStockMatcherProps> = ({
  userProfile,
  onReset,
  onViewDetails
}) => {
  const [recommendations, setRecommendations] = useState<StockRecommendation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [matches, setMatches] = useState<StockRecommendation[]>([]);
  const [passes, setPasses] = useState<StockRecommendation[]>([]);
  const [sessionData, setSessionData] = useState<Partial<AIRecommendationResponse> | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [seenTickers, setSeenTickers] = useState<Set<string>>(new Set());

  const { subscribed, canSwipe, incrementSwipeCount } = useSubscription();

  // Load AI recommendations
  const loadAIRecommendations = useCallback(async () => {
    if (!subscribed) {
      toast.error('AI recommendations require premium subscription');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Loading AI recommendations for user profile:', userProfile);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await supabase.functions.invoke('ai-recommend', {
        body: {
          userProfile,
          excludedStocks: Array.from(seenTickers),
          sessionType: 'ai'
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to get AI recommendations');
      }

      const data: AIRecommendationResponse = response.data;
      
      if (!data.recommendations || data.recommendations.length === 0) {
        throw new Error('No AI recommendations returned');
      }

      console.log(`Loaded ${data.recommendations.length} AI recommendations`);
      setRecommendations(data.recommendations);
      setSessionData(data);
      setCurrentIndex(0);

      // Update seen tickers
      const newTickers = new Set([...seenTickers, ...data.recommendations.map(r => r.ticker)]);
      setSeenTickers(newTickers);

      toast.success(`🤖 AI found ${data.recommendations.length} personalized recommendations!`);
    } catch (error) {
      console.error('Error loading AI recommendations:', error);
      toast.error(error.message || 'Failed to load AI recommendations');
    } finally {
      setIsLoading(false);
    }
  }, [userProfile, subscribed, seenTickers]);

  // Load recommendations on mount
  useEffect(() => {
    loadAIRecommendations();
  }, [loadAIRecommendations]);

  // Store user feedback
  const storeFeedback = async (stock: StockRecommendation, feedbackType: 'like' | 'dislike' | 'match' | 'pass') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('user_feedback').insert({
          user_id: user.id,
          stock_ticker: stock.ticker,
          feedback_type: feedbackType,
          is_ai_recommendation: true,
          recommendation_id: (stock as any).aiRecommendationId
        });
      }
    } catch (error) {
      console.error('Error storing feedback:', error);
    }
  };

  const handleMatch = async () => {
    if (!canSwipe) {
      toast.error('Daily swipe limit reached. Upgrade to continue!');
      return;
    }

    if (currentIndex >= recommendations.length) return;

    const currentStock = recommendations[currentIndex];
    
    setIsAnimating(true);
    setMatches(prev => [...prev, currentStock]);
    
    // Store in user's watchlist
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('user_watchlists').insert({
          user_id: user.id,
          ticker: currentStock.ticker,
          company_name: currentStock.companyName,
          stock_data: currentStock as any
        });
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
    }

    // Store feedback
    await storeFeedback(currentStock, 'match');
    
    // Increment swipe count
    await incrementSwipeCount();
    
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setIsAnimating(false);
    }, 300);

    toast.success(`Added ${currentStock.companyName} to your watchlist!`);
  };

  const handlePass = async () => {
    if (!canSwipe) {
      toast.error('Daily swipe limit reached. Upgrade to continue!');
      return;
    }

    if (currentIndex >= recommendations.length) return;

    const currentStock = recommendations[currentIndex];
    
    setIsAnimating(true);
    setPasses(prev => [...prev, currentStock]);
    
    // Store feedback
    await storeFeedback(currentStock, 'pass');
    
    // Increment swipe count
    await incrementSwipeCount();
    
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setIsAnimating(false);
    }, 300);
  };

  const handleUndo = () => {
    if (currentIndex === 0) return;

    const previousStock = recommendations[currentIndex - 1];
    
    // Remove from matches or passes
    setMatches(prev => prev.filter(stock => stock.ticker !== previousStock.ticker));
    setPasses(prev => prev.filter(stock => stock.ticker !== previousStock.ticker));
    
    setCurrentIndex(prev => prev - 1);
    toast.info('Action undone');
  };

  const loadMoreRecommendations = () => {
    loadAIRecommendations();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-2xl p-8 max-w-md md:max-w-2xl lg:max-w-4xl text-center">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-blue-600 animate-pulse" />
          <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Analyzing Your Profile
          </h3>
          <p className="text-muted-foreground mb-4">
            Our AI is reviewing {userProfile.experience} investor preferences and finding personalized stock matches...
          </p>
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Processing {149} stocks</span>
          </div>
        </div>
      </div>
    );
  }

  // Finished state
  if (currentIndex >= recommendations.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 rounded-2xl p-8 max-w-md md:max-w-2xl lg:max-w-4xl text-center">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-green-600" />
          <h3 className="text-xl font-semibold mb-2">AI Analysis Complete!</h3>
          <p className="text-muted-foreground mb-6">
            You've reviewed all AI-recommended stocks. Great job building your portfolio!
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{matches.length}</div>
              <div className="text-sm text-muted-foreground">AI Matches</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{passes.length}</div>
              <div className="text-sm text-muted-foreground">Passed</div>
            </div>
          </div>

          {sessionData && (
            <div className="space-y-2 mb-6 text-sm">
              <div className="flex justify-between">
                <span>AI Confidence:</span>
                <Badge variant="secondary">{Math.round((sessionData.confidenceScore || 0) * 100)}%</Badge>
              </div>
              <div className="flex justify-between">
                <span>Diversification:</span>
                <Badge variant="secondary">{Math.round((sessionData.diversificationScore || 0) * 100)}%</Badge>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <Button onClick={loadMoreRecommendations} className="w-full">
              <Sparkles className="w-4 h-4 mr-2" />
              Get More AI Recommendations
            </Button>
            <Button onClick={onReset} variant="outline" className="w-full">
              Back to Classic Mode
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentStock = recommendations[currentIndex];
  const progress = ((currentIndex + 1) / recommendations.length) * 100;

  return (
    <div className="flex flex-col h-full">
      {/* Header with AI badge and progress */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Powered
          </Badge>
          {sessionData && (
            <div className="text-sm text-muted-foreground">
              {Math.round((sessionData.confidenceScore || 0) * 100)}% confidence
            </div>
          )}
        </div>
        
        <div className="text-sm text-muted-foreground">
          {currentIndex + 1} of {recommendations.length}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-secondary">
        <div 
          className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Match/Pass counter */}
      <div className="flex justify-center gap-6 p-4">
        <div className="flex items-center gap-2">
          <ThumbsDown className="w-4 h-4 text-red-500" />
          <span className="text-sm font-medium">{passes.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <ThumbsUp className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium">{matches.length}</span>
        </div>
      </div>

      {/* Stock card */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-2">
        <div className={`transition-all duration-300 ${isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
          <TinderStockCard 
            stock={currentStock} 
            onMatch={handleMatch}
            onPass={handlePass}
            onViewDetails={onViewDetails}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-center gap-4 p-6">
        <Button
          onClick={handlePass}
          variant="outline"
          size="lg"
          className="rounded-full w-16 h-16 text-red-500 border-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
          disabled={isAnimating}
        >
          <ThumbsDown className="w-6 h-6" />
        </Button>
        
        <Button
          onClick={handleUndo}
          variant="outline"
          size="lg"
          className="rounded-full w-16 h-16"
          disabled={currentIndex === 0 || isAnimating}
        >
          ↶
        </Button>
        
        <Button
          onClick={handleMatch}
          size="lg"
          className="rounded-full w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
          disabled={isAnimating}
        >
          <ThumbsUp className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
};

export default AIStockMatcher;