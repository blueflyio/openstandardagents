/**
 * Wizard Configuration Types
 * Buildkit-specific configuration types for export and testing
 * Stored in metadata.annotations with 'buildkit.ossa.io/' prefix
 */

export type ExportPlatform = 'langchain' | 'kagent' | 'drupal' | 'symfony';

export interface ExportConfig {
  enabled: boolean;
  platforms: ExportPlatform[];
  langchain?: LangChainExportConfig;
  kagent?: KAgentExportConfig;
  drupal?: DrupalExportConfig;
  symfony?: SymfonyExportConfig;
}

export interface LangChainExportConfig {
  includeCallbacks: boolean;
  includeErrorHandling: boolean;
  includeLangServe: boolean;
  includeTests: boolean;
}

export interface KAgentExportConfig {
  includeRBAC: boolean;
  includeTLS: boolean;
  includeNetworkPolicy: boolean;
}

export interface DrupalExportConfig {
  moduleName: string;
  includeQueue: boolean;
  includeEntity: boolean;
}

export interface SymfonyExportConfig {
  bundleName: string;
  includeEvents: boolean;
  includeCaching: boolean;
}

export type TestType = 'unit' | 'integration' | 'load' | 'security' | 'cost';
export type CICDPlatform = 'github-actions' | 'gitlab-ci';

export interface TestingConfig {
  enabled: boolean;
  types: TestType[];
  mockLLM: boolean;
  generateFixtures: boolean;
  cicd: CICDPlatform[];
  validation: ValidationConfig;
}

export interface ValidationConfig {
  manifest: boolean;
  safety: boolean;
  costBudget: number;
}

/**
 * Helper to get export config from annotations
 */
export function getExportConfig(annotations?: Record<string, string>): ExportConfig | null {
  const configStr = annotations?.['buildkit.ossa.io/export-config'];
  if (!configStr) return null;
  try {
    return JSON.parse(configStr) as ExportConfig;
  } catch {
    return null;
  }
}

/**
 * Helper to get testing config from annotations
 */
export function getTestingConfig(annotations?: Record<string, string>): TestingConfig | null {
  const configStr = annotations?.['buildkit.ossa.io/testing-config'];
  if (!configStr) return null;
  try {
    return JSON.parse(configStr) as TestingConfig;
  } catch {
    return null;
  }
}
