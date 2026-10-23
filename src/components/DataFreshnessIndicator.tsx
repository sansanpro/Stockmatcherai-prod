import React from 'react';
import { Clock, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DataFreshnessIndicatorProps {
  lastUpdated?: string | Date;
  showLabel?: boolean;
  variant?: 'inline' | 'badge' | 'detailed';
  className?: string;
}

const DataFreshnessIndicator: React.FC<DataFreshnessIndicatorProps> = ({
  lastUpdated,
  showLabel = true,
  variant = 'inline',
  className = ''
}) => {
  const getTimeAgo = (date: string | Date) => {
    const now = new Date();
    const updated = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getFreshnessStatus = (date: string | Date) => {
    const now = new Date();
    const updated = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60));
    
    // Fresh: within 30 minutes - enhanced visibility with stronger colors
    if (diffInMinutes <= 30) return { status: 'fresh', color: 'text-gain', icon: Wifi };
    
    // Stale: 30 minutes to 4 hours - more visible yellow
    if (diffInMinutes <= 240) return { status: 'stale', color: 'text-[#8A5A12]', icon: Clock };
    
    // Very stale: over 4 hours - enhanced red for visibility
    return { status: 'very-stale', color: 'text-loss', icon: WifiOff };
  };

  if (!lastUpdated) {
    const Icon = AlertTriangle;
    return (
      <div className={`flex items-center gap-1 text-ink-faint ${className}`}>
        <Icon className="w-3 h-3" />
        {showLabel && <span className="text-xs">No data</span>}
      </div>
    );
  }

  const timeAgo = getTimeAgo(lastUpdated);
  const { status, color, icon: Icon } = getFreshnessStatus(lastUpdated);

  if (variant === 'badge') {
    const badgeVariant = status === 'fresh' ? 'default' : 
                        status === 'stale' ? 'secondary' : 'destructive';
    
    return (
      <Badge variant={badgeVariant} className={`flex items-center gap-1 ${className}`}>
        <Icon className="w-3 h-3" />
        {timeAgo}
      </Badge>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`flex items-center gap-2 p-2 rounded-lg bg-muted/50 ${className}`}>
        <Icon className={`w-4 h-4 ${color}`} />
        <div className="flex flex-col">
          <span className="text-xs font-medium">Last Updated</span>
          <span className={`text-xs ${color}`}>{timeAgo}</span>
        </div>
      </div>
    );
  }

  // Default inline variant
  return (
    <div className={`flex items-center gap-1 ${color} ${className}`}>
      <Icon className="w-3 h-3" />
      {showLabel && <span className="text-xs">{timeAgo}</span>}
    </div>
  );
};

export default DataFreshnessIndicator;