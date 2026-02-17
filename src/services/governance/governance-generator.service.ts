/**
 * Governance Generator Service
 *
 * Generates governance artifacts from an OSSA agent manifest.
 * Extracts from `extensions.governance`, `spec.autonomy`, and `spec.constraints`
 * to produce a complete governance directory structure:
 *
 *   governance/compliance.yaml         -- Compliance framework declarations
 *   governance/policies/autonomy.yaml  -- Autonomy boundaries
 *   governance/policies/constraints.yaml -- Cost/performance/resource limits
 *   governance/policies/team-permissions.yaml -- Per-member permissions (when team exists)
 *   governance/audit.yaml              -- Audit trail configuration
 *
 * Design: generates meaningful defaults when governance data is sparse so that
 * every exported agent ships with sensible governance out of the box.
 */

import * as yaml from 'yaml';
import type { OssaAgent } from '../../types/index.js';
import type { ExportFile } from '../../adapters/base/adapter.interface.js';

// ── Internal helper types ────────────────────────────────────────────────────

/** Loosely typed accessor for dynamic manifest sections. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

/** Governance extension block (extensions.governance). */
interface GovernanceExtension {
  authorization?: {
    clearanceLevel?: number;
    clearance_level?: number;
    toolPermissions?: ToolPermissionEntry[];
    tool_permissions?: ToolPermissionEntry[];
    policyReferences?: string[];
    policy_references?: string[];
  };
  quality?: {
    confidenceThreshold?: number;
    confidence_threshold?: number;
    testCoverageThreshold?: number;
    test_coverage_threshold?: number;
    securityScoreThreshold?: number;
    security_score_threshold?: number;
    maxVulnerabilityCount?: number;
    max_vulnerability_count?: number;
  };
  quality_requirements?: {
    confidenceThreshold?: number;
    confidence_threshold?: number;
    testCoverageThreshold?: number;
    test_coverage_threshold?: number;
    securityScoreThreshold?: number;
    security_score_threshold?: number;
    maxVulnerabilityCount?: number;
    max_vulnerability_count?: number;
  };
  compliance?: {
    frameworks?: string[];
    dataClassification?: string;
    data_classification?: string;
    auditLogging?: boolean;
    audit_logging_required?: boolean;
  };
}

interface ToolPermissionEntry {
  tool: string;
  riskLevel?: string;
  risk_level?: string;
  requiresApproval?: boolean;
  requires_approval?: boolean;
}

/** Autonomy block from spec.autonomy. */
interface AutonomyBlock {
  level?: string;
  approval_required?: boolean;
  approvalRequired?: boolean;
  allowed_actions?: string[];
  allowedActions?: string[];
  blocked_actions?: string[];
  blockedActions?: string[];
}

/** Constraints block from spec.constraints. */
interface ConstraintsBlock {
  cost?: {
    maxTokensPerDay?: number;
    maxTokensPerRequest?: number;
    maxCostPerDay?: number;
    currency?: string;
  };
  performance?: {
    maxLatencySeconds?: number;
    maxErrorRate?: number;
    timeoutSeconds?: number;
  };
  resources?: {
    cpu?: string;
    memory?: string;
    gpu?: string;
  };
}

/** Shape of a single team member (dynamic -- varies by manifest). */
interface TeamMember {
  name?: string;
  agent_ref?: string;
  agentRef?: string;
  role?: string;
  kind?: string;
  agentKind?: string;
}

// ── Compliance framework requirement mappings ────────────────────────────────

interface FrameworkRequirement {
  id: string;
  description: string;
  controls: string[];
}

