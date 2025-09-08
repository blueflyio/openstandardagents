/**
 * High-Performance Capability Matching Engine
 * Optimized for 1000+ agents with sub-100ms response time
 */

import { OSSAAgent, CapabilityMatch, DiscoveryQuery } from '../types';

export interface MatchingAlgorithm {
  name: string;
  description: string;
  score(agent: OSSAAgent, query: DiscoveryQuery): CapabilityMatch;
}

export interface CapabilityIndex {
  capability: string;
  agentIds: Set<string>;
  weight: number;
  frequency: number;
}

export interface DomainIndex {
  domain: string;
  agentIds: Set<string>;
  subdomains: Map<string, Set<string>>;
  weight: number;
}

export class CapabilityMatcher {
  private capabilityIndex = new Map<string, CapabilityIndex>();
  private domainIndex = new Map<string, DomainIndex>();
  private agentPerformanceCache = new Map<string, number>();
  private lastIndexUpdate = 0;
  private indexUpdateThreshold = 60000; // 1 minute

  private algorithms: Map<string, MatchingAlgorithm> = new Map();

  constructor() {
    this.initializeAlgorithms();
  }

  /**
   * Find best matching agents for a discovery query
   * Optimized for sub-100ms response time even with 1000+ agents
   */
  async findMatches(
    agents: Map<string, OSSAAgent>, 
    query: DiscoveryQuery
  ): Promise<CapabilityMatch[]> {
    const startTime = performance.now();
    
    // Update indexes if needed (lazy update)
    if (this.shouldUpdateIndexes()) {
      this.updateIndexes(agents);
    }

    // Use different strategies based on query complexity
    const matches = this.executeOptimizedMatching(agents, query);
    
    const processingTime = performance.now() - startTime;
    console.log(`Capability matching completed in ${processingTime.toFixed(2)}ms for ${agents.size} agents`);
    
    return matches;
  }

  /**
   * Update capability and domain indexes for fast lookup
   */
  updateIndexes(agents: Map<string, OSSAAgent>): void {
    const startTime = performance.now();
    
    this.capabilityIndex.clear();
    this.domainIndex.clear();
    this.agentPerformanceCache.clear();

    for (const [agentId, agent] of agents) {
      // Index primary capabilities
      agent.capabilities.primary.forEach(capability => {
        this.indexCapability(capability, agentId, 1.0);
      });

      // Index secondary capabilities with lower weight
      agent.capabilities.secondary?.forEach(capability => {
        this.indexCapability(capability, agentId, 0.7);
      });

      // Index domains
      agent.capabilities.domains.forEach(domain => {
        this.indexDomain(domain, agentId);
      });

      // Cache performance scores
      this.agentPerformanceCache.set(agentId, this.calculatePerformanceScore(agent));
    }

    this.lastIndexUpdate = Date.now();
    const indexingTime = performance.now() - startTime;
    console.log(`Capability indexes updated in ${indexingTime.toFixed(2)}ms`);
  }

  /**
   * Execute optimized matching based on query characteristics
   */
  private executeOptimizedMatching(
    agents: Map<string, OSSAAgent>,
    query: DiscoveryQuery
  ): CapabilityMatch[] {
    const candidateAgents = this.findCandidateAgents(query);
    
    if (candidateAgents.size === 0) {
      return [];
    }

    const algorithm = this.selectMatchingAlgorithm(query);
    const matches: CapabilityMatch[] = [];

    // Process candidates in batches for better performance
    const batchSize = 50;
    const candidateArray = Array.from(candidateAgents);
    
    for (let i = 0; i < candidateArray.length; i += batchSize) {
      const batch = candidateArray.slice(i, i + batchSize);
      
      const batchMatches = batch
        .map(agentId => {
          const agent = agents.get(agentId);
          if (!agent) return null;
          
          return algorithm.score(agent, query);
        })
        .filter((match): match is CapabilityMatch => match !== null && match.score > 0);
        
      matches.push(...batchMatches);
    }

    // Sort by score (descending) and apply result limit
    matches.sort((a, b) => b.score - a.score);
    
    return query.maxResults ? matches.slice(0, query.maxResults) : matches;
  }

