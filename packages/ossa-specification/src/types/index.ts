/**
 * OSSA v1.0 Type Definitions
 * Open Standard for Scalable AI Agents
 */

export * from './agent';
export * from './capability';
export * from './discovery';
export * from './bridge';
export * from './monitoring';
export * from './performance';

// Re-export commonly used types at root level
export type {
  OSSAAgent,
  AgentMetadata,
  DiscoveryConfig,
  EndpointSpec,
  ConformanceLevel
} from './agent';

export type {
  Capability,
  CapabilityType,
  CapabilityCategory
} from './capability';

export type {
  Registry,
  RegisteredAgent,
  WorkspaceInfo
} from './discovery';

export type {
  BridgeConfig,
  MCPBridgeConfig,
  A2ABridgeConfig,
  OpenAPIBridgeConfig
} from './bridge';

// Version constant
export const OSSA_VERSION = '1.0' as const;