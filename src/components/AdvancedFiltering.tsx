
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';

interface FilterCriteria {
  priceMin: number;
  priceMax: number;
  sector: string;
  riskLevel: string;
  dividendYield: number;
  marketCap: string;
  performance: string;
}

interface AdvancedFilteringProps {
  onFiltersChange: (filters: FilterCriteria) => void;
  onToggle?: () => void;
}

const AdvancedFiltering = ({ onFiltersChange, onToggle }: AdvancedFilteringProps) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterCriteria>({
    priceMin: 0,
    priceMax: 1000,
    sector: 'any',
    riskLevel: 'any',
    dividendYield: 0,
    marketCap: 'any',
    performance: 'any'
  });

  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  useEffect(() => {
    // Count active filters
    let count = 0;
    if (filters.priceMin > 0 || filters.priceMax < 1000) count++;
    if (filters.sector !== 'any') count++;
    if (filters.riskLevel !== 'any') count++;
    if (filters.dividendYield > 0) count++;
    if (filters.marketCap !== 'any') count++;
    if (filters.performance !== 'any') count++;
    
    setActiveFiltersCount(count);
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const resetFilters = () => {
    setFilters({
      priceMin: 0,
      priceMax: 1000,
      sector: 'any',
      riskLevel: 'any',
      dividendYield: 0,
      marketCap: 'any',
      performance: 'any'
    });
  };

  const updateFilter = (key: keyof FilterCriteria, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
    onToggle?.();
  };

  return (
    <div className="relative">
      <Button
        onClick={toggleFilters}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Filter className="w-4 h-4" />
        Filters
        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="ml-1">
            {activeFiltersCount}
          </Badge>
        )}
      </Button>

      {showFilters && (
        <div className="absolute top-12 right-0 w-80 z-50">
          <Card className="shadow-xl dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg dark:text-white">Advanced Filters</CardTitle>
                <Button
                  onClick={toggleFilters}
                  variant="ghost"
                  size="sm"
                  className="w-6 h-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto">
              {/* Price Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium dark:text-gray-200">
                  Price Range: ${filters.priceMin} - ${filters.priceMax}
                </Label>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">Min Price</Label>
                  <Slider
                    value={[filters.priceMin]}
                    onValueChange={(value) => updateFilter('priceMin', value[0])}
                    max={500}
                    step={10}
                    className="w-full"
                  />
                  <Label className="text-xs text-gray-500">Max Price</Label>
                  <Slider
                    value={[filters.priceMax]}
                    onValueChange={(value) => updateFilter('priceMax', value[0])}
                    min={100}
                    max={1000}
                    step={25}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Sector */}
              <div className="space-y-2">
                <Label className="text-sm font-medium dark:text-gray-200">Sector</Label>
                <Select value={filters.sector} onValueChange={(value) => updateFilter('sector', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Sector</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="consumer">Consumer</SelectItem>
                    <SelectItem value="energy">Energy</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Risk Level */}
              <div className="space-y-2">
                <Label className="text-sm font-medium dark:text-gray-200">Risk Level</Label>
                <Select value={filters.riskLevel} onValueChange={(value) => updateFilter('riskLevel', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any risk level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Risk Level</SelectItem>
                    <SelectItem value="low">Low Risk</SelectItem>
                    <SelectItem value="medium">Medium Risk</SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dividend Yield */}
              <div className="space-y-2">
                <Label className="text-sm font-medium dark:text-gray-200">
                  Min Dividend Yield: {filters.dividendYield.toFixed(1)}%
                </Label>
                <Slider
                  value={[filters.dividendYield]}
                  onValueChange={(value) => updateFilter('dividendYield', value[0])}
                  max={8}
                  step={0.5}
                  className="w-full"
                />
              </div>

              {/* Market Cap */}
              <div className="space-y-2">
                <Label className="text-sm font-medium dark:text-gray-200">Market Cap</Label>
                <Select value={filters.marketCap} onValueChange={(value) => updateFilter('marketCap', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any market cap" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Market Cap</SelectItem>
                    <SelectItem value="large">Large Cap (>$10B)</SelectItem>
                    <SelectItem value="mid">Mid Cap ($2B-$10B)</SelectItem>
                    <SelectItem value="small">Small Cap (<$2B)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Performance */}
              <div className="space-y-2">
                <Label className="text-sm font-medium dark:text-gray-200">1-Year Performance</Label>
                <Select value={filters.performance} onValueChange={(value) => updateFilter('performance', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any performance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Performance</SelectItem>
                    <SelectItem value="positive">Positive (+)</SelectItem>
                    <SelectItem value="strong">Strong (>20%)</SelectItem>
                    <SelectItem value="moderate">Moderate (0-20%)</SelectItem>
                    <SelectItem value="negative">Negative (-)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reset Button */}
              <Button
                onClick={resetFilters}
                variant="outline"
                className="w-full"
                disabled={activeFiltersCount === 0}
              >
                Reset All Filters
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdvancedFiltering;