const FRAMEWORK_REQUIREMENTS: Record<string, FrameworkRequirement[]> = {
  SOC2: [
    {
      id: 'SOC2-CC6.1',
      description: 'Logical and physical access controls',
      controls: ['rbac-enforcement', 'least-privilege-access', 'access-review-quarterly'],
    },
    {
      id: 'SOC2-CC6.3',
      description: 'Role-based access with segregation of duties',
      controls: ['role-separation', 'approval-workflows', 'privilege-escalation-monitoring'],
    },
    {
      id: 'SOC2-CC7.2',
      description: 'System monitoring and anomaly detection',
      controls: ['audit-logging', 'anomaly-detection', 'incident-response-plan'],
    },
    {
      id: 'SOC2-CC8.1',
      description: 'Change management controls',
      controls: ['change-approval', 'rollback-capability', 'version-tracking'],
    },
  ],
  HIPAA: [
    {
      id: 'HIPAA-164.312(a)',
      description: 'Access control -- unique user identification',
      controls: ['unique-agent-identity', 'emergency-access-procedure', 'automatic-logoff'],
    },
    {
      id: 'HIPAA-164.312(b)',
      description: 'Audit controls -- hardware/software/procedural',
      controls: ['audit-trail-immutable', 'audit-retention-6-years', 'audit-review-regular'],
    },
    {
      id: 'HIPAA-164.312(c)',
      description: 'Integrity controls',
      controls: ['data-integrity-verification', 'tamper-detection', 'checksums'],
    },
    {
      id: 'HIPAA-164.312(e)',
      description: 'Transmission security',
      controls: ['encryption-in-transit-tls12', 'encryption-at-rest-aes256'],
    },
  ],
  GDPR: [
    {
      id: 'GDPR-Art5',
      description: 'Principles of data processing',
      controls: ['purpose-limitation', 'data-minimisation', 'storage-limitation'],
    },
    {
      id: 'GDPR-Art25',
      description: 'Data protection by design and default',
      controls: ['privacy-by-design', 'default-privacy-settings', 'dpia-required'],
    },
    {
      id: 'GDPR-Art30',
      description: 'Records of processing activities',
      controls: ['processing-records', 'data-flow-mapping', 'controller-documentation'],
    },
    {
      id: 'GDPR-Art33',
      description: 'Notification of data breach',
      controls: ['breach-detection-72h', 'breach-notification-procedure', 'breach-documentation'],
    },
  ],
  'PCI-DSS': [
    {
      id: 'PCI-DSS-Req3',
      description: 'Protect stored cardholder data',
      controls: ['encryption-at-rest', 'key-management', 'data-masking'],
    },
    {
      id: 'PCI-DSS-Req4',
      description: 'Encrypt cardholder data in transit',
      controls: ['tls-1.2-minimum', 'certificate-management', 'no-plaintext-transmission'],
    },
    {
      id: 'PCI-DSS-Req10',
      description: 'Track and monitor access',
      controls: ['audit-trail-all-access', 'log-retention-1-year', 'daily-log-review'],
    },
    {
      id: 'PCI-DSS-Req11',
      description: 'Regular security testing',
      controls: ['quarterly-vulnerability-scan', 'annual-penetration-test', 'ids-ips'],
    },
  ],
  FedRAMP: [
    {
      id: 'FedRAMP-AC',
      description: 'Access control family (NIST 800-53)',
      controls: ['account-management', 'access-enforcement', 'separation-of-duties'],
    },
    {
      id: 'FedRAMP-AU',
      description: 'Audit and accountability family',
      controls: ['audit-events', 'audit-storage', 'audit-review-analysis'],
    },
    {
      id: 'FedRAMP-SC',
      description: 'System and communications protection',
      controls: ['fips-140-2-cryptography', 'boundary-protection', 'cryptographic-key-management'],
    },
    {
      id: 'FedRAMP-CM',
      description: 'Configuration management',
      controls: ['baseline-configuration', 'configuration-change-control', 'least-functionality'],
    },
  ],
};

// ── Default autonomy levels ──────────────────────────────────────────────────

const AUTONOMY_LEVEL_DESCRIPTIONS: Record<string, string> = {
  autonomous: 'Agent operates independently within defined boundaries. No human approval required for standard operations.',
  'semi-autonomous': 'Agent operates independently for routine tasks but requires human approval for high-risk or irreversible actions.',
  supervised: 'Agent proposes actions and waits for human review before execution. All outputs are reviewed.',
  'human-in-the-loop': 'Agent assists humans but never acts independently. Every action requires explicit human confirmation.',
};

// ── Service implementation ───────────────────────────────────────────────────

export class GovernanceGeneratorService {
  /**
   * Generate all governance artifacts from an OSSA manifest.
   * Returns an array of ExportFile entries ready for writing.
   */
  generate(manifest: OssaAgent): ExportFile[] {
    const files: ExportFile[] = [];
    const governance = this.resolveGovernanceExtension(manifest);
    const autonomy = this.resolveAutonomy(manifest);
    const constraints = this.resolveConstraints(manifest);
    const agentName = manifest.metadata?.name ?? 'unnamed-agent';
    const agentVersion = manifest.metadata?.version ?? '0.0.0';
    const agentKind = manifest.metadata?.agentKind ?? 'worker';
    const architecturePattern = manifest.metadata?.agentArchitecture?.pattern ?? 'single';

    // 1. compliance.yaml
    files.push(this.generateComplianceFile(governance, agentName, agentVersion, agentKind));

    // 2. policies/autonomy.yaml
    files.push(this.generateAutonomyPolicy(autonomy, governance, agentName, agentKind));

    // 3. policies/constraints.yaml
    files.push(this.generateConstraintsPolicy(constraints, agentName));

    // 4. policies/team-permissions.yaml (only when team exists)
    const teamMembers = this.resolveTeamMembers(manifest);
    if (teamMembers.length > 0) {
      files.push(
        this.generateTeamPermissions(teamMembers, autonomy, governance, agentName, architecturePattern)
      );
    }

    // 5. audit.yaml
    files.push(this.generateAuditConfig(governance, agentName, agentVersion));

    return files;
  }

