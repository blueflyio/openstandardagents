/**
 * OSSA Error Classification and Handling Strategies
 * Advanced error classification, handling policies, and recovery strategies
 */

import { EventEmitter } from 'events';

export enum ErrorCategory {
  TRANSIENT = 'transient',           // Temporary errors that may resolve
  PERMANENT = 'permanent',           // Persistent errors that won't resolve
  TIMEOUT = 'timeout',               // Timeout-related errors
  AUTHENTICATION = 'authentication', // Auth/authorization errors
  RATE_LIMITING = 'rate-limiting',   // Rate limiting errors
  NETWORK = 'network',               // Network connectivity errors
  VALIDATION = 'validation',         // Input validation errors
  RESOURCE = 'resource',             // Resource exhaustion errors
  CONFIGURATION = 'configuration',   // Configuration/setup errors
  UNKNOWN = 'unknown'                // Unclassified errors
}

export enum ErrorSeverity {
  LOW = 'low',           // Minor impact, degraded performance
  MEDIUM = 'medium',     // Moderate impact, some functionality affected
  HIGH = 'high',         // Major impact, critical functionality affected
  CRITICAL = 'critical'  // Severe impact, system failure
}

export enum HandlingStrategy {
  RETRY = 'retry',                   // Retry the operation
  FAILOVER = 'failover',             // Switch to alternative service
  FALLBACK = 'fallback',             // Use fallback logic
  CIRCUIT_BREAK = 'circuit-break',   // Open circuit breaker
  ESCALATE = 'escalate',             // Escalate to higher authority
  IGNORE = 'ignore',                 // Ignore the error
  LOG_AND_CONTINUE = 'log-continue', // Log error and continue
  ABORT = 'abort'                    // Abort the operation
}

export interface ErrorPattern {
  name: string;
  messagePattern?: RegExp;           // Regex pattern for error message
  codePattern?: RegExp;              // Regex pattern for error code
  typePattern?: RegExp;              // Regex pattern for error type/name
  httpStatusCodes?: number[];        // HTTP status codes
  customMatcher?: (error: Error) => boolean; // Custom matching function
  category: ErrorCategory;
  severity: ErrorSeverity;
  strategy: HandlingStrategy;
  retryable: boolean;
  maxRetries?: number;
  retryDelay?: number;
  metadata?: Record<string, any>;
}

export interface ErrorContext {
  operationName: string;
  operationId: string;
  timestamp: Date;
  attempt: number;
  totalAttempts: number;
  duration: number;
  metadata?: Record<string, any>;
  stackTrace?: string;
  userContext?: {
    userId?: string;
    sessionId?: string;
    requestId?: string;
  };
}

export interface ClassificationResult {
  pattern: ErrorPattern;
  category: ErrorCategory;
  severity: ErrorSeverity;
  strategy: HandlingStrategy;
  retryable: boolean;
  confidence: number;              // Confidence score (0-1)
  reasoning: string;               // Why this classification was chosen
  recommendations: string[];       // Recommended actions
}

export interface ErrorReport {
  error: Error;
  context: ErrorContext;
  classification: ClassificationResult;
  handlingActions: HandlingAction[];
  resolved: boolean;
  resolutionTime?: number;
  escalated: boolean;
  correlationId: string;
}

export interface HandlingAction {
  strategy: HandlingStrategy;
  executed: boolean;
  success: boolean;
  timestamp: Date;
  duration?: number;
  result?: any;
  error?: Error;
  metadata?: Record<string, any>;
}

export interface ErrorStatistics {
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorsByStrategy: Record<HandlingStrategy, number>;
  averageResolutionTime: number;
  mostCommonErrors: Array<{ pattern: string; count: number }>;
  escalationRate: number;
  retrySuccessRate: number;
  lastUpdated: Date;
}

export class ErrorClassifier extends EventEmitter {
  private patterns: Map<string, ErrorPattern> = new Map();
  private statistics: ErrorStatistics;
  private errorHistory: ErrorReport[] = [];
  private readonly maxHistorySize = 1000;

  constructor() {
    super();
    this.statistics = this.initializeStatistics();
    this.registerDefaultPatterns();
  }

