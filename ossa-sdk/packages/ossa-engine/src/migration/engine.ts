import type { MigrationResult } from '../types.js';

/** Detects manifest versions and auto-migrates between OSSA spec versions. */
export class MigrationEngine {
  /** Detect the OSSA version from a manifest */
  detectVersion(manifest: Record<string, unknown>): string {
    const apiVersion = manifest.apiVersion as string | undefined;
    if (!apiVersion) return 'unknown';
    const match = apiVersion.match(/ossa\/v?([\d.]+)/i);
    return match ? match[1] : 'unknown';
  }

  /** Migrate a manifest to a target version */
  migrate(
    manifest: Record<string, unknown>,
    targetVersion: string,
  ): MigrationResult {
    const fromVersion = this.detectVersion(manifest);
    const migrated = structuredClone(manifest);
    const changes: string[] = [];

    // Update apiVersion
    migrated.apiVersion = `ossa/v${targetVersion}`;
    changes.push(`Updated apiVersion from ${fromVersion} to ${targetVersion}`);

    // v0.3 → v0.4 migrations
    if (this.isOlderThan(fromVersion, '0.4') && !this.isOlderThan(targetVersion, '0.4')) {
      this.migrateV03ToV04(migrated, changes);
    }

    return { fromVersion, toVersion: targetVersion, migrated, changes };
  }

  /** Check if a manifest needs migration to a target version */
  needsMigration(
    manifest: Record<string, unknown>,
    targetVersion: string,
  ): boolean {
    const current = this.detectVersion(manifest);
    return current !== targetVersion && current !== 'unknown';
  }

  private migrateV03ToV04(
    manifest: Record<string, unknown>,
    changes: string[],
  ): void {
    const spec = manifest.spec as Record<string, unknown> | undefined;
    if (!spec) return;

    // v0.4 added 'kind' support for Task/Workflow — ensure kind exists
    if (!manifest.kind) {
      manifest.kind = 'Agent';
      changes.push('Added kind: Agent (default for v0.4)');
    }

    // Normalize autonomy level names
    const autonomy = spec.autonomy as Record<string, unknown> | undefined;
    if (autonomy?.level) {
      const levelMap: Record<string, string> = {
        L0: 'none',
        L1: 'notification',
        L2: 'supervised',
        L3: 'semi_autonomous',
        L4: 'fully_autonomous',
      };
      const mapped = levelMap[autonomy.level as string];
      if (mapped) {
        autonomy.level = mapped;
        changes.push(`Normalized autonomy level to ${mapped}`);
      }
    }

    // Ensure tools have type field
    const tools = spec.tools as Record<string, unknown>[] | undefined;
    if (Array.isArray(tools)) {
      for (const tool of tools) {
        if (!tool.type) {
          tool.type = 'builtin';
          changes.push(`Added default type 'builtin' to tool ${tool.name}`);
        }
      }
    }
  }

  private isOlderThan(version: string, target: string): boolean {
    if (version === 'unknown') return true;
    const [vMaj, vMin] = version.split('.').map(Number);
    const [tMaj, tMin] = target.split('.').map(Number);
    return vMaj < tMaj || (vMaj === tMaj && vMin < tMin);
  }
}
