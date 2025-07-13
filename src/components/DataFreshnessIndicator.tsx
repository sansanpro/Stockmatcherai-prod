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
    
    // Fresh: within 30 minutes - vibrant green with glow
    if (diffInMinutes <= 30) return { 
      status: 'fresh', 
      color: 'text-emerald-400', 
      bgColor: 'bg-emerald-500/20 border-emerald-400/30',
      glowColor: 'shadow-emerald-400/50',
      icon: Wifi 
    };
    
    // Stale: 30 minutes to 4 hours - warm amber
    if (diffInMinutes <= 240) return { 
      status: 'stale', 
      color: 'text-amber-300', 
      bgColor: 'bg-amber-500/20 border-amber-300/30',
      glowColor: 'shadow-amber-300/50',
      icon: Clock 
    };
    
    // Very stale: over 4 hours - soft red
    return { 
      status: 'very-stale', 
      color: 'text-rose-400', 
      bgColor: 'bg-rose-500/20 border-rose-400/30',
      glowColor: 'shadow-rose-400/50',
      icon: WifiOff 
    };
  };

  if (!lastUpdated) {
    const Icon = AlertTriangle;
    return (
      <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-full border backdrop-blur-sm transition-all duration-300 text-slate-400 bg-slate-500/20 border-slate-400/30 shadow-sm ${className}`}>
        <Icon className="w-3.5 h-3.5 animate-pulse" />
        {showLabel && <span className="text-xs font-medium">No data</span>}
      </div>
    );
  }

  const timeAgo = getTimeAgo(lastUpdated);
  const { status, color, bgColor, glowColor, icon: Icon } = getFreshnessStatus(lastUpdated);

  if (variant === 'badge') {
    const badgeVariant = status === 'fresh' ? 'default' : 
                        status === 'stale' ? 'secondary' : 'destructive';
    
    return (
      <Badge variant={badgeVariant} className={`flex items-center gap-2 ${className}`}>
        <Icon className="w-3.5 h-3.5" />
        {timeAgo}
      </Badge>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-lg border backdrop-blur-sm transition-all duration-300 hover:scale-105 ${bgColor} ${glowColor} shadow-lg ${className}`}>
        <Icon className={`w-4 h-4 ${color}`} />
        <div className="flex flex-col">
          <span className="text-xs font-medium text-white/90">Last Updated</span>
          <span className={`text-xs font-semibold ${color}`}>{timeAgo}</span>
        </div>
      </div>
    );
  }

  // Enhanced inline variant with modern styling
  return (
    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-full border backdrop-blur-sm transition-all duration-300 hover:scale-105 ${bgColor} ${glowColor} shadow-lg ${className}`}>
      <Icon className={`w-3.5 h-3.5 ${color}`} />
      {showLabel && <span className={`text-xs font-medium ${color}`}>{timeAgo}</span>}
    </div>
  );
};

export default DataFreshnessIndicator;