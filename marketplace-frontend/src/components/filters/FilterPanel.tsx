'use client';

import { useState, useEffect } from 'react';
import { AgentFilter, TrustLevel } from '@/types/agent';
import { api } from '@/lib/api';
import { StarIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';

interface FilterPanelProps {
  onFilterChange: (filters: AgentFilter) => void;
}

const trustLevels: TrustLevel[] = ['verified', 'trusted', 'unverified', 'experimental'];
const trustLabels: Record<TrustLevel, string> = {
  verified: 'Verified',
  trusted: 'Trusted',
  unverified: 'Unverified',
  experimental: 'Experimental',
};

const ratingOptions = [
  { value: 4, label: '4+ Stars' },
  { value: 3, label: '3+ Stars' },
  { value: 2, label: '2+ Stars' },
  { value: 1, label: '1+ Stars' },
];

export function FilterPanel({ onFilterChange }: FilterPanelProps) {
  const [selectedTrustLevels, setSelectedTrustLevels] = useState<TrustLevel[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedRating, setSelectedRating] = useState<number | undefined>();

  const [availableDomains, setAvailableDomains] = useState<string[]>([]);
  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>([]);

  useEffect(() => {
    // Load available filter options
    const loadFilterOptions = async () => {
      try {
        const [domains, platforms] = await Promise.all([
          api.getAvailableDomains(),
          api.getAvailablePlatforms(),
        ]);
        setAvailableDomains(domains);
        setAvailablePlatforms(platforms);
      } catch (err) {
        console.error('Failed to load filter options', err);
      }
    };

    loadFilterOptions();
  }, []);

  useEffect(() => {
    // Notify parent of filter changes
    onFilterChange({
      trustLevels: selectedTrustLevels.length > 0 ? selectedTrustLevels : undefined,
      domains: selectedDomains.length > 0 ? selectedDomains : undefined,
      platforms: selectedPlatforms.length > 0 ? selectedPlatforms : undefined,
      minRating: selectedRating,
    });
  }, [selectedTrustLevels, selectedDomains, selectedPlatforms, selectedRating, onFilterChange]);

  const toggleTrustLevel = (level: TrustLevel) => {
    setSelectedTrustLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  const toggleDomain = (domain: string) => {
    setSelectedDomains((prev) =>
      prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain]
    );
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const clearFilters = () => {
    setSelectedTrustLevels([]);
    setSelectedDomains([]);
    setSelectedPlatforms([]);
    setSelectedRating(undefined);
  };

  const hasActiveFilters =
    selectedTrustLevels.length > 0 ||
    selectedDomains.length > 0 ||
    selectedPlatforms.length > 0 ||
    selectedRating !== undefined;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Trust Level */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Trust Level</h4>
        <div className="space-y-2">
          {trustLevels.map((level) => (
            <label key={level} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={selectedTrustLevels.includes(level)}
                onChange={() => toggleTrustLevel(level)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700">{trustLabels[level]}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Minimum Rating</h4>
        <div className="space-y-2">
          {ratingOptions.map((option) => (
            <label key={option.value} className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="rating"
                checked={selectedRating === option.value}
                onChange={() => setSelectedRating(option.value)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <span className="ml-3 flex items-center text-sm text-gray-700">
                {option.label}
                <StarIcon className="w-4 h-4 text-yellow-400 ml-1" />
              </span>
            </label>
          ))}
          {selectedRating && (
            <button
              onClick={() => setSelectedRating(undefined)}
              className="text-xs text-gray-500 hover:text-gray-700 ml-6"
            >
              Clear rating filter
            </button>
          )}
        </div>
      </div>

      {/* Domain */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Domain</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {availableDomains.map((domain) => (
            <label key={domain} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={selectedDomains.includes(domain)}
                onChange={() => toggleDomain(domain)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700 capitalize">{domain}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Platform Support */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Platform Support</h4>
        <div className="space-y-2">
          {availablePlatforms.map((platform) => (
            <label key={platform} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={selectedPlatforms.includes(platform)}
                onChange={() => togglePlatform(platform)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700 capitalize">{platform}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
