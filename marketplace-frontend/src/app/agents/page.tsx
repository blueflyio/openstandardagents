'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { AgentCatalog } from '@/components/catalog/AgentCatalog';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { SearchBar } from '@/components/filters/SearchBar';
import { AgentFilter } from '@/types/agent';

export default function AgentsPage() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<AgentFilter>({});

  useEffect(() => {
    const search = searchParams.get('search');
    if (search) {
      setFilters((prev) => ({ ...prev, search }));
    }
  }, [searchParams]);

  const handleSearch = (query: string) => {
    setFilters((prev) => ({ ...prev, search: query }));
  };

  const handleFilterChange = (newFilters: AgentFilter) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Browse Agents</h1>
          <SearchBar onSearch={handleSearch} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-8">
              <FilterPanel onFilterChange={handleFilterChange} />
            </div>
          </div>

          {/* Catalog */}
          <div className="flex-1">
            <AgentCatalog filters={filters} />
          </div>
        </div>
      </div>
    </div>
  );
}
