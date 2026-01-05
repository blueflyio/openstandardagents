import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Playground - OSSA',
  description: 'Interactive OSSA manifest editor and validator. Create, edit, and validate Open Standard for Scalable AI Agents manifests in real-time.',
  openGraph: {
    title: 'OSSA Playground - Interactive Manifest Editor',
    description: 'Create, edit, and validate OSSA manifests in real-time with our interactive playground.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OSSA Playground - Interactive Manifest Editor',
    description: 'Create, edit, and validate OSSA manifests in real-time with our interactive playground.',
  },
};

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
