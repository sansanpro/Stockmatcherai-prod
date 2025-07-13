import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Crown, Zap } from 'lucide-react';

const SubscriptionBanner = () => {
  const { 
    subscriptionTier, 
    dailySwipesUsed, 
    dailySwipeLimit, 
    canSwipe, 
    upgradeToPremi,
    loading 
  } = useSubscription();

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-2 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (subscriptionTier === 'premium') {
    return (
      <Card className="mb-6 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-600" />
              <span className="font-semibold text-yellow-800">Premium Member</span>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                Unlimited Swipes
              </Badge>
            </div>
            <Zap className="w-5 h-5 text-yellow-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = (dailySwipesUsed / dailySwipeLimit) * 100;
  const swipesRemaining = Math.max(0, dailySwipeLimit - dailySwipesUsed);

  return (
    <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-blue-800">Free Plan</span>
              <Badge variant="outline" className="text-blue-600 border-blue-300">
                {swipesRemaining} swipes left today
              </Badge>
            </div>
            <Button 
              size="sm" 
              onClick={upgradeToPremi}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Crown className="w-4 h-4 mr-1" />
              Upgrade
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-blue-700">
              <span>Daily usage</span>
              <span>{dailySwipesUsed} / {dailySwipeLimit}</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {!canSwipe && (
            <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded-md">
              You've reached your daily limit. Upgrade to Premium for unlimited swipes!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionBanner;