/**
 * Data Sources Configuration
 *
 * Defines where website data comes from - the source of truth.
 * This replaces the deleted scripts/ folder with proper Next.js patterns.
 */

import type { ExampleCategory } from './schemas';

export const DATA_SOURCES = {
  /**
   * Main OSSA specification repository
   * Contains: examples/, spec/, schemas/
   */
  openstandardagents: {
    gitlabProjectId: '76265294',
    gitlabPath: 'blueflyio/ossa/openstandardagents',
    apiBase: 'https://gitlab.com/api/v4',
    defaultRef: 'main',
  },

  /**
   * npm package for version tracking
   */
  npm: {
    packageName: '@bluefly/openstandardagents',
    registryUrl: 'https://registry.npmjs.org/@bluefly/openstandardagents',
  },

  /**
   * GitHub mirror for tag tracking
   */
  github: {
    repo: 'blueflyio/ossa/openstandardagents',
    apiUrl: 'https://api.github.com/repos/blueflyio/openstandardagents/tags',
  },
} as const;

/**
 * Data files that need to be synced from source
 */
export const SYNC_FILES = {
  // examples.json - from examples/ folder in openstandardagents
  examples: {
    source: 'gitlab:examples/',
    destination: 'public/examples.json',
    description: 'Agent manifest examples from the spec repo',
  },

  // versions.json - from npm registry + git tags
  versions: {
    source: 'npm+gitlab:tags',
    destination: 'lib/versions.json',
    description: 'Version information from npm and git tags',
  },

  // schemas/ - JSON schemas for validation
  schemas: {
    source: 'gitlab:spec/schemas/',
    destination: 'public/schemas/',
    description: 'JSON Schema files for OSSA validation',
  },

  // release-highlights.json - manually maintained
  releaseHighlights: {
    source: 'manual',
    destination: 'lib/release-highlights.json',
    description: 'Release highlights for homepage (manually updated)',
  },
} as const;

/**
 * Category mapping for examples
 */
export function getExampleCategory(filePath: string): ExampleCategory {
  const pathParts = filePath.toLowerCase().split('/');
  const topLevel = pathParts[0];

  // Getting Started
  if (['getting-started', 'quickstart', 'minimal'].includes(topLevel)) {
    return 'Getting Started';
  }

  // Framework Integration
  if (['langchain', 'crewai', 'openai', 'anthropic', 'autogen', 'langflow',
       'langgraph', 'llamaindex', 'cursor', 'vercel'].includes(topLevel)) {
    return 'Framework Integration';
  }

  // Agent Types
  if (topLevel === 'agent-manifests' ||
      ['workers', 'orchestrators', 'critics', 'judges', 'monitors',
       'governors', 'integrators'].some(t => pathParts.includes(t))) {
    return 'Agent Types';
  }

  // Production
  if (['production', 'enterprise'].includes(topLevel) || filePath.includes('compliance')) {
    return 'Production';
  }

  // Infrastructure
  if (topLevel === 'kagent' || topLevel === 'bridges' ||
      ['k8s', 'kubernetes', 'docker', 'serverless'].some(t => filePath.includes(t))) {
    return 'Infrastructure';
  }

  // Advanced Patterns
  if (topLevel === 'advanced' ||
      ['patterns', 'workflows', 'model-router', 'smart-model'].some(t => filePath.includes(t))) {
    return 'Advanced Patterns';
  }

  // Integration Patterns
  if (['integration-patterns', 'adk-integration'].includes(topLevel) ||
      (topLevel === 'bridges' && !filePath.includes('k8s') && !filePath.includes('phase4'))) {
    return 'Integration Patterns';
  }

  // OpenAPI Extensions
  if (topLevel === 'openapi-extensions' || filePath.includes('openapi')) {
    return 'OpenAPI Extensions';
  }

  // Migration Guides
  if (topLevel === 'migration-guides') {
    return 'Migration Guides';
  }

  // Showcase - Featured/highlighted examples
  if (topLevel === 'showcase') {
    return 'Showcase';
  }

  // Adapters (Drupal, etc.)
  if (topLevel === 'adapters' || filePath.includes('adapter')) {
    return 'Getting Started';
  }

  // Default
  return 'Spec Examples';
}
