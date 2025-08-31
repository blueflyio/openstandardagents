/**
 * Agent Selector Service
 * Selects the best agents for a given question based on capabilities and expertise
 */

export interface AgentCandidate {
  agent_id: string;
  name: string;
  capabilities: string[];
  expertise_score: number;
  availability_score: number;
  performance_score: number;
  overall_score: number;
  confidence: number;
  reasoning: string;
}

export interface AgentSelectionResult {
  primary_agent: AgentCandidate | null;
  supporting_agents: AgentCandidate[];
  selection_strategy: string;
  total_candidates: number;
  selection_time_ms: number;
}

export interface DiscoveredAgent {
  id: string;
  name: string;
  version: string;
  format: string;
  source_path: string;
  capabilities: Array<{
    name: string;
    description: string;
    frameworks: string[];
  }>;
  metadata?: any;
  confidence: number;
  last_discovered: Date;
}

export class AgentSelector {
  private agents: Map<string, DiscoveredAgent> = new Map();
  private performanceHistory: Map<string, number[]> = new Map();
  private availabilityStatus: Map<string, 'online' | 'offline' | 'busy'> = new Map();

  constructor() {
    // Initialize with default availability status
    this.availabilityStatus.set('tddai-expert', 'online');
    this.availabilityStatus.set('token-optimizer', 'online');
  }

  async selectAgents(
    questionAnalysis: any,
    availableAgents: DiscoveredAgent[]
  ): Promise<AgentSelectionResult> {
    const startTime = Date.now();
    
    // Update internal agent registry
    availableAgents.forEach(agent => {
      this.agents.set(agent.id, agent);
    });

    // Find candidate agents
    const candidates = this.findCandidateAgents(questionAnalysis);
    
    // Score and rank candidates
    const scoredCandidates = this.scoreCandidates(candidates, questionAnalysis);
    
    // Select primary and supporting agents
    const primaryAgent = this.selectPrimaryAgent(scoredCandidates);
    const supportingAgents = this.selectSupportingAgents(scoredCandidates, primaryAgent);
    
    const selectionTime = Date.now() - startTime;

    return {
      primary_agent: primaryAgent,
      supporting_agents: supportingAgents,
      selection_strategy: this.determineSelectionStrategy(questionAnalysis),
      total_candidates: candidates.length,
      selection_time_ms: selectionTime
    };
  }

  private findCandidateAgents(questionAnalysis: any): DiscoveredAgent[] {
    const candidates: DiscoveredAgent[] = [];
    const requiredCapabilities = questionAnalysis.required_capabilities;

    for (const agent of this.agents.values()) {
      // Check if agent has any of the required capabilities
      const agentCapabilities = agent.capabilities.map(c => c.name);
      const hasRequiredCapability = requiredCapabilities.some((cap: string) =>
        agentCapabilities.includes(cap)
      );

      if (hasRequiredCapability) {
        candidates.push(agent);
      }
    }

    return candidates;
  }

  private scoreCandidates(
    candidates: DiscoveredAgent[],
    questionAnalysis: any
  ): AgentCandidate[] {
    return candidates.map(agent => {
      const expertiseScore = this.calculateExpertiseScore(agent, questionAnalysis);
      const availabilityScore = this.calculateAvailabilityScore(agent);
      const performanceScore = this.calculatePerformanceScore(agent);
      
      const overallScore = (expertiseScore * 0.5) + (availabilityScore * 0.3) + (performanceScore * 0.2);
      
      const confidence = this.calculateConfidence(agent, questionAnalysis);
      const reasoning = this.generateReasoning(agent, questionAnalysis, {
        expertiseScore,
        availabilityScore,
        performanceScore,
        overallScore
      });

      return {
        agent_id: agent.id,
        name: agent.name,
        capabilities: agent.capabilities.map(c => c.name),
        expertise_score: expertiseScore,
        availability_score: availabilityScore,
        performance_score: performanceScore,
        overall_score: overallScore,
        confidence,
        reasoning
      };
    }).sort((a, b) => b.overall_score - a.overall_score);
  }

