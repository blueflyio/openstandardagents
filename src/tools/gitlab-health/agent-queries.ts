/**
 * Agent-Specific GLQL Queries
 * Comprehensive queries for agent observability and performance monitoring
 *
 * @module gitlab-health/agent-queries
 */

export interface AgentGLQLQuery {
  id: string;
  name: string;
  description: string;
  query: string;
  visualization?: 'chart' | 'table' | 'metric' | 'heatmap' | 'timeline';
  category: 'agent-overview' | 'agent-performance' | 'agent-cost' | 'agent-health' | 'agent-trends';
}

/**
 * Agent-specific GLQL queries for observability dashboard
 */
export const AGENT_GLQL_QUERIES: AgentGLQLQuery[] = [
  // ============================================================================
  // AGENT OVERVIEW: High-level agent KPIs
  // ============================================================================
  {
    id: 'agent-overview-execution-count',
    name: 'Agent Execution Count (Last 7 Days)',
    description: 'Total actions executed by each agent in the last 7 days',
    category: 'agent-overview',
    visualization: 'chart',
    query: `
      query AgentExecutionCount {
        auditEvents(
          entityType: "Agent"
          createdAfter: "${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}"
        ) {
          nodes {
            details
            createdAt
          }
          count
        }
      }
    `,
  },
  {
    id: 'agent-overview-success-rate',
    name: 'Agent Success Rate',
    description: 'Success rate by agent over the last 30 days',
    category: 'agent-overview',
    visualization: 'metric',
    query: `
      query AgentSuccessRate {
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
    id: 'agent-overview-total-agents',
    name: 'Total Active Agents',
    description: 'Number of unique agents that executed actions in the last 30 days',
    category: 'agent-overview',
    visualization: 'metric',
    query: `
      query TotalActiveAgents {
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
    id: 'agent-overview-actions-by-agent',
    name: 'Actions by Agent Type',
    description: 'Distribution of actions across all agent types',
    category: 'agent-overview',
    visualization: 'chart',
    query: `
      query ActionsByAgent {
        triage: auditEvents(
          entityType: "Agent"
          details: { agent_id: "triage-agent" }
          createdAfter: "${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}"
        ) {
          count
        }
        link: auditEvents(
          entityType: "Agent"
          details: { agent_id: "link-agent" }
          createdAfter: "${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}"
        ) {
          count
        }
        epic: auditEvents(
          entityType: "Agent"
          details: { agent_id: "epic-agent" }
          createdAfter: "${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}"
        ) {
          count
        }
        sprint: auditEvents(
          entityType: "Agent"
          details: { agent_id: "sprint-agent" }
          createdAfter: "${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}"
        ) {
          count
        }
        cleanup: auditEvents(
          entityType: "Agent"
          details: { agent_id: "cleanup-agent" }
          createdAfter: "${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}"
        ) {
          count
        }
        mentor: auditEvents(
          entityType: "Agent"
          details: { agent_id: "mentor-agent" }
          createdAfter: "${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}"
        ) {
          count
        }
      }
    `,
  },

  // ============================================================================
  // AGENT PERFORMANCE: Response times and throughput
  // ============================================================================
  {
    id: 'agent-performance-avg-duration',
    name: 'Average Agent Response Time',
    description: 'Average execution duration for each agent (last 30 days)',
    category: 'agent-performance',
    visualization: 'chart',
    query: `
      query AgentAvgDuration {
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
    id: 'agent-performance-p95-duration',
    name: 'Agent P95 Response Time',
    description: '95th percentile response time for each agent',
    category: 'agent-performance',
    visualization: 'chart',
    query: `
      query AgentP95Duration {
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
    id: 'agent-performance-slowest-actions',
    name: 'Top 10 Slowest Agent Actions',
    description: 'Slowest agent actions in the last 7 days',
    category: 'agent-performance',
    visualization: 'table',
    query: `
      query SlowestAgentActions {
        auditEvents(
          entityType: "Agent"
          createdAfter: "${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}"
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
    id: 'agent-performance-throughput',
    name: 'Agent Throughput (Actions/Hour)',
    description: 'Number of actions per hour for each agent',
    category: 'agent-performance',
    visualization: 'timeline',
    query: `
      query AgentThroughput {
        auditEvents(
          entityType: "Agent"
          createdAfter: "${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}"
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
  // AGENT COST: Token usage and cost tracking
  // ============================================================================
  {
    id: 'agent-cost-total-tokens',
    name: 'Total Tokens Used by Agent',
    description: 'Total token consumption per agent (last 30 days)',
    category: 'agent-cost',
    visualization: 'chart',
    query: `
      query AgentTotalTokens {
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
    id: 'agent-cost-daily-cost',
    name: 'Daily Agent Costs',
    description: 'Daily cost breakdown by agent (last 30 days)',
    category: 'agent-cost',
    visualization: 'timeline',
    query: `
      query AgentDailyCost {
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
    id: 'agent-cost-monthly-projection',
    name: 'Monthly Cost Projection',
    description: 'Projected monthly costs for each agent based on current usage',
    category: 'agent-cost',
    visualization: 'metric',
    query: `
      query AgentMonthlyCostProjection {
        auditEvents(
          entityType: "Agent"
          createdAfter: "${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}"
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
    id: 'agent-cost-by-action',
    name: 'Cost Breakdown by Action Type',
    description: 'Cost distribution across different action types',
    category: 'agent-cost',
    visualization: 'chart',
    query: `
      query AgentCostByAction {
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
    id: 'agent-cost-top-expensive',
    name: 'Top 5 Most Expensive Agents',
    description: 'Agents with highest token consumption',
    category: 'agent-cost',
    visualization: 'table',
    query: `
      query TopExpensiveAgents {
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
  // AGENT HEALTH: Failure rates and error tracking
  // ============================================================================
  {
    id: 'agent-health-failure-rate',
    name: 'Agent Failure Rate',
    description: 'Percentage of failed actions per agent (last 30 days)',
    category: 'agent-health',
    visualization: 'chart',
    query: `
      query AgentFailureRate {
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
    id: 'agent-health-consecutive-failures',
    name: 'Agents with Consecutive Failures',
    description: 'Agents experiencing repeated failures',
    category: 'agent-health',
    visualization: 'table',
    query: `
      query AgentConsecutiveFailures {
        auditEvents(
          entityType: "Agent"
          createdAfter: "${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}"
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
    id: 'agent-health-error-types',
    name: 'Top Error Types',
    description: 'Most common error types across all agents',
    category: 'agent-health',
    visualization: 'chart',
    query: `
      query AgentErrorTypes {
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
    id: 'agent-health-anomalies',
    name: 'Detected Anomalies',
    description: 'Recent anomalies detected across all agents',
    category: 'agent-health',
    visualization: 'table',
    query: `
      query AgentAnomalies {
        auditEvents(
          entityType: "Agent"
          createdAfter: "${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}"
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
  // AGENT TRENDS: Historical performance analysis
  // ============================================================================
  {
    id: 'agent-trends-execution-over-time',
    name: 'Agent Execution Trend (90 Days)',
    description: 'Agent activity trend over the last 90 days',
    category: 'agent-trends',
    visualization: 'timeline',
    query: `
      query AgentExecutionTrend {
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
  {
    id: 'agent-trends-success-rate-over-time',
    name: 'Success Rate Trend',
    description: 'Weekly success rate trend for each agent',
    category: 'agent-trends',
    visualization: 'timeline',
    query: `
      query AgentSuccessRateTrend {
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
  {
    id: 'agent-trends-cost-over-time',
    name: 'Cost Trend (90 Days)',
    description: 'Daily cost trend for all agents',
    category: 'agent-trends',
    visualization: 'timeline',
    query: `
      query AgentCostTrend {
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
  {
    id: 'agent-trends-performance-improvement',
    name: 'Performance Improvement',
    description: 'Week-over-week performance improvements',
    category: 'agent-trends',
    visualization: 'metric',
    query: `
      query AgentPerformanceImprovement {
        currentWeek: auditEvents(
          entityType: "Agent"
          createdAfter: "${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}"
        ) {
          nodes {
            details
            createdAt
          }
        }
        previousWeek: auditEvents(
          entityType: "Agent"
          createdAfter: "${new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()}"
          createdBefore: "${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}"
        ) {
          nodes {
            details
            createdAt
          }
        }
      }
    `,
  },
];

/**
 * Get queries by category
 */
export function getAgentQueriesByCategory(
  category: AgentGLQLQuery['category']
): AgentGLQLQuery[] {
  return AGENT_GLQL_QUERIES.filter((q) => q.category === category);
}

/**
 * Get query by ID
 */
export function getAgentQueryById(id: string): AgentGLQLQuery | undefined {
  return AGENT_GLQL_QUERIES.find((q) => q.id === id);
}

/**
 * Get all query IDs
 */
export function getAllAgentQueryIds(): string[] {
  return AGENT_GLQL_QUERIES.map((q) => q.id);
}

/**
 * Generate GitLab dashboard configuration
 */
export function generateAgentDashboard(options: {
  name: string;
  refresh: string;
}): Record<string, unknown> {
  const panels = AGENT_GLQL_QUERIES.map((query, index) => ({
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
      tags: ['agent-observability', 'ossa', 'metrics'],
      timezone: 'browser',
      refresh: options.refresh,
      panels,
    },
  };
}

/**
 * Export query library for external use
 */
export default AGENT_GLQL_QUERIES;
