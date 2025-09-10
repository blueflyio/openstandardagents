/**
 * OSSA Agent Core Service
 * Main entry point for the agent type system
 */
import { Express } from 'express';
import { AgentRegistry } from './services/agent-registry.js';
import { AgentFactory } from './services/agent-factory.js';
declare const app: Express;
declare const agentRegistry: AgentRegistry;
declare const agentFactory: AgentFactory;
export { app, agentRegistry, agentFactory };
//# sourceMappingURL=index.d.ts.map