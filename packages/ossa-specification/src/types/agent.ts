/**
 * OSSA Agent Type Definitions
 */

import { BridgeConfig } from './bridge';
import { MonitoringConfig } from './monitoring';
import { PerformanceConfig } from './performance';

export type ConformanceLevel = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface OSSAAgent {
  /** OSSA specification version */
  ossa: '1.0';
  /** Agent metadata */
  agent: AgentMetadata;
  /** Discovery configuration */
  discover: DiscoveryConfig;
  /** List of agent capabilities */
  capabilities: string[];
  /** API endpoints mapped to capabilities */
  api: Record<string, EndpointSpec>;
  /** Optional monitoring configuration */
  monitoring?: MonitoringConfig;
  /** Optional performance configuration */
  performance?: PerformanceConfig;
  /** Optional bridge configurations */
  bridge?: BridgeConfig;
}

export interface AgentMetadata {
  /** Agent name (lowercase, alphanumeric, hyphens allowed) */
  name: string;
  /** Semantic version (e.g., 1.0.0) */
  version: string;
  /** Brief description of the agent */
  description?: string;
  /** Author or organization */
  author?: string;
  /** License identifier (e.g., MIT, Apache-2.0) */
  license?: string;
  /** Tags for categorization */
  tags?: string[];
  /** OSSA conformance level */
  conformance?: ConformanceLevel;
}

export interface DiscoveryConfig {
  /** Enable automatic discovery */
  auto: boolean;
  /** Registry URL for agent registration */
  registry?: string;
  /** Discovery protocol */
  protocol?: 'uadp' | 'custom';
  /** Additional discovery endpoints */
  endpoints?: string[];
}

export interface EndpointSpec {
  /** Capability or capabilities this endpoint implements */
  capability: string | string[];
  /** Endpoint description */
  description?: string;
  /** Parameter definitions (reference to OpenAPI) */
  parameters?: Record<string, unknown>;
  /** Response definitions (reference to OpenAPI) */
  responses?: Record<string, unknown>;
}

// Validation helper types
export type ValidAgentName = string & { __brand: 'ValidAgentName' };
export type SemanticVersion = string & { __brand: 'SemanticVersion' };

// Factory functions for creating typed agents
export function createAgent(config: Omit<OSSAAgent, 'ossa'>): OSSAAgent {
  return {
    ossa: '1.0',
    ...config
  };
}

export function createMinimalAgent(
  name: string,
  version: string,
  capabilities: string[]
): OSSAAgent {
  return {
    ossa: '1.0',
    agent: { name, version },
    discover: { auto: true },
    capabilities,
    api: {}
  };
}

// Conformance level requirements
export interface ConformanceRequirements {
  bronze: {
    hasManifest: boolean;
    hasOpenAPI: boolean;
    hasCapabilities: boolean;
  };
  silver: {
    hasMonitoring: boolean;
    hasHealthEndpoint: boolean;
    hasMetricsEndpoint: boolean;
    hasIOAwareness: boolean;
  };
  gold: {
    hasBridge: boolean;
    hasPerformanceConfig: boolean;
    hasTracing: boolean;
    hasAutoScaling: boolean;
  };
  platinum: {
    hasMultipleBridges: boolean;
    hasAdvancedOptimization: boolean;
    hasCustomMetrics: boolean;
    hasCompleteDocumentation: boolean;
  };
}

// Type guards
export function isOSSAAgent(obj: unknown): obj is OSSAAgent {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'ossa' in obj &&
    (obj as any).ossa === '1.0' &&
    'agent' in obj &&
    'discover' in obj &&
    'capabilities' in obj &&
    'api' in obj
  );
}

export function hasConformanceLevel(
  agent: OSSAAgent,
  level: ConformanceLevel
): boolean {
  const levels: ConformanceLevel[] = ['bronze', 'silver', 'gold', 'platinum'];
  const agentLevel = agent.agent.conformance || 'bronze';
  const agentIndex = levels.indexOf(agentLevel);
  const requiredIndex = levels.indexOf(level);
  return agentIndex >= requiredIndex;
}