  /**
   * Find candidate agents using index-based pre-filtering
   */
  private findCandidateAgents(query: DiscoveryQuery): Set<string> {
    const candidates = new Set<string>();
    
    // If no specific criteria, return all agents (will be filtered by other criteria)
    if (!query.capabilities?.length && !query.domains?.length) {
      // Use all agents from capability index
      this.capabilityIndex.forEach(index => {
        index.agentIds.forEach(agentId => candidates.add(agentId));
      });
      return candidates;
    }

    // Find candidates by capabilities (intersection for better precision)
    if (query.capabilities?.length) {
      const capabilityCandidates = this.findCandidatesByCapabilities(query.capabilities);
      capabilityCandidates.forEach(agentId => candidates.add(agentId));
    }

    // Find candidates by domains (union for broader coverage)
    if (query.domains?.length) {
      const domainCandidates = this.findCandidatesByDomains(query.domains);
      
      if (candidates.size === 0) {
        // If no capability candidates, use domain candidates
        domainCandidates.forEach(agentId => candidates.add(agentId));
      } else {
        // Intersect with existing candidates for precision
        const intersection = new Set<string>();
        candidates.forEach(agentId => {
          if (domainCandidates.has(agentId)) {
            intersection.add(agentId);
          }
        });
        return intersection;
      }
    }

    return candidates;
  }

  /**
   * Find candidates by capabilities with fuzzy matching
   */
  private findCandidatesByCapabilities(capabilities: string[]): Set<string> {
    const candidates = new Set<string>();
    const capabilityScores = new Map<string, number>();

    for (const capability of capabilities) {
      // Exact match
      const exactIndex = this.capabilityIndex.get(capability);
      if (exactIndex) {
        exactIndex.agentIds.forEach(agentId => {
          candidates.add(agentId);
          capabilityScores.set(agentId, (capabilityScores.get(agentId) || 0) + 1.0);
        });
      }

      // Fuzzy match (substring and similar capabilities)
      for (const [indexedCapability, index] of this.capabilityIndex) {
        if (indexedCapability !== capability) {
          const similarity = this.calculateStringSimilarity(capability, indexedCapability);
          if (similarity > 0.7) { // 70% similarity threshold
            index.agentIds.forEach(agentId => {
              candidates.add(agentId);
              capabilityScores.set(agentId, (capabilityScores.get(agentId) || 0) + similarity);
            });
          }
        }
      }
    }

    return candidates;
  }

  /**
   * Find candidates by domains with hierarchical matching
   */
  private findCandidatesByDomains(domains: string[]): Set<string> {
    const candidates = new Set<string>();

    for (const domain of domains) {
      // Exact domain match
      const exactIndex = this.domainIndex.get(domain);
      if (exactIndex) {
        exactIndex.agentIds.forEach(agentId => candidates.add(agentId));
      }

      // Hierarchical domain matching (e.g., "ai.ml" matches "ai.ml.nlp")
      for (const [indexedDomain, index] of this.domainIndex) {
        if (indexedDomain.startsWith(domain + '.') || domain.startsWith(indexedDomain + '.')) {
          index.agentIds.forEach(agentId => candidates.add(agentId));
        }
      }
    }

    return candidates;
  }

  /**
   * Select the best matching algorithm based on query characteristics
   */
  private selectMatchingAlgorithm(query: DiscoveryQuery): MatchingAlgorithm {
    // Use performance-weighted algorithm if performance tier is specified
    if (query.performanceTier) {
      return this.algorithms.get('performance_weighted')!;
    }
    
    // Use semantic matching for complex capability queries
    if (query.capabilities && query.capabilities.length > 3) {
      return this.algorithms.get('semantic_vector')!;
    }
    
    // Use domain-weighted matching for domain-specific queries
    if (query.domains && query.domains.length > 0) {
      return this.algorithms.get('domain_weighted')!;
    }
    
    // Default to hybrid matching
    return this.algorithms.get('hybrid')!;
  }

