/**
 * OSSA v0.3.6 Manifest Linter
 *
 * Best practices linter for OSSA agent manifests
 * Checks taxonomy applicability, type-domain matching, revolutionary features usage, and more
 */

import { readFileSync } from 'fs';
import { join } from 'path';

export interface LintRule {
  id: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

export interface LintResult {
  passed: boolean;
  rules: LintRule[];
}

// Taxonomy domain-to-subdomain mappings
const VALID_SUBDOMAINS: Record<string, string[]> = {
  security: [
    'auth',
    'encryption',
    'compliance',
    'vulnerability',
    'secrets',
    'threat-detection',
  ],
  infrastructure: [
    'ci-cd',
    'gitops',
    'deployment',
    'configuration',
    'networking',
    'storage',
    'kubernetes',
    'cloud',
  ],
  documentation: [
    'api-docs',
    'user-guides',
    'wiki',
    'knowledge-base',
    'changelog',
  ],
  backend: [
    'api',
    'database',
    'services',
    'messaging',
    'caching',
    'integration',
  ],
  frontend: ['web', 'mobile', 'design-system', 'accessibility', 'performance'],
  data: [
    'analytics',
    'ml-ops',
    'etl',
    'data-quality',
    'data-governance',
    'streaming',
  ],
  agents: [
    'orchestration',
    'workers',
    'supervisors',
    'mesh',
    'training',
    'registry',
  ],
  development: ['code-review', 'testing', 'refactoring', 'debugging', 'ide'],
  content: ['authoring', 'editing', 'publishing', 'research', 'localization'],
};

// Agent type to typical domain mappings
const TYPE_DOMAIN_RECOMMENDATIONS: Record<string, string[]> = {
  analyzer: ['security', 'development', 'data'],
  worker: ['development', 'documentation', 'content'],
  operator: ['infrastructure', 'agents'],
  supervisor: ['agents', 'infrastructure'],
  orchestrator: ['agents'],
  governor: ['security', 'agents'],
  specialist: ['security', 'data', 'backend'],
  critic: ['development', 'security'],
};

export class OSSALinter {
  private taxonomySpec: Record<string, string[]>;

  constructor(taxonomyPath?: string) {
    // Load taxonomy spec if available
    const defaultTaxonomyPath = join(__dirname, '../spec/v0.3.6/taxonomy.yaml');
    const resolvedPath = taxonomyPath || defaultTaxonomyPath;

    try {
      // For now, we'll use hardcoded taxonomy rules
      // In production, you'd want to load from taxonomy.yaml
      this.taxonomySpec = VALID_SUBDOMAINS;
    } catch (error) {
      console.warn('Could not load taxonomy spec, using defaults');
      this.taxonomySpec = VALID_SUBDOMAINS;
    }
  }

  /**
   * Lint an OSSA manifest
   */
  lint(manifest: Record<string, unknown>): LintResult {
    const rules: LintRule[] = [];

    // Run all lint checks
    rules.push(...this.checkTaxonomy(manifest));
    rules.push(...this.checkTypeDomainMatch(manifest));
    rules.push(...this.checkRevolutionaryFeatures(manifest));
    rules.push(...this.checkNaming(manifest));
    rules.push(...this.checkCatalog(manifest));
    rules.push(...this.checkLifecycleConsistency(manifest));
    rules.push(...this.checkEconomicsSetup(manifest));

    const passed = !rules.some((r) => r.level === 'error');

    return { passed, rules };
  }

  /**
   * Lint from file path
   */
  lintFile(filePath: string): LintResult {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const manifest = JSON.parse(content);
      return this.lint(manifest);
    } catch (error) {
      return {
        passed: false,
        rules: [
          {
            id: 'file-read-error',
            level: 'error',
            message: `Failed to read or parse file: ${error}`,
          },
        ],
      };
    }
  }

