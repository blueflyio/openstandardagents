/**
 * Agent Analytics GLQL Queries
 *
 * GLQL queries for DORA metrics, A/B testing, business correlation, and GitLab native integrations.
 * Integrates with GitLab Value Stream Analytics, Observability, and Tracing.
 *
 * @module gitlab-health/agent-analytics-queries
 */

export interface AgentAnalyticsGLQLQuery {
  id: string;
  name: string;
  description: string;
  query: string;
  visualization?: 'chart' | 'table' | 'metric' | 'heatmap' | 'timeline';
  category:
    | 'dora-metrics'
    | 'effectiveness'
    | 'ab-testing'
    | 'business-correlation'
    | 'value-stream'
    | 'observability';
}

/**
 * Agent Analytics GLQL queries with GitLab native integrations
 */
export const AGENT_ANALYTICS_QUERIES: AgentAnalyticsGLQLQuery[] = [
  // ============================================================================
  // DORA METRICS: Agent-adapted DORA metrics
  // ============================================================================
  {
    id: 'dora-agent-action-frequency',
    name: 'DORA: Agent Action Frequency',
    description: 'Agent actions per day (equivalent to Deployment Frequency)',
    category: 'dora-metrics',
    visualization: 'timeline',
    query: `
      query AgentActionFrequency {
        auditEvents(
          entityType: "Agent"
          createdAfter: "${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}"
        ) {
          nodes {
            createdAt
            details
          }
          count
        }
      }
    `,
  },
  {
    id: 'dora-agent-response-time',
    name: 'DORA: Agent Response Time',
    description: 'Average agent response time (equivalent to Lead Time)',
    category: 'dora-metrics',
    visualization: 'chart',
    query: `
      query AgentResponseTime {
        auditEvents(
          entityType: "Agent"
          createdAfter: "${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}"
        ) {
          nodes {
            details
            createdAt
          }
        }
      }
    `,
  },
  {
    id: 'dora-agent-fix-time',
    name: 'DORA: Agent Fix Time (MTTR)',
    description: 'Mean time to recover from agent failures',
    category: 'dora-metrics',
    visualization: 'metric',
    query: `
      query AgentFixTime {
        auditEvents(
          entityType: "Agent"
          createdAfter: "${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}"
        ) {
          nodes {
            details
            createdAt
          }
        }
      }
    `,
  },
  {
    id: 'dora-agent-accuracy',
    name: 'DORA: Agent Accuracy',
    description: 'Agent success rate (inverse of Change Failure Rate)',
    category: 'dora-metrics',
    visualization: 'metric',
    query: `
      query AgentAccuracy {
        auditEvents(
          entityType: "Agent"
          createdAfter: "${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}"
        ) {
          nodes {
            details
          }
        }
      }
    `,
  },
  {
    id: 'dora-overall-rating',
    name: 'DORA: Overall Rating',
    description: 'Combined DORA rating (elite, high, medium, low)',
    category: 'dora-metrics',
    visualization: 'metric',
    query: `
      query DORAOverallRating {
        auditEvents(
          entityType: "Agent"
          createdAfter: "${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}"
        ) {
          nodes {
            details
          }
        }
      }
    `,
  },

  // ============================================================================
  // EFFECTIVENESS: Agent effectiveness scoring
  // ============================================================================
  {
    id: 'effectiveness-overall-scores',
    name: 'Agent Effectiveness Scores',
    description: 'Overall effectiveness scores for all agents',
    category: 'effectiveness',
    visualization: 'chart',
    query: `
      query AgentEffectivenessScores {
        auditEvents(
          entityType: "Agent"
          createdAfter: "${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}"
        ) {
          nodes {
            details
          }
        }
      }
    `,
  },
  {
    id: 'effectiveness-accuracy-breakdown',
    name: 'Effectiveness: Accuracy Component',
    description: 'Accuracy scores breakdown by agent',
    category: 'effectiveness',
    visualization: 'chart',
    query: `
      query EffectivenessAccuracy {
        auditEvents(
          entityType: "Agent"
          createdAfter: "${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}"
        ) {
          nodes {
            details
          }
        }
      }
    `,
  },
  {
    id: 'effectiveness-speed-breakdown',
    name: 'Effectiveness: Speed Component',
    description: 'Speed scores breakdown by agent',
    category: 'effectiveness',
    visualization: 'chart',
    query: `
      query EffectivenessSpeed {
        auditEvents(
          entityType: "Agent"
          createdAfter: "${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}"
        ) {
          nodes {
            details
          }
        }
      }
    `,
  },
  {
    id: 'effectiveness-cost-breakdown',
    name: 'Effectiveness: Cost Component',
    description: 'Cost efficiency scores breakdown by agent',
    category: 'effectiveness',
    visualization: 'chart',
    query: `
      query EffectivenessCost {
        auditEvents(
          entityType: "Agent"
          createdAfter: "${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}"
        ) {
          nodes {
            details
          }
        }
      }
    `,
  },
  {
    id: 'effectiveness-trending',
    name: 'Effectiveness Trending',
    description: 'Agents with improving/declining effectiveness',
    category: 'effectiveness',
    visualization: 'table',
    query: `
      query EffectivenessTrending {
        auditEvents(
          entityType: "Agent"
          createdAfter: "${new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()}"
        ) {
          nodes {
            details
            createdAt
          }
        }
      }
    `,
  },

  // ============================================================================
  // A/B TESTING: Experiment results and significance
  // ============================================================================
  {
    id: 'ab-testing-active-tests',
    name: 'Active A/B Tests',
    description: 'Currently running A/B tests',
    category: 'ab-testing',
    visualization: 'table',
    query: `
      query ActiveABTests {
        variables(
          projectPath: "blueflyio/ossa"
          key: "AB_TEST_*"
        ) {
          nodes {
            key
            value
          }
        }
      }
    `,
  },
  {
    id: 'ab-testing-significant-results',
    name: 'Significant A/B Test Results',
    description: 'A/B tests with statistically significant results',
    category: 'ab-testing',
    visualization: 'table',
    query: `
      query SignificantABTestResults {
        auditEvents(
          entityType: "ABTest"
          createdAfter: "${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}"
        ) {
          nodes {
            details
          }
        }
      }
    `,
  },
  {
    id: 'ab-testing-improvement-distribution',
    name: 'A/B Test Improvements Distribution',
    description: 'Distribution of improvement percentages across tests',
    category: 'ab-testing',
    visualization: 'chart',
    query: `
      query ABTestImprovementDistribution {
        auditEvents(
          entityType: "ABTest"
          createdAfter: "${new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()}"
        ) {
          nodes {
            details
          }
        }
      }
    `,
  },

  // ============================================================================
  // BUSINESS CORRELATION: Agent metrics × business outcomes
  // ============================================================================
  {
    id: 'business-issues-closed',
    name: 'Business: Issues Closed',
    description: 'Issues closed over time (correlated with agent actions)',
    category: 'business-correlation',
    visualization: 'timeline',
    query: `
      query IssuesClosed {
        issues(
          state: closed
          groupPath: "blueflyio"
          closedAfter: "${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}"
        ) {
          nodes {
            closedAt
          }
          count
        }
      }
    `,
  },
  {
    id: 'business-mrs-merged',
    name: 'Business: MRs Merged',
    description: 'Merge requests merged (correlated with agent actions)',
    category: 'business-correlation',
    visualization: 'timeline',
    query: `
      query MRsMerged {
        mergeRequests(
          state: merged
          groupPath: "blueflyio"
          mergedAfter: "${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}"
        ) {
          nodes {
            mergedAt
          }
          count
        }
      }
    `,
  },
  {
    id: 'business-sprint-velocity',
    name: 'Business: Sprint Velocity',
    description: 'Issues closed per sprint (team velocity)',
    category: 'business-correlation',
    visualization: 'chart',
    query: `
      query SprintVelocity {
        milestones(
          groupPath: "blueflyio"
          state: closed
        ) {
          nodes {
            title
            stats {
              closedIssuesCount
            }
          }
        }
      }
    `,
  },
  {
    id: 'business-correlation-matrix',
    name: 'Business Correlation Matrix',
    description: 'Correlation coefficients between agent metrics and business KPIs',
    category: 'business-correlation',
    visualization: 'heatmap',
    query: `
      query BusinessCorrelationMatrix {
        auditEvents(
          entityType: "CorrelationAnalysis"
          createdAfter: "${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}"
        ) {
          nodes {
            details
          }
        }
      }
    `,
  },

  // ============================================================================
  // VALUE STREAM ANALYTICS: GitLab native integration
  // ============================================================================
  {
    id: 'vsa-cycle-time',
    name: 'VSA: Cycle Time',
    description: 'Value Stream Analytics: Average cycle time',
    category: 'value-stream',
    visualization: 'metric',
    query: `
      query ValueStreamCycleTime {
        project(fullPath: "blueflyio/ossa/openstandardagents") {
          valueStreamAnalytics {
            stages {
              name
              median
              p95
            }
          }
        }
      }
    `,
  },
  {
    id: 'vsa-lead-time',
    name: 'VSA: Lead Time',
    description: 'Value Stream Analytics: Average lead time',
    category: 'value-stream',
    visualization: 'metric',
    query: `
      query ValueStreamLeadTime {
        project(fullPath: "blueflyio/ossa/openstandardagents") {
          valueStreamAnalytics {
            leadTime {
              value
            }
          }
        }
      }
    `,
  },
  {
    id: 'vsa-deployment-frequency',
    name: 'VSA: Deployment Frequency',
    description: 'Value Stream Analytics: Deployments per day',
    category: 'value-stream',
    visualization: 'chart',
    query: `
      query ValueStreamDeploymentFrequency {
        project(fullPath: "blueflyio/ossa/openstandardagents") {
          valueStreamAnalytics {
            deploymentFrequency {
              value
            }
          }
        }
      }
    `,
  },
  {
    id: 'vsa-agent-impact',
    name: 'VSA: Agent Impact on Value Stream',
    description: 'How agent actions correlate with VSA metrics',
    category: 'value-stream',
    visualization: 'table',
    query: `
      query AgentImpactOnValueStream {
        project(fullPath: "blueflyio/ossa/openstandardagents") {
          valueStreamAnalytics {
            stages {
              name
              median
            }
          }
        }
        auditEvents(
          entityType: "Agent"
          createdAfter: "${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}"
        ) {
          nodes {
            details
            createdAt
          }
        }
      }
    `,
  },

  // ============================================================================
  // OBSERVABILITY: GitLab Observability and Tracing
  // ============================================================================
  {
    id: 'observability-trace-count',
    name: 'Observability: Trace Count',
    description: 'Number of traces generated by agents',
    category: 'observability',
    visualization: 'timeline',
    query: `
      query AgentTraceCount {
        project(fullPath: "blueflyio/ossa/openstandardagents") {
          observability {
            traces(
              createdAfter: "${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}"
            ) {
              count
              nodes {
                timestamp
                duration
              }
            }
          }
        }
      }
    `,
  },
  {
    id: 'observability-trace-duration',
    name: 'Observability: Trace Duration',
    description: 'Average trace duration for agent operations',
    category: 'observability',
    visualization: 'chart',
    query: `
      query AgentTraceDuration {
        project(fullPath: "blueflyio/ossa/openstandardagents") {
          observability {
            traces(
              serviceName: "agent-*"
              createdAfter: "${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}"
            ) {
              nodes {
                serviceName
                duration
                spans {
                  count
                }
              }
            }
          }
        }
      }
    `,
  },
  {
    id: 'observability-error-rate',
    name: 'Observability: Error Rate',
    description: 'Error rate from observability traces',
    category: 'observability',
    visualization: 'metric',
    query: `
      query AgentErrorRate {
        project(fullPath: "blueflyio/ossa/openstandardagents") {
          observability {
            traces(
              serviceName: "agent-*"
              createdAfter: "${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}"
            ) {
              nodes {
                error
                statusCode
              }
            }
          }
        }
      }
    `,
  },
  {
    id: 'observability-service-map',
    name: 'Observability: Service Map',
    description: 'Service dependencies from traces (agent interactions)',
    category: 'observability',
    visualization: 'table',
    query: `
      query AgentServiceMap {
        project(fullPath: "blueflyio/ossa/openstandardagents") {
          observability {
            services {
              nodes {
                name
                calls {
                  downstream
                  count
                }
              }
            }
          }
        }
      }
    `,
  },
  {
    id: 'observability-metrics-summary',
    name: 'Observability: Metrics Summary',
    description: 'Summary of observability metrics for all agents',
    category: 'observability',
    visualization: 'metric',
    query: `
      query AgentObservabilityMetrics {
        project(fullPath: "blueflyio/ossa/openstandardagents") {
          observability {
            metrics(
              serviceName: "agent-*"
              createdAfter: "${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}"
            ) {
              requestRate
              errorRate
              durationP95
            }
          }
        }
      }
    `,
  },
];