  /**
   * Initialize matching algorithms
   */
  private initializeAlgorithms(): void {
    // Hybrid matching algorithm (default)
    this.algorithms.set('hybrid', {
      name: 'hybrid',
      description: 'Balanced scoring across capabilities, domains, and performance',
      score: (agent: OSSAAgent, query: DiscoveryQuery): CapabilityMatch => {
        const capabilityScore = this.calculateCapabilityScore(agent, query.capabilities || []);
        const domainScore = this.calculateDomainScore(agent, query.domains || []);
        const performanceScore = this.agentPerformanceCache.get(agent.id) || 0;
        
        // Weighted combination
        const totalScore = (capabilityScore * 0.5) + (domainScore * 0.3) + (performanceScore * 0.2);
        
        return {
          agentId: agent.id,
          score: totalScore,
          matchedCapabilities: this.findMatchedCapabilities(agent, query.capabilities || []),
          exactMatches: this.findExactMatches(agent, query.capabilities || []),
          partialMatches: this.findPartialMatches(agent, query.capabilities || []),
          domainRelevance: domainScore,
        };
      }
    });

    // Performance-weighted algorithm
    this.algorithms.set('performance_weighted', {
      name: 'performance_weighted',
      description: 'Prioritizes high-performance agents',
      score: (agent: OSSAAgent, query: DiscoveryQuery): CapabilityMatch => {
        const capabilityScore = this.calculateCapabilityScore(agent, query.capabilities || []);
        const performanceScore = this.agentPerformanceCache.get(agent.id) || 0;
        
        // Heavy weight on performance
        const totalScore = (capabilityScore * 0.3) + (performanceScore * 0.7);
        
        return {
          agentId: agent.id,
          score: totalScore,
          matchedCapabilities: this.findMatchedCapabilities(agent, query.capabilities || []),
          exactMatches: this.findExactMatches(agent, query.capabilities || []),
          partialMatches: this.findPartialMatches(agent, query.capabilities || []),
          domainRelevance: this.calculateDomainScore(agent, query.domains || []),
        };
      }
    });

    // Domain-weighted algorithm
    this.algorithms.set('domain_weighted', {
      name: 'domain_weighted',
      description: 'Prioritizes domain expertise',
      score: (agent: OSSAAgent, query: DiscoveryQuery): CapabilityMatch => {
        const capabilityScore = this.calculateCapabilityScore(agent, query.capabilities || []);
        const domainScore = this.calculateDomainScore(agent, query.domains || []);
        
        // Heavy weight on domain relevance
        const totalScore = (capabilityScore * 0.3) + (domainScore * 0.7);
        
        return {
          agentId: agent.id,
          score: totalScore,
          matchedCapabilities: this.findMatchedCapabilities(agent, query.capabilities || []),
          exactMatches: this.findExactMatches(agent, query.capabilities || []),
          partialMatches: this.findPartialMatches(agent, query.capabilities || []),
          domainRelevance: domainScore,
        };
      }
    });

    // Semantic vector algorithm (for complex queries)
    this.algorithms.set('semantic_vector', {
      name: 'semantic_vector',
      description: 'Uses semantic similarity for capability matching',
      score: (agent: OSSAAgent, query: DiscoveryQuery): CapabilityMatch => {
        // Simplified semantic matching (could be enhanced with actual embeddings)
        const semanticScore = this.calculateSemanticScore(agent, query.capabilities || []);
        const performanceScore = this.agentPerformanceCache.get(agent.id) || 0;
        
        const totalScore = (semanticScore * 0.8) + (performanceScore * 0.2);
        
        return {
          agentId: agent.id,
          score: totalScore,
          matchedCapabilities: this.findMatchedCapabilities(agent, query.capabilities || []),
          exactMatches: this.findExactMatches(agent, query.capabilities || []),
          partialMatches: this.findPartialMatches(agent, query.capabilities || []),
          domainRelevance: this.calculateDomainScore(agent, query.domains || []),
        };
      }
    });
  }