  private calculateExpertiseScore(agent: DiscoveredAgent, questionAnalysis: any): number {
    let score = 0;
    const requiredCapabilities = questionAnalysis.required_capabilities;
    const agentCapabilities = agent.capabilities.map(c => c.name);

    // Capability matching
    const matchingCapabilities = requiredCapabilities.filter((cap: string) =>
      agentCapabilities.includes(cap)
    );
    score += (matchingCapabilities.length / requiredCapabilities.length) * 0.6;

    // Domain expertise
    const domain = questionAnalysis.domain;
    if (this.hasDomainExpertise(agent, domain)) {
      score += 0.3;
    }

    // Framework compatibility
    const frameworkScore = this.calculateFrameworkCompatibility(agent, questionAnalysis);
    score += frameworkScore * 0.1;

    return Math.min(1.0, score);
  }

  private calculateAvailabilityScore(agent: DiscoveredAgent): number {
    const status = this.availabilityStatus.get(agent.id) || 'offline';
    
    switch (status) {
      case 'online':
        return 1.0;
      case 'busy':
        return 0.6;
      case 'offline':
        return 0.0;
      default:
        return 0.5;
    }
  }

  private calculatePerformanceScore(agent: DiscoveredAgent): number {
    const history = this.performanceHistory.get(agent.id);
    
    if (!history || history.length === 0) {
      return 0.7; // Default score for new agents
    }

    // Calculate average performance over last 10 executions
    const recentHistory = history.slice(-10);
    const averagePerformance = recentHistory.reduce((sum, score) => sum + score, 0) / recentHistory.length;
    
    return Math.min(1.0, averagePerformance);
  }

  private calculateConfidence(agent: DiscoveredAgent, questionAnalysis: any): number {
    const capabilityMatch = this.calculateCapabilityMatch(agent, questionAnalysis);
    const agentConfidence = agent.confidence;
    const questionConfidence = questionAnalysis.confidence;
    
    return (capabilityMatch * 0.5) + (agentConfidence * 0.3) + (questionConfidence * 0.2);
  }

  private calculateCapabilityMatch(agent: DiscoveredAgent, questionAnalysis: any): number {
    const requiredCapabilities = questionAnalysis.required_capabilities;
    const agentCapabilities = agent.capabilities.map(c => c.name);
    
    const matchingCapabilities = requiredCapabilities.filter((cap: string) =>
      agentCapabilities.includes(cap)
    );
    
    return requiredCapabilities.length > 0 
      ? matchingCapabilities.length / requiredCapabilities.length 
      : 0.5;
  }

  private hasDomainExpertise(agent: DiscoveredAgent, domain: string): boolean {
    // Check agent metadata for domain expertise
    if (agent.metadata?.domains?.includes(domain)) {
      return true;
    }

    // Check capabilities for domain-specific indicators
    const domainIndicators = {
      'drupal': ['drupal_expertise', 'module_development', 'theme_development'],
      'ai_ml': ['llm_optimization', 'ai_workflows', 'model_training'],
      'web_development': ['code_analysis', 'api_design', 'frontend_development'],
      'devops': ['deployment', 'ci_cd', 'infrastructure'],
      'security': ['security_scan', 'vulnerability_assessment', 'compliance'],
      'government': ['rfp_processing', 'compliance', 'procurement']
    };

    const indicators = domainIndicators[domain as keyof typeof domainIndicators] || [];
    const agentCapabilities = agent.capabilities.map(c => c.name);
    
    return indicators.some(indicator => agentCapabilities.includes(indicator));
  }