/**
 * Get queries by category
 */
export function getAnalyticsQueriesByCategory(
  category: AgentAnalyticsGLQLQuery['category']
): AgentAnalyticsGLQLQuery[] {
  return AGENT_ANALYTICS_QUERIES.filter((q) => q.category === category);
}

/**
 * Get query by ID
 */
export function getAnalyticsQueryById(id: string): AgentAnalyticsGLQLQuery | undefined {
  return AGENT_ANALYTICS_QUERIES.find((q) => q.id === id);
}

/**
 * Get all query IDs
 */
export function getAllAnalyticsQueryIds(): string[] {
  return AGENT_ANALYTICS_QUERIES.map((q) => q.id);
}

/**
 * Generate comprehensive analytics dashboard
 */
export function generateAnalyticsDashboard(options: {
  name: string;
  refresh: string;
  includeCategories?: AgentAnalyticsGLQLQuery['category'][];
}): Record<string, unknown> {
  const categories = options.includeCategories || [
    'dora-metrics',
    'effectiveness',
    'value-stream',
    'observability',
  ];

  const queries = AGENT_ANALYTICS_QUERIES.filter((q) =>
    categories.includes(q.category)
  );

  const panels = queries.map((query, index) => ({
    id: index + 1,
    title: query.name,
    type: query.visualization || 'metric',
    targets: [
      {
        query: query.query,
        refId: 'A',
      },
    ],
    gridPos: {
      x: (index % 3) * 8,
      y: Math.floor(index / 3) * 8,
      w: 8,
      h: 8,
    },
  }));

  return {
    dashboard: {
      title: options.name,
      tags: ['agent-analytics', 'ossa', 'dora', 'value-stream', 'observability'],
      timezone: 'browser',
      refresh: options.refresh,
      panels,
    },
  };
}

/**
 * Export query library for external use
 */
export default AGENT_ANALYTICS_QUERIES;