  // Utility methods for scoring

  private calculateCapabilityScore(agent: OSSAAgent, queryCapabilities: string[]): number {
    if (queryCapabilities.length === 0) return 1.0;

    let totalScore = 0;
    let maxPossibleScore = queryCapabilities.length;

    for (const queryCapability of queryCapabilities) {
      let bestMatch = 0;
      
      // Check primary capabilities (full weight)
      for (const primaryCap of agent.capabilities.primary) {
        const similarity = this.calculateStringSimilarity(queryCapability, primaryCap);
        bestMatch = Math.max(bestMatch, similarity);
      }
      
      // Check secondary capabilities (reduced weight)
      for (const secondaryCap of agent.capabilities.secondary || []) {
        const similarity = this.calculateStringSimilarity(queryCapability, secondaryCap) * 0.7;
        bestMatch = Math.max(bestMatch, similarity);
      }
      
      totalScore += bestMatch;
    }

    return totalScore / maxPossibleScore;
  }

  private calculateDomainScore(agent: OSSAAgent, queryDomains: string[]): number {
    if (queryDomains.length === 0) return 1.0;

    let totalScore = 0;
    let maxPossibleScore = queryDomains.length;

    for (const queryDomain of queryDomains) {
      let bestMatch = 0;
      
      for (const agentDomain of agent.capabilities.domains) {
        // Exact match
        if (queryDomain === agentDomain) {
          bestMatch = 1.0;
          break;
        }
        
        // Hierarchical match
        if (agentDomain.includes(queryDomain) || queryDomain.includes(agentDomain)) {
          bestMatch = Math.max(bestMatch, 0.8);
        }
        
        // Similarity match
        const similarity = this.calculateStringSimilarity(queryDomain, agentDomain);
        bestMatch = Math.max(bestMatch, similarity * 0.6);
      }
      
      totalScore += bestMatch;
    }

    return totalScore / maxPossibleScore;
  }

  private calculateSemanticScore(agent: OSSAAgent, queryCapabilities: string[]): number {
    // Simplified semantic scoring
    // In a real implementation, this would use embeddings/vectors
    return this.calculateCapabilityScore(agent, queryCapabilities);
  }

