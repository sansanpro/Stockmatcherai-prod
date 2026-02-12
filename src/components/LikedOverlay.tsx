import { useEffect, useState, useRef } from 'react';
import { ThumbsUp, Sparkles } from 'lucide-react';
import { StockRecommendation } from '@/types/stock-matcher';
import { Button } from '@/components/ui/button';

interface LikedOverlayProps {
  stock: StockRecommendation;
  onClose: () => void;
}

const LikedOverlay = ({ stock, onClose }: LikedOverlayProps) => {
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter');
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const showTimer = setTimeout(() => setPhase('show'), 100);

    const exitTimer = setTimeout(() => {
      setPhase('exit');
      setTimeout(() => onCloseRef.current(), 400);
    }, 2500);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(exitTimer);
    };
  }, []);

  const handleDismiss = () => {
    setPhase('exit');
    setTimeout(onClose, 400);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-400 ${
        phase === 'enter' ? 'opacity-0' : phase === 'exit' ? 'opacity-0 scale-105' : 'opacity-100'
      }`}
      onClick={handleDismiss}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Sparkle particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${15 + Math.random() * 70}%`,
              top: `${20 + Math.random() * 60}%`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: `${1.2 + Math.random() * 0.8}s`,
            }}
          >
            <Sparkles
              className="text-blue-300/50"
              style={{
                width: `${10 + Math.random() * 14}px`,
                height: `${10 + Math.random() * 14}px`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Main content */}
      <div
        className={`relative z-10 flex flex-col items-center text-center px-8 max-w-sm transition-all duration-500 ease-out ${
          phase === 'show'
            ? 'scale-100 translate-y-0 opacity-100'
            : phase === 'enter'
            ? 'scale-75 translate-y-6 opacity-0'
            : 'scale-105 -translate-y-4 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Thumbs up icon */}
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-blue-500/30 animate-pulse">
            <ThumbsUp className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-extrabold text-white mb-1.5 drop-shadow-lg tracking-tight">
          Liked!
        </h1>
        <p className="text-blue-200 text-base mb-5 font-medium">
          Added to your watchlist
        </p>

        {/* Stock info */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 w-full border border-white/20 mb-5">
          <h2 className="text-xl font-bold text-white mb-0.5">{stock.companyName}</h2>
          <p className="text-white/70 font-medium mb-2">{stock.ticker}</p>
          <div className="flex items-center justify-center gap-3 text-sm">
            <span className={`font-semibold ${stock.oneYearReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stock.oneYearReturn > 0 ? '+' : ''}{stock.oneYearReturn.toFixed(1)}%
            </span>
            <div className="w-px h-3.5 bg-white/30" />
            <span className="text-white/70">{stock.sector}</span>
          </div>
        </div>

        {/* Dismiss button */}
        <Button
          onClick={handleDismiss}
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 rounded-xl h-10 shadow-lg"
        >
          Keep Swiping
        </Button>
      </div>
    </div>
  );
};

export default LikedOverlay;