  /**
   * Register error pattern for classification
   */
  registerPattern(pattern: ErrorPattern): void {
    this.patterns.set(pattern.name, pattern);
    this.emit('patternRegistered', { patternName: pattern.name });
  }

  /**
   * Remove error pattern
   */
  removePattern(patternName: string): void {
    this.patterns.delete(patternName);
    this.emit('patternRemoved', { patternName });
  }

  /**
   * Classify error and return handling strategy
   */
  classify(error: Error, context: ErrorContext): ClassificationResult {
    const matchingPatterns = this.findMatchingPatterns(error);
    
    if (matchingPatterns.length === 0) {
      return this.createDefaultClassification(error);
    }

    // Select best matching pattern
    const bestPattern = this.selectBestPattern(matchingPatterns, error, context);
    
    const result: ClassificationResult = {
      pattern: bestPattern,
      category: bestPattern.category,
      severity: bestPattern.severity,
      strategy: bestPattern.strategy,
      retryable: bestPattern.retryable,
      confidence: this.calculateConfidence(bestPattern, error, context),
      reasoning: this.generateReasoning(bestPattern, error),
      recommendations: this.generateRecommendations(bestPattern, context)
    };

    this.emit('errorClassified', { error, context, classification: result });
    return result;
  }

  /**
   * Handle error based on classification
   */
  async handleError(
    error: Error,
    context: ErrorContext,
    classification?: ClassificationResult
  ): Promise<ErrorReport> {
    if (!classification) {
      classification = this.classify(error, context);
    }

    const correlationId = this.generateCorrelationId();
    const report: ErrorReport = {
      error,
      context,
      classification,
      handlingActions: [],
      resolved: false,
      escalated: false,
      correlationId
    };

    const startTime = Date.now();

    try {
      // Execute handling strategy
      const action = await this.executeHandlingStrategy(
        classification.strategy,
        error,
        context,
        classification
      );
      
      report.handlingActions.push(action);
      report.resolved = action.success;
      report.resolutionTime = Date.now() - startTime;

      // If primary strategy failed, try fallback strategies
      if (!action.success && classification.retryable) {
        const fallbackActions = await this.executeFallbackStrategies(
          error,
          context,
          classification
        );
        
        report.handlingActions.push(...fallbackActions);
        report.resolved = fallbackActions.some(a => a.success);
      }

      // Escalate if not resolved and severity is high
      if (!report.resolved && 
          (classification.severity === ErrorSeverity.HIGH || 
           classification.severity === ErrorSeverity.CRITICAL)) {
        
        const escalationAction = await this.escalateError(report);
        report.handlingActions.push(escalationAction);
        report.escalated = true;
      }

    } catch (handlingError) {
      this.emit('handlingFailed', { 
        originalError: error, 
        handlingError, 
        context 
      });
    }

    // Record in history and update statistics
    this.recordError(report);
    this.updateStatistics(report);

    this.emit('errorHandled', report);
    return report;
  }

  /**
   * Get error statistics
   */
  getStatistics(): ErrorStatistics {
    return { ...this.statistics };
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 50): ErrorReport[] {
    return this.errorHistory
      .slice(-limit)
      .sort((a, b) => b.context.timestamp.getTime() - a.context.timestamp.getTime());
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category: ErrorCategory): ErrorReport[] {
    return this.errorHistory.filter(report => 
      report.classification.category === category
    );
  }

  /**
   * Analyze error trends
   */
  analyzeErrorTrends(timeWindowMs: number = 3600000): ErrorTrendAnalysis {
    const cutoff = new Date(Date.now() - timeWindowMs);
    const recentErrors = this.errorHistory.filter(report => 
      report.context.timestamp >= cutoff
    );

    const categoryTrends = this.calculateCategoryTrends(recentErrors);
    const severityTrends = this.calculateSeverityTrends(recentErrors);
    const patternTrends = this.calculatePatternTrends(recentErrors);

    return {
      timeWindow: timeWindowMs,
      totalErrors: recentErrors.length,
      errorRate: recentErrors.length / (timeWindowMs / 1000), // errors per second
      categoryTrends,
      severityTrends,
      patternTrends,
      recommendations: this.generateTrendRecommendations(recentErrors)
    };
  }

