import { useState, useCallback, useRef } from 'react';
import type { OssaEngine, ValidationResult } from '@bluefly/ossa-engine';

/** Real-time validation as user types. Debounced to avoid excessive validation calls. */
export function useValidation(engine: OssaEngine, debounceMs = 300) {
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validateContent = useCallback(
    (content: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setIsValidating(true);

      timerRef.current = setTimeout(async () => {
        const validationResult = await engine.validate(content);
        setResult(validationResult);
        setIsValidating(false);
      }, debounceMs);
    },
    [engine, debounceMs],
  );

  const validateManifest = useCallback(
    (manifest: Record<string, unknown>) => {
      const validationResult = engine.validateManifest(manifest);
      setResult(validationResult);
      return validationResult;
    },
    [engine],
  );

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setResult(null);
    setIsValidating(false);
  }, []);

  return { result, isValidating, validateContent, validateManifest, clear };
}
