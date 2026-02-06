/**
 * OSSA - Open Standard for Software Agents
 *
 * Main entry point for programmatic access.
 */

// CRITICAL: Import reflect-metadata FIRST (required for InversifyJS decorators)
import 'reflect-metadata';

// Export services
export { AgentAuditService } from './services/audit.js';
export type {
  AuditOptions,
  AgentHealth,
  AuditReport,
} from './services/audit.js';

export { AgentProtocolClient } from './services/agent-protocol-client.js';
export type {
  AgentCard,
  AgentSearchFilters,
  AgentSearchQuery,
  AgentSearchResult,
  DIDResolutionResult,
  AgentRegistrationResponse,
  AgentProtocolClientConfig,
} from './services/agent-protocol-client.js';

// Export CLI (for programmatic use)
export { createAuditCommand } from './cli/commands/audit.js';
