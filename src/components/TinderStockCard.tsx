import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { StockRecommendation } from '@/types/stock-matcher';
import { Heart, X, TrendingUp, DollarSign, Building, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import EducationalTooltip from '@/components/EducationalTooltip';
import DataFreshnessIndicator from '@/components/DataFreshnessIndicator';

interface TinderStockCardProps {
  stock: StockRecommendation;
  onMatch: () => void;
  onPass: () => void;
  onViewDetails?: (stock: StockRecommendation) => void;
  isVisible?: boolean;
  zIndex?: number;
  scale?: number;
}

const TinderStockCard = ({ 
  stock, 
  onMatch, 
  onPass, 
  onViewDetails,
  isVisible = true, 
  zIndex = 1,
  scale = 1 
}: TinderStockCardProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isExiting, setIsExiting] = useState(false);
  const [isCeoExpanded, setIsCeoExpanded] = useState(false);
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

  const getCeoInitials = (ceoName: string) => {
    return ceoName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
      setIsExiting(true);
      setTimeout(() => {
        if (dragOffset.x > 0) {
          onMatch();
        } else {
          onPass();
        }
      }, 200);
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
    
    setIsDragging(false);
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(stock);
    }
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
  const opacity = isExiting ? 0 : Math.max(0.7, 1 - Math.abs(dragOffset.x) / 300);
  const cardScale = isExiting ? 0.8 : scale;

  return (
    <div 
      className={`absolute inset-0 transition-all duration-500 ease-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ 
        zIndex,
        transform: `scale(${cardScale})`,
        filter: zIndex === 1 ? 'none' : 'brightness(0.9)',
      }}
    >
      {/* Overlay indicators */}
      {isDragging && (
        <>
          <div 
            className={`absolute inset-0 rounded-3xl flex items-center justify-center z-10 transition-all duration-200 ${
              dragOffset.x > 50 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
            style={{
              background: 'linear-gradient(45deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.9))'
            }}
          >
            <div className="text-white text-center animate-pulse">
              <Heart className="w-16 h-16 mx-auto mb-2 fill-current drop-shadow-lg" />
              <div className="text-2xl font-bold drop-shadow-md">MATCH!</div>
            </div>
          </div>
          
          <div 
            className={`absolute inset-0 rounded-3xl flex items-center justify-center z-10 transition-all duration-200 ${
              dragOffset.x < -50 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
            style={{
              background: 'linear-gradient(45deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))'
            }}
          >
            <div className="text-white text-center animate-pulse">
              <X className="w-16 h-16 mx-auto mb-2 drop-shadow-lg" />
              <div className="text-2xl font-bold drop-shadow-md">PASS</div>
            </div>
          </div>
        </>
      )}

      <Card 
        ref={cardRef}
        className={`w-full max-w-[min(95vw,400px)] md:max-w-xl lg:max-w-3xl xl:max-w-4xl mx-auto shadow-2xl border-0 bg-card overflow-hidden cursor-grab active:cursor-grabbing transform-gpu ${
          isExiting ? 'animate-scale-out' : 'animate-scale-in'
        } h-full rounded-xl sm:rounded-2xl flex flex-col relative`}
        style={{
          transform: `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${rotation}deg)`,
          opacity,
          transition: isDragging || isExiting ? 'none' : 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-out'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <CardContent className="p-0 flex flex-col h-full overflow-y-auto">
          {/* Header with gradient background - Compact on mobile */}
          <div 
            className={`bg-gradient-to-r ${getRiskColor(stock.riskLevel)} text-white p-2.5 sm:p-4 lg:p-4 relative overflow-hidden rounded-t-xl sm:rounded-t-2xl flex-shrink-0`}
          >
            <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 lg:w-24 lg:h-24 bg-white/10 rounded-full -translate-y-4 sm:-translate-y-6 lg:-translate-y-12 translate-x-4 sm:translate-x-6 lg:translate-x-12 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-white/10 rounded-full translate-y-2 sm:translate-y-4 lg:translate-y-8 -translate-x-2 sm:-translate-x-4 lg:-translate-x-8 animate-pulse delay-75"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-1.5 sm:mb-2 lg:mb-3 gap-2">
              <div className="flex-1 min-w-0 animate-fade-in">
                  <h2 className="text-sm sm:text-lg lg:text-2xl font-bold leading-tight truncate">{stock.companyName}</h2>
                  <p className="text-white/90 font-medium text-xs sm:text-sm lg:text-lg">({stock.ticker})</p>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 animate-fade-in delay-100 flex-shrink-0">
                  <Badge className="bg-white/20 text-white border-white/30 font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 backdrop-blur-sm text-[10px] sm:text-xs whitespace-nowrap">
                    {getRiskEmoji(stock.riskLevel)} {stock.riskLevel.toUpperCase()}
                  </Badge>
                  <EducationalTooltip 
                    content={`Risk Level indicates volatility: Low = stable returns, Medium = some fluctuation, High = potential for large gains/losses`}
                    className="text-white/70 hover:text-white transition-colors hidden sm:block"
                  />
                  {onViewDetails && (
                    <button
                      onClick={handleViewDetails}
                      className="bg-white/20 hover:bg-white/30 text-white p-1 rounded-full transition-colors"
                    >
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-white/90 animate-fade-in delay-200 text-[10px] sm:text-xs">
                <Building className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{stock.sector}</span>
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                <span className={`font-semibold transition-colors ${stock.oneYearReturn >= 0 ? 'text-green-200' : 'text-red-200'}`}>{stock.oneYearReturn > 0 ? '+' : ''}{stock.oneYearReturn.toFixed(1)}%</span>
                <EducationalTooltip 
                  content="1-Year Return shows how much the stock price has changed over the past 12 months"
                  className="text-white/70 hover:text-white transition-colors hidden sm:block"
                />
              </div>
              
              <div className="mt-1 sm:mt-2 animate-fade-in delay-300">
                <DataFreshnessIndicator 
                  lastUpdated={(stock as any).lastUpdated} 
                  variant="inline"
                  className="bg-black/20 backdrop-blur-sm rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-xs"
                />
              </div>
            </div>
          </div>

          {/* CEO Section with Stylish Initials - Compact on mobile */}
          <div className="p-2.5 sm:p-4 lg:p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 animate-fade-in delay-300">
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-5 mb-2 sm:mb-3">
              <div className="w-10 h-10 sm:w-14 sm:h-14 lg:w-20 lg:h-20 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full flex items-center justify-center shadow-lg border-2 border-white ring-2 ring-blue-500/20 flex-shrink-0">
                <span className="text-white font-bold text-sm sm:text-lg lg:text-2xl tracking-wide">
                  {getCeoInitials(stock.ceoName)}
                </span>
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-base lg:text-xl truncate">{stock.ceoName}</h3>
                <p className="text-[10px] sm:text-xs lg:text-base text-gray-600 dark:text-gray-300">CEO</p>
                <p className="text-[9px] sm:text-xs lg:text-sm text-gray-500 dark:text-gray-400 truncate">{stock.companyName}</p>
              </div>
            </div>
            <div className="relative">
              <p className={`text-[10px] sm:text-xs lg:text-base text-gray-700 dark:text-gray-300 leading-relaxed ${
                isCeoExpanded ? '' : 'line-clamp-3 sm:line-clamp-6'
              } transition-all duration-300`}>
                {stock.ceoHighlights}
              </p>
              {stock.ceoHighlights.split('\n').length > 3 || stock.ceoHighlights.length > 200 ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCeoExpanded(!isCeoExpanded);
                  }}
                  className="mt-1 sm:mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-[10px] sm:text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  {isCeoExpanded ? (
                    <>
                      Less <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" />
                    </>
                  ) : (
                    <>
                      More <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                    </>
                  )}
                </button>
              ) : null}
            </div>
          </div>

          {/* Financials Grid - Compact on mobile */}
          <div className="p-2.5 sm:p-4 lg:p-3 bg-white dark:bg-gray-800 animate-fade-in delay-400">
            <h4 className="font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 lg:mb-4 flex items-center gap-1 sm:gap-2 text-xs sm:text-base lg:text-xl">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-600 dark:text-green-400" />
              Key Metrics
            </h4>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-3">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-2 sm:p-3 lg:p-3 rounded-lg sm:rounded-xl text-center">
                <div className="flex items-center justify-center gap-0.5 sm:gap-1 mb-0.5 sm:mb-1">
                  <p className="text-[10px] sm:text-xs lg:text-base text-blue-600 dark:text-blue-400 font-medium">P/E Ratio</p>
                  <EducationalTooltip 
                    content="P/E Ratio compares a company's share price to its earnings per share. Lower values may indicate undervalued stocks."
                    className="hidden sm:block"
                  />
                </div>
                <p className="text-sm sm:text-lg lg:text-2xl font-bold text-blue-700 dark:text-blue-300">{stock.peRatio}</p>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-2 sm:p-3 lg:p-3 rounded-lg sm:rounded-xl text-center">
                <div className="flex items-center justify-center gap-0.5 sm:gap-1 mb-0.5 sm:mb-1">
                  <p className="text-[10px] sm:text-xs lg:text-base text-purple-600 dark:text-purple-400 font-medium">Market Cap</p>
                  <EducationalTooltip 
                    content="Market Capitalization is the total value of all company shares. Larger caps are typically more stable."
                    className="hidden sm:block"
                  />
                </div>
                <p className="text-sm sm:text-lg lg:text-2xl font-bold text-purple-700 dark:text-purple-300">{stock.marketCap}</p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-2 sm:p-3 lg:p-3 rounded-lg sm:rounded-xl text-center">
                <div className="flex items-center justify-center gap-0.5 sm:gap-1 mb-0.5 sm:mb-1">
                  <p className="text-[10px] sm:text-xs lg:text-base text-green-600 dark:text-green-400 font-medium">Price/Share</p>
                  <EducationalTooltip 
                    content="Current trading price per individual share of the company's stock."
                    className="hidden sm:block"
                  />
                </div>
                <p className="text-sm sm:text-lg lg:text-2xl font-bold text-green-700 dark:text-green-300">{formatNumber(stock.pricePerShare)}</p>
              </div>
              {stock.dividendYield > 0 && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-100 dark:from-yellow-900/20 dark:to-orange-800/20 p-2 sm:p-3 lg:p-3 rounded-lg sm:rounded-xl text-center">
                  <div className="flex items-center justify-center gap-0.5 sm:gap-1 mb-0.5 sm:mb-1">
                    <p className="text-[10px] sm:text-xs lg:text-base text-orange-600 dark:text-orange-400 font-medium">Dividend</p>
                    <EducationalTooltip 
                      content="Dividend Yield shows the annual dividend payments as a percentage of the stock price. Higher yields provide more regular income."
                      className="hidden sm:block"
                    />
                  </div>
                  <p className="text-sm sm:text-lg lg:text-2xl font-bold text-orange-700 dark:text-orange-300">{stock.dividendYield.toFixed(2)}%</p>
                </div>
              )}
            </div>
          </div>

          {/* Why it fits section - Compact on mobile */}
          <div className="p-2.5 sm:p-4 lg:p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 animate-fade-in delay-500 flex-shrink-0">
            <h4 className="font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2 text-xs sm:text-base lg:text-xl">
              <span className="text-sm sm:text-lg lg:text-xl">💡</span>
              Why this matches you
            </h4>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-2.5 sm:p-4 lg:p-4 rounded-lg sm:rounded-xl border border-white/50 dark:border-gray-600/50 shadow-lg">
              <p className="text-[10px] sm:text-sm lg:text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
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
