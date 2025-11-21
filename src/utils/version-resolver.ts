/**
 * Version Resolver Utility
 * Resolves wildcard OSSA apiVersion patterns to specific versions
 * 
 * Examples:
 * - ossa/v0.2.x → ossa/v0.2.4 (latest 0.2.x)
 * - ossa/v0.2 → ossa/v0.2.4 (same as 0.2.x)
 * - ossa/v0.x → ossa/v0.2.4 (latest 0.x.x)
 * - ossa/v0 → ossa/v0.2.4 (same as 0.x)
 */

export interface VersionResolution {
  original: string;
  resolved: string;
  isWildcard: boolean;
}

/**
 * Available OSSA versions (ordered from oldest to newest)
 */
const AVAILABLE_VERSIONS = [
  '0.1.9',
  '0.2.0',
  '0.2.1',
  '0.2.2',
  '0.2.3',
  '0.2.4',
] as const;

/**
 * Latest version for each major.minor series
 */
const LATEST_VERSIONS: Record<string, string> = {
  '0.1': '0.1.9',
  '0.2': '0.2.4',
  '0': '0.2.4', // Latest in 0.x series
  '1': '1.0.0', // When v1 is released
};

/**
 * Resolve wildcard apiVersion to specific version
 * @param apiVersion - apiVersion string (e.g., "ossa/v0.2.x", "ossa/v0.2.4")
 * @returns Resolved version with metadata
 */
export function resolveApiVersion(apiVersion: string): VersionResolution {
  // Remove "ossa/v" prefix
  const versionPart = apiVersion.replace(/^ossa\/v?/, '');
  
  // Check if it's already a specific version (no wildcards)
  if (/^\d+\.\d+\.\d+/.test(versionPart)) {
    return {
      original: apiVersion,
      resolved: apiVersion,
      isWildcard: false,
    };
  }
  
  // Handle dev versions
  const isDev = versionPart.includes('-dev');
  const baseVersion = versionPart.replace(/-dev$/, '');
  
  // Pattern matching for wildcards
  if (baseVersion === '0.2.x' || baseVersion === '0.2') {
    const resolved = `ossa/v${LATEST_VERSIONS['0.2']}${isDev ? '-dev' : ''}`;
    return {
      original: apiVersion,
      resolved,
      isWildcard: true,
    };
  }
  
  if (baseVersion === '0.x' || baseVersion === '0') {
    const resolved = `ossa/v${LATEST_VERSIONS['0']}${isDev ? '-dev' : ''}`;
    return {
      original: apiVersion,
      resolved,
      isWildcard: true,
    };
  }
  
  // Handle other minor version wildcards (e.g., 0.1.x)
  const minorMatch = baseVersion.match(/^(\d+\.\d+)\.x$/);
  if (minorMatch) {
    const minor = minorMatch[1];
    const latest = LATEST_VERSIONS[minor] || AVAILABLE_VERSIONS[AVAILABLE_VERSIONS.length - 1];
    const resolved = `ossa/v${latest}${isDev ? '-dev' : ''}`;
    return {
      original: apiVersion,
      resolved,
      isWildcard: true,
    };
  }
  
  // Handle major version wildcards (e.g., 1.x, 1)
  if (baseVersion === '1.x' || baseVersion === '1') {
    const resolved = `ossa/v${LATEST_VERSIONS['1'] || '1.0.0'}${isDev ? '-dev' : ''}`;
    return {
      original: apiVersion,
      resolved,
      isWildcard: true,
    };
  }
  
  // If no pattern matches, return as-is (will be validated by schema)
  return {
    original: apiVersion,
    resolved: apiVersion,
    isWildcard: false,
  };
}

/**
 * Extract schema version from apiVersion for validation
 * @param apiVersion - apiVersion string
 * @returns Schema version string (e.g., "0.2.4", "0.2.3")
 */
export function extractSchemaVersion(apiVersion: string): string {
  const resolved = resolveApiVersion(apiVersion);
  // Extract version number from resolved version
  const match = resolved.resolved.match(/^ossa\/v?(\d+\.\d+\.\d+)/);
  if (match) {
    return match[1];
  }
  // Fallback to latest
  return LATEST_VERSIONS['0.2'] || '0.2.4';
}

