'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface SearchResult {
  title: string;
  href: string;
  category: string;
}

const allDocs: SearchResult[] = [
  { title: '5-Minute Overview', href: '/docs/getting-started/5-minute-overview', category: 'Getting Started' },
  { title: 'Installation', href: '/docs/getting-started/installation', category: 'Getting Started' },
  { title: 'Hello World', href: '/docs/getting-started/hello-world', category: 'Getting Started' },
  { title: 'First Agent', href: '/docs/getting-started/first-agent', category: 'Getting Started' },
  { title: 'For Developers', href: '/docs/for-audiences/developers', category: 'For Audiences' },
  { title: 'For Architects', href: '/docs/for-audiences/architects', category: 'For Audiences' },
  { title: 'For Enterprises', href: '/docs/for-audiences/enterprises', category: 'For Audiences' },
  { title: 'For Students & Researchers', href: '/docs/for-audiences/students-researchers', category: 'For Audiences' },
  { title: 'Migration Guides', href: '/docs/examples/migration-guides', category: 'Examples' },
];

export function DocsSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) {
      return [];
    }

    const lowerQuery = query.toLowerCase();
    return allDocs.filter(
      (doc) =>
        doc.title.toLowerCase().includes(lowerQuery) ||
        doc.category.toLowerCase().includes(lowerQuery)
    );
  }, [query]);

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="search"
          placeholder="Search documentation..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Search documentation"
          aria-describedby="search-description"
          role="searchbox"
        />
        <svg
          className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {isOpen && results.length > 0 && (
        <div
          className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto"
          role="listbox"
          aria-label="Search results"
        >
          {results.map((result) => (
            <Link
              key={result.href}
              href={result.href}
              className="block px-4 py-3 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              onClick={() => {
                setQuery('');
                setIsOpen(false);
              }}
              role="option"
              aria-label={`${result.title} in ${result.category}`}
            >
              <div className="font-semibold text-gray-900">{result.title}</div>
              <div className="text-sm text-gray-500">{result.category}</div>
            </Link>
          ))}
        </div>
      )}

      {isOpen && query.trim() && results.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
          <p className="text-gray-500">No results found</p>
        </div>
      )}
    </div>
  );
}

