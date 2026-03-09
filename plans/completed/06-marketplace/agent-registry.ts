/**
 * @bluefly/agent-mesh — SOD: Agent Registry
 *
 * Canonical registry of 12 SOD-aware agents (3 per tier).
 * Used by middleware and compliance-engine for agent lookups and tier validation.
 *
 * Tier mapping:
 *   T1 Analyzer:  vulnerability-scanner, code-quality-analyzer, dependency-auditor
 *   T2 Reviewer:  merge-request-reviewer, architecture-reviewer, compliance-reviewer
 *   T3 Executor:  pipeline-remediation, deployment-agent, infrastructure-agent
 *   T4 Approver:  release-coordinator, change-approver, security-approver
 */

import { AgentTier } from './tiers';

export interface RegisteredAgent {
  agentId: string;
  tier: AgentTier;
  role: string;
  description: string;
}

export const AGENT_REGISTRY: RegisteredAgent[] = [
  // --- T1: Analyzers (read-only) ---
  {
    agentId: 'vulnerability-scanner',
    tier: AgentTier.ANALYZER,
    role: 'analyzer',
    description: 'SAST/DAST scanning and CVE detection',
  },
  {
    agentId: 'code-quality-analyzer',
    tier: AgentTier.ANALYZER,
    role: 'analyzer',
    description: 'Code quality metrics, lint, and complexity analysis',
  },
  {
    agentId: 'dependency-auditor',
    tier: AgentTier.ANALYZER,
    role: 'analyzer',
    description: 'Dependency tree audit and license compliance',
  },

  // --- T2: Reviewers (comment/label) ---
  {
    agentId: 'merge-request-reviewer',
    tier: AgentTier.REVIEWER,
    role: 'reviewer',
    description: 'Automated MR review with inline comments',
  },
  {
    agentId: 'architecture-reviewer',
    tier: AgentTier.REVIEWER,
    role: 'reviewer',
    description: 'Architecture pattern validation and ADR enforcement',
  },
  {
    agentId: 'compliance-reviewer',
    tier: AgentTier.REVIEWER,
    role: 'reviewer',
    description: 'Regulatory and policy compliance review',
  },

  // --- T3: Executors (push/deploy) ---
  {
    agentId: 'pipeline-remediation',
    tier: AgentTier.EXECUTOR,
    role: 'executor',
    description: 'Auto-fix pipeline failures and rerun jobs',
  },
  {
    agentId: 'deployment-agent',
    tier: AgentTier.EXECUTOR,
    role: 'executor',
    description: 'Environment deployments and rollbacks',
  },
  {
    agentId: 'infrastructure-agent',
    tier: AgentTier.EXECUTOR,
    role: 'executor',
    description: 'Terraform/K8s resource provisioning and scaling',
  },

  // --- T4: Approvers (merge/release) ---
  {
    agentId: 'release-coordinator',
    tier: AgentTier.APPROVER,
    role: 'approver',
    description: 'Release branch merge and tag coordination',
  },
  {
    agentId: 'change-approver',
    tier: AgentTier.APPROVER,
    role: 'approver',
    description: 'Change management approval and CAB gate',
  },
  {
    agentId: 'security-approver',
    tier: AgentTier.APPROVER,
    role: 'approver',
    description: 'Security review sign-off and vulnerability acceptance',
  },
];

/**
 * Lookup an agent by ID. Returns undefined if not found.
 */
export function getAgent(agentId: string): RegisteredAgent | undefined {
  return AGENT_REGISTRY.find((a) => a.agentId === agentId);
}

/**
 * Get all agents for a given tier.
 */
export function getAgentsByTier(tier: AgentTier): RegisteredAgent[] {
  return AGENT_REGISTRY.filter((a) => a.tier === tier);
}

/**
 * Validate that an agent ID exists and matches expected tier.
 */
export function validateAgent(
  agentId: string,
  expectedTier?: AgentTier,
): { valid: boolean; reason?: string } {
  const agent = getAgent(agentId);
  if (!agent) {
    return { valid: false, reason: `Unknown agent: ${agentId}` };
  }
  if (expectedTier && agent.tier !== expectedTier) {
    return {
      valid: false,
      reason: `Agent ${agentId} is ${agent.tier}, expected ${expectedTier}`,
    };
  }
  return { valid: true };
}
