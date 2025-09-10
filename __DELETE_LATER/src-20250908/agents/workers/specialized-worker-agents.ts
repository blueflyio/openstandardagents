/**
 * Specialized Worker Agents - OSSA v0.1.8 Compliant
 * 
 * Collection of domain-specific worker agents optimized for specific tasks
 * with specialized capabilities, assessments, and optimization strategies.
 * 
 * Features:
 * - Code-focused agents for development tasks
 * - Document-focused agents for content creation
 * - Analysis-focused agents for research and validation
 * - Creative-focused agents for ideation and problem-solving
 * - Each with domain-specific optimization and assessment
 */

import { TokenOptimizingWorkerAgent } from './token-optimizing-worker-agent';
import { SelfAssessingWorkerAgent } from './self-assessing-worker-agent';
import { 
  WorkerTask, 
  WorkerExecutionResult, 
  WorkerConfiguration,
  WorkerCapability,
  CodeWorkerAgent as ICodeWorkerAgent,
  DocumentWorkerAgent as IDocumentWorkerAgent,
  AnalysisWorkerAgent as IAnalysisWorkerAgent,
  CreativeWorkerAgent as ICreativeWorkerAgent
} from './types';

/**
 * Code Generation and Review Worker Agent
 * Specialized for software development tasks with code-specific optimizations
 */
export class CodeWorkerAgent extends SelfAssessingWorkerAgent implements ICodeWorkerAgent {
  public specialization: 'code_generation' | 'code_review' | 'debugging' | 'refactoring';
  public supported_languages: string[];
  public framework_expertise: string[];

  constructor(
    worker_id: string,
    specialization: 'code_generation' | 'code_review' | 'debugging' | 'refactoring' = 'code_generation',
    configuration?: Partial<WorkerConfiguration>
  ) {
    super(
      worker_id,
      {
        ...configuration,
        worker_type: 'code_specialist',
        optimization_settings: {
          target_cost_reduction: 60, // High optimization for code tasks
          max_quality_trade_off: 5, // Low quality trade-off for code
          token_optimization_strategies: [
            'code_template_optimization',
            'comment_optimization',
            'identifier_compression',
            'syntax_tree_optimization',
            'documentation_pruning'
          ],
          self_assessment_frequency: 'always',
          ...configuration?.optimization_settings
        }
      }
    );

    this.specialization = specialization;
    this.supported_languages = [
      'typescript', 'javascript', 'python', 'java', 'go', 'rust', 'c++', 'c#',
      'php', 'ruby', 'swift', 'kotlin', 'scala', 'haskell', 'clojure'
    ];
    this.framework_expertise = [
      'react', 'vue', 'angular', 'node.js', 'express', 'fastapi', 'django',
      'spring', 'dotnet', 'rails', 'laravel', 'gin', 'actix-web', 'tokio'
    ];

    this.addCodeSpecificCapabilities();
    this.optimizeForCodeTasks();
  }

  async executeTask(task: WorkerTask): Promise<WorkerExecutionResult> {
    // Pre-process task for code-specific optimizations
    const code_optimized_task = await this.optimizeCodeTask(task);
    
    // Execute with specialized code assessment
    const result = await super.executeTask(code_optimized_task);
    
    // Post-process with code-specific enhancements
    return this.enhanceCodeResult(result, task);
  }

  private addCodeSpecificCapabilities(): void {
    const capabilities: WorkerCapability[] = [
      {
        id: 'code_generation',
        name: 'Code Generation',
        description: 'Generate high-quality code in multiple programming languages',
        domain: 'software_development',
        complexity_level: 'expert',
        estimated_token_cost: 300,
        quality_threshold: 0.9,
        requires_self_assessment: true,
        optimization_potential: 60
      },
      {
        id: 'code_review',
        name: 'Code Review',
        description: 'Comprehensive code review with security and performance analysis',
        domain: 'software_quality',
        complexity_level: 'expert',
        estimated_token_cost: 250,
        quality_threshold: 0.92,
        requires_self_assessment: true,
        optimization_potential: 55
      },
      {
        id: 'debugging',
        name: 'Code Debugging',
        description: 'Identify and fix bugs in code with detailed explanations',
        domain: 'problem_solving',
        complexity_level: 'expert',
        estimated_token_cost: 200,
        quality_threshold: 0.88,
        requires_self_assessment: true,
        optimization_potential: 50
      },
      {
        id: 'refactoring',
        name: 'Code Refactoring',
        description: 'Improve code structure and maintainability without changing functionality',
        domain: 'code_improvement',
        complexity_level: 'expert',
        estimated_token_cost: 275,
        quality_threshold: 0.9,
        requires_self_assessment: true,
        optimization_potential: 58
      },
      {
        id: 'architecture_design',
        name: 'Software Architecture Design',
        description: 'Design scalable and maintainable software architectures',
        domain: 'system_design',
        complexity_level: 'expert',
        estimated_token_cost: 400,
        quality_threshold: 0.85,
        requires_self_assessment: true,
        optimization_potential: 45
      }
    ];

    capabilities.forEach(capability => this.addCapability(capability));
  }

