'use client';

import { useState, useEffect } from 'react';
import { Agent, AgentReview, UsageStatistics } from '@/types/agent';
import { api } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  StarIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
} from '@heroicons/react/24/solid';
import { DocumentTextIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface AgentDetailViewProps {
  gaid: string;
}

const trustColors = {
  verified: 'bg-trust-verified',
  trusted: 'bg-trust-trusted',
  unverified: 'bg-trust-unverified',
  experimental: 'bg-trust-experimental',
};

const trustLabels = {
  verified: 'Verified',
  trusted: 'Trusted',
  unverified: 'Unverified',
  experimental: 'Experimental',
};

export function AgentDetailView({ gaid }: AgentDetailViewProps) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [reviews, setReviews] = useState<AgentReview[]>([]);
  const [statistics, setStatistics] = useState<UsageStatistics | null>(null);
  const [relatedAgents, setRelatedAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'readme' | 'deployment' | 'reviews'>('readme');

  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        setLoading(true);
        const [agentData, reviewsData, statsData, relatedData] = await Promise.all([
          api.getAgent(gaid),
          api.getAgentReviews(gaid),
          api.getAgentStatistics(gaid),
          api.getRecommendedAgents(gaid, 4),
        ]);

        setAgent(agentData);
        setReviews(reviewsData);
        setStatistics(statsData);
        setRelatedAgents(relatedData);
      } catch (err) {
        console.error('Failed to load agent data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentData();
  }, [gaid]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-64 bg-gray-200 rounded-lg" />
        <div className="h-96 bg-gray-200 rounded-lg" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800 font-medium">Agent not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Agent ID Card */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg shadow-xl p-8 text-white">
        <div className="flex items-start gap-6">
          {/* Icon */}
          {agent.icon ? (
            <img src={agent.icon} alt={agent.name} className="w-24 h-24 rounded-lg" />
          ) : (
            <div className="w-24 h-24 rounded-lg bg-white/20 flex items-center justify-center text-4xl font-bold">
              {agent.name.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{agent.name}</h1>
              <span
                className={clsx(
                  'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium',
                  trustColors[agent.trustLevel]
                )}
              >
                <ShieldCheckIcon className="w-4 h-4" />
                {trustLabels[agent.trustLevel]}
              </span>
            </div>

            <p className="text-lg text-white/90 mb-4">{agent.description}</p>

            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <StarIcon className="w-5 h-5 text-yellow-300" />
                <span className="font-medium">{agent.rating.toFixed(1)}</span>
                <span className="text-white/70">({agent.reviewCount} reviews)</span>
              </div>
              <div className="flex items-center gap-2">
                <RocketLaunchIcon className="w-5 h-5" />
                <span>{agent.downloadCount.toLocaleString()} deployments</span>
              </div>
              <div className="flex items-center gap-2">
                <CodeBracketIcon className="w-5 h-5" />
                <span>v{agent.version}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4">
              {agent.author.avatar ? (
                <img
                  src={agent.author.avatar}
                  alt={agent.author.name}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-medium">
                  {agent.author.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-white/90">by {agent.author.name}</span>
              {agent.author.verified && (
                <ShieldCheckIcon className="w-4 h-4 text-green-300" title="Verified Author" />
              )}
            </div>
          </div>

          {/* Deploy Button */}
          <button className="px-6 py-3 bg-white text-primary-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2">
            <RocketLaunchIcon className="w-5 h-5" />
            Deploy Now
          </button>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-6">
          {agent.capabilities.map((capability) => (
            <span
              key={capability}
              className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm"
            >
              {capability}
            </span>
          ))}
        </div>

        {/* GAID */}
        <div className="mt-4 pt-4 border-t border-white/20">
          <span className="text-sm text-white/70">GAID:</span>
          <code className="ml-2 text-sm font-mono">{agent.gaid}</code>
        </div>
      </div>

      {/* Usage Statistics */}
      {statistics && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <ChartBarIcon className="w-6 h-6 text-primary-600" />
              <span className="text-sm text-gray-600">Total Deployments</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {statistics.totalDeployments.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <UserGroupIcon className="w-6 h-6 text-green-600" />
              <span className="text-sm text-gray-600">Active Instances</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {statistics.activeInstances.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <StarIcon className="w-6 h-6 text-yellow-600" />
              <span className="text-sm text-gray-600">Success Rate</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{statistics.successRate.toFixed(1)}%</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <ClockIcon className="w-6 h-6 text-blue-600" />
              <span className="text-sm text-gray-600">Avg Response Time</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{statistics.avgResponseTime}ms</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('readme')}
              className={clsx(
                'px-6 py-4 text-sm font-medium border-b-2',
                activeTab === 'readme'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <DocumentTextIcon className="w-5 h-5 inline mr-2" />
              README
            </button>
            <button
              onClick={() => setActiveTab('deployment')}
              className={clsx(
                'px-6 py-4 text-sm font-medium border-b-2',
                activeTab === 'deployment'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <RocketLaunchIcon className="w-5 h-5 inline mr-2" />
              Deployment
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={clsx(
                'px-6 py-4 text-sm font-medium border-b-2',
                activeTab === 'reviews'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <StarIcon className="w-5 h-5 inline mr-2" />
              Reviews ({reviews.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'readme' && (
            <div className="prose max-w-none">
              {agent.readme ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{agent.readme}</ReactMarkdown>
              ) : (
                <p className="text-gray-500">No README available for this agent.</p>
              )}
            </div>
          )}

          {activeTab === 'deployment' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Deployment Instructions</h3>

              {agent.platforms.map((platform) => (
                <div key={platform.name} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2 capitalize">
                    {platform.deployment} - {platform.name}
                  </h4>
                  <div className="bg-gray-50 rounded p-4">
                    <code className="text-sm text-gray-800">
                      # Deploy {agent.name} to {platform.name}
                      <br />
                      ossa deploy {agent.gaid} --platform {platform.deployment}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {review.author.avatar ? (
                          <img
                            src={review.author.avatar}
                            alt={review.author.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium">
                            {review.author.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{review.author.name}</p>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <StarIcon
                                key={i}
                                className={clsx(
                                  'w-4 h-4',
                                  i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h5 className="font-medium text-gray-900 mb-1">{review.title}</h5>
                    <p className="text-gray-700 text-sm">{review.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Related Agents */}
      {relatedAgents.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Related Agents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedAgents.map((relatedAgent) => (
              <a
                key={relatedAgent.gaid}
                href={`/agents/${relatedAgent.gaid}`}
                className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  {relatedAgent.icon ? (
                    <img
                      src={relatedAgent.icon}
                      alt={relatedAgent.name}
                      className="w-12 h-12 rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                      {relatedAgent.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{relatedAgent.name}</h4>
                    <div className="flex items-center text-sm">
                      <StarIcon className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="text-gray-600">{relatedAgent.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{relatedAgent.description}</p>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
