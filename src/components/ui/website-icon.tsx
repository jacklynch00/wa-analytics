'use client';

import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

interface WebsiteIconProps {
  domain: string;
  className?: string;
  size?: number;
}

export function WebsiteIcon({ domain, className = '', size = 16 }: WebsiteIconProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Generate favicon URLs with multiple fallback services for better quality
  const getFaviconUrls = (domain: string) => {
    const cleanDomain = domain.replace(/^www\./, '');
    const iconSize = Math.max(32, size); // Use at least 32px for better quality
    
    return [
      // Primary: DuckDuckGo (higher quality)
      `https://icons.duckduckgo.com/ip3/${cleanDomain}.ico`,
      // Fallback 1: Clearbit (high quality but may not have all sites)
      `https://logo.clearbit.com/${cleanDomain}?size=${iconSize}`,
      // Fallback 2: Google with larger size
      `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=${iconSize}`,
      // Fallback 3: Direct favicon.ico
      `https://${cleanDomain}/favicon.ico`,
    ];
  };

  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const faviconUrls = getFaviconUrls(domain);

  // Reset state when domain changes
  useEffect(() => {
    setCurrentUrlIndex(0);
    setImageError(false);
    setIsLoading(true);
  }, [domain]);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    // Try next URL in fallback chain
    if (currentUrlIndex < faviconUrls.length - 1) {
      setCurrentUrlIndex(currentUrlIndex + 1);
    } else {
      setImageError(true);
      setIsLoading(false);
    }
  };

  if (imageError || !domain) {
    return <Globe className={`w-${size/4} h-${size/4} text-gray-400 ${className}`} />;
  }

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-100 rounded animate-pulse"
          style={{ width: size, height: size }}
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={faviconUrls[currentUrlIndex]}
        alt={`${domain} icon`}
        width={size}
        height={size}
        className={`rounded ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{ width: size, height: size }}
      />
    </div>
  );
}