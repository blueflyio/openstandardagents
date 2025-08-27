/**
 * Question Analyzer Service
 * Analyzes questions to determine required capabilities and complexity
 */

export interface QuestionAnalysis {
  id: string;
  question: string;
  complexity: 'low' | 'medium' | 'high' | 'expert';
  required_capabilities: string[];
  technical_terms: string[];
  domain: string;
  estimated_tokens: number;
  confidence: number;
  analysis_time_ms: number;
}

export interface TechnicalTerm {
  term: string;
  category: 'framework' | 'technology' | 'concept' | 'tool';
  confidence: number;
}

export class QuestionAnalyzer {
  private technicalTerms: Map<string, TechnicalTerm> = new Map();
  private capabilityPatterns: Map<string, string[]> = new Map();

  constructor() {
    this.initializeTechnicalTerms();
    this.initializeCapabilityPatterns();
  }

  async analyzeQuestion(question: string): Promise<QuestionAnalysis> {
    const startTime = Date.now();

    // Extract technical terms
    const technicalTerms = this.extractTechnicalTerms(question);

    // Determine complexity
    const complexity = this.determineComplexity(question, technicalTerms);

    // Map to required capabilities
    const requiredCapabilities = this.mapToCapabilities(question, technicalTerms);

    // Determine domain
    const domain = this.determineDomain(technicalTerms);

    // Estimate tokens
    const estimatedTokens = this.estimateTokens(question);

    // Calculate confidence
    const confidence = this.calculateConfidence(technicalTerms, requiredCapabilities);

    const analysisTime = Date.now() - startTime;

    return {
      id: this.generateAnalysisId(),
      question,
      complexity,
      required_capabilities: requiredCapabilities,
      technical_terms: technicalTerms.map(t => t.term),
      domain,
      estimated_tokens: estimatedTokens,
      confidence,
      analysis_time_ms: analysisTime
    };
  }

  private initializeTechnicalTerms(): void {
    const terms = [
      // Frameworks
      { term: 'drupal', category: 'framework' as const, confidence: 0.95 },
      { term: 'mcp', category: 'framework' as const, confidence: 0.9 },
      { term: 'langchain', category: 'framework' as const, confidence: 0.9 },
      { term: 'crewai', category: 'framework' as const, confidence: 0.9 },
      { term: 'openai', category: 'framework' as const, confidence: 0.9 },
      { term: 'anthropic', category: 'framework' as const, confidence: 0.9 },

      // Technologies
      { term: 'typescript', category: 'technology' as const, confidence: 0.95 },
      { term: 'javascript', category: 'technology' as const, confidence: 0.95 },
      { term: 'php', category: 'technology' as const, confidence: 0.95 },
      { term: 'python', category: 'technology' as const, confidence: 0.95 },
      { term: 'nodejs', category: 'technology' as const, confidence: 0.9 },
      { term: 'docker', category: 'technology' as const, confidence: 0.9 },
      { term: 'kubernetes', category: 'technology' as const, confidence: 0.9 },

      // Concepts
      { term: 'ai', category: 'concept' as const, confidence: 0.8 },
      { term: 'llm', category: 'concept' as const, confidence: 0.9 },
      { term: 'agent', category: 'concept' as const, confidence: 0.8 },
      { term: 'orchestration', category: 'concept' as const, confidence: 0.85 },
      { term: 'compliance', category: 'concept' as const, confidence: 0.8 },
      { term: 'security', category: 'concept' as const, confidence: 0.8 },
      { term: 'performance', category: 'concept' as const, confidence: 0.8 },

      // Tools
      { term: 'tddai', category: 'tool' as const, confidence: 0.95 },
      { term: 'git', category: 'tool' as const, confidence: 0.9 },
      { term: 'ci/cd', category: 'tool' as const, confidence: 0.85 },
      { term: 'testing', category: 'tool' as const, confidence: 0.8 }
    ];

    terms.forEach(term => {
      this.technicalTerms.set(term.term.toLowerCase(), term);
    });
  }

  private initializeCapabilityPatterns(): void {
    this.capabilityPatterns.set('code_analysis', [
      'analyze', 'review', 'quality', 'metrics', 'complexity', 'maintainability'
    ]);
    this.capabilityPatterns.set('security_scan', [
      'security', 'vulnerability', 'scan', 'audit', 'compliance', 'owasp'
    ]);
    this.capabilityPatterns.set('test_generation', [
      'test', 'testing', 'unit test', 'integration test', 'tdd', 'coverage'
    ]);
    this.capabilityPatterns.set('documentation', [
      'documentation', 'docs', 'readme', 'api docs', 'generate docs'
    ]);
    this.capabilityPatterns.set('drupal_expertise', [
      'drupal', 'module', 'theme', 'hook', 'entity', 'field', 'view'
    ]);
    this.capabilityPatterns.set('llm_optimization', [
      'token', 'optimization', 'llm', 'prompt', 'efficiency', 'cost'
    ]);
    this.capabilityPatterns.set('rfp_processing', [
      'rfp', 'proposal', 'government', 'procurement', 'compliance'
    ]);
  }

