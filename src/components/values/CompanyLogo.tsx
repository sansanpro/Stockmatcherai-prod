import { useState } from 'react';

interface CompanyLogoProps {
  src?: string | null;
  name: string;
  ticker: string;
  className?: string; // size, e.g. "w-12 h-12"
}

// The logo on a white tile, with the ticker's initials shown until it loads (or if it can't)
const CompanyLogo = ({ src, name, ticker, className = 'w-12 h-12' }: CompanyLogoProps) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const initials = ticker.replace(/[^A-Z]/gi, '').slice(0, 2).toUpperCase();

  return (
    <div className={`relative flex-shrink-0 rounded-xl overflow-hidden bg-white shadow-md ${className}`}>
      {(!loaded || failed || !src) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-600 to-slate-800 text-white font-bold">
          {initials}
        </div>
      )}
      {src && !failed && (
        <img
          src={src}
          alt={`${name} logo`}
          className={`w-full h-full object-contain p-1 transition-opacity ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
};

export default CompanyLogo;
