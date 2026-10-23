
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { Bell, TrendingUp, TrendingDown, X } from 'lucide-react';

interface WeeklySummary {
  date: string;
  totalMatches: number;
  avgPerformance: number;
  bestPerformer: string;
  worstPerformer: string;
}

const NotificationSystem = () => {
  const { watchlist } = useApp();
  const [notifications, setNotifications] = useState<WeeklySummary[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // Generate weekly summary notification
    if (watchlist.length > 0) {
      const summary: WeeklySummary = {
        date: new Date().toLocaleDateString(),
        totalMatches: watchlist.length,
        avgPerformance: watchlist.reduce((sum, stock) => sum + stock.oneYearReturn, 0) / watchlist.length,
        bestPerformer: watchlist.reduce((best, stock) => 
          stock.oneYearReturn > best.oneYearReturn ? stock : best
        ).ticker,
        worstPerformer: watchlist.reduce((worst, stock) => 
          stock.oneYearReturn < worst.oneYearReturn ? stock : worst
        ).ticker
      };
      
      const existingNotifications = JSON.parse(localStorage.getItem('stockMatcher_notifications') || '[]');
      const isNewWeek = !existingNotifications.some((n: WeeklySummary) => n.date === summary.date);
      
      if (isNewWeek) {
        const updatedNotifications = [summary, ...existingNotifications.slice(0, 4)];
        setNotifications(updatedNotifications);
        localStorage.setItem('stockMatcher_notifications', JSON.stringify(updatedNotifications));
      } else {
        setNotifications(existingNotifications);
      }
    }
  }, [watchlist]);

  const dismissNotification = (index: number) => {
    const updated = notifications.filter((_, i) => i !== index);
    setNotifications(updated);
    localStorage.setItem('stockMatcher_notifications', JSON.stringify(updated));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="relative">
      <Button
        onClick={() => setShowNotifications(!showNotifications)}
        variant="outline"
        size="sm"
        className="relative w-11 h-11 p-0"
      >
        <Bell className="w-4 h-4" />
        {notifications.length > 0 && (
          <Badge className="absolute -top-1.5 -right-1.5 w-5 h-5 p-0 flex items-center justify-center bg-red-500 text-[10px]">
            {notifications.length}
          </Badge>
        )}
      </Button>

      {showNotifications && (
        <div className="absolute top-10 sm:top-12 right-0 w-64 sm:w-80 z-50">
          <Card className="shadow-lg ">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 ">
                <Bell className="w-5 h-5" />
                Weekly Summaries
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {notifications.map((notification, index) => (
                <div key={index} className="relative p-3 bg-sand rounded-lg">
                  <Button
                    onClick={() => dismissNotification(index)}
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 w-9 h-9 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                  
                  <div className="pr-6">
                    <p className="text-sm font-medium text-ink mb-2">
                      Week of {notification.date}
                    </p>
                    <div className="space-y-1 text-xs text-ink-soft">
                      <p>📊 {notification.totalMatches} total matches</p>
                      <p className="flex items-center gap-1">
                        {notification.avgPerformance >= 0 ? (
                          <TrendingUp className="w-3 h-3 text-green-600" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-600" />
                        )}
                        Avg: {notification.avgPerformance.toFixed(1)}%
                      </p>
                      <p>🚀 Best: {notification.bestPerformer}</p>
                      <p>📉 Worst: {notification.worstPerformer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default NotificationSystem;