  // ── Resolution helpers ───────────────────────────────────────────────────

  /**
   * Resolve governance extension from both spec-level and top-level extensions.
   * Spec-level takes precedence. Returns a normalised structure.
   */
  private resolveGovernanceExtension(manifest: OssaAgent): GovernanceExtension {
    const spec = manifest.spec as AnyRecord | undefined;
    const topLevel = (manifest.extensions as AnyRecord)?.governance as GovernanceExtension | undefined;
    const specLevel = spec?.governance as GovernanceExtension | undefined;
    const extLevel = spec?.extensions?.governance as GovernanceExtension | undefined;

    // Merge: spec.governance > spec.extensions.governance > extensions.governance
    return {
      ...topLevel,
      ...extLevel,
      ...specLevel,
    };
  }

  private resolveAutonomy(manifest: OssaAgent): AutonomyBlock {
    return (manifest.spec?.autonomy as AutonomyBlock) ?? {};
  }

  private resolveConstraints(manifest: OssaAgent): ConstraintsBlock {
    return (manifest.spec?.constraints as ConstraintsBlock) ?? {};
  }

  /**
   * Extract team members from multiple possible locations:
   *   spec.team.members, spec.team.agents, spec.team.participants
   */
  private resolveTeamMembers(manifest: OssaAgent): TeamMember[] {
    const spec = manifest.spec as AnyRecord | undefined;
    if (!spec?.team) return [];

    const team = spec.team as AnyRecord;
    const members: TeamMember[] =
      team.members ?? team.agents ?? team.participants ?? [];

    return Array.isArray(members) ? members : [];
  }

  // ── File generators ──────────────────────────────────────────────────────

  /**
   * Generate governance/compliance.yaml with framework-specific requirements.
   */
  private generateComplianceFile(
    governance: GovernanceExtension,
    agentName: string,
    agentVersion: string,
    agentKind: string,
  ): ExportFile {
    const compliance = governance.compliance ?? {};
    const quality = governance.quality ?? governance.quality_requirements ?? {};
    const authorization = governance.authorization ?? {};

    const declaredFrameworks: string[] = compliance.frameworks ?? [];
    const dataClassification: string =
      compliance.dataClassification ??
      compliance.data_classification ??
      this.inferDataClassification(declaredFrameworks);

    const auditLogging: boolean =
      compliance.auditLogging ??
      compliance.audit_logging_required ??
      declaredFrameworks.length > 0;

    // Build framework-specific requirement sections
    const frameworkSections: AnyRecord[] = declaredFrameworks.map((fw) => {
      const upperFw = fw.toUpperCase() === 'PCI-DSS' ? 'PCI-DSS' : fw.toUpperCase();
      const requirements = FRAMEWORK_REQUIREMENTS[upperFw] ?? FRAMEWORK_REQUIREMENTS[fw] ?? [];
      return {
        framework: fw,
        status: 'declared',
        requirements: requirements.map((r) => ({
          id: r.id,
          description: r.description,
          controls: r.controls,
          status: 'pending-validation',
        })),
      };
    });

    // If no frameworks declared, provide a sensible default
    if (frameworkSections.length === 0) {
      frameworkSections.push({
        framework: 'internal-baseline',
        status: 'active',
        requirements: [
          {
            id: 'BASELINE-001',
            description: 'Agent identity and access control',
            controls: ['unique-agent-identity', 'least-privilege-access'],
            status: 'active',
          },
          {
            id: 'BASELINE-002',
            description: 'Action audit logging',
            controls: ['audit-logging', 'structured-log-format'],
            status: 'active',
          },
          {
            id: 'BASELINE-003',
            description: 'Output validation',
            controls: ['output-schema-validation', 'error-handling'],
            status: 'active',
          },
        ],
      });
    }

    // Quality thresholds with sensible defaults
    const confidenceThreshold =
      quality.confidenceThreshold ?? quality.confidence_threshold ?? 70;
    const testCoverageThreshold =
      quality.testCoverageThreshold ?? quality.test_coverage_threshold ?? 60;
    const securityScoreThreshold =
      quality.securityScoreThreshold ?? quality.security_score_threshold ?? 70;
    const maxVulnerabilityCount =
      quality.maxVulnerabilityCount ?? quality.max_vulnerability_count ?? 0;

    // Authorization clearance
    const clearanceLevel =
      authorization.clearanceLevel ??
      authorization.clearance_level ??
      this.inferClearanceLevel(agentKind);

    const doc: AnyRecord = {
      apiVersion: 'governance/v1',
      kind: 'ComplianceProfile',
      metadata: {
        agent: agentName,
        version: agentVersion,
        generatedAt: new Date().toISOString(),
        generatedBy: 'ossa-governance-generator',
      },
      spec: {
        dataClassification,
        auditLogging,
        clearanceLevel,
        qualityGates: {
          confidenceThreshold,
          testCoverageThreshold,
          securityScoreThreshold,
          maxVulnerabilityCount,
        },
        frameworks: frameworkSections,
      },
    };

    // Include tool permissions if declared
    const toolPermissions =
      authorization.toolPermissions ?? authorization.tool_permissions ?? [];
    if (toolPermissions.length > 0) {
      doc.spec.toolPermissions = toolPermissions.map((tp) => ({
        tool: tp.tool,
        riskLevel: tp.riskLevel ?? tp.risk_level ?? 'medium',
        requiresApproval: tp.requiresApproval ?? tp.requires_approval ?? false,
      }));
    }

    // Include policy references if declared
    const policyRefs =
      authorization.policyReferences ?? authorization.policy_references ?? [];
    if (policyRefs.length > 0) {
      doc.spec.policyReferences = policyRefs;
    }

    return {
      path: 'governance/compliance.yaml',
      content: this.toYaml(doc),
      type: 'config',
      language: 'yaml',
    };
  }

