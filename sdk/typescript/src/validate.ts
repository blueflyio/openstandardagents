import type { UadpManifest, ValidationResult } from './types.js';

/** Validate a /.well-known/uadp.json manifest object. */
export function validateManifest(manifest: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!manifest || typeof manifest !== 'object') {
    return { valid: false, errors: ['Manifest must be a JSON object'], warnings: [] };
  }

  const m = manifest as Record<string, unknown>;

  if (!m.protocol_version || typeof m.protocol_version !== 'string') {
    errors.push('protocol_version is required and must be a string');
  } else if (!/^\d+\.\d+\.\d+$/.test(m.protocol_version)) {
    errors.push('protocol_version must be semver (e.g., "0.1.0")');
  }

  if (!m.node_name || typeof m.node_name !== 'string') {
    errors.push('node_name is required and must be a string');
  }

  if (!m.endpoints || typeof m.endpoints !== 'object') {
    errors.push('endpoints is required and must be an object');
  } else {
    const ep = m.endpoints as Record<string, unknown>;
    if (!ep.skills && !ep.agents) {
      errors.push('endpoints must include at least one of: skills, agents');
    }
    for (const [key, val] of Object.entries(ep)) {
      if (typeof val !== 'string') {
        errors.push(`endpoints.${key} must be a string URL`);
      }
    }
  }

  if (!m.node_description) warnings.push('node_description is recommended');
  if (!m.ossa_versions) warnings.push('ossa_versions is recommended');

  return { valid: errors.length === 0, errors, warnings };
}

/** Validate a UADP skills/agents response envelope. */
export function validateResponse(response: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!response || typeof response !== 'object') {
    return { valid: false, errors: ['Response must be a JSON object'], warnings: [] };
  }

  const r = response as Record<string, unknown>;

  if (!Array.isArray(r.data)) {
    errors.push('data must be an array');
  } else {
    for (let i = 0; i < r.data.length; i++) {
      const item = r.data[i] as Record<string, unknown>;
      if (!item.apiVersion) errors.push(`data[${i}].apiVersion is required`);
      if (!item.kind) errors.push(`data[${i}].kind is required`);
      if (!item.metadata || typeof item.metadata !== 'object') {
        errors.push(`data[${i}].metadata is required`);
      } else {
        const meta = item.metadata as Record<string, unknown>;
        if (!meta.name) errors.push(`data[${i}].metadata.name is required`);
      }
    }
  }

  if (!r.meta || typeof r.meta !== 'object') {
    errors.push('meta is required');
  } else {
    const meta = r.meta as Record<string, unknown>;
    if (typeof meta.total !== 'number') errors.push('meta.total must be a number');
    if (typeof meta.page !== 'number') errors.push('meta.page must be a number');
    if (typeof meta.limit !== 'number') errors.push('meta.limit must be a number');
    if (typeof meta.node_name !== 'string') errors.push('meta.node_name must be a string');
  }

  return { valid: errors.length === 0, errors, warnings };
}

/** Type guard: is this a valid UadpManifest? */
export function isUadpManifest(value: unknown): value is UadpManifest {
  return validateManifest(value).valid;
}
