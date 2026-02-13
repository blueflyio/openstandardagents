import { useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { OssaEngine, ExportTarget, ExportResult, GeneratedFile } from '@bluefly/ossa-engine';

interface ExportSelectorProps {
  engine: OssaEngine;
  manifest: Record<string, unknown>;
  children: (ctx: ExportSelectorContext) => ReactNode;
}

interface ExportSelectorContext {
  targets: ExportTarget[];
  selectedTarget: ExportTarget | null;
  selectTarget: (target: ExportTarget) => void;
  result: ExportResult | null;
  doExport: () => ExportResult | null;
  error: string | null;
}

/** Headless platform picker with export functionality */
export function ExportSelector({ engine, manifest, children }: ExportSelectorProps) {
  const [selectedTarget, setSelectedTarget] = useState<ExportTarget | null>(null);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const targets = engine.getExportTargets();

  const selectTarget = useCallback((target: ExportTarget) => {
    setSelectedTarget(target);
    setResult(null);
    setError(null);
  }, []);

  const doExport = useCallback(() => {
    if (!selectedTarget) {
      setError('No target selected');
      return null;
    }
    try {
      const exportResult = engine.export(manifest, selectedTarget);
      setResult(exportResult);
      setError(null);
      return exportResult;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    }
  }, [engine, manifest, selectedTarget]);

  return children({
    targets,
    selectedTarget,
    selectTarget,
    result,
    doExport,
    error,
  });
}
