
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StockRecommendation } from '@/types/stock-matcher';
import { Heart, X, TrendingUp, DollarSign, Building, User } from 'lucide-react';

interface TinderStockCardProps {
  stock: StockRecommendation;
  onMatch: () => void;
  onPass: () => void;
}

const TinderStockCard = ({ stock, onMatch, onPass }: TinderStockCardProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'from-green-400 to-green-600';
      case 'medium': return 'from-yellow-400 to-orange-500';
      case 'high': return 'from-red-400 to-pink-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getRiskEmoji = (risk: string) => {
    switch (risk) {
      case 'low': return '🟢';
      case 'medium': return '🟡';
      case 'high': return '🔴';
      default: return '⚪';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(1)}B`;
    }
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    }
    return `$${num.toFixed(2)}`;
  };

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setStartPos({ x: clientX, y: clientY });
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    
    const deltaX = clientX - startPos.x;
    const deltaY = clientY - startPos.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleEnd = () => {
    if (!isDragging) return;
    
    const threshold = 100;
    if (Math.abs(dragOffset.x) > threshold) {
      if (dragOffset.x > 0) {
        onMatch();
      } else {
        onPass();
      }
    }
    
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleMove(e.clientX, e.clientY);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleEnd();
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, startPos]);

  const rotation = dragOffset.x * 0.1;
  const opacity = Math.max(0.7, 1 - Math.abs(dragOffset.x) / 300);

  return (
    <div className="relative">
      {/* Overlay indicators */}
      {isDragging && (
        <>
          <div 
            className={`absolute inset-0 rounded-3xl flex items-center justify-center z-10 transition-opacity ${
              dragOffset.x > 50 ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              background: 'linear-gradient(45deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.9))'
            }}
          >
            <div className="text-white text-center">
              <Heart className="w-16 h-16 mx-auto mb-2 fill-current" />
              <div className="text-2xl font-bold">MATCH!</div>
            </div>
          </div>
          
          <div 
            className={`absolute inset-0 rounded-3xl flex items-center justify-center z-10 transition-opacity ${
              dragOffset.x < -50 ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              background: 'linear-gradient(45deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))'
            }}
          >
            <div className="text-white text-center">
              <X className="w-16 h-16 mx-auto mb-2" />
              <div className="text-2xl font-bold">PASS</div>
            </div>
          </div>
        </>
      )}

      <Card 
        ref={cardRef}
        className="w-full max-w-sm mx-auto shadow-2xl border-0 bg-white overflow-hidden cursor-grab active:cursor-grabbing"
        style={{
          transform: `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${rotation}deg)`,
          opacity,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out, opacity 0.3s ease-out'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <CardContent className="p-0">
          {/* Header with gradient background */}
          <div 
            className={`bg-gradient-to-r ${getRiskColor(stock.riskLevel)} text-white p-6 relative overflow-hidden`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold leading-tight">{stock.companyName}</h2>
                  <p className="text-white/90 font-medium text-lg">({stock.ticker})</p>
                </div>
                <Badge className="bg-white/20 text-white border-white/30 font-semibold px-3 py-1">
                  {getRiskEmoji(stock.riskLevel)} {stock.riskLevel.toUpperCase()}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-white/90">
                <Building className="w-4 h-4" />
                <span className="text-sm">{stock.sector}</span>
                <TrendingUp className="w-4 h-4 ml-2" />
                <span className={`text-sm font-semibold ${stock.oneYearReturn >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                  {stock.oneYearReturn > 0 ? '+' : ''}{stock.oneYearReturn.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* CEO Section */}
          <div className="p-6 bg-gradient-to-r from-gray-50 to-blue-50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{stock.ceoName}</h3>
                <p className="text-sm text-gray-600">Chief Executive Officer</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {stock.ceoHighlights}
            </p>
          </div>

          {/* Financials Grid */}
          <div className="p-6 bg-white">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Key Metrics
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl text-center">
                <p className="text-xs text-blue-600 font-medium mb-1">P/E Ratio</p>
                <p className="text-xl font-bold text-blue-700">{stock.peRatio}</p>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl text-center">
                <p className="text-xs text-purple-600 font-medium mb-1">Market Cap</p>
                <p className="text-xl font-bold text-purple-700">{stock.marketCap}</p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl text-center">
                <p className="text-xs text-green-600 font-medium mb-1">Price/Share</p>
                <p className="text-xl font-bold text-green-700">{formatNumber(stock.pricePerShare)}</p>
              </div>
              {stock.dividendYield > 0 && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-100 p-4 rounded-xl text-center">
                  <p className="text-xs text-orange-600 font-medium mb-1">Dividend</p>
                  <p className="text-xl font-bold text-orange-700">{stock.dividendYield.toFixed(2)}%</p>
                </div>
              )}
            </div>
          </div>

          {/* Why it fits section */}
          <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-lg">💡</span>
              Why this matches you
            </h4>
            <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-white/50">
              <p className="text-sm text-gray-700 leading-relaxed">
                {stock.whyItFits}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TinderStockCard;
