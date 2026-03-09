/**
 * @bluefly/agent-tracer — SOD: Prometheus Metrics
 *
 * Three core metrics for SOD enforcement observability:
 *   sod_gate_decisions_total   — Counter: decision={PERMIT|DENY|ESCALATE}
 *   sod_violations_total       — Counter: source_tier, target_tier, violation_type
 *   sod_gate_latency_seconds   — Histogram: p50/p99 gate evaluation time
 *
 * Compatible with prom-client (Node.js Prometheus client).
 */

import {
  Counter,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from 'prom-client';

// Dedicated registry for SOD metrics (avoids polluting global registry)
export const sodRegistry = new Registry();

// Collect default Node.js metrics into SOD registry
collectDefaultMetrics({ register: sodRegistry });

// --- Counter: Gate Decisions ---
export const sodGateDecisionsTotal = new Counter({
  name: 'sod_gate_decisions_total',
  help: 'Total SOD gate decisions by outcome',
  labelNames: ['decision', 'source_tier', 'target_tier', 'action'] as const,
  registers: [sodRegistry],
});

// --- Counter: Violations ---
export const sodViolationsTotal = new Counter({
  name: 'sod_violations_total',
  help: 'Total SOD violations by type and tier pair',
  labelNames: ['source_tier', 'target_tier', 'violation_type'] as const,
  registers: [sodRegistry],
});

// --- Histogram: Gate Latency ---
export const sodGateLatency = new Histogram({
  name: 'sod_gate_latency_seconds',
  help: 'SOD gate evaluation latency in seconds',
  labelNames: ['decision'] as const,
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [sodRegistry],
});

// --- Helper: Record a gate decision ---
export function recordGateDecision(params: {
  decision: 'PERMIT' | 'DENY' | 'ESCALATE';
  sourceTier: string;
  targetTier: string;
  action: string;
  latencyMs: number;
}): void {
  sodGateDecisionsTotal.inc({
    decision: params.decision,
    source_tier: params.sourceTier,
    target_tier: params.targetTier,
    action: params.action,
  });

  sodGateLatency.observe(
    { decision: params.decision },
    params.latencyMs / 1000,
  );
}

// --- Helper: Record a violation ---
export function recordViolation(params: {
  sourceTier: string;
  targetTier: string;
  violationType: string;
}): void {
  sodViolationsTotal.inc({
    source_tier: params.sourceTier,
    target_tier: params.targetTier,
    violation_type: params.violationType,
  });
}

// --- Expose /metrics endpoint content ---
export async function getMetrics(): Promise<string> {
  return sodRegistry.metrics();
}