  /**
   * Find matching error patterns
   */
  private findMatchingPatterns(error: Error): ErrorPattern[] {
    const matches: ErrorPattern[] = [];

    for (const pattern of this.patterns.values()) {
      if (this.patternMatches(pattern, error)) {
        matches.push(pattern);
      }
    }

    return matches;
  }

  /**
   * Check if pattern matches error
   */
  private patternMatches(pattern: ErrorPattern, error: Error): boolean {
    // Custom matcher takes precedence
    if (pattern.customMatcher) {
      return pattern.customMatcher(error);
    }

    // Check message pattern
    if (pattern.messagePattern && !pattern.messagePattern.test(error.message)) {
      return false;
    }

    // Check type pattern
    if (pattern.typePattern && !pattern.typePattern.test(error.name || error.constructor.name)) {
      return false;
    }

    // Check HTTP status codes (if error has status)
    if (pattern.httpStatusCodes && 'status' in error) {
      const status = (error as any).status || (error as any).statusCode;
      if (status && !pattern.httpStatusCodes.includes(status)) {
        return false;
      }
    }

    // Check error code pattern
    if (pattern.codePattern && 'code' in error) {
      const code = (error as any).code;
      if (code && !pattern.codePattern.test(String(code))) {
        return false;
      }
    }

    return true;
  }

