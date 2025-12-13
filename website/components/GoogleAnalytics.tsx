'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

// Primary: Use build-time env var
// Fallback: Load from CI-generated config at runtime
const BUILD_TIME_GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

interface AnalyticsConfig {
  measurementId: string;
  enabled: boolean;
  settings: {
    anonymize_ip: boolean;
    send_page_view: boolean;
    cookie_flags: string;
  };
}

export function GoogleAnalytics() {
  const [gaId, setGaId] = useState<string | undefined>(BUILD_TIME_GA_ID);

  useEffect(() => {
    // If no build-time ID, try to load from CI-generated config
    if (!BUILD_TIME_GA_ID) {
      fetch('/analytics-config.json')
        .then(res => res.json())
        .then((config: AnalyticsConfig) => {
          if (config.enabled && config.measurementId) {
            setGaId(config.measurementId);
          }
        })
        .catch(() => {
          // Config not available, analytics disabled
        });
    }
  }, []);

  if (!gaId) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            page_path: window.location.pathname,
            anonymize_ip: true,
            cookie_flags: 'SameSite=None;Secure'
          });
        `}
      </Script>
    </>
  );
}

// Track page views for client-side navigation
export function trackPageView(url: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    // Get the GA ID from the first gtag config call
    const gaId = BUILD_TIME_GA_ID || (window as { __GA_ID__?: string }).__GA_ID__;
    if (gaId) {
      window.gtag('config', gaId, {
        page_path: url,
      });
    }
  }
}

// Track custom events
export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    gtag: (command: string, ...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}