  private async optimizeCodeTask(task: WorkerTask): Promise<WorkerTask> {
    const optimized_task = { ...task };

    // Code-specific optimizations
    if (typeof task.input_data === 'string') {
      // Remove verbose comments for token optimization
      optimized_task.input_data = task.input_data
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .replace(/\/\/.*$/gm, '') // Remove line comments
        .replace(/\n\s*\n/g, '\n'); // Remove empty lines
    }

    // Add code context optimization
    if (task.context?.code_examples) {
      optimized_task.context = {
        ...task.context,
        code_examples: this.optimizeCodeExamples(task.context.code_examples)
      };
    }

    return optimized_task;
  }

  private optimizeCodeExamples(examples: any[]): any[] {
    return examples.map(example => {
      if (typeof example === 'string') {
        return example
          .replace(/\s+/g, ' ') // Normalize whitespace
          .replace(/;\s*}/g, ';}') // Compact syntax
          .trim();
      }
      return example;
    });
  }

  private async enhanceCodeResult(result: WorkerExecutionResult, original_task: WorkerTask): Promise<WorkerExecutionResult> {
    // Add code-specific metadata
    const enhanced_result = {
      ...result,
      result_data: {
        ...result.result_data,
        code_metadata: {
          language_detected: this.detectLanguage(result.result_data),
          estimated_lines: this.estimateLineCount(result.result_data),
          complexity_score: this.calculateCodeComplexity(result.result_data),
          security_score: this.assessSecurityBasics(result.result_data),
          maintainability_score: this.assessMaintainability(result.result_data)
        }
      }
    };

    return enhanced_result;
  }

  private detectLanguage(code: any): string {
    const code_text = typeof code === 'string' ? code : JSON.stringify(code);
    
    // Simple language detection heuristics
    if (code_text.includes('interface ') || code_text.includes(': string')) return 'typescript';
    if (code_text.includes('function ') && code_text.includes('=>')) return 'javascript';
    if (code_text.includes('def ') || code_text.includes('import ')) return 'python';
    if (code_text.includes('public class') || code_text.includes('System.out')) return 'java';
    if (code_text.includes('func ') || code_text.includes('package main')) return 'go';
    
    return 'unknown';
  }

  private estimateLineCount(code: any): number {
    const code_text = typeof code === 'string' ? code : JSON.stringify(code);
    return code_text.split('\n').filter(line => line.trim().length > 0).length;
  }

  private calculateCodeComplexity(code: any): number {
    const code_text = typeof code === 'string' ? code : JSON.stringify(code);
    
    // Simple cyclomatic complexity estimation
    let complexity = 1; // Base complexity
    
    // Add complexity for control structures
    complexity += (code_text.match(/\bif\b/g) || []).length;
    complexity += (code_text.match(/\bwhile\b/g) || []).length;
    complexity += (code_text.match(/\bfor\b/g) || []).length;
    complexity += (code_text.match(/\bswitch\b/g) || []).length;
    complexity += (code_text.match(/\bcatch\b/g) || []).length;
    complexity += (code_text.match(/&&|\|\|/g) || []).length;
    
    return Math.min(complexity / 10, 1.0); // Normalize to 0-1
  }

  private assessSecurityBasics(code: any): number {
    const code_text = typeof code === 'string' ? code : JSON.stringify(code);
    
    let security_score = 1.0;
    
    // Deduct for potential security issues
    if (code_text.includes('eval(')) security_score -= 0.3;
    if (code_text.includes('innerHTML')) security_score -= 0.2;
    if (code_text.includes('document.write')) security_score -= 0.2;
    if (code_text.includes('SELECT * FROM')) security_score -= 0.2;
    if (code_text.match(/password.*=.*["'][^"']*["']/i)) security_score -= 0.3;
    
    return Math.max(0, security_score);
  }

  private assessMaintainability(code: any): number {
    const code_text = typeof code === 'string' ? code : JSON.stringify(code);
    const lines = code_text.split('\n').filter(line => line.trim().length > 0);
    
    let maintainability = 0.8; // Base score
    
    // Bonus for good practices
    const comment_ratio = (code_text.match(/\/\/|\/\*/g) || []).length / lines.length;
    maintainability += Math.min(comment_ratio * 2, 0.1);
    
    // Deduct for long functions (heuristic)
    const function_matches = code_text.match(/(function|def|func)\s+\w+[^{]*{[^}]*}/g) || [];
    const long_functions = function_matches.filter(fn => fn.length > 500).length;
    maintainability -= long_functions * 0.1;
    
    return Math.max(0, Math.min(1, maintainability));
  }
}

