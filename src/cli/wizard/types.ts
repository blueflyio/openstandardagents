/**
 * OSSA Wizard Types
 * Type definitions for the interactive agent creation wizard
 */

import type { OssaAgent } from '../../types/index.js';

export interface WizardState {
  agent: Partial<OssaAgent>;
  agentType?: AgentType;
  template?: AgentTemplate;
  step: number;
  totalSteps: number;
  canUndo: boolean;
  history: Partial<OssaAgent>[];
}

export type AgentType =
  | 'orchestrator'
  | 'worker'
  | 'planner'
  | 'reviewer'
  | 'critic'
  | 'judge'
  | 'monitor'
  | 'integrator'
  | 'voice'
  | 'trainer'
  | 'governor';

export interface AgentTypeInfo {
  type: AgentType;
  label: string;
  icon: string;
  description: string;
  useCases: string[];
  estimatedTime: string;
  recommendedModels: string[];
  defaultTools: string[];
}

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  type: AgentType;
  manifest: Partial<OssaAgent>;
  tags: string[];
}

export interface DomainInfo {
  id: string;
  name: string;
  description: string;
  subdomains: string[];
  recommendedCapabilities: string[];
}

export interface CapabilityInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  requiredTools: string[];
}

export interface LLMProviderInfo {
  id: string;
  name: string;
  models: LLMModelInfo[];
  pricingTier: 'free' | 'low' | 'medium' | 'high';
}

export interface LLMModelInfo {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  costPer1MTokens: number;
  recommended: boolean;
  supportsFunctionCalling: boolean;
}

export interface ToolInfo {
  type: string;
  name: string;
  description: string;
  provider?: string;
  category: string;
  setupComplexity: 'easy' | 'medium' | 'hard';
}

export interface ValidationRule {
  field: string;
  validator: (value: unknown) => boolean;
  message: string;
}

export interface WizardStep {
  name: string;
  title: string;
  description: string;
  required: boolean;
  execute: (state: WizardState) => Promise<WizardState>;
  validate?: (state: WizardState) => Promise<boolean>;
  skip?: (state: WizardState) => boolean;
}

export interface WizardOptions {
  output?: string;
  directory?: string;
  template?: string;
  dryRun?: boolean;
  verbose?: boolean;
  fromExample?: string;
  field?: string;
  mode?: string;
}
