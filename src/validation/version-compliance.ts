/**
 * Version compliance for OSSA manifests (platform gate).
 * Single source of truth for --min-api-version in CLI and programmatic use.
 */

/** Allowed apiVersion sets when requiring a minimum (e.g. platform requires ossa/v0.4+). */
export const MIN_API_VERSION_ALLOWED: Record<string, Set<string>> = {
  'ossa/v0.4': new Set(['ossa/v0.4', 'ossa/v0.4.1', 'ossa.bluefly.io/v1alpha1']),
};

export interface VersionComplianceResult {
  compliant: boolean;
  currentVersion?: string;
  requiredVersion: string;
}

/**
 * Check manifest apiVersion against a required minimum (e.g. ossa/v0.4).
 * Returns compliant only if apiVersion is in the allowed set for that minimum.
 */
export function checkVersionCompliance(
  apiVersion: string | undefined,
  minApiVersion: string
): VersionComplianceResult {
  const allowed = MIN_API_VERSION_ALLOWED[minApiVersion];
  const requiredVersion = minApiVersion;
  if (!allowed) return { compliant: true, requiredVersion };
  const compliant = !!apiVersion && allowed.has(apiVersion);
  return { compliant, currentVersion: apiVersion, requiredVersion };
}
