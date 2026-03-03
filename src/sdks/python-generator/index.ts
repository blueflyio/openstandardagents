/**
 * Python SDK Bridge
 *
 * SOLID: Single Responsibility - Python SDK integration
 * DRY: Reuses shared validation
 *
 * Note: Python SDK implementation lives in sdks/python/ but
 * this provides TypeScript integration for the Python SDK
 */

export interface PythonSDKClient {
  loadManifest(filePath: string): Promise<unknown>;
  validateManifest(
    manifest: unknown
  ): Promise<{ valid: boolean; errors: string[] }>;
  exportManifest(
    manifest: unknown,
    format: 'yaml' | 'json' | 'python'
  ): Promise<string>;
}

/**
 * Minimal bridge: load, validate, and export. Full Python SDK lives in sdks/python/.
 */
export async function loadManifestFromPath(filePath: string): Promise<unknown> {
  const fs = await import('fs');
  const path = await import('path');
  const yaml = await import('yaml');
  const ext = path.extname(filePath).toLowerCase();
  const raw = fs.readFileSync(filePath, 'utf-8');
  return ext === '.json' ? JSON.parse(raw) : yaml.parse(raw);
}

export async function validateManifest(
  manifest: unknown
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  if (!manifest || typeof manifest !== 'object') {
    errors.push('Manifest must be an object');
    return { valid: false, errors };
  }
  const m = manifest as Record<string, unknown>;
  if (!m.metadata || typeof m.metadata !== 'object')
    errors.push('metadata is required');
  if ((m.metadata as Record<string, unknown>)?.name == null)
    errors.push('metadata.name is required');
  if (!m.apiVersion) errors.push('apiVersion is required');
  return { valid: errors.length === 0, errors };
}

export async function exportManifest(
  manifest: unknown,
  format: 'yaml' | 'json' | 'python'
): Promise<string> {
  if (format === 'json') return JSON.stringify(manifest, null, 2);
  if (format === 'yaml') {
    const yaml = await import('yaml');
    return yaml.stringify(manifest, { indent: 2 });
  }
  return `# Python representation of manifest\nmanifest = ${JSON.stringify(manifest, null, 2)}`;
}
