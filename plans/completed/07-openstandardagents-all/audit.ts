/**
 * @bluefly/agent-tracer — SOD: Audit Trail
 *
 * Structured audit entries for SOD gate decisions.
 * Retention policy:
 *   gate_decision  → 365 days
 *   sod_violation   → 730 days
 *   policy_change   → indefinite
 */

export type AuditEventType = 'gate_decision' | 'sod_violation' | 'policy_change';

export interface SODAuditEntry {
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  workflowId: string;
  sourceAgent: string;
  targetAgent: string;
  sourceTier: string;
  targetTier: string;
  action: string;
  decision: 'PERMIT' | 'DENY' | 'ESCALATE';
  reason: string;
  policyVersion: string;
  correlationId: string;
  metadata?: Record<string, unknown>;
}

export interface RetentionPolicy {
  eventType: AuditEventType;
  retentionDays: number | null; // null = indefinite
}

export const RETENTION_POLICIES: RetentionPolicy[] = [
  { eventType: 'gate_decision', retentionDays: 365 },
  { eventType: 'sod_violation', retentionDays: 730 },
  { eventType: 'policy_change', retentionDays: null },
];

/**
 * Calculate the retention expiry date for a given event type.
 * Returns null for indefinite retention.
 */
export function calculateRetention(
  eventType: AuditEventType,
  fromDate: Date = new Date(),
): Date | null {
  const policy = RETENTION_POLICIES.find((p) => p.eventType === eventType);
  if (!policy || policy.retentionDays === null) return null;
  const expiry = new Date(fromDate);
  expiry.setDate(expiry.getDate() + policy.retentionDays);
  return expiry;
}

/**
 * Create a new audit entry with auto-generated ID and timestamp.
 */
export function createAuditEntry(
  params: Omit<SODAuditEntry, 'id' | 'timestamp'>,
): SODAuditEntry {
  return {
    ...params,
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Determine if an audit entry represents a violation (for alerting).
 */
export function isViolation(entry: SODAuditEntry): boolean {
  return entry.decision === 'DENY' || entry.eventType === 'sod_violation';
}

/**
 * Format an audit entry as a structured log line.
 */
export function formatAuditLog(entry: SODAuditEntry): string {
  return JSON.stringify({
    type: 'sod_audit',
    ...entry,
    retentionExpiry: calculateRetention(entry.eventType)?.toISOString() ?? 'indefinite',
  });
}
