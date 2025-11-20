import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.scss';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StructuredData } from '@/components/StructuredData';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'Open Standard Agents - Industry Standard for Agent Orchestration',
    template: '%s | Open Standard Agents',
  },
  description: 'The vendor-neutral specification for multi-agent systems. Write once, deploy anywhere. Zero vendor lock-in.',
  keywords: ['OSSA', 'AI Agents', 'OpenAPI', 'Standard', 'Specification', 'AI', 'Machine Learning', 'Agent Framework'],
  authors: [{ name: 'OSSA Standards Team' }],
  creator: 'OSSA Standards Team',
  publisher: 'OSSA Standards Team',
  metadataBase: new URL('https://openstandardagents.org'),
  openGraph: {
    title: 'Open Standard Agents - Industry Standard for Agent Orchestration',
    description: 'The vendor-neutral specification for multi-agent systems. Write once, deploy anywhere.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Open Standard Agents',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'OSSA - Open Standard for Scalable AI Agents',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Open Standard Agents - Industry Standard for Agent Orchestration',
    description: 'The vendor-neutral specification for multi-agent systems',
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
        <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/assets/brand/ossa-logo.svg" />
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
      <body>
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

