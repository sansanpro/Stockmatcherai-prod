
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { Award, Trophy, Target, Zap, Star, X } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  requirement: number;
  unlocked: boolean;
  unlockedAt?: string;
}

const AchievementSystem = () => {
  const { watchlist, swipeStats } = useApp();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showAchievements, setShowAchievements] = useState(false);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);

  const achievementDefinitions: Omit<Achievement, 'unlocked' | 'unlockedAt'>[] = [
    {
      id: 'first_match',
      title: 'First Match',
      description: 'Match with your first stock',
      icon: <Award className="w-5 h-5 text-yellow-500" />,
      requirement: 1
    },
    {
      id: 'five_matches',
      title: 'Getting Started',
      description: 'Match with 5 stocks',
      icon: <Target className="w-5 h-5 text-blue-500" />,
      requirement: 5
    },
    {
      id: 'ten_matches',
      title: 'Stock Enthusiast',
      description: 'Match with 10 stocks',
      icon: <Star className="w-5 h-5 text-purple-500" />,
      requirement: 10
    },
    {
      id: 'twenty_matches',
      title: 'Portfolio Builder',
      description: 'Match with 20 stocks',
      icon: <Trophy className="w-5 h-5 text-orange-500" />,
      requirement: 20
    },
    {
      id: 'fifty_swipes',
      title: 'Active Swiper',
      description: 'Make 50 total swipes',
      icon: <Zap className="w-5 h-5 text-green-500" />,
      requirement: 50
    }
  ];

  useEffect(() => {
    const savedAchievements = JSON.parse(localStorage.getItem('stockMatcher_achievements') || '[]');
    
    const updatedAchievements = achievementDefinitions.map(def => {
      const saved = savedAchievements.find((a: Achievement) => a.id === def.id);
      const currentCount = def.id.includes('match') ? watchlist.length : swipeStats.totalSwipes;
      const wasUnlocked = saved?.unlocked || false;
      const isUnlocked = currentCount >= def.requirement;
      
      // Check for new achievements
      if (isUnlocked && !wasUnlocked) {
        setNewAchievements(prev => [...prev, def.id]);
      }
      
      return {
        ...def,
        unlocked: isUnlocked,
        unlockedAt: isUnlocked && !wasUnlocked ? new Date().toISOString() : saved?.unlockedAt
      };
    });

    setAchievements(updatedAchievements);
    localStorage.setItem('stockMatcher_achievements', JSON.stringify(updatedAchievements));
  }, [watchlist.length, swipeStats.totalSwipes]);

  const dismissNewAchievement = (achievementId: string) => {
    setNewAchievements(prev => prev.filter(id => id !== achievementId));
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <>
      {/* New Achievement Notifications */}
      {newAchievements.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {newAchievements.map(achievementId => {
            const achievement = achievements.find(a => a.id === achievementId);
            if (!achievement) return null;
            
            return (
              <Card key={achievementId} className="w-80 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800 shadow-lg animate-slide-in-right">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {achievement.icon}
                      <div>
                        <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                          Achievement Unlocked!
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          {achievement.title}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => dismissNewAchievement(achievementId)}
                      variant="ghost"
                      size="sm"
                      className="w-6 h-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Achievement Button */}
      <div className="relative">
        <Button
          onClick={() => setShowAchievements(!showAchievements)}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Trophy className="w-4 h-4" />
          Achievements
          <Badge variant="secondary">{unlockedCount}/{achievements.length}</Badge>
        </Button>

        {/* Achievement Panel */}
        {showAchievements && (
          <div className="absolute top-12 right-0 w-80 z-50">
            <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
                  <Trophy className="w-5 h-5" />
                  Achievements ({unlockedCount}/{achievements.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-3 rounded-lg border ${
                      achievement.unlocked
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={achievement.unlocked ? '' : 'opacity-50'}>
                        {achievement.icon}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${
                          achievement.unlocked 
                            ? 'text-green-800 dark:text-green-200' 
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {achievement.title}
                        </p>
                        <p className={`text-xs ${
                          achievement.unlocked 
                            ? 'text-green-600 dark:text-green-300' 
                            : 'text-gray-500 dark:text-gray-500'
                        }`}>
                          {achievement.description}
                        </p>
                        {achievement.unlocked && achievement.unlockedAt && (
                          <p className="text-xs text-green-500 dark:text-green-400 mt-1">
                            Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {achievement.unlocked && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          ✓
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
};

export default AchievementSystem;