  /**
   * Generate governance/policies/autonomy.yaml with clear boundaries.
   */
  private generateAutonomyPolicy(
    autonomy: AutonomyBlock,
    governance: GovernanceExtension,
    agentName: string,
    agentKind: string,
  ): ExportFile {
    const level = autonomy.level ?? this.inferAutonomyLevel(agentKind);
    const approvalRequired =
      autonomy.approval_required ?? autonomy.approvalRequired ?? level !== 'autonomous';
    const allowedActions =
      autonomy.allowed_actions ?? autonomy.allowedActions ?? [];
    const blockedActions =
      autonomy.blocked_actions ?? autonomy.blockedActions ?? [];

    // Provide defaults when lists are empty
    const effectiveAllowed =
      allowedActions.length > 0
        ? allowedActions
        : this.defaultAllowedActions(agentKind);
    const effectiveBlocked =
      blockedActions.length > 0
        ? blockedActions
        : this.defaultBlockedActions(agentKind);

    // Derive escalation policy from autonomy level
    const escalationPolicy = this.buildEscalationPolicy(level, approvalRequired);

    // Authorization-based constraints
    const clearanceLevel =
      governance.authorization?.clearanceLevel ??
      governance.authorization?.clearance_level ??
      this.inferClearanceLevel(agentKind);

    const doc: AnyRecord = {
      apiVersion: 'governance/v1',
      kind: 'AutonomyPolicy',
      metadata: {
        agent: agentName,
        description: AUTONOMY_LEVEL_DESCRIPTIONS[level] ?? `Autonomy level: ${level}`,
      },
      spec: {
        level,
        approvalRequired,
        clearanceLevel,
        boundaries: {
          allowedActions: effectiveAllowed,
          blockedActions: effectiveBlocked,
        },
        escalation: escalationPolicy,
        riskThresholds: {
          low: {
            requiresApproval: false,
            description: 'Read-only operations, no side effects',
          },
          medium: {
            requiresApproval: level === 'supervised' || level === 'human-in-the-loop',
            description: 'Write operations, reversible changes',
          },
          high: {
            requiresApproval: level !== 'autonomous',
            description: 'Destructive or high-impact operations',
          },
          critical: {
            requiresApproval: true,
            description: 'System-level changes, always require human approval',
          },
        },
      },
    };

    return {
      path: 'governance/policies/autonomy.yaml',
      content: this.toYaml(doc),
      type: 'config',
      language: 'yaml',
    };
  }

