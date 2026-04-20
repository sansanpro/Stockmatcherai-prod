import { useEffect, useState, useRef } from 'react';
import { Heart, Sparkles, TrendingUp, X } from 'lucide-react';
import { StockRecommendation } from '@/types/stock-matcher';
import { Button } from '@/components/ui/button';

interface MatchOverlayProps {
  stock: StockRecommendation;
  compatibilityScore: number;
  onClose: () => void;
  onViewDetails?: (stock: StockRecommendation) => void;
}

const MatchOverlay = ({ stock, compatibilityScore, onClose, onViewDetails }: MatchOverlayProps) => {
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter');
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const showTimer = setTimeout(() => setPhase('show'), 100);
    
    const exitTimer = setTimeout(() => {
      setPhase('exit');
      setTimeout(() => onCloseRef.current(), 500);
    }, 8000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(exitTimer);
    };
  }, []);

  const handleDismiss = () => {
    setPhase('exit');
    setTimeout(onClose, 500);
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(stock);
    }
    handleDismiss();
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-500 ${
        phase === 'enter' ? 'opacity-0' : phase === 'exit' ? 'opacity-0 scale-110' : 'opacity-100'
      }`}
      onClick={handleDismiss}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Animated particles / sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              animationDelay: `${i * 0.15}s`,
              animationDuration: `${1.5 + Math.random()}s`,
            }}
          >
            <Sparkles
              className="text-yellow-400/60"
              style={{
                width: `${12 + Math.random() * 20}px`,
                height: `${12 + Math.random() * 20}px`,
              }}
            />
          </div>
        ))}
      </div>

      {/* X close button */}
      <button
        onClick={handleDismiss}
        aria-label="Close match overlay"
        className="absolute top-6 right-6 z-20 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Main content */}
      <div
        className={`relative z-10 flex flex-col items-center text-center px-8 max-w-sm transition-all duration-700 ease-out ${
          phase === 'show'
            ? 'scale-100 translate-y-0 opacity-100'
            : phase === 'enter'
            ? 'scale-50 translate-y-8 opacity-0'
            : 'scale-110 -translate-y-8 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hearts animation */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center shadow-2xl shadow-pink-500/40 animate-pulse">
            <Heart className="w-12 h-12 text-white fill-white" />
          </div>
          {/* Orbiting hearts */}
          <Heart
            className="absolute -top-2 -right-2 w-6 h-6 text-pink-400 fill-pink-400 animate-bounce"
            style={{ animationDelay: '0.2s' }}
          />
          <Heart
            className="absolute -bottom-1 -left-3 w-5 h-5 text-red-400 fill-red-400 animate-bounce"
            style={{ animationDelay: '0.5s' }}
          />
          <Heart
            className="absolute top-0 -left-4 w-4 h-4 text-pink-300 fill-pink-300 animate-bounce"
            style={{ animationDelay: '0.8s' }}
          />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-extrabold text-white mb-2 drop-shadow-lg tracking-tight">
          It's a Match!
        </h1>
        <p className="text-pink-200 text-lg mb-6 font-medium">
          This stock is perfect for you
        </p>

        {/* Stock info card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 w-full border border-white/20 mb-6">
          <h2 className="text-2xl font-bold text-white mb-1">{stock.companyName}</h2>
          <p className="text-white/70 font-medium text-lg mb-3">{stock.ticker}</p>

          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className={`font-semibold ${stock.oneYearReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stock.oneYearReturn > 0 ? '+' : ''}{stock.oneYearReturn.toFixed(1)}%
              </span>
            </div>
            <div className="w-px h-4 bg-white/30" />
            <span className="text-white/70 text-sm">{stock.sector}</span>
          </div>

          {/* Compatibility score bar */}
          <div className="mt-3">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-white/60 uppercase tracking-wider font-medium">Match Score</span>
              <span className="text-sm font-bold text-green-400">{compatibilityScore}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: phase === 'show' ? `${compatibilityScore}%` : '0%' }}
              />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 w-full">
          {onViewDetails && (
            <Button
              onClick={handleViewDetails}
              className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm rounded-xl h-11"
            >
              View Details
            </Button>
          )}
          <Button
            onClick={handleDismiss}
            className="flex-1 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white border-0 rounded-xl h-11 shadow-lg"
          >
            Keep Swiping
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MatchOverlay;