  private checkTaxonomy(manifest: Record<string, unknown>): LintRule[] {
    const rules: LintRule[] = [];
    const metadata = manifest.metadata as Record<string, unknown> | undefined;
    const taxonomy = metadata?.taxonomy as Record<string, unknown> | undefined;

    if (!taxonomy) {
      rules.push({
        id: 'taxonomy-missing',
        level: 'warning',
        message: 'No taxonomy classification defined',
        suggestion:
          'Add metadata.taxonomy to help with agent discovery and classification',
      });
      return rules;
    }

    // Check domain validity
    const validDomains = Object.keys(VALID_SUBDOMAINS);
    const domain = taxonomy.domain as string;
    if (typeof domain === 'string' && !validDomains.includes(domain)) {
      rules.push({
        id: 'taxonomy-invalid-domain',
        level: 'error',
        message: `Invalid domain "${domain}"`,
        suggestion: `Valid domains: ${validDomains.join(', ')}`,
      });
    }

    // Check subdomain validity
    if (taxonomy.subdomain) {
      const subdomain = taxonomy.subdomain as string;
      const validSubdomains = VALID_SUBDOMAINS[domain] || [];
      if (
        typeof subdomain === 'string' &&
        !validSubdomains.includes(subdomain)
      ) {
        rules.push({
          id: 'taxonomy-invalid-subdomain',
          level: 'warning',
          message: `Subdomain "${subdomain}" is not a typical subdomain for ${domain}`,
          suggestion: `Typical subdomains for ${domain}: ${validSubdomains.join(', ')}`,
        });
      }
    }

    // Check concerns applicability
    const validConcerns = [
      'quality',
      'observability',
      'governance',
      'performance',
      'architecture',
      'cost',
      'reliability',
    ];
    if (taxonomy.concerns && Array.isArray(taxonomy.concerns)) {
      taxonomy.concerns.forEach((concern: unknown) => {
        if (typeof concern === 'string' && !validConcerns.includes(concern)) {
          rules.push({
            id: 'taxonomy-invalid-concern',
            level: 'warning',
            message: `Unknown concern "${concern}"`,
            suggestion: `Valid concerns: ${validConcerns.join(', ')}`,
          });
        }
      });
    }

    return rules;
  }

  private checkTypeDomainMatch(manifest: Record<string, unknown>): LintRule[] {
    const rules: LintRule[] = [];
    const metadata = manifest.metadata as Record<string, unknown> | undefined;
    const taxonomy = metadata?.taxonomy as Record<string, unknown> | undefined;
    const spec = manifest.spec as Record<string, unknown> | undefined;
    const agentType = spec?.type as string | undefined;

    if (!taxonomy || !agentType || typeof agentType !== 'string') return rules;

    const domain = (taxonomy as Record<string, unknown>).domain as string;
    const recommendedDomains = TYPE_DOMAIN_RECOMMENDATIONS[agentType];
    if (
      recommendedDomains &&
      typeof domain === 'string' &&
      !recommendedDomains.includes(domain)
    ) {
      rules.push({
        id: 'type-domain-mismatch',
        level: 'info',
        message: `Agent type "${agentType}" typically belongs to domains: ${recommendedDomains.join(', ')}`,
        suggestion: `Consider if "${domain}" is the best domain for a "${agentType}" agent`,
      });
    }

    return rules;
  }

