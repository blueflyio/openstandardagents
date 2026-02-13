import { useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { OssaEngine, WizardStep, FieldDescriptor, ValidationIssue } from '@bluefly/ossa-engine';
import { useManifestBuilder } from '../hooks/use-manifest-builder.js';

interface ManifestWizardProps {
  engine: OssaEngine;
  children: (ctx: ManifestWizardContext) => ReactNode;
  onComplete?: (manifest: Record<string, unknown>) => void;
}

interface ManifestWizardContext {
  steps: WizardStep[];
  currentStep: WizardStep;
  currentIndex: number;
  totalSteps: number;
  fields: FieldDescriptor[];
  manifest: Record<string, unknown>;
  errors: Record<string, string>;
  setValue: (path: string, value: unknown) => void;
  next: () => void;
  back: () => void;
  goTo: (index: number) => void;
  isFirst: boolean;
  isLast: boolean;
  validate: () => boolean;
}

/** Schema-driven multi-step wizard. Headless — you control the rendering. */
export function ManifestWizard({ engine, children, onComplete }: ManifestWizardProps) {
  const steps = useMemo(() => engine.getWizardSteps(), [engine]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { manifest, setValue, validate: runValidation } = useManifestBuilder(engine);

  const currentStep = steps[currentIndex] ?? steps[0];
  const fields = currentStep?.fields ?? [];

  const errors = useMemo(() => {
    const result = runValidation();
    const errorMap: Record<string, string> = {};
    if (result?.errors) {
      for (const err of result.errors) {
        errorMap[err.path] = err.message;
      }
    }
    return errorMap;
  }, [manifest, runValidation]);

  const validate = useCallback(() => {
    const result = runValidation();
    return result?.valid ?? false;
  }, [runValidation]);

  const next = useCallback(() => {
    if (currentIndex < steps.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else if (onComplete) {
      onComplete(manifest);
    }
  }, [currentIndex, steps.length, onComplete, manifest]);

  const back = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, steps.length - 1)));
  }, [steps.length]);

  if (!currentStep) return null;

  return children({
    steps,
    currentStep,
    currentIndex,
    totalSteps: steps.length,
    fields,
    manifest,
    errors,
    setValue,
    next,
    back,
    goTo,
    isFirst: currentIndex === 0,
    isLast: currentIndex === steps.length - 1,
    validate,
  });
}
