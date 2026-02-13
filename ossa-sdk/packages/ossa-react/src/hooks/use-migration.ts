import { useState, useCallback } from 'react';
import type { OssaEngine, MigrationResult } from '@bluefly/ossa-engine';

/** Detect version and offer migration */
export function useMigration(engine: OssaEngine) {
  const [result, setResult] = useState<MigrationResult | null>(null);

  const detectVersion = useCallback(
    (manifest: Record<string, unknown>) => {
      return engine.migration.detectVersion(manifest);
    },
    [engine],
  );

  const needsMigration = useCallback(
    (manifest: Record<string, unknown>, targetVersion: string) => {
      return engine.migration.needsMigration(manifest, targetVersion);
    },
    [engine],
  );

  const migrate = useCallback(
    (manifest: Record<string, unknown>, targetVersion: string) => {
      const migrationResult = engine.migrate(manifest, targetVersion);
      setResult(migrationResult);
      return migrationResult;
    },
    [engine],
  );

  return { result, detectVersion, needsMigration, migrate };
}
