/**
 * Taxonomy Service
 * Classification engine for OSSA agents with 20+ classification dimensions
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { injectable } from 'inversify';
import type { OssaAgent } from '../types/index.js';

export interface TaxonomyClassification {
  domain: string;
  subdomain?: string;
  capability?: string;
  concerns?: string[];
  maturity?: 'prototype' | 'beta' | 'stable' | 'production';
  deploymentPattern?: 'serverless' | 'container' | 'edge' | 'hybrid';
  integrationPattern?: 'api-first' | 'event-driven' | 'batch' | 'streaming';
  costProfile?: 'low' | 'medium' | 'high' | 'enterprise';
  performanceTier?: 'real-time' | 'near-real-time' | 'batch';
  agentType?: string;
}

export interface TaxonomyRecommendation {
  classification: TaxonomyClassification;
  confidence: number;
  reasoning: string[];
  alternatives?: TaxonomyClassification[];
}

export interface TaxonomySpec {
  domains: Record<
    string,
    {
      description: string;
      subdomains?: string[];
      examples?: string[];
    }
  >;
  concerns?: Record<
    string,
    {
      description: string;
      applies_to: string[];
    }
  >;
  maturity_levels?: Record<
    string,
    {
      description: string;
      stability: string;
      testing_required: string;
      documentation_required: string;
      use_cases: string[];
    }
  >;
  deployment_patterns?: Record<
    string,
    {
      description: string;
      examples: string[];
      characteristics: string[];
      use_cases: string[];
    }
  >;
  integration_patterns?: Record<
    string,
    {
      description: string;
      protocols: string[];
      characteristics: string[];
      use_cases: string[];
    }
  >;
  cost_profiles?: Record<
    string,
    {
      description: string;
      estimated_monthly_cost: string;
      characteristics: string[];
      use_cases: string[];
    }
  >;
  performance_tiers?: Record<
    string,
    {
      description: string;
      latency_requirement: string;
      throughput: string;
      use_cases: string[];
    }
  >;
  agent_types?: Record<
    string,
    {
      description: string;
      typical_domains: string[];
      recommended_tier?: string;
    }
  >;
}

let cachedTaxonomy: TaxonomySpec | null = null;

@injectable()
export class TaxonomyService {
  /**
   * Load taxonomy specification
   */
  async loadTaxonomy(): Promise<TaxonomySpec> {
    if (cachedTaxonomy) {
      return cachedTaxonomy;
    }

    const possiblePaths = [
      path.resolve(process.cwd(), 'spec/v0.3.6/taxonomy.yaml'),
      path.resolve(process.cwd(), 'spec/v0.3.3/taxonomy.yaml'),
      path.resolve(
        process.cwd(),
        '../openstandardagents.org/spec/v0.3.6/taxonomy.yaml'
      ),
      path.resolve(
        process.cwd(),
        '../openstandardagents.org/spec/v0.3.3/taxonomy.yaml'
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
          console.warn(`Failed to load taxonomy from ${taxonomyPath}:`, error);
        }
      }
    }

    throw new Error('Taxonomy specification not found');
  }

  /**
   * Classify agent based on manifest
   */
  async classifyAgent(manifest: OssaAgent): Promise<TaxonomyClassification> {
    const taxonomy = await this.loadTaxonomy();
    const spec = manifest.spec as Record<string, unknown>;
    const taxonomyData = spec.taxonomy as Record<string, unknown> | undefined;

    const classification: TaxonomyClassification = {
      domain:
        (taxonomyData?.domain as string) ||
        this.inferDomain(manifest, taxonomy),
      subdomain: taxonomyData?.subdomain as string | undefined,
      capability: taxonomyData?.capability as string | undefined,
      concerns: taxonomyData?.concerns as string[] | undefined,
      maturity: taxonomyData?.maturity as TaxonomyClassification['maturity'],
      deploymentPattern:
        taxonomyData?.deployment_pattern as TaxonomyClassification['deploymentPattern'],
      integrationPattern:
        taxonomyData?.integration_pattern as TaxonomyClassification['integrationPattern'],
      costProfile:
        taxonomyData?.cost_profile as TaxonomyClassification['costProfile'],
      performanceTier:
        taxonomyData?.performance_tier as TaxonomyClassification['performanceTier'],
      agentType: manifest.spec?.role || this.inferAgentType(manifest, taxonomy),
    };

    return classification;
  }

  /**
   * Recommend taxonomy based on use case
   */
  async recommendTaxonomy(
    useCase: string,
    agentType?: string
  ): Promise<TaxonomyRecommendation> {
    const taxonomy = await this.loadTaxonomy();
    const useCaseLower = useCase.toLowerCase();

    // Infer domain from use case keywords
    const domain = this.matchDomainFromUseCase(useCaseLower, taxonomy);
    const subdomain = this.matchSubdomainFromUseCase(
      useCaseLower,
      taxonomy,
      domain
    );
    const concerns = this.matchConcernsFromUseCase(useCaseLower, taxonomy);

    // Infer deployment pattern
    const deploymentPattern = this.inferDeploymentPattern(useCaseLower);
    const integrationPattern = this.inferIntegrationPattern(useCaseLower);
    const costProfile = this.inferCostProfile(useCaseLower);
    const performanceTier = this.inferPerformanceTier(useCaseLower);

    const classification: TaxonomyClassification = {
      domain,
      subdomain,
      concerns,
      deploymentPattern,
      integrationPattern,
      costProfile,
      performanceTier,
      agentType:
        agentType || this.inferAgentTypeFromUseCase(useCaseLower, taxonomy),
    };

    return {
      classification,
      confidence: 0.8, // TODO: Calculate actual confidence
      reasoning: [
        `Domain "${domain}" matched from use case keywords`,
        `Deployment pattern "${deploymentPattern}" inferred from use case`,
        `Integration pattern "${integrationPattern}" inferred from use case`,
      ],
    };
  }

  /**
   * Validate taxonomy classification
   */
  async validateTaxonomy(
    classification: TaxonomyClassification
  ): Promise<{ valid: boolean; errors: string[] }> {
    const taxonomy = await this.loadTaxonomy();
    const errors: string[] = [];

    // Validate domain
    if (!taxonomy.domains[classification.domain]) {
      errors.push(`Invalid domain: ${classification.domain}`);
    }

    // Validate subdomain belongs to domain
    if (classification.subdomain) {
      const domain = taxonomy.domains[classification.domain];
      if (
        domain &&
        domain.subdomains &&
        !domain.subdomains.includes(classification.subdomain)
      ) {
        errors.push(
          `Subdomain "${classification.subdomain}" does not belong to domain "${classification.domain}"`
        );
      }
    }

    // Validate concerns
    if (classification.concerns) {
      for (const concern of classification.concerns) {
        if (!taxonomy.concerns || !taxonomy.concerns[concern]) {
          errors.push(`Invalid concern: ${concern}`);
        }
      }
    }

    // Validate maturity level
    if (classification.maturity) {
      const validMaturities = ['prototype', 'beta', 'stable', 'production'];
      if (!validMaturities.includes(classification.maturity)) {
        errors.push(`Invalid maturity level: ${classification.maturity}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Infer domain from agent manifest
   */
  private inferDomain(manifest: OssaAgent, taxonomy: TaxonomySpec): string {
    // Check metadata labels
    const labels = manifest.metadata?.labels || {};
    if (labels['ossa.ai/domain']) {
      return labels['ossa.ai/domain'] as string;
    }

    // Infer from role/description
    const role = manifest.spec?.role || '';
    const description = manifest.metadata?.description || '';

    const text = `${role} ${description}`.toLowerCase();

    // Match against domain keywords
    for (const [domain, domainInfo] of Object.entries(taxonomy.domains)) {
      if (
        text.includes(domain) ||
        domainInfo.description.toLowerCase().includes(text)
      ) {
        return domain;
      }
    }

    // Default to 'agents' domain
    return 'agents';
  }

  /**
   * Infer agent type from manifest
   */
  private inferAgentType(manifest: OssaAgent, taxonomy: TaxonomySpec): string {
    const role = manifest.spec?.role || '';
    const roleLower = role.toLowerCase();

    // Match against agent types
    if (taxonomy.agent_types) {
      for (const [type, typeInfo] of Object.entries(taxonomy.agent_types)) {
        if (
          roleLower.includes(type) ||
          typeInfo.description.toLowerCase().includes(roleLower)
        ) {
          return type;
        }
      }
    }

    return 'worker'; // Default
  }

  /**
   * Match domain from use case
   */
  private matchDomainFromUseCase(
    useCase: string,
    taxonomy: TaxonomySpec
  ): string {
    for (const [domain, domainInfo] of Object.entries(taxonomy.domains)) {
      if (
        useCase.includes(domain) ||
        domainInfo.description.toLowerCase().includes(useCase) ||
        domainInfo.examples?.some((ex) => useCase.includes(ex))
      ) {
        return domain;
      }
    }
    return 'agents'; // Default
  }

  /**
   * Match subdomain from use case
   */
  private matchSubdomainFromUseCase(
    useCase: string,
    taxonomy: TaxonomySpec,
    domain: string
  ): string | undefined {
    const domainInfo = taxonomy.domains[domain];
    if (!domainInfo?.subdomains) {
      return undefined;
    }

    for (const subdomain of domainInfo.subdomains) {
      if (useCase.includes(subdomain)) {
        return subdomain;
      }
    }

    return undefined;
  }

  /**
   * Match concerns from use case
   */
  private matchConcernsFromUseCase(
    useCase: string,
    taxonomy: TaxonomySpec
  ): string[] {
    const matched: string[] = [];

    if (!taxonomy.concerns) {
      return matched;
    }

    for (const [concern, concernInfo] of Object.entries(taxonomy.concerns)) {
      if (
        useCase.includes(concern) ||
        concernInfo.description.toLowerCase().includes(useCase)
      ) {
        matched.push(concern);
      }
    }

    return matched;
  }

  /**
   * Infer deployment pattern from use case
   */
  private inferDeploymentPattern(
    useCase: string
  ): TaxonomyClassification['deploymentPattern'] {
    if (
      useCase.includes('serverless') ||
      useCase.includes('lambda') ||
      useCase.includes('function')
    ) {
      return 'serverless';
    }
    if (
      useCase.includes('edge') ||
      useCase.includes('cdn') ||
      useCase.includes('workers')
    ) {
      return 'edge';
    }
    if (
      useCase.includes('container') ||
      useCase.includes('docker') ||
      useCase.includes('kubernetes')
    ) {
      return 'container';
    }
    return 'container'; // Default
  }

  /**
   * Infer integration pattern from use case
   */
  private inferIntegrationPattern(
    useCase: string
  ): TaxonomyClassification['integrationPattern'] {
    if (
      useCase.includes('api') ||
      useCase.includes('rest') ||
      useCase.includes('http')
    ) {
      return 'api-first';
    }
    if (
      useCase.includes('event') ||
      useCase.includes('queue') ||
      useCase.includes('stream')
    ) {
      return 'event-driven';
    }
    if (
      useCase.includes('batch') ||
      useCase.includes('scheduled') ||
      useCase.includes('cron')
    ) {
      return 'batch';
    }
    if (
      useCase.includes('real-time') ||
      useCase.includes('live') ||
      useCase.includes('streaming')
    ) {
      return 'streaming';
    }
    return 'api-first'; // Default
  }

  /**
   * Infer cost profile from use case
   */
  private inferCostProfile(
    useCase: string
  ): TaxonomyClassification['costProfile'] {
    if (
      useCase.includes('enterprise') ||
      useCase.includes('production') ||
      useCase.includes('mission-critical')
    ) {
      return 'enterprise';
    }
    if (
      useCase.includes('high-volume') ||
      useCase.includes('frequent') ||
      useCase.includes('continuous')
    ) {
      return 'high';
    }
    if (
      useCase.includes('prototype') ||
      useCase.includes('experiment') ||
      useCase.includes('personal')
    ) {
      return 'low';
    }
    return 'medium'; // Default
  }

  /**
   * Infer performance tier from use case
   */
  private inferPerformanceTier(
    useCase: string
  ): TaxonomyClassification['performanceTier'] {
    if (
      useCase.includes('real-time') ||
      useCase.includes('immediate') ||
      useCase.includes('instant')
    ) {
      return 'real-time';
    }
    if (
      useCase.includes('batch') ||
      useCase.includes('scheduled') ||
      useCase.includes('overnight')
    ) {
      return 'batch';
    }
    return 'near-real-time'; // Default
  }

  /**
   * Infer agent type from use case
   */
  private inferAgentTypeFromUseCase(
    useCase: string,
    taxonomy: TaxonomySpec
  ): string {
    if (!taxonomy.agent_types) {
      return 'worker';
    }

    for (const [type, typeInfo] of Object.entries(taxonomy.agent_types)) {
      if (
        useCase.includes(type) ||
        typeInfo.description.toLowerCase().includes(useCase) ||
        typeInfo.typical_domains.some((domain) => useCase.includes(domain))
      ) {
        return type;
      }
    }

    return 'worker'; // Default
  }
}
