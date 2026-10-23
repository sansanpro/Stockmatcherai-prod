import { useState } from 'react';
import { ExternalLink, Building2, Users, Calendar, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { useCompanyProfile, extractMission, formatEmployeeCount, formatIPODate, formatHeadquarters } from '@/hooks/useCompanyProfile';
import { Skeleton } from '@/components/ui/skeleton';
import StockNewsPill from '@/components/StockNewsPill';

interface CompanySnapshotProps {
  ticker: string;
  companyName: string;
  sector?: string;
  variant?: 'compact' | 'expanded';
}

const CompanySnapshot = ({ ticker, companyName, sector, variant = 'compact' }: CompanySnapshotProps) => {
  const { profile, isLoading, error } = useCompanyProfile(ticker);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset image error when profile changes. FMP's logo CDN needs no API key or quota,
  // so it still shows a logo when the profile request fails.
  const currentImageUrl = profile?.image || `https://images.financialmodelingprep.com/symbol/${ticker.toUpperCase()}.png`;
  const [lastImageUrl, setLastImageUrl] = useState<string | undefined>(undefined);
  
  if (currentImageUrl !== lastImageUrl) {
    setLastImageUrl(currentImageUrl);
    setImageError(false);
    setImageLoaded(false);
  }

  // Get ticker initials as fallback for logo
  const getTickerInitials = (tickerSymbol: string) => {
    return tickerSymbol.slice(0, 2).toUpperCase();
  };

  // Render logo with fallback
  const renderLogo = (size: 'sm' | 'lg' = 'sm') => {
    const sizeClasses = size === 'lg' 
      ? 'w-20 h-20 text-2xl' 
      : 'w-14 h-14 sm:w-16 sm:h-16 text-lg sm:text-xl';

    const initials = (
      <div className={`${sizeClasses} bg-sand rounded-xl flex items-center justify-center shadow-sm border border-line flex-shrink-0`}>
        <span className="text-ink-soft font-bold tracking-wide">
          {getTickerInitials(ticker)}
        </span>
      </div>
    );

    if (imageError) return initials;

    // Show initials until the logo has loaded (Finnhub logos redirect and can take a moment),
    // instead of an empty white tile
    return (
      <div className="relative flex-shrink-0">
        {!imageLoaded && initials}
        <div className={`${sizeClasses} rounded-xl overflow-hidden bg-white shadow-sm border border-line ${imageLoaded ? '' : 'absolute inset-0 opacity-0'}`}>
          <img
            src={currentImageUrl}
            alt={`${companyName} logo`}
            className="w-full h-full object-contain p-1"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        </div>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-4 bg-sand/60 animate-pulse">
        <div className="flex items-center gap-3 sm:gap-4 mb-3">
          <Skeleton className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl" />
          <div className="flex-1">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    const mission = profile?.description ? extractMission(profile.description) : null;
    const displayIndustry = profile?.industry || sector || 'Company';
    const ipoYear = profile?.ipoDate ? formatIPODate(profile.ipoDate) : null;

    return (
      <div className="p-4 sm:p-6 lg:p-4 bg-sand/60 animate-fade-in delay-300">
        <div className="flex items-start gap-3 sm:gap-4 lg:gap-5 mb-3">
          {renderLogo('sm')}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-ink text-base sm:text-lg lg:text-xl truncate">
              {companyName || profile?.companyName}
            </h3>
            <p className="text-xs sm:text-sm lg:text-base text-ink-soft">
              {displayIndustry} {ipoYear && `• ${ipoYear}`}
            </p>
          </div>
        </div>

        {/* Mission/Description */}
        {mission && (
          <p className="text-xs sm:text-sm lg:text-base text-ink-soft leading-relaxed mb-3 line-clamp-2 italic">
            "{mission}..."
          </p>
        )}

        {/* Quick Facts Row */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-ink-faint">
          <StockNewsPill ticker={ticker} companyName={companyName} />
          
          {profile?.website && (
            <a 
              href={profile.website} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Website</span>
            </a>
          )}
          
          {profile?.city && (
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              {formatHeadquarters(profile.city, profile.state)}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Expanded variant
  const description = profile?.description || `${companyName} is a company in the ${sector || 'market'} sector.`;
  const showExpandButton = description.length > 300;
  
  return (
    <div className="p-5 bg-sand/60">
      {/* Header with large logo */}
      <div className="flex items-center gap-4 mb-4">
        {renderLogo('lg')}
        <div>
          <h3 className="font-bold text-ink text-xl">
            {companyName || profile?.companyName}
          </h3>
          <p className="text-sm text-ink-soft">
            {profile?.industry || sector || 'Company'}
          </p>
          {profile?.country && (
            <p className="text-sm text-ink-faint">
              {formatHeadquarters(profile.city, profile.state, profile.country)}
            </p>
          )}
        </div>
      </div>

      {/* About Section */}
      <div className="mb-4">
        <h4 className="font-semibold text-ink mb-2 text-sm uppercase tracking-wide">
          About {companyName || profile?.companyName}
        </h4>
        <p className={`text-base text-ink-soft leading-relaxed ${
          !isDescriptionExpanded && showExpandButton ? 'line-clamp-4' : ''
        }`}>
          {description}
        </p>
        {showExpandButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsDescriptionExpanded(!isDescriptionExpanded);
            }}
            className="mt-2 text-primary hover:text-clay-ink text-sm font-medium flex items-center gap-1 transition-colors"
          >
            {isDescriptionExpanded ? (
              <>Show less <ChevronUp className="w-4 h-4" /></>
            ) : (
              <>Read more <ChevronDown className="w-4 h-4" /></>
            )}
          </button>
        )}
      </div>

      {/* Facts Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {profile?.ipoDate && (
          <div className="bg-white border border-line rounded-xl p-3 text-center">
            <Calendar className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xs text-ink-faint">Went Public</p>
            <p className="font-semibold text-ink text-sm">
              {new Date(profile.ipoDate).getUTCFullYear() || 'N/A'}
            </p>
          </div>
        )}
        
        {profile?.fullTimeEmployees && (
          <div className="bg-white border border-line rounded-xl p-3 text-center">
            <Users className="w-5 h-5 mx-auto mb-1 text-[#3B6A2A]" />
            <p className="text-xs text-ink-faint">Employees</p>
            <p className="font-semibold text-ink text-sm">
              {formatEmployeeCount(profile.fullTimeEmployees)}
            </p>
          </div>
        )}
        
        {(profile?.city || profile?.country) && (
          <div className="bg-white border border-line rounded-xl p-3 text-center">
            <Building2 className="w-5 h-5 mx-auto mb-1 text-[#2C5288]" />
            <p className="text-xs text-ink-faint">Headquarters</p>
            <p className="font-semibold text-ink text-sm truncate">
              {profile.city || profile.state || profile.country || 'N/A'}
            </p>
          </div>
        )}
      </div>

      {/* Website Link */}
      {profile?.website && (
        <a 
          href={profile.website} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors mb-4"
        >
          <Globe className="w-4 h-4" />
          Visit Website
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}

      {/* News Section */}
      <div className="pt-3 border-t border-line">
        <h4 className="font-semibold text-ink mb-2 text-sm uppercase tracking-wide flex items-center gap-2">
          📰 Latest News
        </h4>
        <StockNewsPill ticker={ticker} companyName={companyName} />
      </div>
    </div>
  );
};

export default CompanySnapshot;
