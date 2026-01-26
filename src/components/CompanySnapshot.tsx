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

  // Reset image error when profile changes
  const currentImageUrl = profile?.image;
  const [lastImageUrl, setLastImageUrl] = useState<string | undefined>(undefined);
  
  if (currentImageUrl !== lastImageUrl) {
    setLastImageUrl(currentImageUrl);
    setImageError(false);
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

    const hasValidImage = profile?.image && !imageError;

    if (hasValidImage) {
      return (
        <div className={`${sizeClasses} rounded-xl overflow-hidden bg-white shadow-lg border-2 border-white ring-2 ring-blue-500/20 flex-shrink-0`}>
          <img 
            src={profile.image} 
            alt={`${companyName} logo`}
            className="w-full h-full object-contain p-1"
            onError={() => setImageError(true)}
          />
        </div>
      );
    }

    return (
      <div className={`${sizeClasses} bg-gradient-to-br from-blue-600 to-indigo-800 rounded-xl flex items-center justify-center shadow-lg border-2 border-white ring-2 ring-blue-500/20 flex-shrink-0`}>
        <span className="text-white font-bold tracking-wide">
          {getTickerInitials(ticker)}
        </span>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 animate-pulse">
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
      <div className="p-4 sm:p-6 lg:p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 animate-fade-in delay-300">
        <div className="flex items-start gap-3 sm:gap-4 lg:gap-5 mb-3">
          {renderLogo('sm')}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg lg:text-xl truncate">
              {profile?.companyName || companyName}
            </h3>
            <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-300">
              {displayIndustry} {ipoYear && `• ${ipoYear}`}
            </p>
          </div>
        </div>

        {/* Mission/Description */}
        {mission && (
          <p className="text-xs sm:text-sm lg:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-3 line-clamp-2 italic">
            "{mission}..."
          </p>
        )}

        {/* Quick Facts Row */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          <StockNewsPill ticker={ticker} companyName={companyName} />
          
          {profile?.website && (
            <a 
              href={profile.website} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
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
    <div className="p-5 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600">
      {/* Header with large logo */}
      <div className="flex items-center gap-4 mb-4">
        {renderLogo('lg')}
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white text-xl">
            {profile?.companyName || companyName}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {profile?.industry || sector || 'Company'}
          </p>
          {profile?.country && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatHeadquarters(profile.city, profile.state, profile.country)}
            </p>
          )}
        </div>
      </div>

      {/* About Section */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm uppercase tracking-wide">
          About {profile?.companyName || companyName}
        </h4>
        <p className={`text-base text-gray-700 dark:text-gray-300 leading-relaxed ${
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
            className="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm font-medium flex items-center gap-1 transition-colors"
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
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-3 text-center">
            <Calendar className="w-5 h-5 mx-auto mb-1 text-blue-600 dark:text-blue-400" />
            <p className="text-xs text-gray-500 dark:text-gray-400">Founded</p>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">
              {formatIPODate(profile.ipoDate)}
            </p>
          </div>
        )}
        
        {profile?.fullTimeEmployees && (
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-3 text-center">
            <Users className="w-5 h-5 mx-auto mb-1 text-green-600 dark:text-green-400" />
            <p className="text-xs text-gray-500 dark:text-gray-400">Employees</p>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">
              {formatEmployeeCount(profile.fullTimeEmployees)}
            </p>
          </div>
        )}
        
        {(profile?.city || profile?.country) && (
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-3 text-center">
            <Building2 className="w-5 h-5 mx-auto mb-1 text-purple-600 dark:text-purple-400" />
            <p className="text-xs text-gray-500 dark:text-gray-400">Headquarters</p>
            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
              {profile.state || profile.country || 'N/A'}
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
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors mb-4"
        >
          <Globe className="w-4 h-4" />
          Visit Website
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}

      {/* News Section */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm uppercase tracking-wide flex items-center gap-2">
          📰 Latest News
        </h4>
        <StockNewsPill ticker={ticker} companyName={companyName} />
      </div>
    </div>
  );
};

export default CompanySnapshot;