/**
 * Document Creation and Management Worker Agent
 * Specialized for content creation, documentation, and writing tasks
 */
export class DocumentWorkerAgent extends TokenOptimizingWorkerAgent implements IDocumentWorkerAgent {
  public specialization: 'technical_writing' | 'documentation' | 'translation' | 'summarization';
  public supported_formats: string[];
  public domain_expertise: string[];

  constructor(
    worker_id: string,
    specialization: 'technical_writing' | 'documentation' | 'translation' | 'summarization' = 'documentation',
    configuration?: Partial<WorkerConfiguration>
  ) {
    super(
      worker_id,
      {
        ...configuration,
        worker_type: 'document_specialist',
        optimization_settings: {
          target_cost_reduction: 65, // High optimization for document tasks
          max_quality_trade_off: 8, // Moderate quality trade-off acceptable
          token_optimization_strategies: [
            'content_deduplication',
            'template_optimization',
            'format_compression',
            'style_normalization',
            'reference_optimization'
          ],
          self_assessment_frequency: 'always',
          ...configuration?.optimization_settings
        }
      }
    );

    this.specialization = specialization;
    this.supported_formats = [
      'markdown', 'html', 'pdf', 'docx', 'txt', 'json', 'xml', 'yaml',
      'rst', 'latex', 'confluence', 'notion', 'gitbook'
    ];
    this.domain_expertise = [
      'technical_documentation', 'api_documentation', 'user_guides',
      'tutorials', 'specifications', 'reports', 'proposals', 'articles'
    ];

    this.addDocumentSpecificCapabilities();
  }

  async executeTask(task: WorkerTask): Promise<WorkerExecutionResult> {
    // Apply document-specific preprocessing
    const doc_optimized_task = await this.optimizeDocumentTask(task);
    
    // Execute with token optimization focus
    const result = await super.executeTask(doc_optimized_task);
    
    // Post-process with document enhancements
    return this.enhanceDocumentResult(result, task);
  }

  private addDocumentSpecificCapabilities(): void {
    const capabilities: WorkerCapability[] = [
      {
        id: 'technical_writing',
        name: 'Technical Writing',
        description: 'Create clear, comprehensive technical documentation',
        domain: 'documentation',
        complexity_level: 'complex',
        estimated_token_cost: 350,
        quality_threshold: 0.88,
        requires_self_assessment: true,
        optimization_potential: 65
      },
      {
        id: 'api_documentation',
        name: 'API Documentation',
        description: 'Generate detailed API documentation with examples',
        domain: 'technical_documentation',
        complexity_level: 'complex',
        estimated_token_cost: 300,
        quality_threshold: 0.9,
        requires_self_assessment: true,
        optimization_potential: 60
      },
      {
        id: 'content_summarization',
        name: 'Content Summarization',
        description: 'Create concise summaries while preserving key information',
        domain: 'content_processing',
        complexity_level: 'moderate',
        estimated_token_cost: 150,
        quality_threshold: 0.85,
        requires_self_assessment: true,
        optimization_potential: 70
      },
      {
        id: 'multilingual_translation',
        name: 'Translation Services',
        description: 'Accurate translation maintaining context and tone',
        domain: 'localization',
        complexity_level: 'complex',
        estimated_token_cost: 250,
        quality_threshold: 0.87,
        requires_self_assessment: true,
        optimization_potential: 55
      },
      {
        id: 'content_optimization',
        name: 'Content Optimization',
        description: 'Optimize content for readability, SEO, and engagement',
        domain: 'content_enhancement',
        complexity_level: 'moderate',
        estimated_token_cost: 200,
        quality_threshold: 0.83,
        requires_self_assessment: true,
        optimization_potential: 62
      }
    ];

    capabilities.forEach(capability => this.addCapability(capability));
  }

  private async optimizeDocumentTask(task: WorkerTask): Promise<WorkerTask> {
    const optimized_task = { ...task };

    // Document-specific optimizations
    if (typeof task.input_data === 'string') {
      optimized_task.input_data = this.optimizeTextContent(task.input_data);
    }

    // Optimize context for document tasks
    if (task.context?.examples) {
      optimized_task.context = {
        ...task.context,
        examples: this.optimizeDocumentExamples(task.context.examples)
      };
    }

    return optimized_task;
  }

