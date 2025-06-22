
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UserProfile, StockRecommendation } from '@/types/stock-matcher';
import StockCard from '@/components/StockCard';
import { generateStockRecommendations } from '@/utils/stockMatcher';

interface StockMatcherProps {
  userProfile: UserProfile;
  onReset: () => void;
}

const StockMatcher = ({ userProfile, onReset }: StockMatcherProps) => {
  const [recommendations, setRecommendations] = useState<StockRecommendation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecommendations = async () => {
      setLoading(true);
      const stocks = await generateStockRecommendations(userProfile);
      setRecommendations(stocks);
      setLoading(false);
    };
    
    loadRecommendations();
  }, [userProfile]);

  const handleNext = () => {
    if (currentIndex < recommendations.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-lg font-medium">Finding your perfect stock matches...</p>
          <p className="text-sm text-gray-600">Analyzing your profile and market data 📊</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Your Stock Matches 🎯
          </h1>
          <p className="text-sm text-gray-600">
            {userProfile.age}-year-old {userProfile.gender} • {userProfile.riskTolerance} risk • {userProfile.sectorPreference}
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center space-x-2 mb-6">
          {recommendations.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-8 rounded-full transition-colors ${
                index === currentIndex ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Stock Card */}
        {recommendations.length > 0 && (
          <div className="mb-6">
            <StockCard stock={recommendations[currentIndex]} />
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mb-6">
          <Button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            variant="outline"
            className="flex items-center gap-2"
          >
            ← Previous
          </Button>
          
          <span className="text-sm text-gray-500">
            {currentIndex + 1} of {recommendations.length}
          </span>
          
          <Button
            onClick={handleNext}
            disabled={currentIndex === recommendations.length - 1}
            className="flex items-center gap-2"
          >
            Next →
          </Button>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button 
            onClick={onReset}
            variant="outline"
            className="w-full"
          >
            Update Profile 📝
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StockMatcher;
