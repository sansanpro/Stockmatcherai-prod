import { useState } from 'react';
import { Newspaper, ChevronRight, ExternalLink, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCompanyNews, NewsItem } from '@/hooks/useCompanyNews';

interface StockNewsPillProps {
  ticker: string;
  companyName: string;
}

const getTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getSentiment = (title: string): { emoji: string; color: string } => {
  const lowerTitle = title.toLowerCase();
  const positiveWords = ['surge', 'gain', 'rise', 'beat', 'record', 'growth', 'strong', 'boost', 'soar', 'jump', 'rally', 'upgrade', 'profit', 'success'];
  const negativeWords = ['fall', 'drop', 'decline', 'miss', 'loss', 'cut', 'down', 'weak', 'crash', 'plunge', 'downgrade', 'warning', 'layoff', 'concern'];

  if (positiveWords.some(word => lowerTitle.includes(word))) {
    return { emoji: '🟢', color: 'text-green-500' };
  }
  if (negativeWords.some(word => lowerTitle.includes(word))) {
    return { emoji: '🔴', color: 'text-red-500' };
  }
  return { emoji: '🟡', color: 'text-yellow-500' };
};

const StockNewsPill = ({ ticker, companyName }: StockNewsPillProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { news, isLoading, error } = useCompanyNews(ticker);

  // Don't render if no news or error
  if (error || (!isLoading && news.length === 0)) {
    return null;
  }

  const handleNewsClick = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handlePillClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(true);
  };

  return (
    <>
      {/* Compact News Pill */}
      <button
        onClick={handlePillClick}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
          bg-gradient-to-r from-blue-500/20 to-cyan-500/20 
          hover:from-blue-500/30 hover:to-cyan-500/30
          dark:from-blue-400/20 dark:to-cyan-400/20
          dark:hover:from-blue-400/30 dark:hover:to-cyan-400/30
          text-blue-700 dark:text-blue-300
          border border-blue-200/50 dark:border-blue-500/30
          transition-all duration-200 hover:scale-105 active:scale-95
          backdrop-blur-sm shadow-sm hover:shadow-md"
      >
        <Newspaper className="w-3 h-3" />
        {isLoading ? (
          <span className="w-12 h-2.5 bg-blue-400/40 rounded-full animate-pulse inline-block" />
        ) : (
          <>
            <span>{news.length} update{news.length !== 1 ? 's' : ''}</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </>
        )}
      </button>

      {/* Expanded News Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent 
          side="bottom" 
          className="h-[60vh] rounded-t-3xl px-0"
          onClick={(e) => e.stopPropagation()}
        >
          <SheetHeader className="px-5 pb-4 border-b">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <Newspaper className="w-5 h-5 text-blue-500" />
              Latest News for {ticker}
            </SheetTitle>
            <p className="text-sm text-muted-foreground">{companyName}</p>
          </SheetHeader>
          
          <div className="overflow-y-auto h-full pb-20">
            {isLoading ? (
              <div className="p-5 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {news.map((item, index) => {
                  const sentiment = getSentiment(item.title);
                  return (
                    <button
                      key={index}
                      onClick={(e) => handleNewsClick(item.url, e)}
                      className="w-full p-4 text-left hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg mt-0.5">{sentiment.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <span className="font-medium">{item.site}</span>
                            <span>•</span>
                            <span>{getTimeAgo(item.publishedDate)}</span>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            
            {!isLoading && news.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No recent news available for {ticker}</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default StockNewsPill;
