import { useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { OssaEngine, ValidationResult } from '@bluefly/ossa-engine';
import { useValidation } from '../hooks/use-validation.js';

interface ManifestEditorProps {
  engine: OssaEngine;
  initialContent?: string;
  children: (ctx: ManifestEditorContext) => ReactNode;
}

interface ManifestEditorContext {
  content: string;
  setContent: (content: string) => void;
  validation: ValidationResult | null;
  isValidating: boolean;
  format: 'yaml' | 'json';
  setFormat: (format: 'yaml' | 'json') => void;
}

/** Headless YAML/JSON editor with live validation */
export function ManifestEditor({ engine, initialContent = '', children }: ManifestEditorProps) {
  const [content, setContentState] = useState(initialContent);
  const [format, setFormat] = useState<'yaml' | 'json'>('yaml');
  const { result, isValidating, validateContent } = useValidation(engine);

  const setContent = useCallback(
    (newContent: string) => {
      setContentState(newContent);
      validateContent(newContent);
    },
    [validateContent],
  );

  return children({
    content,
    setContent,
    validation: result,
    isValidating,
    format,
    setFormat,
  });
}
