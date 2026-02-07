'use client';

import { DiscoverySection } from './DiscoverySection';
import { SearchBar } from '@/components/filters/SearchBar';
import { useRouter } from 'next/navigation';
import { RocketLaunchIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export function HomePage() {
  const router = useRouter();

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/agents?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">Agent Marketplace</h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Discover, deploy, and share production-ready OSSA agents. Browse thousands of agents
              built by the community.
            </p>

            {/* Search */}
            <div className="max-w-2xl mx-auto mb-8">
              <SearchBar
                onSearch={handleSearch}
                placeholder="Search agents by name, capability, or domain..."
              />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-center gap-4">
              <a
                href="/agents"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
                Browse All Agents
              </a>
              <a
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-400 text-white font-semibold rounded-lg transition-colors"
              >
                <RocketLaunchIcon className="w-5 h-5" />
                Register Your Agent
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Discovery Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-3xl font-bold text-primary-600">2,547</p>
            <p className="text-sm text-gray-600 mt-1">Total Agents</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-3xl font-bold text-green-600">15,234</p>
            <p className="text-sm text-gray-600 mt-1">Active Deployments</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-3xl font-bold text-blue-600">1,423</p>
            <p className="text-sm text-gray-600 mt-1">Developers</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-3xl font-bold text-purple-600">98.5%</p>
            <p className="text-sm text-gray-600 mt-1">Success Rate</p>
          </div>
        </div>

        {/* Discovery Sections */}
        <DiscoverySection type="trending" limit={6} />
        <DiscoverySection type="recent" limit={6} />
        <DiscoverySection type="top-rated" limit={6} />
        <DiscoverySection type="recommended" limit={6} />

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-2xl shadow-xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to share your agent?</h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of developers sharing their agents with the community. Register your
            agent today and reach a global audience.
          </p>
          <a
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            <RocketLaunchIcon className="w-6 h-6" />
            Get Started
          </a>
        </div>
      </div>
    </div>
  );
}
