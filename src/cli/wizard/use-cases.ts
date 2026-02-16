/**
 * Use Case Detection for Interactive Wizard
 * Maps user intent to appropriate templates and configurations
 */

import type { TemplateMeta } from './template-catalog.js';
import {
  TEMPLATE_CATALOG,
  findTemplatesByUseCase,
} from './template-catalog.js';

export interface UseCase {
  id: string;
  name: string;
  description: string;
  category:
    | 'automation'
    | 'assistant'
    | 'development'
    | 'integration'
    | 'analysis';
  templates: string[]; // Template IDs
  recommendedModel: string;
  recommendedProvider: string;
  complexity: 'simple' | 'moderate' | 'complex';
}

export const USE_CASES: UseCase[] = [
  {
    id: 'code-review',
    name: 'Code Review & Quality Analysis',
    description: 'Automated code review, security scanning, best practices',
    category: 'development',
    templates: ['claude-code-review'],
    recommendedModel: 'claude-sonnet-4',
    recommendedProvider: 'anthropic',
    complexity: 'moderate',
  },
  {
    id: 'documentation',
    name: 'Documentation Generation',
    description: 'Technical docs, API documentation, README generation',
    category: 'automation',
    templates: ['openai-docs-generator'],
    recommendedModel: 'gpt-4o',
    recommendedProvider: 'openai',
    complexity: 'simple',
  },
  {
    id: 'customer-support',
    name: 'Customer Support & Chat',
    description: 'Customer service bot, FAQ automation, ticket triage',
    category: 'assistant',
    templates: [],
    recommendedModel: 'gpt-4o-mini',
    recommendedProvider: 'openai',
    complexity: 'simple',
  },
  {
    id: 'content-management',
    name: 'Content Management & CMS',
    description: 'Content generation, SEO optimization, Drupal integration',
    category: 'integration',
    templates: ['drupal-content-ai'],
    recommendedModel: 'gpt-4o',
    recommendedProvider: 'openai',
    complexity: 'moderate',
  },
  {
    id: 'ide-assistant',
    name: 'IDE Code Assistant',
    description: 'Real-time code completion, refactoring suggestions',
    category: 'development',
    templates: ['cursor-ide'],
    recommendedModel: 'claude-sonnet-4',
    recommendedProvider: 'anthropic',
    complexity: 'complex',
  },
  {
    id: 'multi-agent',
    name: 'Multi-Agent Workflow',
    description: 'Complex orchestration, team collaboration, task delegation',
    category: 'automation',
    templates: ['crewai-multi-agent'],
    recommendedModel: 'gpt-4o',
    recommendedProvider: 'openai',
    complexity: 'complex',
  },
  {
    id: 'research',
    name: 'Research & Analysis',
    description: 'Autonomous research, data analysis, report generation',
    category: 'analysis',
    templates: ['langchain-research'],
    recommendedModel: 'claude-sonnet-4',
    recommendedProvider: 'anthropic',
    complexity: 'moderate',
  },
  {
    id: 'visual-workflow',
    name: 'Visual Workflow Builder',
    description: 'No-code agent builder, visual flow design',
    category: 'automation',
    templates: ['langflow-visual'],
    recommendedModel: 'gpt-4o-mini',
    recommendedProvider: 'openai',
    complexity: 'simple',
  },
  {
    id: 'custom',
    name: 'Custom Agent',
    description: 'Build from scratch with minimal template',
    category: 'development',
    templates: [],
    recommendedModel: 'gpt-4o',
    recommendedProvider: 'openai',
    complexity: 'moderate',
  },
];

/**
 * Find use case by ID
 */
export function getUseCase(id: string): UseCase | undefined {
  return USE_CASES.find((uc) => uc.id === id);
}

/**
 * Get templates for a use case
 */
export function getTemplatesForUseCase(useCaseId: string): TemplateMeta[] {
  const useCase = getUseCase(useCaseId);
  if (!useCase) return [];

  return useCase.templates
    .map((templateId) => TEMPLATE_CATALOG.find((t) => t.id === templateId))
    .filter((t): t is TemplateMeta => t !== undefined);
}

/**
 * Get use cases by category
 */
export function getUseCasesByCategory(
  category: UseCase['category']
): UseCase[] {
  return USE_CASES.filter((uc) => uc.category === category);
}

/**
 * Get recommended configuration for use case
 */
export function getRecommendedConfig(useCaseId: string): {
  provider: string;
  model: string;
  features: string[];
} {
  const useCase = getUseCase(useCaseId);
  if (!useCase) {
    return {
      provider: 'openai',
      model: 'gpt-4o',
      features: [],
    };
  }

  const features: string[] = [];

  switch (useCase.category) {
    case 'development':
      features.push('code-analysis', 'syntax-highlighting', 'git-integration');
      break;
    case 'assistant':
      features.push('conversational', 'memory', 'context-aware');
      break;
    case 'automation':
      features.push(
        'task-scheduling',
        'workflow-orchestration',
        'event-driven'
      );
      break;
    case 'integration':
      features.push('api-integration', 'webhooks', 'data-sync');
      break;
    case 'analysis':
      features.push('data-processing', 'reporting', 'visualization');
      break;
  }

  return {
    provider: useCase.recommendedProvider,
    model: useCase.recommendedModel,
    features,
  };
}