  private calculateFrameworkCompatibility(agent: DiscoveredAgent, questionAnalysis: any): number {
    // Check if agent supports frameworks mentioned in the question
    const technicalTerms = questionAnalysis.technical_terms || [];
    const supportedFrameworks = new Set<string>();
    
    agent.capabilities.forEach(capability => {
      capability.frameworks.forEach(framework => {
        supportedFrameworks.add(framework);
      });
    });

    const mentionedFrameworks = technicalTerms.filter((term: string) =>
      ['mcp', 'langchain', 'crewai', 'openai', 'anthropic', 'drupal'].includes(term)
    );

    if (mentionedFrameworks.length === 0) {
      return 0.5; // Neutral score if no frameworks mentioned
    }

    const supportedMentionedFrameworks = mentionedFrameworks.filter((framework: string) =>
      supportedFrameworks.has(framework)
    );

    return supportedMentionedFrameworks.length / mentionedFrameworks.length;
  }

  private selectPrimaryAgent(candidates: AgentCandidate[]): AgentCandidate | null {
    if (candidates.length === 0) {
      return null;
    }

    // Select the highest scoring candidate that's available
    for (const candidate of candidates) {
      if (candidate.availability_score > 0.5 && candidate.overall_score > 0.3) {
        return candidate;
      }
    }

    // Fallback to highest scoring candidate
    return candidates[0];
  }

  private selectSupportingAgents(
    candidates: AgentCandidate[],
    primaryAgent: AgentCandidate | null
  ): AgentCandidate[] {
    const supportingAgents: AgentCandidate[] = [];
    const primaryAgentId = primaryAgent?.agent_id;

    for (const candidate of candidates) {
      // Skip primary agent
      if (candidate.agent_id === primaryAgentId) {
        continue;
      }

      // Add supporting agents with good scores
      if (candidate.overall_score > 0.4 && candidate.availability_score > 0.3) {
        supportingAgents.push(candidate);
      }

      // Limit to 3 supporting agents
      if (supportingAgents.length >= 3) {
        break;
      }
    }

    return supportingAgents;
  }

  private determineSelectionStrategy(questionAnalysis: any): string {
    const complexity = questionAnalysis.complexity;
    const capabilityCount = questionAnalysis.required_capabilities.length;

    if (complexity === 'expert' && capabilityCount > 3) {
      return 'multi_agent_collaboration';
    } else if (complexity === 'high' && capabilityCount > 2) {
      return 'primary_with_support';
    } else if (complexity === 'medium') {
      return 'single_primary_agent';
    } else {
      return 'simple_routing';
    }
  }

  private generateReasoning(
    agent: DiscoveredAgent,
    questionAnalysis: any,
    scores: any
  ): string {
    const reasons: string[] = [];

    // Capability matching
    const matchingCapabilities = questionAnalysis.required_capabilities.filter((cap: string) =>
      agent.capabilities.map(c => c.name).includes(cap)
    );
    
    if (matchingCapabilities.length > 0) {
      reasons.push(`Matches ${matchingCapabilities.length} required capabilities: ${matchingCapabilities.join(', ')}`);
    }

    // Domain expertise
    if (this.hasDomainExpertise(agent, questionAnalysis.domain)) {
      reasons.push(`Has expertise in ${questionAnalysis.domain} domain`);
    }

    // Performance
    if (scores.performance_score > 0.8) {
      reasons.push('High historical performance');
    }

    // Availability
    const status = this.availabilityStatus.get(agent.id);
    if (status === 'online') {
      reasons.push('Currently available');
    }

    return reasons.join('; ');
  }

  // Public methods for updating agent status
  updateAgentPerformance(agentId: string, performanceScore: number): void {
    if (!this.performanceHistory.has(agentId)) {
      this.performanceHistory.set(agentId, []);
    }
    
    const history = this.performanceHistory.get(agentId)!;
    history.push(performanceScore);
    
    // Keep only last 50 performance scores
    if (history.length > 50) {
      history.shift();
    }
  }

  updateAgentAvailability(agentId: string, status: 'online' | 'offline' | 'busy'): void {
    this.availabilityStatus.set(agentId, status);
  }

  getAgentStats(): any {
    return {
      total_agents: this.agents.size,
      online_agents: Array.from(this.availabilityStatus.values()).filter(s => s === 'online').length,
      performance_history: Object.fromEntries(this.performanceHistory),
      availability_status: Object.fromEntries(this.availabilityStatus)
    };
  }
}
