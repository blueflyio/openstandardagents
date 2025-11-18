'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface ExampleFile {
  name: string;
  path: string;
  content: string;
  category: string;
}

interface ExamplesViewerProps {
  examples: ExampleFile[];
}

export function ExamplesViewer({ examples }: ExamplesViewerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedExample, setSelectedExample] = useState<ExampleFile | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Initialize from URL parameters
  useEffect(() => {
    const exampleParam = searchParams.get('example');
    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search');

    if (exampleParam) {
      const example = examples.find(ex => ex.path === exampleParam);
      if (example) setSelectedExample(example);
    } else if (examples.length > 0) {
      setSelectedExample(examples[0]);
    }

    if (categoryParam) setFilter(categoryParam);
    if (searchParam) setSearchQuery(searchParam);
  }, [examples, searchParams]);

  // Update URL when selection changes
  const handleSelectExample = (example: ExampleFile) => {
    setSelectedExample(example);
    const params = new URLSearchParams(searchParams.toString());
    params.set('example', example.path);
    if (filter !== 'all') params.set('category', filter);
    if (searchQuery) params.set('search', searchQuery);
    router.push(`/examples?${params.toString()}`, { scroll: false });
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    const params = new URLSearchParams(searchParams.toString());
    if (newFilter !== 'all') {
      params.set('category', newFilter);
    } else {
      params.delete('category');
    }
    router.push(`/examples?${params.toString()}`, { scroll: false });
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    const params = new URLSearchParams(searchParams.toString());
    if (query) {
      params.set('search', query);
    } else {
      params.delete('search');
    }
    router.push(`/examples?${params.toString()}`, { scroll: false });
  };

  const categories = useMemo(() => {
    const cats = new Set(examples.map((ex) => ex.category));
    return Array.from(cats).sort();
  }, [examples]);

  const filteredExamples = useMemo(() => {
    let filtered = examples;

    if (filter !== 'all') {
      filtered = filtered.filter((ex) => ex.category === filter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ex) =>
          ex.name.toLowerCase().includes(query) ||
          ex.path.toLowerCase().includes(query) ||
          ex.content.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [examples, filter, searchQuery]);

  const getLanguage = (filename: string): string => {
    if (filename.endsWith('.ts')) return 'typescript';
    if (filename.endsWith('.json')) return 'json';
    if (filename.endsWith('.yml') || filename.endsWith('.yaml')) return 'yaml';
    return 'text';
  };

  const copyToClipboard = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Sidebar */}
      <div className="lg:col-span-1">
        <div className="card border-2 border-gray-300 sticky top-4">
          <div className="flex items-center mb-4">
            <svg className="w-6 h-6 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900">Browse Examples</h2>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="search"
              placeholder="Search examples..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-3 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-base"
              aria-label="Search examples"
            />
          </div>

          {/* Category Filter */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <select
              value={filter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="w-full pl-10 pr-3 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-base appearance-none bg-white"
            >
              <option value="all">All Categories ({filteredExamples.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} ({examples.filter(ex => ex.category === cat).length})
                </option>
              ))}
            </select>
          </div>

          {/* Results Count */}
          <div className="mb-3 px-2">
            <span className="text-sm font-semibold text-gray-700">
              {filteredExamples.length} {filteredExamples.length === 1 ? 'example' : 'examples'} found
            </span>
          </div>

          {/* Example List */}
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {filteredExamples.map((example) => (
              <button
                key={example.path}
                onClick={() => handleSelectExample(example)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all border-2 ${
                  selectedExample?.path === example.path
                    ? 'bg-gradient-to-r from-primary to-primary-dark text-white border-primary shadow-md'
                    : 'bg-white border-gray-200 hover:border-primary/50 hover:shadow-md'
                }`}
              >
                <div className="font-bold mb-1 truncate">{example.name}</div>
                <div
                  className={`text-xs truncate flex items-center ${
                    selectedExample?.path === example.path
                      ? 'text-white/80'
                      : 'text-gray-500'
                  }`}
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {example.category}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:col-span-2">
        {selectedExample ? (
          <div className="card border-2 border-gray-300 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <svg className="w-6 h-6 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h2 className="text-3xl font-bold text-gray-900">{selectedExample.name}</h2>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center text-gray-600">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    {selectedExample.path}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    {selectedExample.category}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">{selectedExample.content.split('\n').length} lines</span>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(selectedExample.content)}
                className="bg-gradient-to-r from-primary to-primary-dark text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2"
                aria-label="Copy example code to clipboard"
                title="Copy code"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Code
              </button>
            </div>

            <div className="border-2 border-gray-300 rounded-xl overflow-hidden shadow-md">
              <SyntaxHighlighter
                language={getLanguage(selectedExample.name)}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  borderRadius: 0,
                  fontSize: '15px',
                  padding: '1.5rem',
                }}
                showLineNumbers
                wrapLines
              >
                {selectedExample.content}
              </SyntaxHighlighter>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-200">
              <h3 className="font-bold text-blue-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Quick Actions
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                <a href={`/playground?source=examples&example=${encodeURIComponent(selectedExample.name)}`} className="bg-white border-2 border-blue-200 rounded-lg p-3 hover:border-blue-400 hover:shadow-md transition-all">
                  <div className="font-semibold text-blue-900">✏️ Try in Playground</div>
                  <div className="text-xs text-gray-600 mt-1">Test and modify this example</div>
                </a>
                <a href="/schema#components" className="bg-white border-2 border-blue-200 rounded-lg p-3 hover:border-blue-400 hover:shadow-md transition-all">
                  <div className="font-semibold text-blue-900">📖 View Schema Reference</div>
                  <div className="text-xs text-gray-600 mt-1">Learn about all fields</div>
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="card border-2 border-dashed border-gray-300 text-center py-20">
            <div className="text-6xl mb-4">👈</div>
            <p className="text-gray-600 text-lg font-semibold mb-2">Select an example to view</p>
            <p className="text-gray-500">Choose from {examples.length} examples on the left</p>
          </div>
        )}
      </div>
    </div>
  );
}

