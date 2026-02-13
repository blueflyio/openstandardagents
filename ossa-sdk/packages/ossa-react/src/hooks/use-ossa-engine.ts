import { useState, useMemo } from 'react';
import { OssaEngine } from '@bluefly/ossa-engine';

/** Initialize the OSSA engine with a JSON Schema. Returns a stable engine instance. */
export function useOssaEngine(schema: object): OssaEngine {
  const engine = useMemo(() => new OssaEngine(schema), [schema]);
  return engine;
}

/** Get schema fields for a specific section path. Re-computes when sectionPath changes. */
export function useSchemaFields(engine: OssaEngine, sectionPath?: string) {
  return useMemo(() => engine.getFields(sectionPath), [engine, sectionPath]);
}

/** Get wizard steps from the schema. Stable across renders. */
export function useWizardSteps(engine: OssaEngine) {
  return useMemo(() => engine.getWizardSteps(), [engine]);
}
