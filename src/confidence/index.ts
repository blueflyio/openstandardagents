/**
 * OSSA SDK — Confidence Scoring Module
 * @package @bluefly/openstandardagents
 *
 * Canonical confidence gate implementation for the OSSA platform.
 * Referenced by: duadp, workflow-engine, social-gate, any Cedar quality gate consumer.
 *
 * Research basis:
 *   - Cedar Policies for AI Agent Governance (OSSA Research, 2026-03-09)
 *   - NIST AI RMF 1.0, MEASURE 2.5: AI system performance evaluated using metrics
 *   - LangChain State of Agent Engineering 2026: 57% orgs run agents in prod;
 *     quality is primary barrier (32% of respondents)
 *   - Confidence-Informed Self-Consistency (CISC): 46% fewer reasoning paths
 *     with equal accuracy (Xiong et al., 2024)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConfidenceAction = 'proceed' | 'human_review' | 'reject';

export interface ConfidenceVerdict {
  action: ConfidenceAction;
  confidence: number;
  reason: string;
  /** Set on human_review — trust tier to downgrade to while review pending */
  degraded_tier?: string;
}

export interface DeployGateContext {
  confidence_score: number;
  test_coverage: number;
  security_score: number;
  vulnerability_count: number;
  day_of_week: string;
  human_approved: boolean;
}

// ---------------------------------------------------------------------------
// Three-tier confidence routing
// Thresholds: ≥90 auto-approve, 50–89 human review, <50 reject
// Source: Cedar Policies for AI Agent Governance (OSSA Research 2026)
// ---------------------------------------------------------------------------

/**
 * Gate an agent action based on model confidence score.
 *
 * @param confidence  [0–100] confidence score. 0 means not provided — skip gate.
 * @param trustTier   OSSA trust tier of the resource being published/acted on.
 * @param validationPassed  Whether OSSA schema validation succeeded.
 */
export function confidenceGate(
  confidence: number,
  trustTier: string = 'community',
  validationPassed: boolean = false,
): ConfidenceVerdict {
  if (confidence === 0) {
    return { action: 'proceed', confidence, reason: 'no-model-confidence-provided' };
  }

  if (confidence >= 90) {
    return { action: 'proceed', confidence, reason: 'high-confidence-auto-approve' };
  }

  if (confidence >= 50) {
    const isHighTrust = ['verified', 'official'].includes(trustTier);
    if (isHighTrust) {
      return {
        action: 'human_review',
        confidence,
        reason: 'medium-confidence-requires-review-for-high-trust-tier',
        degraded_tier: 'signed',
      };
    }
    return { action: 'proceed', confidence, reason: 'medium-confidence-acceptable-for-tier' };
  }

  if (validationPassed) {
    return {
      action: 'human_review',
      confidence,
      reason: 'low-confidence-but-validation-passed',
      degraded_tier: 'community',
    };
  }

  return { action: 'reject', confidence, reason: 'low-confidence-and-validation-failed' };
}

// ---------------------------------------------------------------------------
// Logprob → confidence conversion
// Source: "log probability analysis" section — Cedar Policies OSSA Research 2026
// ---------------------------------------------------------------------------

/**
 * Convert token log-probabilities to an integer [0–100] confidence score.
 * Uses mean of exp(logprob) across all tokens.
 *
 * Caveat: Even high-performing LLMs show minimal confidence variation between
 * correct/incorrect answers — domain-specific calibration is recommended
 * (LangChain State of Agent Engineering 2026, p. 14).
 */
export function logprobsToConfidence(logprobs: number[]): number {
  if (!logprobs?.length) return 0;
  const avgProb = logprobs.reduce((s, lp) => s + Math.exp(lp), 0) / logprobs.length;
  return Math.round(Math.min(1, Math.max(0, avgProb)) * 100);
}

// ---------------------------------------------------------------------------
// Self-consistency confidence scoring
// Source: CISC method (Xiong et al. 2024) — 46% fewer paths, equal accuracy
// ---------------------------------------------------------------------------

/**
 * Estimate confidence via self-consistency voting.
 * Samples multiple model outputs and uses agreement rate as confidence proxy.
 *
 * @param responses  Array of sampled model outputs (strings).
 * @returns  [0–100] confidence based on modal agreement rate.
 */
export function selfConsistencyConfidence(responses: string[]): number {
  if (!responses?.length) return 0;
  const freq: Record<string, number> = {};
  for (const r of responses) {
    const normalized = r.trim().toLowerCase();
    freq[normalized] = (freq[normalized] || 0) + 1;
  }
  const maxCount = Math.max(...Object.values(freq));
  return Math.round((maxCount / responses.length) * 100);
}

// ---------------------------------------------------------------------------
// Cedar deploy-gate context builder
// ---------------------------------------------------------------------------

/**
 * Build the Cedar context object for the `deploy` action quality gate.
 * Reads from CI artifact metrics; pass overrides when calling from tests.
 */
export function buildDeployGateContext(
  overrides: Partial<DeployGateContext> = {},
): DeployGateContext {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return {
    confidence_score: overrides.confidence_score ?? 0,
    test_coverage: overrides.test_coverage ?? 0,
    security_score: overrides.security_score ?? 0,
    vulnerability_count: overrides.vulnerability_count ?? 0,
    day_of_week: overrides.day_of_week ?? days[new Date().getDay()],
    human_approved: overrides.human_approved ?? false,
  };
}

// ---------------------------------------------------------------------------
// Resource confidence extractor
// ---------------------------------------------------------------------------

/**
 * Extract confidence score from an OSSA resource payload.
 * Checks metadata.confidence_score, spec.confidence_score, extensions.confidence_score.
 */
export function extractConfidenceScore(resource: Record<string, unknown>): number {
  const meta = resource.metadata as Record<string, unknown> | undefined;
  const spec = resource.spec as Record<string, unknown> | undefined;
  const ext = resource.extensions as Record<string, unknown> | undefined;
  const raw = meta?.confidence_score ?? spec?.confidence_score ?? ext?.confidence_score ?? 0;
  const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
  return isNaN(n) ? 0 : Math.min(100, Math.max(0, n));
}