  /**
   * Generate governance/policies/constraints.yaml with budget, performance, and resource limits.
   */
  private generateConstraintsPolicy(
    constraints: ConstraintsBlock,
    agentName: string,
  ): ExportFile {
    const cost = constraints.cost ?? {};
    const performance = constraints.performance ?? {};
    const resources = constraints.resources ?? {};

    const doc: AnyRecord = {
      apiVersion: 'governance/v1',
      kind: 'ConstraintsPolicy',
      metadata: {
        agent: agentName,
      },
      spec: {
        budget: {
          maxTokensPerDay: cost.maxTokensPerDay ?? 100_000,
          maxTokensPerRequest: cost.maxTokensPerRequest ?? 4_096,
          maxCostPerDay: cost.maxCostPerDay ?? 10.0,
          currency: cost.currency ?? 'USD',
          alertThresholds: {
            warning: 0.8,
            critical: 0.95,
          },
          enforcement: 'hard-limit',
        },
        performanceSLA: {
          maxLatencySeconds: performance.maxLatencySeconds ?? 30,
          maxErrorRate: performance.maxErrorRate ?? 0.01,
          timeoutSeconds: performance.timeoutSeconds ?? 60,
          retryPolicy: {
            maxAttempts: 3,
            backoffStrategy: 'exponential',
            initialDelayMs: 1000,
          },
        },
        resources: {
          cpu: resources.cpu ?? '500m',
          memory: resources.memory ?? '512Mi',
          gpu: resources.gpu ?? null,
          limits: {
            cpu: resources.cpu ?? '500m',
            memory: resources.memory ?? '512Mi',
          },
          requests: {
            cpu: this.halveResource(resources.cpu ?? '500m'),
            memory: this.halveResource(resources.memory ?? '512Mi'),
          },
        },
      },
    };

    return {
      path: 'governance/policies/constraints.yaml',
      content: this.toYaml(doc),
      type: 'config',
      language: 'yaml',
    };
  }

  /**
   * Generate governance/policies/team-permissions.yaml with per-member permissions.
   * Permission scoping is based on agent kind:
   *   - team-lead / orchestrator -> broad permissions
   *   - teammate / worker        -> scoped to assigned role
   *   - subagent                 -> restricted to specific tasks
   */
  private generateTeamPermissions(
    members: TeamMember[],
    autonomy: AutonomyBlock,
    governance: GovernanceExtension,
    agentName: string,
    architecturePattern: string,
  ): ExportFile {
    const teamLevel =
      autonomy.level ?? 'semi-autonomous';
    const baseClearance =
      governance.authorization?.clearanceLevel ??
      governance.authorization?.clearance_level ??
      2;

    const memberPermissions = members.map((member) => {
      const memberName = member.name ?? member.agent_ref ?? member.agentRef ?? 'unnamed';
      const memberRole = member.role ?? 'worker';
      const memberKind = member.kind ?? member.agentKind ?? this.inferKindFromRole(memberRole);

      const tier = this.computeMemberTier(memberKind, baseClearance);

      return {
        name: memberName,
        role: memberRole,
        kind: memberKind,
        permissions: {
          clearanceLevel: tier.clearance,
          accessTier: tier.accessTier,
          approvalRequired: tier.approvalRequired,
          allowedOperations: tier.allowedOperations,
          blockedOperations: tier.blockedOperations,
          canEscalate: tier.canEscalate,
          canDelegate: tier.canDelegate,
        },
      };
    });

    const doc: AnyRecord = {
      apiVersion: 'governance/v1',
      kind: 'TeamPermissions',
      metadata: {
        agent: agentName,
        teamSize: members.length,
        architecturePattern,
      },
      spec: {
        teamAutonomyLevel: teamLevel,
        coordinationModel: this.inferCoordinationModel(architecturePattern),
        members: memberPermissions,
        defaults: {
          description: 'Default permissions applied to any member not explicitly listed',
          clearanceLevel: Math.max(0, baseClearance - 1),
          accessTier: 'tier_2_write_limited',
          approvalRequired: true,
          allowedOperations: ['read', 'analyze', 'report'],
          blockedOperations: ['delete', 'deploy-production', 'modify-governance'],
        },
      },
    };

    return {
      path: 'governance/policies/team-permissions.yaml',
      content: this.toYaml(doc),
      type: 'config',
      language: 'yaml',
    };
  }

