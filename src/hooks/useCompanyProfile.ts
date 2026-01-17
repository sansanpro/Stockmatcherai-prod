import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CompanyProfile {
  symbol: string;
  companyName: string;
  description: string;
  sector: string;
  industry: string;
  country: string;
  fullTimeEmployees: string;
  website: string;
  mktCap: number;
  ipoDate: string;
  image: string;
  city?: string;
  state?: string;
}

// Client-side cache for company profiles
const profileCache = new Map<string, { data: CompanyProfile; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export function useCompanyProfile(ticker: string) {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) {
      setIsLoading(false);
      return;
    }

    const fetchProfile = async () => {
      const cacheKey = ticker.toUpperCase();
      const cached = profileCache.get(cacheKey);
      
      // Return cached data if still valid
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setProfile(cached.data);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fnError } = await supabase.functions.invoke('fmp-data', {
          body: { action: 'company_profile', symbol: ticker }
        });

        if (fnError) {
          throw new Error(fnError.message);
        }

        if (data?.data) {
          const profileData = data.data as CompanyProfile;
          profileCache.set(cacheKey, { data: profileData, timestamp: Date.now() });
          setProfile(profileData);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error('Error fetching company profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch profile');
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [ticker]);

  return { profile, isLoading, error };
}

// Helper function to extract mission statement from description
export function extractMission(description: string): string {
  if (!description) return '';
  
  // Get first sentence as mission
  const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 10);
  return sentences[0]?.trim() || description.slice(0, 150);
}

// Helper function to format employee count
export function formatEmployeeCount(employees: string | number): string {
  const count = typeof employees === 'string' ? parseInt(employees) : employees;
  if (isNaN(count)) return 'N/A';
  
  if (count >= 100000) return `${(count / 1000).toFixed(0)}K+`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

// Helper function to format IPO date
export function formatIPODate(ipoDate: string): string {
  if (!ipoDate) return 'N/A';
  
  try {
    const date = new Date(ipoDate);
    const year = date.getFullYear();
    const now = new Date().getFullYear();
    const yearsAgo = now - year;
    
    if (yearsAgo > 1) {
      return `Est. ${year}`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return 'N/A';
  }
}

// Helper function to format headquarters location
export function formatHeadquarters(city?: string, state?: string, country?: string): string {
  const parts = [city, state].filter(Boolean);
  if (parts.length === 0) {
    return country || 'N/A';
  }
  return parts.join(', ');
}