  private checkRevolutionaryFeatures(
    manifest: Record<string, unknown>
  ): LintRule[] {
    const rules: LintRule[] = [];
    const metadata = (manifest.metadata as Record<string, unknown>) || {};

    // Check genetics prerequisites
    if (metadata.genetics) {
      const genetics = metadata.genetics as Record<string, unknown>;
      const identity = metadata.decentralized_identity as
        | Record<string, unknown>
        | undefined;

      if (!identity || !identity.did) {
        rules.push({
          id: 'genetics-requires-did',
          level: 'warning',
          message: 'Agent has genetics but no decentralized_identity.did',
          suggestion:
            'Agents with genetics should have a DID for lineage tracking',
        });
      }

      if (
        typeof genetics.generation === 'number' &&
        genetics.generation > 0 &&
        (!genetics.parent_dids ||
          (Array.isArray(genetics.parent_dids) &&
            genetics.parent_dids.length === 0))
      ) {
        rules.push({
          id: 'genetics-missing-parents',
          level: 'error',
          message: 'Generation > 0 but no parent_dids specified',
          suggestion:
            'Bred agents must specify parent DIDs for lineage tracking',
        });
      }
    }

    // Check economics prerequisites
    if (metadata.economics) {
      const economics = metadata.economics as Record<string, unknown>;
      const identity = metadata.decentralized_identity as
        | Record<string, unknown>
        | undefined;

      if (!identity || !identity.did) {
        rules.push({
          id: 'economics-requires-did',
          level: 'warning',
          message: 'Agent has economics but no decentralized_identity.did',
          suggestion:
            'Agents participating in marketplace should have a DID for transactions',
        });
      }

      if (economics.marketplace && !economics.wallet) {
        rules.push({
          id: 'marketplace-requires-wallet',
          level: 'error',
          message: 'Agent has marketplace offerings but no wallet',
          suggestion: 'Add economics.wallet to receive payments',
        });
      }
    }

    // Check lifecycle consistency
    if (metadata.lifecycle_stages) {
      const lifecycle = metadata.lifecycle_stages as Record<string, unknown>;
      const economics = metadata.economics as
        | Record<string, unknown>
        | undefined;

      if (lifecycle.current_stage === 'retired' && economics) {
        const marketplace = economics.marketplace as
          | Record<string, unknown>
          | undefined;
        if (marketplace?.offerings) {
          rules.push({
            id: 'retired-agent-marketplace',
            level: 'warning',
            message: 'Retired agent still has marketplace offerings',
            suggestion: 'Remove marketplace offerings for retired agents',
          });
        }
      }
    }

    return rules;
  }

  private checkNaming(manifest: Record<string, unknown>): LintRule[] {
    const rules: LintRule[] = [];
    const metadata = manifest.metadata as Record<string, unknown> | undefined;
    const name = metadata?.name as string | undefined;

    if (name) {
      // Check DNS-1123 subdomain compliance
      const dnsPattern = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;
      if (!dnsPattern.test(name)) {
        rules.push({
          id: 'name-invalid-format',
          level: 'error',
          message: `Name "${name}" does not follow DNS-1123 subdomain format`,
          suggestion: 'Use lowercase alphanumeric characters and hyphens only',
        });
      }

      // Check name length
      if (name.length > 253) {
        rules.push({
          id: 'name-too-long',
          level: 'error',
          message: `Name "${name}" exceeds 253 character limit`,
        });
      }
    }

    return rules;
  }

  private checkCatalog(manifest: Record<string, unknown>): LintRule[] {
    const rules: LintRule[] = [];
    const metadata = manifest.metadata as Record<string, unknown> | undefined;
    const catalog = metadata?.catalog as Record<string, unknown> | undefined;

    if (catalog?.published) {
      const catalogObj = catalog as Record<string, unknown>;

      // Published agents should have documentation
      if (!catalogObj.documentation_url) {
        rules.push({
          id: 'published-missing-docs',
          level: 'warning',
          message: 'Published agent has no documentation_url',
          suggestion:
            'Add catalog.documentation_url for better discoverability',
        });
      }

      // Public agents should have ratings
      if (catalogObj.visibility === 'public') {
        const ratings = catalogObj.ratings as
          | Record<string, unknown>
          | undefined;
        if (
          !ratings ||
          (typeof ratings.count === 'number' && ratings.count === 0)
        ) {
          rules.push({
            id: 'public-no-ratings',
            level: 'info',
            message: 'Public agent has no ratings yet',
            suggestion: 'Encourage users to rate the agent',
          });
        }
      }
    }

    return rules;
  }

