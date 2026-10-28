import { useState, useRef, useEffect } from 'react';
import { capitalize } from '@/lib/utils';
import { useLiveQuote } from '@/hooks/useLiveQuote';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Card, CardContent } from '@/components/ui/card';
import { StockRecommendation } from '@/types/stock-matcher';
import { Heart, X, Eye, Minimize2, ThumbsUp } from 'lucide-react';
import DataFreshnessIndicator from '@/components/DataFreshnessIndicator';
import { Sheet, SheetContent, keepOpenForAIAssistant } from '@/components/ui/sheet';
import StockNewsPill from '@/components/StockNewsPill';
import CompanySnapshot from '@/components/CompanySnapshot';
import CompanyLogo from '@/components/values/CompanyLogo';
import CauseChips, { causeTone } from '@/components/values/CauseChips';
import ValuesSummary from '@/components/values/ValuesSummary';
import { CautionChip, CautionNote } from '@/components/values/Caution';
import KeyNumbers from '@/components/values/KeyNumbers';


const timeAgo = (iso?: string) => {
  if (!iso) return '';
  const hours = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

interface TinderStockCardProps {
  stock: StockRecommendation;
  onMatch: () => void;
  onPass: () => void;
  onViewDetails?: (stock: StockRecommendation) => void;
  isVisible?: boolean;
  zIndex?: number;
  scale?: number;
  isHighMatch?: boolean;
  // Only the top card refreshes its price on demand
  isActive?: boolean;
  // For people who have never bought a stock: a short meaning under each number
  explain?: boolean;
}

const TinderStockCard = ({ 
  stock, 
  onMatch, 
  onPass, 
  onViewDetails,
  isVisible = true, 
  zIndex = 1,
  scale = 1,
  isHighMatch = false,
  isActive = false,
  explain = false,
}: TinderStockCardProps) => {
  const live = useLiveQuote(stock.ticker, stock.pricePerShare, stock.lastUpdated, isActive);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isExiting, setIsExiting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const tapThreshold = 10; // pixels - if drag is less than this, it's a tap

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

  // Taps on buttons/links inside the card (details, tooltips, news, carousel) shouldn't also
  // count as a tap on the card, which would expand it on top of whatever the button opens
  const startsOnControl = (target: EventTarget) =>
    target instanceof Element && !!target.closest('button, a, input, [role="button"]');

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    if (startsOnControl(e.target)) return;
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
    if (startsOnControl(e.target)) return;
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

  const isUpdate = stock.cardType === 'update' && !!stock.update;
  const primaryCause = stock.cause ?? stock.matchedCauses?.[0]?.cause;

  // Logo, name and the causes it matches, on a soft tint of the cause's color
  const header = (large = false) => (
    <div className={`${causeTone(primaryCause).header} text-ink ${large ? 'p-5' : 'p-4'} flex-shrink-0`}>
      <div className="flex items-start gap-3">
        <CompanyLogo src={stock.logoUrl} name={stock.companyName} ticker={stock.ticker} className={large ? 'w-14 h-14' : 'w-12 h-12'} />
        <div className="flex-1 min-w-0">
          <h2 className={`${large ? 'text-2xl' : 'text-xl'} font-bold leading-tight truncate`}>{stock.companyName}</h2>
          <p className="text-ink-soft text-sm">{stock.ticker}{stock.sector ? ` · ${capitalize(stock.sector)}` : ''}</p>
        </div>
        {!large && onViewDetails && (
          <button
            onClick={handleViewDetails}
            aria-label="View stock details"
            className="bg-surface/85 hover:bg-surface text-ink-soft border border-ink/5 w-10 h-10 flex items-center justify-center rounded-full shadow-sm transition-colors flex-shrink-0"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="mt-3">
        {isUpdate ? (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-white border border-line text-ink">
            📰 News on a company you liked
          </span>
        ) : (
          <CauseChips causes={stock.matchedCauses} />
        )}
        {stock.caution && <div className="mt-2"><CautionChip caution={stock.caution} /></div>}
      </div>
    </div>
  );

  // Update cards: the news, and why the user liked the company in the first place
  const updateBody = isUpdate && (
    <div className="space-y-3">
      <CautionNote caution={stock.caution} />
      <div className="rounded-xl bg-sand border border-line p-3">
        <p className="text-[0.9375rem] font-semibold leading-snug text-ink">{stock.update!.headline}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {[stock.update!.source, timeAgo(stock.update!.publishedAt)].filter(Boolean).join(' · ')}
        </p>
        {stock.update!.url && (
          <a href={stock.update!.url} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-sm font-semibold text-primary underline">
            Read it{stock.update!.source ? ` on ${stock.update!.source}` : ''} ↗
          </a>
        )}
      </div>
      {stock.missionStory && (
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground">Why you liked it</p>
          <p className="text-sm text-ink mt-1 leading-snug">{stock.missionStory}</p>
        </div>
      )}
    </div>
  );

  // Each matched cause's one-line reason
  const whyLines = !isUpdate && (stock.matchedCauses ?? []).some(c => c.whyLine) && (
    <div>
      <p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Why it matches you</p>
      <ul className="space-y-1 text-sm text-ink">
        {(stock.matchedCauses ?? []).filter(c => c.whyLine).map(c => (
          <li key={c.cause}><span aria-hidden>{c.icon}</span> {c.whyLine}</li>
        ))}
      </ul>
    </div>
  );

  const rotation = dragOffset.x * 0.1;
  const opacity = isExiting ? 0 : Math.max(0.7, 1 - Math.abs(dragOffset.x) / 300);
  const cardScale = isExiting ? 0.8 : scale;

  // Tapping the card opens everything, with the meaning of every number spelled out
  const renderExpandedContent = () => (
    <div className="flex flex-col h-full overflow-y-auto">
      {header(true)}
      <div className="p-5 space-y-5">
        {updateBody}
        <ValuesSummary stock={stock} />
        {whyLines}
        <KeyNumbers stock={stock} price={live.price} explain />
        <div className="flex flex-wrap items-center gap-2">
          <DataFreshnessIndicator lastUpdated={live.lastUpdated} variant="inline" className="bg-muted rounded-full px-3 py-1.5 text-sm" />
          <StockNewsPill ticker={stock.ticker} companyName={stock.companyName} />
        </div>
      </div>
      <CompanySnapshot ticker={stock.ticker} companyName={stock.companyName} sector={stock.sector} variant="expanded" />
      <p className="text-center text-xs text-muted-foreground py-4">Educational only, not investment advice.</p>
    </div>
  );

  return (
    <>
      {/* Expanded fullscreen sheet */}
      <Sheet open={isExpanded} onOpenChange={setIsExpanded} modal={false}>
        <SheetContent side="bottom" className="h-[95vh] p-0 rounded-t-3xl z-[65]" onInteractOutside={keepOpenForAIAssistant}>
          <div className="flex items-center justify-between p-4 border-b bg-background sticky top-0 z-10">
            <h3 className="font-semibold text-lg">Stock Details</h3>
            <button
              onClick={() => setIsExpanded(false)}
              aria-label="Collapse stock details"
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
          filter: isActive ? 'none' : 'brightness(0.94)', // only the cards behind are dimmed
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
              background: 'linear-gradient(45deg, rgba(181, 74, 34, 0.92), rgba(138, 58, 24, 0.92))'
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
              background: 'linear-gradient(45deg, rgba(31, 26, 21, 0.82), rgba(70, 60, 50, 0.82))'
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
className={`w-full max-w-[min(95vw,400px)] md:max-w-[min(90vw,600px)] lg:max-w-[min(85vw,800px)] xl:max-w-[min(80vw,900px)] mx-auto shadow-[0_18px_40px_rgb(var(--primary-deep)/0.16)] border border-line bg-surface overflow-hidden cursor-grab active:cursor-grabbing transform-gpu ${
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
        <CardContent className="p-0 flex flex-col h-full overflow-y-auto">
          {/* Story first: who they are and what they work on, then proof, then the numbers */}
          {header()}
          <div className="p-4 space-y-4">
            {updateBody}
            {!isUpdate && <ValuesSummary stock={stock} compact />}
            <KeyNumbers stock={stock} price={live.price} explain={explain} />
            <div className="flex flex-wrap items-center gap-2">
              <DataFreshnessIndicator lastUpdated={live.lastUpdated} variant="inline" className="bg-muted rounded-full px-2.5 py-1 text-xs" />
              <StockNewsPill ticker={stock.ticker} companyName={stock.companyName} />
            </div>
            <p className="text-center text-xs text-muted-foreground pb-1">
              Tap for the full picture · Swipe right if you'd be proud to own a piece
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  );
};

export default TinderStockCard;