  private extractTechnicalTerms(question: string): TechnicalTerm[] {
    const words = question.toLowerCase().split(/\s+/);
    const foundTerms: TechnicalTerm[] = [];

    for (const word of words) {
      // Check exact matches
      if (this.technicalTerms.has(word)) {
        foundTerms.push(this.technicalTerms.get(word)!);
        continue;
      }

      // Check partial matches
      for (const [term, data] of this.technicalTerms) {
        if (word.includes(term) || term.includes(word)) {
          foundTerms.push({
            ...data,
            confidence: data.confidence * 0.7 // Reduce confidence for partial matches
          });
        }
      }
    }

    // Remove duplicates and sort by confidence
    const uniqueTerms = new Map<string, TechnicalTerm>();
    foundTerms.forEach(term => {
      const existing = uniqueTerms.get(term.term);
      if (!existing || term.confidence > existing.confidence) {
        uniqueTerms.set(term.term, term);
      }
    });

    return Array.from(uniqueTerms.values()).sort((a, b) => b.confidence - a.confidence);
  }

  private determineComplexity(question: string, terms: TechnicalTerm[]): QuestionAnalysis['complexity'] {
    const questionLength = question.length;
    const termCount = terms.length;
    const highConfidenceTerms = terms.filter(t => t.confidence > 0.8).length;

    // Simple heuristics for complexity
    if (questionLength < 50 && termCount < 3 && highConfidenceTerms < 2) {
      return 'low';
    } else if (questionLength < 200 && termCount < 6 && highConfidenceTerms < 4) {
      return 'medium';
    } else if (questionLength < 500 && termCount < 10 && highConfidenceTerms < 7) {
      return 'high';
    } else {
      return 'expert';
    }
  }

  private mapToCapabilities(question: string, terms: TechnicalTerm[]): string[] {
    const capabilities: Set<string> = new Set();
    const questionLower = question.toLowerCase();

    // Check capability patterns
    for (const [capability, patterns] of this.capabilityPatterns) {
      for (const pattern of patterns) {
        if (questionLower.includes(pattern)) {
          capabilities.add(capability);
        }
      }
    }

    // Map technical terms to capabilities
    for (const term of terms) {
      switch (term.term) {
        case 'drupal':
          capabilities.add('drupal_expertise');
          break;
        case 'tddai':
          capabilities.add('test_generation');
          capabilities.add('code_analysis');
          break;
        case 'security':
        case 'vulnerability':
          capabilities.add('security_scan');
          break;
        case 'llm':
        case 'token':
          capabilities.add('llm_optimization');
          break;
        case 'rfp':
        case 'proposal':
          capabilities.add('rfp_processing');
          break;
      }
    }

    return Array.from(capabilities);
  }

  private determineDomain(terms: TechnicalTerm[]): string {
    const domains = {
      'drupal': 0,
      'ai_ml': 0,
      'web_development': 0,
      'devops': 0,
      'security': 0,
      'government': 0
    };

    for (const term of terms) {
      switch (term.term) {
        case 'drupal':
          domains.drupal += term.confidence;
          break;
        case 'ai':
        case 'llm':
        case 'agent':
          domains.ai_ml += term.confidence;
          break;
        case 'typescript':
        case 'javascript':
        case 'php':
          domains.web_development += term.confidence;
          break;
        case 'docker':
        case 'kubernetes':
        case 'ci/cd':
          domains.devops += term.confidence;
          break;
        case 'security':
        case 'compliance':
          domains.security += term.confidence;
          break;
        case 'rfp':
        case 'government':
          domains.government += term.confidence;
          break;
      }
    }

    // Return the domain with highest score
    return Object.entries(domains).reduce((a, b) => domains[a[0] as keyof typeof domains] > domains[b[0] as keyof typeof domains] ? a : b)[0];
  }

  private estimateTokens(question: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(question.length / 4);
  }

  private calculateConfidence(terms: TechnicalTerm[], capabilities: string[]): number {
    if (terms.length === 0 && capabilities.length === 0) {
      return 0.1;
    }

    const termConfidence = terms.length > 0
      ? terms.reduce((sum, t) => sum + t.confidence, 0) / terms.length
      : 0;

    const capabilityConfidence = capabilities.length > 0 ? 0.8 : 0.2;

    return Math.min(0.95, (termConfidence + capabilityConfidence) / 2);
  }

  private generateAnalysisId(): string {
    return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
