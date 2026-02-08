'use client';

import { useState, useEffect } from 'react';
import { Agent } from '@/types/agent';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  FireIcon,
  ClockIcon,
  StarIcon,
  SparklesIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/solid';
import clsx from 'clsx';

type DiscoveryType = 'trending' | 'recent' | 'top-rated' | 'recommended';

interface DiscoverySectionProps {
  type: DiscoveryType;
  limit?: number;
  title?: string;
  showViewAll?: boolean;
}

const sectionConfig: Record<
  DiscoveryType,
  {
    icon: typeof FireIcon;
    title: string;
    description: string;
    color: string;
    fetchFn: (limit: number) => Promise<Agent[]>;
  }
> = {
  trending: {
    icon: FireIcon,
    title: 'Trending Agents',
    description: 'Popular agents right now',
    color: 'text-orange-500',
    fetchFn: api.getTrendingAgents.bind(api),
  },
  recent: {
    icon: ClockIcon,
    title: 'Recently Added',
    description: 'Latest additions to the marketplace',
    color: 'text-blue-500',
    fetchFn: api.getRecentAgents.bind(api),
  },
  'top-rated': {
    icon: StarIcon,
    title: 'Top Rated',
    description: 'Highest rated agents',
    color: 'text-yellow-500',
    fetchFn: api.getTopRatedAgents.bind(api),
  },
  recommended: {
    icon: SparklesIcon,
    title: 'Recommended for You',
    description: 'Personalized agent recommendations',
    color: 'text-purple-500',
    fetchFn: api.getRecommendedAgents.bind(api),
  },
};

export function DiscoverySection({
  type,
  limit = 6,
  title,
  showViewAll = true,
}: DiscoverySectionProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const config = sectionConfig[type];
  const Icon = config.icon;
  const displayTitle = title || config.title;

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        const data = await config.fetchFn(limit);
        setAgents(data);
      } catch (err) {
        console.error(`Failed to load ${type} agents`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [type, limit]);

  if (loading) {
    return (
      <div className="mb-12">
        <div className="h-8 w-48 bg-gray-200 rounded mb-4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (agents.length === 0) {
    return null;
  }

  return (
    <div className="mb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Icon className={clsx('w-8 h-8', config.color)} />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{displayTitle}</h2>
            <p className="text-sm text-gray-600">{config.description}</p>
          </div>
        </div>

        {showViewAll && (
          <Link
            href={`/agents?view=${type}`}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            View All
            <ChevronRightIcon className="w-5 h-5" />
          </Link>
        )}
      </div>

      {/* Agent Cards - Compact Version */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <Link key={agent.gaid} href={`/agents/${agent.gaid}`}>
            <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4 h-full flex gap-4">
              {/* Icon */}
              {agent.icon ? (
                <img src={agent.icon} alt={agent.name} className="w-16 h-16 rounded-lg flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {agent.name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate mb-1">{agent.name}</h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">{agent.description}</p>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <StarIcon className="w-4 h-4 text-yellow-400" />
                    <span className="font-medium">{agent.rating.toFixed(1)}</span>
                  </div>
                  <span>{agent.downloadCount.toLocaleString()} deployments</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
