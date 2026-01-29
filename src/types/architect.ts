/**
 * AI Architect Types
 *
 * Definitions for the AI Architect service and its intermediate representations.
 */

import { Adapter, Principal } from './identity.js';
import { Capability } from './index.js';

export type AgentKind = 'Agent' | 'Task' | 'Workflow';

export interface ArchitectureConstraint {
  type: 'cost' | 'performance' | 'compliance' | 'platform';
  value: string | number | boolean;
  priority: 'must' | 'should' | 'nice-to-have';
}

/**
 * Architectural Blueprint
 * Intermediate representation of the agent system before manifest generation.
 * This allows for user review and adjustment of the "Plan".
 */
export interface Blueprint {
  title: string;
  summary: string;
  kind: AgentKind;

  // High-level design decisions
  architecture: {
    pattern:
      | 'single-agent'
      | 'multi-agent-swarm'
      | 'dag-workflow'
      | 'task-pipeline';
    reasoning: string;
  };

  // Selected components
  identity: {
    principal: Principal;
    adapters: Adapter[];
  };

  intelligence: {
    provider: string;
    model: string;
    rationale: string;
  };

  capabilities: {
    selected: Capability[];
    missing_but_needed: string[]; // Capabilities the user needs to build/acquire
  };

  constraints: ArchitectureConstraint[];
}

export interface ArchitectRecommendation {
  adapters: Adapter[];
  tools: string[]; // Tool names
  configuration: Record<string, unknown>;
  confidence: number;
}
