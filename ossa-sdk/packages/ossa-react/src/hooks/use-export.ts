import { useState, useCallback } from 'react';
import type { OssaEngine, ExportResult, ExportTarget } from '@bluefly/ossa-engine';

/** Trigger export and get file tree */
export function useExport(engine: OssaEngine) {
  const [result, setResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const doExport = useCallback(
    (manifest: Record<string, unknown>, target: ExportTarget) => {
      try {
        setError(null);
        const exportResult = engine.export(manifest, target);
        setResult(exportResult);
        return exportResult;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        return null;
      }
    },
    [engine],
  );

  const targets = engine.getExportTargets();

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, error, doExport, targets, clear };
}

/** Preview export without committing — returns file list */
export function useExportPreview(engine: OssaEngine) {
  const [preview, setPreview] = useState<ExportResult | null>(null);

  const previewExport = useCallback(
    (manifest: Record<string, unknown>, target: ExportTarget) => {
      const result = engine.export(manifest, target);
      setPreview(result);
      return result;
    },
    [engine],
  );

  return { preview, previewExport };
}
