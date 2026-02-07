'use client';

import Link from 'next/link';
import { Agent } from '@/types/agent';
import { StarIcon, ShieldCheckIcon } from '@heroicons/react/24/solid';
import { RocketLaunchIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface AgentCardProps {
  agent: Agent;
  onDeploy?: (agent: Agent) => void;
}

const trustColors = {
  verified: 'bg-trust-verified text-white',
  trusted: 'bg-trust-trusted text-white',
  unverified: 'bg-trust-unverified text-white',
  experimental: 'bg-trust-experimental text-white',
};

const trustLabels = {
  verified: 'Verified',
  trusted: 'Trusted',
  unverified: 'Unverified',
  experimental: 'Experimental',
};

export function AgentCard({ agent, onDeploy }: AgentCardProps) {
  const handleDeploy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDeploy?.(agent);
  };

  return (
    <Link href={`/agents/${agent.gaid}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          {/* Icon */}
          {agent.icon ? (
            <img src={agent.icon} alt={agent.name} className="w-16 h-16 rounded-lg object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold">
              {agent.name.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Name and Trust Badge */}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-gray-900 truncate">{agent.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={clsx(
                  'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                  trustColors[agent.trustLevel]
                )}
              >
                <ShieldCheckIcon className="w-3 h-3" />
                {trustLabels[agent.trustLevel]}
              </span>
              <span className="text-xs text-gray-500">v{agent.version}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">{agent.description}</p>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <StarIcon
                key={i}
                className={clsx(
                  'w-4 h-4',
                  i < Math.floor(agent.rating) ? 'text-yellow-400' : 'text-gray-300'
                )}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">
            {agent.rating.toFixed(1)} ({agent.reviewCount} reviews)
          </span>
        </div>

        {/* Capability Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {agent.capabilities.slice(0, 3).map((capability) => (
            <span
              key={capability}
              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
            >
              {capability}
            </span>
          ))}
          {agent.capabilities.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
              +{agent.capabilities.length - 3} more
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          {/* Author */}
          <div className="flex items-center gap-2">
            {agent.author.avatar ? (
              <img src={agent.author.avatar} alt={agent.author.name} className="w-6 h-6 rounded-full" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-700">
                {agent.author.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm text-gray-600">{agent.author.name}</span>
          </div>

          {/* Deploy Button */}
          <button
            onClick={handleDeploy}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <RocketLaunchIcon className="w-4 h-4" />
            Deploy
          </button>
        </div>

        {/* Downloads */}
        <div className="mt-2 text-xs text-gray-500 text-right">
          {agent.downloadCount.toLocaleString()} deployments
        </div>
      </div>
    </Link>
  );
}
