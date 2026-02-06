/**
 * Taxonomy Data Loader
 * Loads taxonomy from spec/taxonomy.yaml
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { logger } from '../../../utils/logger.js';

interface TaxonomyDomain {
  description: string;
  subdomains?: string[];
  examples?: string[];
}

interface TaxonomySpec {
  domains: Record<string, TaxonomyDomain>;
  concerns?: Record<string, { description: string; applies_to: string[] }>;
}

let cachedTaxonomy: TaxonomySpec | null = null;

/**
 * Load taxonomy from spec directory
 */
export function loadTaxonomy(): TaxonomySpec {
  if (cachedTaxonomy) {
    return cachedTaxonomy;
  }

  // Try multiple locations
  const possiblePaths = [
    path.resolve(process.cwd(), 'spec/v0.3.3/taxonomy.yaml'),
    path.resolve(process.cwd(), 'spec/v0.3/taxonomy.yaml'),
    path.resolve(
      process.cwd(),
      '../openstandardagents.org/spec/v0.3.3/taxonomy.yaml'
    ),
    path.resolve(
      __dirname || process.cwd(),
      '../../../spec/v0.3.3/taxonomy.yaml'
    ),
    path.resolve(
      __dirname || process.cwd(),
      '../../../spec/v0.3/taxonomy.yaml'
    ),
  ];

  for (const taxonomyPath of possiblePaths) {
    if (fs.existsSync(taxonomyPath)) {
      try {
        const content = fs.readFileSync(taxonomyPath, 'utf-8');
        const parsed = yaml.parse(content) as TaxonomySpec;
        cachedTaxonomy = parsed;
        return parsed;
      } catch (error) {
        logger.warn(
          {
            path: taxonomyPath,
            error: error instanceof Error ? error.message : String(error),
          },
          'Failed to load taxonomy'
        );
      }
    }
  }

  // Fallback to hardcoded domains
  return getDefaultTaxonomy();
}

/**
 * Get default taxonomy (fallback)
 */
function getDefaultTaxonomy(): TaxonomySpec {
  return {
    domains: {
      security: {
        description: 'Authentication, authorization, encryption, compliance',
        subdomains: ['auth', 'encryption', 'compliance', 'vulnerability'],
      },
      infrastructure: {
        description: 'DevOps, CI/CD, deployment, configuration',
        subdomains: ['ci-cd', 'gitops', 'deployment', 'kubernetes'],
      },
      documentation: {
        description: 'Documentation, wiki, guides, knowledge management',
        subdomains: ['api-docs', 'wiki', 'knowledge-base'],
      },
      backend: {
        description: 'API, database, services, business logic',
        subdomains: ['api', 'database', 'services', 'messaging'],
      },
      frontend: {
        description: 'UI/UX, web, mobile interfaces',
        subdomains: ['web', 'mobile', 'design-system'],
      },
      data: {
        description: 'Data engineering, analytics, ML/AI operations',
        subdomains: ['analytics', 'ml-ops', 'etl'],
      },
      agents: {
        description: 'OSSA agents, automation, orchestration',
        subdomains: ['orchestration', 'workers', 'mesh'],
      },
      development: {
        description: 'Software development, code quality, testing',
        subdomains: ['code-review', 'testing', 'refactoring'],
      },
      content: {
        description: 'Content management, editing, publishing',
        subdomains: ['authoring', 'editing', 'publishing'],
      },
    },
    concerns: {
      quality: {
        description: 'Testing, code quality, standards',
        applies_to: ['*'],
      },
      observability: {
        description: 'Metrics, logging, tracing',
        applies_to: ['*'],
      },
      governance: {
        description: 'Policies, compliance, audit',
        applies_to: ['*'],
      },
      performance: {
        description: 'Performance optimization',
        applies_to: ['*'],
      },
      architecture: { description: 'Architecture patterns', applies_to: ['*'] },
      cost: { description: 'Cost optimization', applies_to: ['*'] },
      reliability: {
        description: 'Reliability and resilience',
        applies_to: ['*'],
      },
    },
  };
}

/**
 * Get domain choices for wizard
 */
export function getDomainChoices() {
  const taxonomy = loadTaxonomy();
  return Object.entries(taxonomy.domains).map(([key, domain]) => ({
    value: key,
    name: `${key.charAt(0).toUpperCase() + key.slice(1)} - ${domain.description}`,
    description: domain.description,
    subdomains: domain.subdomains || [],
  }));
}

/**
 * Get concern choices for wizard
 */
export function getConcernChoices() {
  const taxonomy = loadTaxonomy();
  if (!taxonomy.concerns) return [];

  return Object.entries(taxonomy.concerns).map(([key, concern]) => ({
    value: key,
    name: `${key.charAt(0).toUpperCase() + key.slice(1)} - ${concern.description}`,
    description: concern.description,
  }));
}