  private calculatePerformanceScore(agent: OSSAAgent): number {
    const metrics = agent.performance;
    
    // Normalize metrics to 0-1 scale
    const responseTimeScore = Math.max(0, 1 - (metrics.avgResponseTimeMs / 1000));
    const uptimeScore = metrics.uptimePercentage / 100;
    const successScore = metrics.successRate;
    const throughputScore = Math.min(1, metrics.throughputRps / 100); // Cap at 100 RPS
    
    // Weighted performance score
    return (responseTimeScore * 0.3) + (uptimeScore * 0.3) + (successScore * 0.3) + (throughputScore * 0.1);
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    // Exact match
    if (s1 === s2) return 1.0;
    
    // Substring match
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;
    
    // Jaccard similarity (simplified)
    const set1 = new Set(s1.split(/\W+/));
    const set2 = new Set(s2.split(/\W+/));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  private findMatchedCapabilities(agent: OSSAAgent, queryCapabilities: string[]): string[] {
    const matched: string[] = [];
    const allCapabilities = [...agent.capabilities.primary, ...(agent.capabilities.secondary || [])];
    
    for (const queryCapability of queryCapabilities) {
      for (const agentCapability of allCapabilities) {
        if (this.calculateStringSimilarity(queryCapability, agentCapability) > 0.7) {
          matched.push(agentCapability);
        }
      }
    }
    
    return [...new Set(matched)]; // Remove duplicates
  }

  private findExactMatches(agent: OSSAAgent, queryCapabilities: string[]): string[] {
    const allCapabilities = [...agent.capabilities.primary, ...(agent.capabilities.secondary || [])];
    return queryCapabilities.filter(queryCapability => 
      allCapabilities.some(agentCapability => 
        queryCapability.toLowerCase() === agentCapability.toLowerCase()
      )
    );
  }

  private findPartialMatches(agent: OSSAAgent, queryCapabilities: string[]): string[] {
    const exactMatches = new Set(this.findExactMatches(agent, queryCapabilities));
    const allMatches = this.findMatchedCapabilities(agent, queryCapabilities);
    
    return allMatches.filter(match => {
      const correspondingQuery = queryCapabilities.find(query => 
        this.calculateStringSimilarity(query, match) > 0.7
      );
      return correspondingQuery && !exactMatches.has(correspondingQuery);
    });
  }

  // Index management methods

  private indexCapability(capability: string, agentId: string, weight: number): void {
    const normalizedCapability = capability.toLowerCase().trim();
    
    if (!this.capabilityIndex.has(normalizedCapability)) {
      this.capabilityIndex.set(normalizedCapability, {
        capability: normalizedCapability,
        agentIds: new Set(),
        weight: 0,
        frequency: 0,
      });
    }
    
    const index = this.capabilityIndex.get(normalizedCapability)!;
    index.agentIds.add(agentId);
    index.weight += weight;
    index.frequency += 1;
  }

  private indexDomain(domain: string, agentId: string): void {
    const normalizedDomain = domain.toLowerCase().trim();
    
    if (!this.domainIndex.has(normalizedDomain)) {
      this.domainIndex.set(normalizedDomain, {
        domain: normalizedDomain,
        agentIds: new Set(),
        subdomains: new Map(),
        weight: 0,
      });
    }
    
    const index = this.domainIndex.get(normalizedDomain)!;
    index.agentIds.add(agentId);
    index.weight += 1;
    
    // Handle subdomain indexing
    const parts = normalizedDomain.split('.');
    for (let i = 1; i < parts.length; i++) {
      const subdomain = parts.slice(i).join('.');
      if (!index.subdomains.has(subdomain)) {
        index.subdomains.set(subdomain, new Set());
      }
      index.subdomains.get(subdomain)!.add(agentId);
    }
  }

  private shouldUpdateIndexes(): boolean {
    return Date.now() - this.lastIndexUpdate > this.indexUpdateThreshold;
  }

  /**
   * Get capability matching statistics
   */
  getStatistics(): {
    totalCapabilities: number;
    totalDomains: number;
    averageCapabilitiesPerAgent: number;
    mostCommonCapabilities: Array<{ capability: string; frequency: number }>;
    lastIndexUpdate: Date;
  } {
    const capabilities = Array.from(this.capabilityIndex.values())
      .sort((a, b) => b.frequency - a.frequency);
    
    const totalAgents = new Set<string>();
    this.capabilityIndex.forEach(index => {
      index.agentIds.forEach(agentId => totalAgents.add(agentId));
    });

    const avgCapabilities = totalAgents.size > 0 
      ? Array.from(this.capabilityIndex.values()).reduce((sum, index) => sum + index.frequency, 0) / totalAgents.size
      : 0;

    return {
      totalCapabilities: this.capabilityIndex.size,
      totalDomains: this.domainIndex.size,
      averageCapabilitiesPerAgent: avgCapabilities,
      mostCommonCapabilities: capabilities.slice(0, 10).map(cap => ({
        capability: cap.capability,
        frequency: cap.frequency,
      })),
      lastIndexUpdate: new Date(this.lastIndexUpdate),
    };
  }
}