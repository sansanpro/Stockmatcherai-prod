import { useState, useRef, useEffect } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StockRecommendation } from '@/types/stock-matcher';
import { Heart, X, TrendingUp, DollarSign, Building, Eye, Minimize2, ThumbsUp, ChevronLeft, ChevronRight } from 'lucide-react';
import EducationalTooltip from '@/components/EducationalTooltip';
import DataFreshnessIndicator from '@/components/DataFreshnessIndicator';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import StockNewsPill from '@/components/StockNewsPill';
import CompanySnapshot from '@/components/CompanySnapshot';

interface TinderStockCardProps {
  stock: StockRecommendation;
  onMatch: () => void;
  onPass: () => void;
  onViewDetails?: (stock: StockRecommendation) => void;
  isVisible?: boolean;
  zIndex?: number;
  scale?: number;
  isHighMatch?: boolean;
}

const TinderStockCard = ({ 
  stock, 
  onMatch, 
  onPass, 
  onViewDetails,
  isVisible = true, 
  zIndex = 1,
  scale = 1,
  isHighMatch = false
}: TinderStockCardProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isExiting, setIsExiting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const tapThreshold = 10; // pixels - if drag is less than this, it's a tap

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
    setHasDragged(false);
    setStartPos({ x: clientX, y: clientY });
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    
    const deltaX = clientX - startPos.x;
    const deltaY = clientY - startPos.y;
    
    // Check if we've moved enough to consider it a drag
    if (Math.abs(deltaX) > tapThreshold || Math.abs(deltaY) > tapThreshold) {
      setHasDragged(true);
    }
    
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleEnd = () => {
    if (!isDragging) return;
    
    const threshold = 100;
    
    // If it was a tap (not a drag), expand the card
    if (!hasDragged && Math.abs(dragOffset.x) < tapThreshold && Math.abs(dragOffset.y) < tapThreshold) {
      setIsExpanded(true);
      setIsDragging(false);
      setDragOffset({ x: 0, y: 0 });
      return;
    }
    
    if (Math.abs(dragOffset.x) > threshold) {
      setIsExiting(true);
      const isMatch = dragOffset.x > 0;
      Haptics.impact({ style: isMatch ? ImpactStyle.Medium : ImpactStyle.Light }).catch(() => {});
      setTimeout(() => {
        if (isMatch) {
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
    if (isDragging) {
      e.preventDefault(); // Prevent background scrolling while swiping
    }
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

  // Render the expanded fullscreen content
  const renderExpandedContent = () => (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header with gradient background */}
      <div 
        className={`bg-gradient-to-r ${getRiskColor(stock.riskLevel)} text-white p-5 relative overflow-hidden flex-shrink-0`}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-3 gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-tight">{stock.companyName}</h2>
              <p className="text-white/90 font-medium text-lg">({stock.ticker})</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge className="bg-white/20 text-white border-white/30 font-semibold px-3 py-1.5 backdrop-blur-sm">
                {getRiskEmoji(stock.riskLevel)} {stock.riskLevel.toUpperCase()}
              </Badge>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 text-white/90 text-sm">
            <Building className="w-4 h-4" />
            <span>{stock.sector}</span>
            <TrendingUp className="w-4 h-4 ml-2" />
            <span className={`font-semibold ${stock.oneYearReturn >= 0 ? 'text-green-200' : 'text-red-200'}`}>
              {stock.oneYearReturn > 0 ? '+' : ''}{stock.oneYearReturn.toFixed(1)}%
            </span>
          </div>
          
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <DataFreshnessIndicator 
              lastUpdated={(stock as any).lastUpdated} 
              variant="inline"
              className="bg-black/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm"
            />
            <StockNewsPill ticker={stock.ticker} companyName={stock.companyName} />
          </div>
        </div>
      </div>

      {/* Company Snapshot - Expanded */}
      <CompanySnapshot 
        ticker={stock.ticker} 
        companyName={stock.companyName} 
        sector={stock.sector}
        variant="expanded" 
      />

      {/* Financials Grid */}
      <div className="p-5 bg-white dark:bg-gray-800">
        <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-xl">
          <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
          Key Metrics
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">P/E Ratio</p>
              <EducationalTooltip content="P/E Ratio compares a company's share price to its earnings per share. Lower values may indicate undervalued stocks." />
            </div>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stock.peRatio}</p>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-xl text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Market Cap</p>
              <EducationalTooltip content="Market Capitalization is the total value of all company shares. Larger caps are typically more stable." />
            </div>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stock.marketCap}</p>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-xl text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">Price/Share</p>
              <EducationalTooltip content="Current trading price per individual share of the company's stock." />
            </div>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatNumber(stock.pricePerShare)}</p>
          </div>
          {stock.dividendYield > 0 && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-100 dark:from-yellow-900/20 dark:to-orange-800/20 p-4 rounded-xl text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Dividend</p>
                <EducationalTooltip content="Dividend Yield shows the annual dividend payments as a percentage of the stock price. Higher yields provide more regular income." />
              </div>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{stock.dividendYield.toFixed(2)}%</p>
            </div>
          )}
        </div>
      </div>

      {/* Why it fits section */}
      <div className="p-5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 flex-1">
        <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-xl">
          <span className="text-xl">💡</span>
          Why this matches you
        </h4>
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-5 rounded-xl border border-white/50 dark:border-gray-600/50 shadow-lg">
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
            {stock.whyItFits}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Expanded fullscreen sheet */}
      <Sheet open={isExpanded} onOpenChange={setIsExpanded}>
        <SheetContent side="bottom" className="h-[95vh] p-0 rounded-t-3xl">
          <div className="flex items-center justify-between p-4 border-b bg-background sticky top-0 z-10">
            <h3 className="font-semibold text-lg">Stock Details</h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 active:scale-95 transition-all"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>
          {renderExpandedContent()}
        </SheetContent>
      </Sheet>

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
              background: isHighMatch
                ? 'linear-gradient(45deg, rgba(236, 72, 153, 0.9), rgba(219, 39, 119, 0.9))'
                : 'linear-gradient(45deg, rgba(59, 130, 246, 0.9), rgba(6, 182, 212, 0.9))'
            }}
          >
            <div className="text-white text-center animate-pulse">
              {isHighMatch ? (
                <Heart className="w-16 h-16 mx-auto mb-2 fill-current drop-shadow-lg" />
              ) : (
                <ThumbsUp className="w-16 h-16 mx-auto mb-2 drop-shadow-lg" />
              )}
              <div className="text-2xl font-bold drop-shadow-md">
                {isHighMatch ? 'MATCHED!' : 'LIKED!'}
              </div>
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
className={`w-full max-w-[min(95vw,400px)] md:max-w-[min(90vw,600px)] lg:max-w-[min(85vw,800px)] xl:max-w-[min(80vw,900px)] mx-auto shadow-2xl border-0 bg-card overflow-hidden cursor-grab active:cursor-grabbing transform-gpu ${
          isExiting ? 'animate-scale-out' : 'animate-scale-in'
        } h-full max-h-[70vh] sm:max-h-[75vh] md:max-h-[80vh] lg:max-h-[calc(100vh-10rem)] rounded-2xl flex flex-col relative`}
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
        {/* Faint edge chevrons when idle */}
        {!isDragging && !isExiting && (
          <>
            <div className="absolute left-1 top-1/2 -translate-y-1/2 z-10 opacity-15 pointer-events-none">
              <ChevronLeft className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="absolute right-1 top-1/2 -translate-y-1/2 z-10 opacity-15 pointer-events-none">
              <ChevronRight className="w-6 h-6 text-muted-foreground" />
            </div>
          </>
        )}
        <CardContent className="p-0 flex flex-col h-full overflow-y-auto">
          {/* Header with gradient background */}
          <div 
            className={`bg-gradient-to-r ${getRiskColor(stock.riskLevel)} text-white p-4 sm:p-5 lg:p-4 relative overflow-hidden rounded-t-2xl flex-shrink-0`}
          >
            <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-white/10 rounded-full -translate-y-6 sm:-translate-y-12 translate-x-6 sm:translate-x-12 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 sm:w-16 sm:h-16 bg-white/10 rounded-full translate-y-4 sm:translate-y-8 -translate-x-4 sm:-translate-x-8 animate-pulse delay-75"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-3 gap-2">
              <div className="flex-1 min-w-0 animate-fade-in">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold leading-tight truncate">{stock.companyName}</h2>
                  <p className="text-white/90 font-medium text-sm sm:text-base lg:text-lg">({stock.ticker})</p>
                </div>
                <div className="flex items-center gap-2 animate-fade-in delay-100 flex-shrink-0">
                  <Badge className="bg-white/20 text-white border-white/30 font-semibold px-2 py-1 backdrop-blur-sm text-xs whitespace-nowrap">
                    {getRiskEmoji(stock.riskLevel)} {stock.riskLevel.toUpperCase()}
                  </Badge>
                  <EducationalTooltip 
                    content={`Risk Level indicates volatility: Low = stable returns, Medium = some fluctuation, High = potential for large gains/losses`}
                    className="text-white/70 hover:text-white transition-colors"
                  />
                  {onViewDetails && (
                    <button
                      onClick={handleViewDetails}
                      className="bg-white/20 hover:bg-white/30 text-white p-1 sm:p-2 rounded-full transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 text-white/90 animate-fade-in delay-200 text-xs sm:text-sm">
                <Building className="w-4 h-4" />
                <span>{stock.sector}</span>
                <TrendingUp className="w-4 h-4 ml-2" />
                <span className={`font-semibold transition-colors ${stock.oneYearReturn >= 0 ? 'text-green-200' : 'text-red-200'}`}>{stock.oneYearReturn > 0 ? '+' : ''}{stock.oneYearReturn.toFixed(1)}%</span>
                <EducationalTooltip 
                  content="1-Year Return shows how much the stock price has changed over the past 12 months"
                  className="text-white/70 hover:text-white transition-colors"
                />
              </div>
              
              <div className="mt-2 flex flex-wrap items-center gap-2 animate-fade-in delay-300">
                <DataFreshnessIndicator 
                  lastUpdated={(stock as any).lastUpdated} 
                  variant="inline"
                  className="bg-black/20 backdrop-blur-sm rounded-full px-2 py-1 text-xs"
                />
                <StockNewsPill ticker={stock.ticker} companyName={stock.companyName} />
              </div>
            </div>
          </div>

          {/* Company Snapshot - Compact */}
          <CompanySnapshot 
            ticker={stock.ticker} 
            companyName={stock.companyName} 
            sector={stock.sector}
            variant="compact" 
          />

          {/* Why it fits section - More prominent */}
          <div className="p-4 sm:p-6 lg:p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 animate-fade-in delay-400 flex-shrink-0">
            <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-base sm:text-lg lg:text-xl">
              <span className="text-lg lg:text-xl">💡</span>
              Why this matches you
            </h4>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 sm:p-5 lg:p-4 rounded-xl border border-white/50 dark:border-gray-600/50 shadow-lg">
              <p className="text-sm sm:text-base lg:text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                {stock.whyItFits}
              </p>
            </div>

            {/* Tap to expand hint */}
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 animate-pulse">
                Tap to expand • Swipe to match or pass
              </p>
            </div>
          </div>

          {/* Financials Grid */}
          <div className="p-4 sm:p-6 lg:p-3 bg-white dark:bg-gray-800 animate-fade-in delay-500">
            <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-base sm:text-lg lg:text-xl">
              <DollarSign className="w-5 h-5 lg:w-6 lg:h-6 text-green-600 dark:text-green-400" />
              Key Metrics
            </h4>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-3">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-3 sm:p-4 lg:p-3 rounded-xl text-center transform hover:scale-105 transition-all duration-200">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <p className="text-xs sm:text-sm lg:text-base text-blue-600 dark:text-blue-400 font-medium">P/E Ratio</p>
                  <EducationalTooltip
                    content="P/E Ratio compares a company's share price to its earnings per share. Lower values may indicate undervalued stocks."
                  />
                </div>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-700 dark:text-blue-300">{stock.peRatio}</p>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-3 sm:p-4 lg:p-3 rounded-xl text-center transform hover:scale-105 transition-all duration-200">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <p className="text-xs sm:text-sm lg:text-base text-purple-600 dark:text-purple-400 font-medium">Market Cap</p>
                  <EducationalTooltip
                    content="Market Capitalization is the total value of all company shares. Larger caps are typically more stable."
                  />
                </div>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-700 dark:text-purple-300">{stock.marketCap}</p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-3 sm:p-4 lg:p-3 rounded-xl text-center transform hover:scale-105 transition-all duration-200">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <p className="text-xs sm:text-sm lg:text-base text-green-600 dark:text-green-400 font-medium">Price/Share</p>
                  <EducationalTooltip
                    content="Current trading price per individual share of the company's stock."
                  />
                </div>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-700 dark:text-green-300">{formatNumber(stock.pricePerShare)}</p>
              </div>
              {stock.dividendYield > 0 && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-100 dark:from-yellow-900/20 dark:to-orange-800/20 p-3 sm:p-4 lg:p-3 rounded-xl text-center transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <p className="text-xs sm:text-sm lg:text-base text-orange-600 dark:text-orange-400 font-medium">Dividend</p>
                    <EducationalTooltip
                      content="Dividend Yield shows the annual dividend payments as a percentage of the stock price. Higher yields provide more regular income."
                    />
                  </div>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-700 dark:text-orange-300">{stock.dividendYield.toFixed(2)}%</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  );
};

export default TinderStockCard;