  /**
   * Generate governance/audit.yaml with retention, format, and event configuration.
   */
  private generateAuditConfig(
    governance: GovernanceExtension,
    agentName: string,
    agentVersion: string,
  ): ExportFile {
    const compliance = governance.compliance ?? {};
    const declaredFrameworks = compliance.frameworks ?? [];
    const auditRequired =
      compliance.auditLogging ??
      compliance.audit_logging_required ??
      true; // Default: audit is always enabled

    // Retention based on strictest compliance requirement
    const retentionDays = this.computeRetentionDays(declaredFrameworks);

    const doc: AnyRecord = {
      apiVersion: 'governance/v1',
      kind: 'AuditConfig',
      metadata: {
        agent: agentName,
        version: agentVersion,
      },
      spec: {
        enabled: auditRequired,
        format: 'json',
        output: {
          destination: 'structured-log',
          fallback: 'file',
          filePath: `logs/${agentName}/audit.jsonl`,
        },
        retention: {
          days: retentionDays,
          policy: retentionDays >= 365 ? 'compliance-mandatory' : 'standard',
          archiveAfterDays: Math.min(90, retentionDays),
          compressionEnabled: true,
        },
        events: {
          actionExecution: {
            enabled: true,
            detail: 'full',
            description: 'Log every tool call, API request, and action taken',
          },
          approvalDecisions: {
            enabled: true,
            detail: 'full',
            description: 'Log all approval requests and decisions (approved, denied, timed-out)',
          },
          policyEvaluations: {
            enabled: true,
            detail: 'summary',
            description: 'Log governance policy evaluation outcomes',
          },
          errorEvents: {
            enabled: true,
            detail: 'full',
            description: 'Log all errors, failures, and exception traces',
          },
          accessEvents: {
            enabled: true,
            detail: 'full',
            description: 'Log resource access (data reads, writes, deletions)',
          },
          configChanges: {
            enabled: true,
            detail: 'full',
            description: 'Log changes to agent configuration and governance policies',
          },
          costTracking: {
            enabled: true,
            detail: 'summary',
            description: 'Log token usage, cost accrual, and budget threshold events',
          },
        },
        integrity: {
          checksumAlgorithm: 'sha256',
          tamperDetection: declaredFrameworks.length > 0,
          signEntries: declaredFrameworks.some((fw) =>
            ['HIPAA', 'FedRAMP', 'PCI-DSS'].includes(fw.toUpperCase())
          ),
        },
        redaction: {
          enabled: true,
          patterns: [
            { type: 'pii', action: 'hash', description: 'Hash personally identifiable information' },
            { type: 'secrets', action: 'redact', description: 'Redact API keys, tokens, and credentials' },
            { type: 'phi', action: 'hash', description: 'Hash protected health information (HIPAA)' },
          ],
        },
      },
    };

    return {
      path: 'governance/audit.yaml',
      content: this.toYaml(doc),
      type: 'config',
      language: 'yaml',
    };
  }

  // ── Inference and default helpers ────────────────────────────────────────

  /**
   * Infer data classification from compliance frameworks.
   * Stricter frameworks imply higher classification.
   */
  private inferDataClassification(frameworks: string[]): string {
    const upper = frameworks.map((f) => f.toUpperCase());
    if (upper.includes('HIPAA') || upper.includes('PCI-DSS')) return 'restricted';
    if (upper.includes('FEDRAMP')) return 'confidential';
    if (upper.includes('SOC2') || upper.includes('GDPR')) return 'internal';
    return 'internal';
  }

  /**
   * Infer clearance level from agent kind.
   * More powerful agent kinds get higher default clearance.
   */
  private inferClearanceLevel(agentKind: string): number {
    switch (agentKind) {
      case 'orchestrator':
      case 'supervisor':
        return 4;
      case 'planner':
      case 'coordinator':
        return 3;
      case 'executor':
      case 'worker':
      case 'assistant':
      case 'analyst':
      case 'researcher':
      case 'specialist':
        return 2;
      case 'reviewer':
      case 'monitor':
        return 1;
      case 'tool':
        return 1;
      default:
        return 1;
    }
  }

  /**
   * Infer autonomy level from agent kind.
   */
  private inferAutonomyLevel(agentKind: string): string {
    switch (agentKind) {
      case 'orchestrator':
      case 'coordinator':
        return 'semi-autonomous';
      case 'worker':
      case 'executor':
        return 'autonomous';
      case 'assistant':
        return 'human-in-the-loop';
      case 'reviewer':
      case 'monitor':
      case 'analyst':
        return 'supervised';
      default:
        return 'semi-autonomous';
    }
  }

  /**
   * Default allowed actions based on agent kind.
   */
  private defaultAllowedActions(agentKind: string): string[] {
    const base = ['read-data', 'analyze', 'generate-reports'];
    switch (agentKind) {
      case 'orchestrator':
      case 'coordinator':
        return [...base, 'delegate-tasks', 'coordinate-agents', 'monitor-progress'];
      case 'executor':
      case 'worker':
        return [...base, 'execute-tasks', 'write-data', 'call-tools'];
      case 'assistant':
        return [...base, 'respond-to-user', 'suggest-actions'];
      case 'reviewer':
        return [...base, 'review-outputs', 'approve-changes', 'add-comments'];
      case 'planner':
        return [...base, 'create-plans', 'estimate-effort', 'prioritise-tasks'];
      case 'monitor':
        return [...base, 'observe-metrics', 'trigger-alerts'];
      default:
        return base;
    }
  }