  private optimizeTextContent(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\.\s+/g, '. ') // Normalize sentence spacing
      .replace(/,\s+/g, ', ') // Normalize comma spacing
      .trim();
  }

  private optimizeDocumentExamples(examples: any[]): any[] {
    return examples.slice(0, 3).map(example => { // Limit examples for token optimization
      if (typeof example === 'string' && example.length > 200) {
        return example.substring(0, 200) + '...';
      }
      return example;
    });
  }

  private async enhanceDocumentResult(result: WorkerExecutionResult, original_task: WorkerTask): Promise<WorkerExecutionResult> {
    const enhanced_result = {
      ...result,
      result_data: {
        ...result.result_data,
        document_metadata: {
          format_detected: this.detectDocumentFormat(result.result_data),
          word_count: this.countWords(result.result_data),
          readability_score: this.calculateReadabilityScore(result.result_data),
          structure_score: this.assessDocumentStructure(result.result_data),
          completeness_indicators: this.assessDocumentCompleteness(result.result_data, original_task)
        }
      }
    };

    return enhanced_result;
  }

  private detectDocumentFormat(content: any): string {
    const text = typeof content === 'string' ? content : JSON.stringify(content);
    
    if (text.includes('##') || text.includes('```')) return 'markdown';
    if (text.includes('<html>') || text.includes('<div>')) return 'html';
    if (text.includes('\\section{') || text.includes('\\begin{')) return 'latex';
    if (text.includes('---\n') && text.includes('\n---')) return 'yaml-frontmatter';
    
    return 'plain_text';
  }

  private countWords(content: any): number {
    const text = typeof content === 'string' ? content : JSON.stringify(content);
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  private calculateReadabilityScore(content: any): number {
    const text = typeof content === 'string' ? content : JSON.stringify(content);
    
    // Simple readability assessment (Flesch-like)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0);
    
    if (sentences.length === 0 || words.length === 0) return 0.5;
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    
    // Simplified Flesch Reading Ease (normalized to 0-1)
    const readability = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    return Math.max(0, Math.min(1, readability / 100));
  }

  private countSyllables(word: string): number {
    // Simple syllable counting heuristic
    const vowels = 'aeiouyAEIOUY';
    let count = 0;
    let previousWasVowel = false;
    
    for (const char of word) {
      const isVowel = vowels.includes(char);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }
    
    // Handle silent e
    if (word.endsWith('e') || word.endsWith('E')) {
      count = Math.max(1, count - 1);
    }
    
    return Math.max(1, count);
  }

  private assessDocumentStructure(content: any): number {
    const text = typeof content === 'string' ? content : JSON.stringify(content);
    
    let structure_score = 0.5; // Base score
    
    // Check for headings
    if (text.match(/^#+ /gm)) structure_score += 0.2;
    
    // Check for lists
    if (text.match(/^[-*+] /gm) || text.match(/^\d+\. /gm)) structure_score += 0.15;
    
    // Check for paragraphs
    if (text.includes('\n\n')) structure_score += 0.1;
    
    // Check for code blocks or emphasis
    if (text.includes('```') || text.includes('**') || text.includes('*')) structure_score += 0.05;
    
    return Math.min(1, structure_score);
  }

  private assessDocumentCompleteness(content: any, task: WorkerTask): string[] {
    const indicators = [];
    const text = typeof content === 'string' ? content : JSON.stringify(content);
    
    // Check for introduction
    if (text.toLowerCase().includes('introduction') || text.toLowerCase().includes('overview')) {
      indicators.push('has_introduction');
    }
    
    // Check for conclusion
    if (text.toLowerCase().includes('conclusion') || text.toLowerCase().includes('summary')) {
      indicators.push('has_conclusion');
    }
    
    // Check for examples
    if (text.toLowerCase().includes('example') || text.includes('```')) {
      indicators.push('has_examples');
    }
    
    // Check task-specific requirements
    if (task.description.toLowerCase().includes('api') && text.toLowerCase().includes('endpoint')) {
      indicators.push('has_api_coverage');
    }
    
    return indicators;
  }
}

/**
 * Analysis and Research Worker Agent
 * Specialized for data analysis, research, and validation tasks
 */
export class AnalysisWorkerAgent extends SelfAssessingWorkerAgent implements IAnalysisWorkerAgent {
  public specialization: 'data_analysis' | 'research' | 'validation' | 'compliance_checking';
  public analysis_frameworks: string[];
  public domain_knowledge: string[];

  constructor(
    worker_id: string,
    specialization: 'data_analysis' | 'research' | 'validation' | 'compliance_checking' = 'research',
    configuration?: Partial<WorkerConfiguration>
  ) {
    super(
      worker_id,
      {
        ...configuration,
        worker_type: 'analysis_specialist',
        optimization_settings: {
          target_cost_reduction: 55, // Moderate optimization to maintain analytical depth
          max_quality_trade_off: 3, // Very low quality trade-off for analysis
          token_optimization_strategies: [
            'data_compression',
            'statistical_sampling',
            'reference_consolidation',
            'methodology_optimization',
            'evidence_prioritization'
          ],
          self_assessment_frequency: 'always',
          ...configuration?.optimization_settings
        }
      }
    );

    this.specialization = specialization;
    this.analysis_frameworks = [
      'statistical_analysis', 'qualitative_research', 'quantitative_analysis',
      'comparative_analysis', 'trend_analysis', 'risk_assessment', 'cost_benefit_analysis'
    ];
    this.domain_knowledge = [
      'business_intelligence', 'market_research', 'financial_analysis',
      'technical_evaluation', 'compliance_frameworks', 'regulatory_standards'
    ];

    this.addAnalysisSpecificCapabilities();
  }

  async executeTask(task: WorkerTask): Promise<WorkerExecutionResult> {
    // Apply analysis-specific preprocessing
    const analysis_optimized_task = await this.optimizeAnalysisTask(task);
    
    // Execute with enhanced self-assessment
    const result = await super.executeTask(analysis_optimized_task);
    
    // Post-process with analysis enhancements
    return this.enhanceAnalysisResult(result, task);
  }

  private addAnalysisSpecificCapabilities(): void {
    const capabilities: WorkerCapability[] = [
      {
        id: 'comprehensive_research',
        name: 'Comprehensive Research',
        description: 'Conduct thorough research with source validation',
        domain: 'research',
        complexity_level: 'expert',
        estimated_token_cost: 400,
        quality_threshold: 0.92,
        requires_self_assessment: true,
        optimization_potential: 50
      },
      {
        id: 'data_analysis',
        name: 'Data Analysis',
        description: 'Statistical and qualitative data analysis with insights',
        domain: 'analytics',
        complexity_level: 'expert',
        estimated_token_cost: 350,
        quality_threshold: 0.9,
        requires_self_assessment: true,
        optimization_potential: 55
      },
      {
        id: 'compliance_validation',
        name: 'Compliance Validation',
        description: 'Validate against regulatory and compliance frameworks',
        domain: 'compliance',
        complexity_level: 'expert',
        estimated_token_cost: 300,
        quality_threshold: 0.95,
        requires_self_assessment: true,
        optimization_potential: 45
      },
      {
        id: 'comparative_analysis',
        name: 'Comparative Analysis',
        description: 'Compare and contrast multiple options with recommendations',
        domain: 'evaluation',
        complexity_level: 'complex',
        estimated_token_cost: 325,
        quality_threshold: 0.88,
        requires_self_assessment: true,
        optimization_potential: 52
      }
    ];

    capabilities.forEach(capability => this.addCapability(capability));
  }

  private async optimizeAnalysisTask(task: WorkerTask): Promise<WorkerTask> {
    const optimized_task = { ...task };

    // Analysis-specific optimizations while preserving data integrity
    if (task.context?.data_sources) {
      optimized_task.context = {
        ...task.context,
        data_sources: this.optimizeDataSources(task.context.data_sources)
      };
    }

    return optimized_task;
  }

  private optimizeDataSources(sources: any[]): any[] {
    // Prioritize and limit data sources for token optimization
    return sources
      .sort((a, b) => (b.priority || 0) - (a.priority || 0)) // Sort by priority
      .slice(0, 10) // Limit to top 10 sources
      .map(source => ({
        ...source,
        description: source.description?.substring(0, 200) // Truncate descriptions
      }));
  }

  private async enhanceAnalysisResult(result: WorkerExecutionResult, original_task: WorkerTask): Promise<WorkerExecutionResult> {
    const enhanced_result = {
      ...result,
      result_data: {
        ...result.result_data,
        analysis_metadata: {
          methodology_used: this.identifyMethodology(result.result_data),
          evidence_strength: this.assessEvidenceStrength(result.result_data),
          bias_assessment: this.assessPotentialBias(result.result_data),
          confidence_intervals: this.estimateConfidenceIntervals(result.result_data),
          recommendations_quality: this.assessRecommendationsQuality(result.result_data),
          validation_checkpoints: this.identifyValidationPoints(result.result_data)
        }
      }
    };

    return enhanced_result;
  }

  private identifyMethodology(analysis: any): string[] {
    const text = typeof analysis === 'string' ? analysis : JSON.stringify(analysis);
    const methodologies = [];

    if (text.includes('statistical') || text.includes('correlation')) methodologies.push('statistical_analysis');
    if (text.includes('qualitative') || text.includes('interview')) methodologies.push('qualitative_research');
    if (text.includes('comparative') || text.includes('versus')) methodologies.push('comparative_analysis');
    if (text.includes('trend') || text.includes('over time')) methodologies.push('trend_analysis');
    if (text.includes('risk') || text.includes('probability')) methodologies.push('risk_assessment');

    return methodologies;
  }

  private assessEvidenceStrength(analysis: any): number {
    const text = typeof analysis === 'string' ? analysis : JSON.stringify(analysis);
    
    let strength = 0.5; // Base strength
    
    // Check for citations and references
    if (text.match(/\[\d+\]/) || text.includes('according to')) strength += 0.2;
    
    // Check for data points
    if (text.match(/\d+%|\d+\.\d+/)) strength += 0.15;
    
    // Check for multiple sources
    if (text.includes('multiple') || text.includes('various sources')) strength += 0.1;
    
    // Check for methodology description
    if (text.includes('methodology') || text.includes('approach')) strength += 0.05;
    
    return Math.min(1, strength);
  }

  private assessPotentialBias(analysis: any): string[] {
    const text = typeof analysis === 'string' ? analysis : JSON.stringify(analysis);
    const potential_biases = [];

    // Check for absolute statements
    if (text.includes('always') || text.includes('never') || text.includes('all ')) {
      potential_biases.push('absolute_statements');
    }

    // Check for emotional language
    if (text.match(/\b(amazing|terrible|awful|fantastic)\b/i)) {
      potential_biases.push('emotional_language');
    }

    // Check for single source dependency
    if (!text.includes('multiple') && !text.includes('various')) {
      potential_biases.push('limited_sources');
    }

    return potential_biases;
  }

  private estimateConfidenceIntervals(analysis: any): { low: number; high: number } {
    // Simple confidence estimation based on analysis characteristics
    const text = typeof analysis === 'string' ? analysis : JSON.stringify(analysis);
    
    let confidence = 0.8; // Base confidence
    
    if (text.includes('uncertain') || text.includes('unclear')) confidence -= 0.2;
    if (text.includes('data shows') || text.includes('evidence indicates')) confidence += 0.1;
    
    const margin = 0.1;
    return {
      low: Math.max(0, confidence - margin),
      high: Math.min(1, confidence + margin)
    };
  }

  private assessRecommendationsQuality(analysis: any): number {
    const text = typeof analysis === 'string' ? analysis : JSON.stringify(analysis);
    
    let quality = 0.6; // Base quality
    
    // Check for specific recommendations
    if (text.includes('recommend') || text.includes('suggest')) quality += 0.2;
    
    // Check for prioritization
    if (text.includes('priority') || text.includes('first')) quality += 0.1;
    
    // Check for actionability
    if (text.includes('implement') || text.includes('execute')) quality += 0.1;
    
    return Math.min(1, quality);
  }

  private identifyValidationPoints(analysis: any): string[] {
    const text = typeof analysis === 'string' ? analysis : JSON.stringify(analysis);
    const validation_points = [];

    if (text.includes('verified') || text.includes('confirmed')) {
      validation_points.push('evidence_verification');
    }

    if (text.includes('cross-referenced') || text.includes('multiple sources')) {
      validation_points.push('source_triangulation');
    }

    if (text.includes('methodology') || text.includes('systematic')) {
      validation_points.push('methodological_rigor');
    }

    return validation_points;
  }
}

/**
 * Creative Problem-Solving Worker Agent
 * Specialized for ideation, brainstorming, and creative tasks
 */
export class CreativeWorkerAgent extends TokenOptimizingWorkerAgent implements ICreativeWorkerAgent {
  public specialization: 'content_creation' | 'design' | 'brainstorming' | 'problem_solving';
  public creative_domains: string[];
  public style_preferences: string[];

  constructor(
    worker_id: string,
    specialization: 'content_creation' | 'design' | 'brainstorming' | 'problem_solving' = 'brainstorming',
    configuration?: Partial<WorkerConfiguration>
  ) {
    super(
      worker_id,
      {
        ...configuration,
        worker_type: 'creative_specialist',
        optimization_settings: {
          target_cost_reduction: 60, // Good optimization while preserving creativity
          max_quality_trade_off: 12, // Higher trade-off acceptable for creative tasks
          token_optimization_strategies: [
            'creative_template_optimization',
            'idea_deduplication',
            'concept_compression',
            'style_normalization',
            'inspiration_caching'
          ],
          self_assessment_frequency: 'periodic', // Less frequent for creative flow
          ...configuration?.optimization_settings
        }
      }
    );

    this.specialization = specialization;
    this.creative_domains = [
      'marketing', 'advertising', 'product_design', 'user_experience',
      'content_strategy', 'brand_development', 'innovation_consulting'
    ];
    this.style_preferences = [
      'minimalist', 'modern', 'classic', 'innovative', 'professional',
      'casual', 'technical', 'artistic', 'business_oriented'
    ];

    this.addCreativeSpecificCapabilities();
  }

  async executeTask(task: WorkerTask): Promise<WorkerExecutionResult> {
    // Apply creative-specific preprocessing
    const creative_optimized_task = await this.optimizeCreativeTask(task);
    
    // Execute with creative token optimization
    const result = await super.executeTask(creative_optimized_task);
    
    // Post-process with creative enhancements
    return this.enhanceCreativeResult(result, task);
  }

  private addCreativeSpecificCapabilities(): void {
    const capabilities: WorkerCapability[] = [
      {
        id: 'creative_brainstorming',
        name: 'Creative Brainstorming',
        description: 'Generate innovative ideas and creative solutions',
        domain: 'ideation',
        complexity_level: 'complex',
        estimated_token_cost: 250,
        quality_threshold: 0.8,
        requires_self_assessment: false,
        optimization_potential: 65
      },
      {
        id: 'content_creation',
        name: 'Creative Content Creation',
        description: 'Create engaging and original content across formats',
        domain: 'content',
        complexity_level: 'complex',
        estimated_token_cost: 300,
        quality_threshold: 0.82,
        requires_self_assessment: true,
        optimization_potential: 60
      },
      {
        id: 'design_ideation',
        name: 'Design Ideation',
        description: 'Generate design concepts and visual solutions',
        domain: 'design',
        complexity_level: 'complex',
        estimated_token_cost: 275,
        quality_threshold: 0.78,
        requires_self_assessment: false,
        optimization_potential: 58
      },
      {
        id: 'problem_solving',
        name: 'Creative Problem Solving',
        description: 'Innovative approaches to complex problems',
        domain: 'innovation',
        complexity_level: 'expert',
        estimated_token_cost: 350,
        quality_threshold: 0.85,
        requires_self_assessment: true,
        optimization_potential: 55
      }
    ];

    capabilities.forEach(capability => this.addCapability(capability));
  }

  private async optimizeCreativeTask(task: WorkerTask): Promise<WorkerTask> {
    const optimized_task = { ...task };

    // Creative-specific optimizations that preserve essence
    if (task.context?.inspiration_sources) {
      optimized_task.context = {
        ...task.context,
        inspiration_sources: this.optimizeInspirationSources(task.context.inspiration_sources)
      };
    }

    // Optimize creative constraints
    if (task.context?.creative_constraints) {
      optimized_task.context = {
        ...task.context,
        creative_constraints: this.optimizeCreativeConstraints(task.context.creative_constraints)
      };
    }

    return optimized_task;
  }

  private optimizeInspirationSources(sources: any[]): any[] {
    // Select diverse, high-impact inspiration sources
    return sources
      .sort((a, b) => (b.impact_score || 0) - (a.impact_score || 0))
      .slice(0, 8) // Limit for token optimization
      .map(source => ({
        ...source,
        description: source.description?.substring(0, 150) // Truncate descriptions
      }));
  }

  private optimizeCreativeConstraints(constraints: any): any {
    // Preserve essential constraints while optimizing representation
    return {
      ...constraints,
      style_guide: constraints.style_guide?.substring(0, 300),
      brand_guidelines: constraints.brand_guidelines?.substring(0, 200)
    };
  }

  private async enhanceCreativeResult(result: WorkerExecutionResult, original_task: WorkerTask): Promise<WorkerExecutionResult> {
    const enhanced_result = {
      ...result,
      result_data: {
        ...result.result_data,
        creative_metadata: {
          originality_score: this.assessOriginality(result.result_data),
          creativity_indicators: this.identifyCreativityIndicators(result.result_data),
          style_analysis: this.analyzeStyle(result.result_data),
          engagement_potential: this.assessEngagementPotential(result.result_data),
          concept_diversity: this.assessConceptDiversity(result.result_data),
          implementation_feasibility: this.assessImplementationFeasibility(result.result_data)
        }
      }
    };

    return enhanced_result;
  }

  private assessOriginality(creative_output: any): number {
    const text = typeof creative_output === 'string' ? creative_output : JSON.stringify(creative_output);
    
    // Simple originality heuristics
    let originality = 0.7; // Base score
    
    // Check for unique combinations
    const unique_phrases = text.match(/\b\w+[-_]\w+\b/g) || [];
    originality += Math.min(unique_phrases.length * 0.02, 0.15);
    
    // Check for creative metaphors or analogies
    if (text.includes('like') || text.includes('as if') || text.includes('imagine')) {
      originality += 0.1;
    }
    
    // Check for novel concepts
    if (text.includes('innovative') || text.includes('unique') || text.includes('new approach')) {
      originality += 0.05;
    }
    
    return Math.min(1, originality);
  }

  private identifyCreativityIndicators(output: any): string[] {
    const text = typeof output === 'string' ? output : JSON.stringify(output);
    const indicators = [];

    if (text.includes('innovative') || text.includes('groundbreaking')) {
      indicators.push('innovation_language');
    }

    if (text.match(/\b\w+ing\b.*\b\w+ing\b/)) { // Action word combinations
      indicators.push('dynamic_language');
    }

    if (text.includes('what if') || text.includes('imagine')) {
      indicators.push('hypothetical_thinking');
    }

    if (text.match(/\d+.*ideas?|\d+.*concepts?/)) {
      indicators.push('idea_generation');
    }

    return indicators;
  }

  private analyzeStyle(output: any): { tone: string; formality: string; creativity_level: string } {
    const text = typeof output === 'string' ? output : JSON.stringify(output);
    
    // Simple style analysis
    let tone = 'neutral';
    if (text.includes('exciting') || text.includes('amazing')) tone = 'enthusiastic';
    if (text.includes('professional') || text.includes('enterprise')) tone = 'business';
    
    let formality = 'moderate';
    if (text.includes('shall') || text.includes('wherein')) formality = 'formal';
    if (text.includes("it's") || text.includes("we'll")) formality = 'casual';
    
    let creativity_level = 'standard';
    const creative_words = (text.match(/\b(creative|innovative|unique|original|breakthrough)\b/gi) || []).length;
    if (creative_words > 2) creativity_level = 'high';
    if (creative_words === 0) creativity_level = 'low';
    
    return { tone, formality, creativity_level };
  }

  private assessEngagementPotential(output: any): number {
    const text = typeof output === 'string' ? output : JSON.stringify(output);
    
    let engagement = 0.6; // Base score
    
    // Check for questions
    const questions = (text.match(/\?/g) || []).length;
    engagement += Math.min(questions * 0.05, 0.2);
    
    // Check for calls to action
    if (text.includes('try') || text.includes('explore') || text.includes('discover')) {
      engagement += 0.1;
    }
    
    // Check for emotional language
    const emotion_words = (text.match(/\b(love|hate|excited|frustrated|amazing|terrible)\b/gi) || []).length;
    engagement += Math.min(emotion_words * 0.03, 0.1);
    
    return Math.min(1, engagement);
  }

  private assessConceptDiversity(output: any): number {
    const text = typeof output === 'string' ? output : JSON.stringify(output);
    
    // Count distinct concept areas mentioned
    const concept_areas = new Set();
    
    const business_terms = ['market', 'customer', 'revenue', 'strategy'];
    const tech_terms = ['digital', 'platform', 'system', 'technology'];
    const design_terms = ['visual', 'aesthetic', 'layout', 'color'];
    const social_terms = ['community', 'social', 'engagement', 'interaction'];
    
    [business_terms, tech_terms, design_terms, social_terms].forEach((terms, index) => {
      if (terms.some(term => text.toLowerCase().includes(term))) {
        concept_areas.add(index);
      }
    });
    
    return concept_areas.size / 4; // Normalize to 0-1
  }

  private assessImplementationFeasibility(output: any): number {
    const text = typeof output === 'string' ? output : JSON.stringify(output);
    
    let feasibility = 0.7; // Base score
    
    // Check for practical considerations
    if (text.includes('budget') || text.includes('cost') || text.includes('resource')) {
      feasibility += 0.1;
    }
    
    // Check for timeline mentions
    if (text.includes('timeline') || text.includes('phase') || text.includes('step')) {
      feasibility += 0.1;
    }
    
    // Check for constraints acknowledgment
    if (text.includes('constraint') || text.includes('limitation') || text.includes('requirement')) {
      feasibility += 0.1;
    }
    
    return Math.min(1, feasibility);
  }
}

/**
 * Factory for creating specialized worker agents
 */
export class SpecializedWorkerAgentFactory {
  static createCodeWorker(
    worker_id: string,
    specialization?: 'code_generation' | 'code_review' | 'debugging' | 'refactoring',
    configuration?: Partial<WorkerConfiguration>
  ): CodeWorkerAgent {
    return new CodeWorkerAgent(worker_id, specialization, configuration);
  }

  static createDocumentWorker(
    worker_id: string,
    specialization?: 'technical_writing' | 'documentation' | 'translation' | 'summarization',
    configuration?: Partial<WorkerConfiguration>
  ): DocumentWorkerAgent {
    return new DocumentWorkerAgent(worker_id, specialization, configuration);
  }

  static createAnalysisWorker(
    worker_id: string,
    specialization?: 'data_analysis' | 'research' | 'validation' | 'compliance_checking',
    configuration?: Partial<WorkerConfiguration>
  ): AnalysisWorkerAgent {
    return new AnalysisWorkerAgent(worker_id, specialization, configuration);
  }

  static createCreativeWorker(
    worker_id: string,
    specialization?: 'content_creation' | 'design' | 'brainstorming' | 'problem_solving',
    configuration?: Partial<WorkerConfiguration>
  ): CreativeWorkerAgent {
    return new CreativeWorkerAgent(worker_id, specialization, configuration);
  }
}

// Export specialized worker agents
export const SpecializedWorkerAgents = {
  CodeWorkerAgent,
  DocumentWorkerAgent,
  AnalysisWorkerAgent,
  CreativeWorkerAgent,
  SpecializedWorkerAgentFactory
};