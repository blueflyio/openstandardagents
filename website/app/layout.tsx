import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.scss';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StructuredData } from '@/components/StructuredData';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import { getVersionForMetadata } from '@/lib/get-version-for-metadata';

const versionInfo = getVersionForMetadata();

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: `Open Standard Agents ${versionInfo.tag} - Enterprise Multi-Agent Specification`,
    template: '%s | Open Standard Agents',
  },
  description: 'Production-ready specification for autonomous agent systems with formal security models, multi-agent orchestration (A2A), and OpenTelemetry observability. Write once, deploy anywhere.',
  keywords: ['OSSA', 'AI Agents', 'OpenAPI', 'Standard', 'Specification', 'AI', 'Machine Learning', 'Agent Framework', 'A2A Protocol', 'Multi-Agent', 'OpenTelemetry', 'Agent Security'],
  authors: [{ name: 'OSSA Standards Team' }],
  creator: 'OSSA Standards Team',
  publisher: 'OSSA Standards Team',
  metadataBase: new URL('https://openstandardagents.org'),
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },

  openGraph: {
    title: `Open Standard Agents ${versionInfo.tag} - Enterprise Multi-Agent Specification`,
    description: 'Production-ready specification for autonomous agent systems with formal security models, multi-agent orchestration, and OpenTelemetry observability.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Open Standard Agents',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: `OSSA ${versionInfo.tag} - Enterprise Multi-Agent Specification`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `OSSA ${versionInfo.tag} - Enterprise Multi-Agent Specification`,
    description: 'Production-ready spec for multi-agent systems with A2A Protocol, security models, and OpenTelemetry',
    creator: '@openstandardagents',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://openstandardagents.org',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Performance: Preconnect to critical origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
        <link rel="dns-prefetch" href="https://unpkg.com" />

        {/* Icons */}
        <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/assets/brand/ossa-logo.svg" />

        {/* Performance: Preload critical assets */}
        <link rel="preload" href="/og-image.png" as="image" />
        <StructuredData
          type="Organization"
          data={{
            description: 'Open Standard Agents Organization - Maintaining the Industry Standard for Agent Orchestration',
          }}
        />
        <StructuredData
          type="WebSite"
          data={{
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: 'https://openstandardagents.org/search?q={search_term_string}',
              },
              'query-input': 'required name=search_term_string',
            },
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <GoogleAnalytics />
        <div className="flex flex-col min-h-screen">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded"
          >
            Skip to main content
          </a>
          <Header />
          <main id="main-content" className="flex-grow" tabIndex={-1}>
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}