  /**
   * Select best matching pattern from multiple matches
   */
  private selectBestPattern(
    patterns: ErrorPattern[],
    error: Error,
    context: ErrorContext
  ): ErrorPattern {
    // Sort by specificity (more specific patterns have higher scores)
    const scored = patterns.map(pattern => ({
      pattern,
      score: this.calculatePatternScore(pattern, error, context)
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored[0].pattern;
  }

  /**
   * Calculate pattern specificity score
   */
  private calculatePatternScore(pattern: ErrorPattern, error: Error, context: ErrorContext): number {
    let score = 0;

    // Custom matcher gets high score
    if (pattern.customMatcher) score += 10;
    
    // Specific message patterns get higher scores
    if (pattern.messagePattern) {
      score += 5;
      if (pattern.messagePattern.source.length > 10) score += 2; // More specific regex
    }

    // Type patterns add score
    if (pattern.typePattern) score += 3;

    // HTTP status codes add score
    if (pattern.httpStatusCodes) score += 2;

    // Code patterns add score
    if (pattern.codePattern) score += 2;

    return score;
  }

  /**
   * Calculate confidence in classification
   */
  private calculateConfidence(
    pattern: ErrorPattern,
    error: Error,
    context: ErrorContext
  ): number {
    let confidence = 0.5; // Base confidence

    // Higher confidence for custom matchers
    if (pattern.customMatcher) confidence += 0.3;

    // Higher confidence for specific patterns
    if (pattern.messagePattern) confidence += 0.2;
    if (pattern.typePattern) confidence += 0.1;
    if (pattern.httpStatusCodes) confidence += 0.1;

    // Historical accuracy could boost confidence here
    // This would require tracking pattern accuracy over time

    return Math.min(1.0, confidence);
  }

  /**
   * Generate reasoning for classification
   */
  private generateReasoning(pattern: ErrorPattern, error: Error): string {
    const reasons: string[] = [];

    if (pattern.messagePattern) {
      reasons.push(`Error message matches pattern: ${pattern.messagePattern.source}`);
    }

    if (pattern.typePattern) {
      reasons.push(`Error type matches pattern: ${pattern.typePattern.source}`);
    }

    if (pattern.httpStatusCodes && 'status' in error) {
      const status = (error as any).status || (error as any).statusCode;
      if (status) {
        reasons.push(`HTTP status code ${status} matches allowed codes`);
      }
    }

    if (pattern.customMatcher) {
      reasons.push('Custom matcher function returned true');
    }

    return reasons.join('; ') || 'Default classification applied';
  }

  /**
   * Generate recommendations based on pattern
   */
  private generateRecommendations(
    pattern: ErrorPattern,
    context: ErrorContext
  ): string[] {
    const recommendations: string[] = [];

    switch (pattern.strategy) {
      case HandlingStrategy.RETRY:
        recommendations.push(`Retry operation up to ${pattern.maxRetries || 3} times`);
        if (pattern.retryDelay) {
          recommendations.push(`Wait ${pattern.retryDelay}ms between retries`);
        }
        break;

      case HandlingStrategy.FAILOVER:
        recommendations.push('Switch to alternative service or endpoint');
        break;

      case HandlingStrategy.FALLBACK:
        recommendations.push('Use fallback logic or cached data');
        break;

      case HandlingStrategy.CIRCUIT_BREAK:
        recommendations.push('Open circuit breaker to prevent cascade failures');
        break;

      case HandlingStrategy.ESCALATE:
        recommendations.push('Escalate to operations team or higher authority');
        break;

      case HandlingStrategy.IGNORE:
        recommendations.push('Error can be safely ignored');
        break;

      case HandlingStrategy.LOG_AND_CONTINUE:
        recommendations.push('Log error details and continue operation');
        break;

      case HandlingStrategy.ABORT:
        recommendations.push('Abort operation immediately');
        break;
    }

    // Add severity-specific recommendations
    switch (pattern.severity) {
      case ErrorSeverity.CRITICAL:
        recommendations.push('Consider activating incident response procedures');
        break;
      case ErrorSeverity.HIGH:
        recommendations.push('Monitor closely for related issues');
        break;
    }

    return recommendations;
  }

  /**
   * Execute handling strategy
   */
  private async executeHandlingStrategy(
    strategy: HandlingStrategy,
    error: Error,
    context: ErrorContext,
    classification: ClassificationResult
  ): Promise<HandlingAction> {
    const action: HandlingAction = {
      strategy,
      executed: true,
      success: false,
      timestamp: new Date()
    };

    const startTime = Date.now();

    try {
      switch (strategy) {
        case HandlingStrategy.RETRY:
          action.success = await this.executeRetry(error, context, classification);
          break;

        case HandlingStrategy.FAILOVER:
          action.success = await this.executeFailover(error, context, classification);
          break;

        case HandlingStrategy.FALLBACK:
          action.success = await this.executeFallback(error, context, classification);
          break;

        case HandlingStrategy.CIRCUIT_BREAK:
          action.success = await this.executeCircuitBreak(error, context, classification);
          break;

        case HandlingStrategy.ESCALATE:
          action.success = await this.executeEscalate(error, context, classification);
          break;

        case HandlingStrategy.IGNORE:
          action.success = true; // Ignoring is always "successful"
          break;

        case HandlingStrategy.LOG_AND_CONTINUE:
          action.success = await this.executeLogAndContinue(error, context, classification);
          break;

        case HandlingStrategy.ABORT:
          action.success = true; // Aborting is the intended action
          break;
      }
    } catch (executionError) {
      action.error = executionError as Error;
      action.success = false;
    }

    action.duration = Date.now() - startTime;
    return action;
  }

  /**
   * Execute fallback strategies
   */
  private async executeFallbackStrategies(
    error: Error,
    context: ErrorContext,
    classification: ClassificationResult
  ): Promise<HandlingAction[]> {
    const fallbackStrategies = [
      HandlingStrategy.FALLBACK,
      HandlingStrategy.LOG_AND_CONTINUE
    ];

    const actions: HandlingAction[] = [];

    for (const strategy of fallbackStrategies) {
      if (strategy !== classification.strategy) {
        const action = await this.executeHandlingStrategy(
          strategy,
          error,
          context,
          classification
        );
        actions.push(action);

        if (action.success) {
          break; // Stop trying fallbacks if one succeeds
        }
      }
    }

    return actions;
  }

  // Strategy execution methods (simplified implementations)
  private async executeRetry(error: Error, context: ErrorContext, classification: ClassificationResult): Promise<boolean> {
    // Implementation would integrate with retry policy
    this.emit('retryExecuted', { error, context });
    return Math.random() > 0.3; // Simulate retry success
  }

  private async executeFailover(error: Error, context: ErrorContext, classification: ClassificationResult): Promise<boolean> {
    // Implementation would switch to alternative service
    this.emit('failoverExecuted', { error, context });
    return Math.random() > 0.2; // Simulate failover success
  }

  private async executeFallback(error: Error, context: ErrorContext, classification: ClassificationResult): Promise<boolean> {
    // Implementation would use fallback logic
    this.emit('fallbackExecuted', { error, context });
    return Math.random() > 0.1; // Simulate fallback success
  }

  private async executeCircuitBreak(error: Error, context: ErrorContext, classification: ClassificationResult): Promise<boolean> {
    // Implementation would open circuit breaker
    this.emit('circuitBreakExecuted', { error, context });
    return true; // Circuit breaking is always successful as an action
  }

  private async executeEscalate(error: Error, context: ErrorContext, classification: ClassificationResult): Promise<boolean> {
    // Implementation would escalate to operations
    this.emit('escalationExecuted', { error, context });
    return true; // Escalation is always successful as an action
  }

  private async executeLogAndContinue(error: Error, context: ErrorContext, classification: ClassificationResult): Promise<boolean> {
    // Implementation would log error
    console.error(`[${classification.severity.toUpperCase()}] ${classification.category}:`, error.message);
    this.emit('errorLogged', { error, context, classification });
    return true; // Logging is always successful
  }

  /**
   * Escalate error to higher authority
   */
  private async escalateError(report: ErrorReport): Promise<HandlingAction> {
    const action: HandlingAction = {
      strategy: HandlingStrategy.ESCALATE,
      executed: true,
      success: true,
      timestamp: new Date(),
      metadata: {
        escalationReason: 'Unresolved error with high severity',
        originalStrategy: report.classification.strategy
      }
    };

    this.emit('errorEscalated', report);
    return action;
  }

  /**
   * Create default classification for unrecognized errors
   */
  private createDefaultClassification(error: Error): ClassificationResult {
    return {
      pattern: {
        name: 'default-unknown',
        category: ErrorCategory.UNKNOWN,
        severity: ErrorSeverity.MEDIUM,
        strategy: HandlingStrategy.LOG_AND_CONTINUE,
        retryable: false
      },
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      strategy: HandlingStrategy.LOG_AND_CONTINUE,
      retryable: false,
      confidence: 0.1,
      reasoning: 'No matching error pattern found',
      recommendations: ['Review error pattern and consider adding classification rule']
    };
  }

  /**
   * Generate correlation ID for error tracking
   */
  private generateCorrelationId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Record error in history
   */
  private recordError(report: ErrorReport): void {
    this.errorHistory.push(report);
    
    // Maintain history size limit
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }
  }

  /**
   * Update error statistics
   */
  private updateStatistics(report: ErrorReport): void {
    this.statistics.totalErrors++;
    this.statistics.errorsByCategory[report.classification.category]++;
    this.statistics.errorsBySeverity[report.classification.severity]++;
    this.statistics.errorsByStrategy[report.classification.strategy]++;
    
    if (report.resolved && report.resolutionTime) {
      // Update average resolution time
      const totalTime = this.statistics.averageResolutionTime * (this.statistics.totalErrors - 1);
      this.statistics.averageResolutionTime = (totalTime + report.resolutionTime) / this.statistics.totalErrors;
    }
    
    if (report.escalated) {
      this.statistics.escalationRate = 
        ((this.statistics.escalationRate * (this.statistics.totalErrors - 1)) + 1) / this.statistics.totalErrors;
    }

    this.statistics.lastUpdated = new Date();
    this.emit('statisticsUpdated', this.statistics);
  }

  /**
   * Initialize statistics
   */
  private initializeStatistics(): ErrorStatistics {
    return {
      totalErrors: 0,
      errorsByCategory: Object.keys(ErrorCategory).reduce((acc, key) => {
        acc[key as ErrorCategory] = 0;
        return acc;
      }, {} as Record<ErrorCategory, number>),
      errorsBySeverity: Object.keys(ErrorSeverity).reduce((acc, key) => {
        acc[key as ErrorSeverity] = 0;
        return acc;
      }, {} as Record<ErrorSeverity, number>),
      errorsByStrategy: Object.keys(HandlingStrategy).reduce((acc, key) => {
        acc[key as HandlingStrategy] = 0;
        return acc;
      }, {} as Record<HandlingStrategy, number>),
      averageResolutionTime: 0,
      mostCommonErrors: [],
      escalationRate: 0,
      retrySuccessRate: 0,
      lastUpdated: new Date()
    };
  }

  /**
   * Register default error patterns
   */
  private registerDefaultPatterns(): void {
    // Network errors
    this.registerPattern({
      name: 'network-timeout',
      messagePattern: /timeout|timed out/i,
      category: ErrorCategory.TIMEOUT,
      severity: ErrorSeverity.MEDIUM,
      strategy: HandlingStrategy.RETRY,
      retryable: true,
      maxRetries: 3,
      retryDelay: 1000
    });

    this.registerPattern({
      name: 'connection-refused',
      messagePattern: /connection refused|ECONNREFUSED/i,
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.HIGH,
      strategy: HandlingStrategy.FAILOVER,
      retryable: true,
      maxRetries: 2
    });

    // HTTP errors
    this.registerPattern({
      name: 'rate-limit',
      httpStatusCodes: [429],
      category: ErrorCategory.RATE_LIMITING,
      severity: ErrorSeverity.MEDIUM,
      strategy: HandlingStrategy.RETRY,
      retryable: true,
      maxRetries: 5,
      retryDelay: 2000
    });

    this.registerPattern({
      name: 'server-error',
      httpStatusCodes: [500, 502, 503, 504],
      category: ErrorCategory.TRANSIENT,
      severity: ErrorSeverity.HIGH,
      strategy: HandlingStrategy.RETRY,
      retryable: true,
      maxRetries: 3
    });

    // Authentication errors
    this.registerPattern({
      name: 'authentication-failed',
      httpStatusCodes: [401, 403],
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      strategy: HandlingStrategy.ESCALATE,
      retryable: false
    });

    // Validation errors
    this.registerPattern({
      name: 'validation-error',
      httpStatusCodes: [400],
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      strategy: HandlingStrategy.LOG_AND_CONTINUE,
      retryable: false
    });
  }

  /**
   * Calculate category trends
   */
  private calculateCategoryTrends(errors: ErrorReport[]): Record<ErrorCategory, number> {
    const trends: Record<ErrorCategory, number> = {} as any;
    
    for (const category of Object.values(ErrorCategory)) {
      trends[category] = errors.filter(e => e.classification.category === category).length;
    }
    
    return trends;
  }

  /**
   * Calculate severity trends
   */
  private calculateSeverityTrends(errors: ErrorReport[]): Record<ErrorSeverity, number> {
    const trends: Record<ErrorSeverity, number> = {} as any;
    
    for (const severity of Object.values(ErrorSeverity)) {
      trends[severity] = errors.filter(e => e.classification.severity === severity).length;
    }
    
    return trends;
  }

  /**
   * Calculate pattern trends
   */
  private calculatePatternTrends(errors: ErrorReport[]): Array<{ pattern: string; count: number }> {
    const patternCounts = new Map<string, number>();
    
    for (const error of errors) {
      const patternName = error.classification.pattern.name;
      patternCounts.set(patternName, (patternCounts.get(patternName) || 0) + 1);
    }
    
    return Array.from(patternCounts.entries())
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Generate trend recommendations
   */
  private generateTrendRecommendations(errors: ErrorReport[]): string[] {
    const recommendations: string[] = [];
    const categoryTrends = this.calculateCategoryTrends(errors);
    const severityTrends = this.calculateSeverityTrends(errors);
    
    // High critical error rate
    if (severityTrends[ErrorSeverity.CRITICAL] > errors.length * 0.1) {
      recommendations.push('High critical error rate detected - investigate immediately');
    }
    
    // High network error rate
    if (categoryTrends[ErrorCategory.NETWORK] > errors.length * 0.3) {
      recommendations.push('Network connectivity issues detected - check infrastructure');
    }
    
    // High timeout rate
    if (categoryTrends[ErrorCategory.TIMEOUT] > errors.length * 0.2) {
      recommendations.push('High timeout rate - consider increasing timeout values or improving performance');
    }
    
    return recommendations;
  }
}

/**
 * Error trend analysis interface
 */
export interface ErrorTrendAnalysis {
  timeWindow: number;
  totalErrors: number;
  errorRate: number;
  categoryTrends: Record<ErrorCategory, number>;
  severityTrends: Record<ErrorSeverity, number>;
  patternTrends: Array<{ pattern: string; count: number }>;
  recommendations: string[];
}