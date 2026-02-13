import { useState, useCallback, useMemo } from 'react';
import {
  ManifestBuilder,
  type ValidationResult,
  type OssaEngine,
} from '@bluefly/ossa-engine';

interface UseManifestBuilderReturn {
  manifest: Record<string, unknown>;
  builder: ManifestBuilder;
  validation: ValidationResult | null;
  setValue: (path: string, value: unknown) => void;
  setMetadata: (meta: Record<string, unknown>) => void;
  validate: () => ValidationResult;
  reset: () => void;
}

/** Reactive ManifestBuilder with live validation */
export function useManifestBuilder(
  engine: OssaEngine,
): UseManifestBuilderReturn {
  const [builder, setBuilder] = useState(() => new ManifestBuilder());
  const [version, setVersion] = useState(0);
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  const manifest = useMemo(() => builder.getPartial(), [builder, version]);

  const setValue = useCallback(
    (path: string, value: unknown) => {
      builder.set(path, value);
      setVersion((v) => v + 1);
    },
    [builder],
  );

  const setMetadata = useCallback(
    (meta: Record<string, unknown>) => {
      builder.metadata(meta as Parameters<ManifestBuilder['metadata']>[0]);
      setVersion((v) => v + 1);
    },
    [builder],
  );

  const validate = useCallback(() => {
    const result = engine.validateManifest(builder.getPartial());
    setValidation(result);
    return result;
  }, [engine, builder]);

  const reset = useCallback(() => {
    setBuilder(new ManifestBuilder());
    setValidation(null);
    setVersion((v) => v + 1);
  }, []);

  return { manifest, builder, validation, setValue, setMetadata, validate, reset };
}