  /**
   * Default blocked actions based on agent kind.
   */
  private defaultBlockedActions(agentKind: string): string[] {
    const universal = [
      'modify-own-governance',
      'disable-audit-logging',
      'bypass-approval-workflows',
      'access-other-agent-credentials',
    ];
    switch (agentKind) {
      case 'reviewer':
      case 'monitor':
      case 'analyst':
        return [...universal, 'write-data', 'execute-deployments', 'modify-configurations'];
      case 'assistant':
        return [...universal, 'execute-deployments', 'modify-infrastructure'];
      default:
        return universal;
    }
  }

  /**
   * Build escalation policy based on autonomy level.
   */
  private buildEscalationPolicy(
    level: string,
    approvalRequired: boolean,
  ): AnyRecord {
    const policy: AnyRecord = {
      enabled: level !== 'autonomous' || approvalRequired,
      channels: ['human-supervisor'],
      timeoutBehavior: 'deny',
    };

    switch (level) {
      case 'autonomous':
        policy.triggerConditions = [
          'budget-threshold-exceeded',
          'error-rate-spike',
          'blocked-action-attempted',
        ];
        policy.timeoutSeconds = 300;
        break;
      case 'semi-autonomous':
        policy.triggerConditions = [
          'high-risk-action',
          'budget-threshold-exceeded',
          'confidence-below-threshold',
          'blocked-action-attempted',
        ];
        policy.timeoutSeconds = 600;
        break;
      case 'supervised':
        policy.triggerConditions = [
          'any-write-action',
          'any-external-call',
          'confidence-below-threshold',
        ];
        policy.timeoutSeconds = 900;
        break;
      case 'human-in-the-loop':
        policy.triggerConditions = ['every-action'];
        policy.timeoutSeconds = 1800;
        break;
      default:
        policy.triggerConditions = ['high-risk-action', 'blocked-action-attempted'];
        policy.timeoutSeconds = 600;
    }

    return policy;
  }

  /**
   * Infer agent kind from a role description string.
   */
  private inferKindFromRole(role: string): string {
    const lower = role.toLowerCase();
    if (lower.includes('lead') || lower.includes('manager') || lower.includes('orchestrat'))
      return 'team-lead';
    if (lower.includes('review') || lower.includes('approv'))
      return 'reviewer';
    if (lower.includes('monitor') || lower.includes('watch') || lower.includes('observ'))
      return 'monitor';
    if (lower.includes('sub') || lower.includes('helper'))
      return 'subagent';
    if (lower.includes('plan'))
      return 'planner';
    if (lower.includes('execut'))
      return 'executor';
    return 'teammate';
  }