  private checkLifecycleConsistency(
    manifest: Record<string, unknown>
  ): LintRule[] {
    const rules: LintRule[] = [];
    const metadata = manifest.metadata as Record<string, unknown> | undefined;
    const lifecycle = metadata?.lifecycle_stages as
      | Record<string, unknown>
      | undefined;

    if (!lifecycle) return rules;

    // Check stage progression consistency
    if (
      lifecycle.current_stage === 'senior' ||
      lifecycle.current_stage === 'retired'
    ) {
      const career = lifecycle.career as Record<string, unknown> | undefined;
      if (
        !career?.promotions ||
        (Array.isArray(career.promotions) && career.promotions.length === 0)
      ) {
        rules.push({
          id: 'senior-no-promotions',
          level: 'info',
          message: 'Agent is senior/retired but has no promotion history',
          suggestion:
            'Document career progression with lifecycle_stages.career.promotions',
        });
      }
    }

    // Check retirement eligibility
    const retirement = lifecycle.retirement as
      | Record<string, unknown>
      | undefined;
    if (retirement?.eligible && !retirement.legacy) {
      rules.push({
        id: 'retirement-no-legacy',
        level: 'warning',
        message: 'Agent eligible for retirement but no legacy defined',
        suggestion: 'Define retirement.legacy to preserve agent contributions',
      });
    }

    return rules;
  }

  private checkEconomicsSetup(manifest: Record<string, unknown>): LintRule[] {
    const rules: LintRule[] = [];
    const metadata = manifest.metadata as Record<string, unknown> | undefined;
    const economics = metadata?.economics as
      | Record<string, unknown>
      | undefined;

    if (!economics) return rules;

    // Check marketplace offerings have valid pricing
    const marketplace = economics.marketplace as
      | Record<string, unknown>
      | undefined;
    if (marketplace?.offerings && Array.isArray(marketplace.offerings)) {
      marketplace.offerings.forEach((offering: unknown, index: number) => {
        const offeringObj = offering as Record<string, unknown>;
        if (typeof offeringObj.price === 'number' && offeringObj.price <= 0) {
          rules.push({
            id: 'offering-invalid-price',
            level: 'warning',
            message: `Offering #${index + 1} has price <= 0`,
            suggestion: 'Set a positive price or use pricing_model: "free"',
          });
        }
      });
    }

    // Check wallet has positive balance if agent is active in marketplace
    const wallet = economics.wallet as Record<string, unknown> | undefined;
    if (marketplace?.offerings && wallet) {
      if (typeof wallet.balance === 'number' && wallet.balance < 0) {
        rules.push({
          id: 'wallet-negative-balance',
          level: 'error',
          message: 'Wallet has negative balance',
          suggestion: 'Wallet balance cannot be negative',
        });
      }
    }

    return rules;
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: ts-node linter.ts <manifest.json>');
    process.exit(1);
  }

  const manifestPath = args[0];
  const linter = new OSSALinter();
  const result = linter.lintFile(manifestPath);

  if (result.passed) {
    console.log('✅ Linting passed');
  } else {
    console.log('❌ Linting failed');
  }

  if (result.rules.length > 0) {
    console.log('\nLint results:');

    const errors = result.rules.filter((r) => r.level === 'error');
    const warnings = result.rules.filter((r) => r.level === 'warning');
    const info = result.rules.filter((r) => r.level === 'info');

    if (errors.length > 0) {
      console.log('\n🔴 Errors:');
      errors.forEach((r) => {
        console.log(`   [${r.id}] ${r.message}`);
        if (r.suggestion) console.log(`      → ${r.suggestion}`);
      });
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      warnings.forEach((r) => {
        console.log(`   [${r.id}] ${r.message}`);
        if (r.suggestion) console.log(`      → ${r.suggestion}`);
      });
    }

    if (info.length > 0) {
      console.log('\nℹ️  Info:');
      info.forEach((r) => {
        console.log(`   [${r.id}] ${r.message}`);
        if (r.suggestion) console.log(`      → ${r.suggestion}`);
      });
    }
  }

  process.exit(result.passed ? 0 : 1);
}
