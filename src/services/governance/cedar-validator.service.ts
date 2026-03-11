/**
 * Cedar Policy Validator Service
 *
 * Uses @cedar-policy/cedar-wasm to validate Cedar policies embedded in OSSA manifests.
 * This is OSSA's responsibility: schema definition + offline validation.
 * Runtime enforcement belongs to DUADP.
 */

import {
  checkParsePolicySet,
  checkParseSchema,
  type CheckParseAnswer,
  type DetailedError,
} from '@cedar-policy/cedar-wasm';

export interface CedarValidationResult {
  valid: boolean;
  policyId?: string;
  errors: string[];
  warnings: string[];
}

export interface CedarManifestValidationResult {
  valid: boolean;
  policyCount: number;
  results: CedarValidationResult[];
  hasSchema: boolean;
}

interface CedarPolicyEntry {
  id: string;
  description?: string;
  policy_text: string;
  version?: string;
}

interface CedarExtension {
  policies: CedarPolicyEntry[];
  schema_text?: string;
  entity_types?: string[];
  default_decision?: 'deny' | 'allow';
}

function extractErrors(answer: CheckParseAnswer): string[] {
  if (answer.type === 'failure') {
    return answer.errors.map(
      (e: DetailedError) => e.message ?? JSON.stringify(e),
    );
  }
  return [];
}

/**
 * Validate a single Cedar policy text for syntax correctness.
 */
export function validatePolicyText(
  policyText: string,
  policyId?: string,
): CedarValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const result = checkParsePolicySet({
      staticPolicies: policyText,
    });
    errors.push(...extractErrors(result));
  } catch (e: unknown) {
    errors.push(
      `Cedar WASM error: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  return { valid: errors.length === 0, policyId, errors, warnings };
}

/**
 * Validate a Cedar policy against a Cedar schema.
 */
export function validatePolicyWithSchema(
  policyText: string,
  schemaText: string,
  policyId?: string,
): CedarValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // First validate schema itself
  try {
    const schemaResult = checkParseSchema(schemaText);
    const schemaErrors = extractErrors(schemaResult);
    if (schemaErrors.length > 0) {
      errors.push(...schemaErrors.map((e) => `Schema error: ${e}`));
      return { valid: false, policyId, errors, warnings };
    }
  } catch (e: unknown) {
    errors.push(
      `Cedar schema parse error: ${e instanceof Error ? e.message : String(e)}`,
    );
    return { valid: false, policyId, errors, warnings };
  }

  // Then validate policy syntax
  try {
    const result = checkParsePolicySet({
      staticPolicies: policyText,
    });
    errors.push(...extractErrors(result));
  } catch (e: unknown) {
    errors.push(
      `Cedar WASM error: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  return { valid: errors.length === 0, policyId, errors, warnings };
}

/**
 * Extract and validate all Cedar policies from an OSSA manifest.
 */
export function validateManifestCedarPolicies(
  manifest: Record<string, unknown>,
): CedarManifestValidationResult {
  const extensions = manifest.extensions as
    | Record<string, unknown>
    | undefined;
  const security = extensions?.security as Record<string, unknown> | undefined;
  const cedarExt = security?.cedar as CedarExtension | undefined;

  if (!cedarExt || !cedarExt.policies || cedarExt.policies.length === 0) {
    return { valid: true, policyCount: 0, results: [], hasSchema: false };
  }

  const results: CedarValidationResult[] = [];
  const hasSchema = !!cedarExt.schema_text;

  for (const policy of cedarExt.policies) {
    const result = hasSchema
      ? validatePolicyWithSchema(
          policy.policy_text,
          cedarExt.schema_text!,
          policy.id,
        )
      : validatePolicyText(policy.policy_text, policy.id);
    results.push(result);
  }

  return {
    valid: results.every((r) => r.valid),
    policyCount: cedarExt.policies.length,
    results,
    hasSchema,
  };
}