  /**
   * Compute member permissions tier based on kind and base clearance.
   */
  private computeMemberTier(
    memberKind: string,
    baseClearance: number,
  ): {
    clearance: number;
    accessTier: string;
    approvalRequired: boolean;
    allowedOperations: string[];
    blockedOperations: string[];
    canEscalate: boolean;
    canDelegate: boolean;
  } {
    switch (memberKind) {
      case 'team-lead':
      case 'orchestrator':
      case 'supervisor':
        return {
          clearance: Math.min(5, baseClearance + 1),
          accessTier: 'tier_3_full_access',
          approvalRequired: false,
          allowedOperations: [
            'read', 'write', 'execute', 'delegate', 'coordinate',
            'approve-member-actions', 'modify-team-config', 'view-audit-logs',
          ],
          blockedOperations: [
            'modify-own-governance', 'disable-audit-logging',
            'access-other-team-credentials',
          ],
          canEscalate: true,
          canDelegate: true,
        };

      case 'coordinator':
      case 'planner':
        return {
          clearance: baseClearance,
          accessTier: 'tier_2_write_limited',
          approvalRequired: false,
          allowedOperations: [
            'read', 'analyze', 'plan', 'coordinate', 'create-issues',
            'assign-tasks', 'report',
          ],
          blockedOperations: [
            'modify-governance', 'deploy-production',
            'delete-data', 'modify-infrastructure',
          ],
          canEscalate: true,
          canDelegate: true,
        };

      case 'teammate':
      case 'worker':
      case 'executor':
        return {
          clearance: baseClearance,
          accessTier: 'tier_2_write_limited',
          approvalRequired: true,
          allowedOperations: [
            'read', 'write', 'execute-assigned-tasks', 'call-tools',
            'report-progress',
          ],
          blockedOperations: [
            'modify-governance', 'deploy-production', 'approve-changes',
            'delete-data', 'modify-team-config',
          ],
          canEscalate: true,
          canDelegate: false,
        };

      case 'reviewer':
        return {
          clearance: Math.max(1, baseClearance - 1),
          accessTier: 'tier_1_read',
          approvalRequired: false,
          allowedOperations: [
            'read', 'analyze', 'review', 'approve-changes', 'add-comments',
            'request-changes',
          ],
          blockedOperations: [
            'write-code', 'execute-deployments', 'modify-governance',
            'delete-data', 'modify-infrastructure',
          ],
          canEscalate: true,
          canDelegate: false,
        };

      case 'subagent':
        return {
          clearance: Math.max(0, baseClearance - 2),
          accessTier: 'tier_1_read',
          approvalRequired: true,
          allowedOperations: [
            'read-assigned-scope', 'execute-specific-task', 'report-to-parent',
          ],
          blockedOperations: [
            'write-outside-scope', 'communicate-external',
            'modify-governance', 'deploy', 'delete-data',
            'access-other-agent-data', 'modify-team-config',
          ],
          canEscalate: false,
          canDelegate: false,
        };

      case 'monitor':
      case 'analyst':
        return {
          clearance: Math.max(1, baseClearance - 1),
          accessTier: 'tier_1_read',
          approvalRequired: false,
          allowedOperations: [
            'read', 'observe-metrics', 'analyze-data', 'generate-reports',
            'trigger-alerts',
          ],
          blockedOperations: [
            'write-data', 'execute-tasks', 'modify-governance',
            'deploy', 'delete-data',
          ],
          canEscalate: true,
          canDelegate: false,
        };

      default:
        return {
          clearance: Math.max(0, baseClearance - 1),
          accessTier: 'tier_1_read',
          approvalRequired: true,
          allowedOperations: ['read', 'analyze', 'report'],
          blockedOperations: [
            'write', 'delete', 'deploy', 'modify-governance',
          ],
          canEscalate: false,
          canDelegate: false,
        };
    }
  }

  /**
   * Derive coordination model from architecture pattern.
   */
  private inferCoordinationModel(pattern: string): string {
    switch (pattern) {
      case 'hierarchical':
        return 'manager-worker';
      case 'swarm':
        return 'peer-to-peer-with-handoffs';
      case 'pipeline':
        return 'sequential-chain';
      case 'graph':
        return 'dag-orchestration';
      case 'reactive':
        return 'event-driven';
      case 'cognitive':
        return 'deliberative-reasoning';
      default:
        return 'central-coordinator';
    }
  }

  /**
   * Compute audit retention days from the strictest framework requirement.
   *
   * HIPAA:  6 years (2190 days)
   * FedRAMP: 3 years (1095 days)
   * PCI-DSS: 1 year (365 days)
   * SOC2:   1 year (365 days)
   * GDPR:   context-dependent, default 365 days
   * Default: 90 days
   */
  private computeRetentionDays(frameworks: string[]): number {
    if (frameworks.length === 0) return 90;

    const upper = frameworks.map((f) => f.toUpperCase());
    const retentionMap: Record<string, number> = {
      HIPAA: 2190,
      FEDRAMP: 1095,
      'PCI-DSS': 365,
      SOC2: 365,
      GDPR: 365,
    };

    let maxRetention = 90;
    for (const fw of upper) {
      const retention = retentionMap[fw] ?? 90;
      if (retention > maxRetention) {
        maxRetention = retention;
      }
    }
    return maxRetention;
  }

  /**
   * Halve a Kubernetes-style resource string for request values.
   * Examples: "1000m" -> "500m", "2Gi" -> "1Gi", "512Mi" -> "256Mi"
   */
  private halveResource(resource: string): string {
    const match = resource.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
    if (!match) return resource;
    const value = parseFloat(match[1]);
    const unit = match[2];
    const halved = Math.max(1, Math.round(value / 2));
    return `${halved}${unit}`;
  }

  /**
   * Serialise a document to YAML with consistent formatting.
   */
  private toYaml(doc: AnyRecord): string {
    return yaml.stringify(doc, {
      indent: 2,
      lineWidth: 120,
      defaultStringType: 'PLAIN',
      defaultKeyType: 'PLAIN',
      nullStr: '~',
    });
  }
}
