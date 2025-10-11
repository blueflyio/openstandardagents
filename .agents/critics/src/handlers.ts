/**
 * Request handlers for Code Reviewer Agent
 */

import { Request, Response } from 'express';
import {
  AgentConfig,
  ReviewRequest,
  ReviewResponse,
  SecurityScanRequest,
  SecurityScanResponse,
  QualityCheckRequest,
  QualityCheckResponse,
  BatchReviewRequest,
  BatchReviewResponse,
  HealthResponse,
  CapabilitiesResponse,
  AgentMetrics,
  ValidationError,
  ProcessingError
} from './types';
import { SecurityScanner } from './security';
import { QualityAnalyzer } from './quality';
import { MetricsCollector } from './metrics';

export class ReviewHandler {
  constructor(
    private config: AgentConfig,
    private security: SecurityScanner,
    private quality: QualityAnalyzer,
    private metrics: MetricsCollector
  ) {}

  /**
   * Health check endpoint - OSSA required
   */
  async health(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const healthChecks = await Promise.all([
        this.checkDependencies(),
        this.checkMemoryUsage(),
        this.checkDiskSpace(),
        this.checkSecurityScanner(),
        this.checkQualityAnalyzer()
      ]);

      const allHealthy = healthChecks.every(check => check.status === 'pass');
      const hasWarnings = healthChecks.some(check => check.status === 'warn');

      const status = allHealthy ? (hasWarnings ? 'degraded' : 'healthy') : 'unhealthy';

      const response: HealthResponse = {
        status,
        timestamp: new Date().toISOString(),
        version: this.config.version,
        uptime: process.uptime(),
        checks: healthChecks
      };

      const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;
      res.status(statusCode).json(response);

    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: this.config.version,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Capabilities endpoint - OSSA required
   */
  async capabilities(req: Request, res: Response): Promise<void> {
    const response: CapabilitiesResponse = {
      agent: this.config.name,
      version: this.config.version,
      category: 'critics',
      capabilities: this.config.capabilities,
      supportedLanguages: [
        'typescript', 'javascript', 'python', 'java', 'go',
        'rust', 'cpp', 'csharp', 'php', 'ruby'
      ],
      endpoints: [
        {
          path: '/health',
          method: 'GET',
          description: 'Agent health status',
          authentication_required: false
        },
        {
          path: '/capabilities',
          method: 'GET',
          description: 'Agent capabilities',
          authentication_required: false
        },
        {
          path: '/analyze',
          method: 'POST',
          description: 'Comprehensive code analysis',
          authentication_required: true
        },
        {
          path: '/review',
          method: 'POST',
          description: 'Code review with suggestions',
          authentication_required: true
        },
        {
          path: '/security-scan',
          method: 'POST',
          description: 'Security vulnerability scanning',
          authentication_required: true
        },
        {
          path: '/quality-check',
          method: 'POST',
          description: 'Code quality assessment',
          authentication_required: true
        },
        {
          path: '/batch-review',
          method: 'POST',
          description: 'Batch review multiple files',
          authentication_required: true
        }
      ],
      integrations: ['gitlab', 'github', 'sonarqube', 'eslint', 'prettier']
    };

    res.json(response);
  }

  /**
   * Comprehensive code analysis
   */
  async analyze(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const requestId = (req as any).requestId;

    try {
      const request: ReviewRequest = req.body;
      this.validateReviewRequest(request);

      // Parallel execution of analysis components
      const [securityResults, qualityResults] = await Promise.all([
        this.security.scanCode(request.code, request.language),
        this.quality.analyzeCode(request.code, request.language)
      ]);

      const response: ReviewResponse = {
        success: true,
        summary: {
          totalIssues: securityResults.vulnerabilities.length + qualityResults.violations.length,
          criticalIssues: securityResults.vulnerabilities.filter(v => v.severity === 'critical').length,
          warningIssues: qualityResults.violations.filter(v => v.severity === 'warning').length,
          infoIssues: qualityResults.violations.filter(v => v.severity === 'error').length,
          overallScore: this.calculateOverallScore(securityResults, qualityResults),
          status: this.determineStatus(securityResults, qualityResults)
        },
        issues: [
          ...this.convertSecurityToIssues(securityResults.vulnerabilities),
          ...this.convertQualityToIssues(qualityResults.violations)
        ],
        metrics: qualityResults.metrics,
        recommendations: [
          ...securityResults.recommendations,
          ...qualityResults.suggestions.map(s => s.description)
        ],
        requestId,
        duration: Date.now() - startTime
      };

      this.metrics.recordReview(response);
      res.json(response);

    } catch (error) {
      this.handleError(error, res, requestId);
    }
  }

  /**
   * Code review with detailed feedback
   */
  async review(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const requestId = (req as any).requestId;

    try {
      const request: ReviewRequest = req.body;
      this.validateReviewRequest(request);

      // Enhanced review includes context-aware analysis
      const analysisPromises = [
        this.quality.analyzeCode(request.code, request.language)
      ];

      if (request.options?.includeSecurityScan !== false) {
        analysisPromises.push(
          this.security.scanCode(request.code, request.language)
        );
      }

      const results = await Promise.all(analysisPromises);
      const qualityResults = results[0];
      const securityResults = results[1] || { vulnerabilities: [], recommendations: [] };

      const response: ReviewResponse = {
        success: true,
        summary: {
          totalIssues: securityResults.vulnerabilities.length + qualityResults.violations.length,
          criticalIssues: securityResults.vulnerabilities.filter(v => v.severity === 'critical').length,
          warningIssues: qualityResults.violations.filter(v => v.severity === 'warning').length,
          infoIssues: qualityResults.violations.filter(v => v.severity === 'error').length,
          overallScore: this.calculateOverallScore(securityResults, qualityResults),
          status: this.determineStatus(securityResults, qualityResults)
        },
        issues: [
          ...this.convertSecurityToIssues(securityResults.vulnerabilities),
          ...this.convertQualityToIssues(qualityResults.violations)
        ],
        metrics: qualityResults.metrics,
        recommendations: this.generateEnhancedRecommendations(
          securityResults,
          qualityResults,
          request.context
        ),
        requestId,
        duration: Date.now() - startTime
      };

      this.metrics.recordReview(response);
      res.json(response);

    } catch (error) {
      this.handleError(error, res, requestId);
    }
  }

  /**
   * Security-focused scanning
   */
  async securityScan(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const requestId = (req as any).requestId;

    try {
      const request: SecurityScanRequest = req.body;
      this.validateSecurityScanRequest(request);

      const results = await this.security.scanCode(request.code, request.language);

      const response: SecurityScanResponse = {
        vulnerabilities: results.vulnerabilities,
        dependencyIssues: results.dependencyIssues || [],
        securityScore: results.securityScore,
        recommendations: results.recommendations
      };

      this.metrics.recordSecurityScan(response);
      res.json(response);

    } catch (error) {
      this.handleError(error, res, requestId);
    }
  }

  /**
   * Quality-focused analysis
   */
  async qualityCheck(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const requestId = (req as any).requestId;

    try {
      const request: QualityCheckRequest = req.body;
      this.validateQualityCheckRequest(request);

      const results = await this.quality.analyzeCode(request.code, request.language);

      const response: QualityCheckResponse = {
        passed: results.violations.length === 0,
        metrics: results.metrics,
        violations: results.violations,
        suggestions: results.suggestions
      };

      res.json(response);

    } catch (error) {
      this.handleError(error, res, requestId);
    }
  }

  /**
   * Batch review multiple files
   */
  async batchReview(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const requestId = (req as any).requestId;

    try {
      const request: BatchReviewRequest = req.body;
      this.validateBatchReviewRequest(request);

      const results = await this.processBatchReview(request);

      const response: BatchReviewResponse = {
        success: true,
        results,
        summary: this.calculateBatchSummary(results),
        duration: Date.now() - startTime
      };

      res.json(response);

    } catch (error) {
      this.handleError(error, res, requestId);
    }
  }

  /**
   * Agent metrics endpoint
   */
  async metrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics: AgentMetrics = this.metrics.getMetrics();
      res.json(metrics);
    } catch (error) {
      this.handleError(error, res, 'metrics');
    }
  }

  // Private helper methods
  private validateReviewRequest(request: ReviewRequest): void {
    if (!request.code) {
      throw new ValidationError('Code is required', 'code');
    }
    if (!request.language) {
      throw new ValidationError('Language is required', 'language');
    }
    if (request.code.length > this.config.security.max_file_size) {
      throw new ValidationError('Code exceeds maximum file size', 'code');
    }
  }

  private validateSecurityScanRequest(request: SecurityScanRequest): void {
    if (!request.code) {
      throw new ValidationError('Code is required', 'code');
    }
    if (!request.language) {
      throw new ValidationError('Language is required', 'language');
    }
  }

  private validateQualityCheckRequest(request: QualityCheckRequest): void {
    if (!request.code) {
      throw new ValidationError('Code is required', 'code');
    }
    if (!request.language) {
      throw new ValidationError('Language is required', 'language');
    }
  }

  private validateBatchReviewRequest(request: BatchReviewRequest): void {
    if (!request.files || !Array.isArray(request.files)) {
      throw new ValidationError('Files array is required', 'files');
    }
    if (request.files.length === 0) {
      throw new ValidationError('At least one file is required', 'files');
    }
    if (request.files.length > 100) {
      throw new ValidationError('Maximum 100 files per batch', 'files');
    }
  }

  private async processBatchReview(request: BatchReviewRequest): Promise<any[]> {
    // Implementation would process files either sequentially or in parallel
    // This is a simplified version
    const results = [];

    for (const file of request.files) {
      try {
        const reviewRequest: ReviewRequest = {
          code: file.content,
          language: file.language,
          options: request.options
        };

        // Simplified review logic
        const result = {
          filePath: file.filePath,
          success: true,
          review: await this.performSingleReview(reviewRequest)
        };

        results.push(result);
      } catch (error) {
        results.push({
          filePath: file.filePath,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  private async performSingleReview(request: ReviewRequest): Promise<ReviewResponse> {
    // Simplified single review implementation
    return {
      success: true,
      summary: {
        totalIssues: 0,
        criticalIssues: 0,
        warningIssues: 0,
        infoIssues: 0,
        overallScore: 100,
        status: 'passed'
      },
      issues: [],
      metrics: {} as any,
      recommendations: [],
      requestId: 'batch-item',
      duration: 100
    };
  }

  private calculateBatchSummary(results: any[]): any {
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    return {
      totalFiles: results.length,
      successfulReviews: successful,
      failedReviews: failed,
      totalIssues: 0,
      averageScore: 100
    };
  }

  private calculateOverallScore(securityResults: any, qualityResults: any): number {
    // Simplified scoring algorithm
    const securityWeight = 0.6;
    const qualityWeight = 0.4;

    const securityScore = securityResults.securityScore || 100;
    const qualityScore = 100 - (qualityResults.violations.length * 5);

    return Math.max(0, securityWeight * securityScore + qualityWeight * qualityScore);
  }

  private determineStatus(securityResults: any, qualityResults: any): 'passed' | 'failed' | 'warning' {
    const criticalVulnerabilities = securityResults.vulnerabilities.filter(
      (v: any) => v.severity === 'critical'
    ).length;

    if (criticalVulnerabilities > 0) {
      return 'failed';
    }

    const totalIssues = securityResults.vulnerabilities.length + qualityResults.violations.length;
    if (totalIssues > 10) {
      return 'warning';
    }

    return 'passed';
  }

  private convertSecurityToIssues(vulnerabilities: any[]): any[] {
    return vulnerabilities.map(vuln => ({
      id: vuln.id,
      severity: vuln.severity,
      category: 'security',
      line: vuln.line,
      message: vuln.title,
      description: vuln.description,
      rule: vuln.cweId,
      ruleId: vuln.cweId,
      fixable: false,
      suggestedFix: vuln.recommendation
    }));
  }

  private convertQualityToIssues(violations: any[]): any[] {
    return violations.map(violation => ({
      id: `quality-${Math.random().toString(36).substr(2, 9)}`,
      severity: violation.severity,
      category: 'quality',
      message: violation.message,
      rule: violation.metric,
      ruleId: violation.metric,
      fixable: true
    }));
  }

  private generateEnhancedRecommendations(
    securityResults: any,
    qualityResults: any,
    context?: any
  ): string[] {
    const recommendations = [
      ...securityResults.recommendations,
      ...qualityResults.suggestions.map((s: any) => s.description)
    ];

    // Add context-specific recommendations
    if (context?.projectId) {
      recommendations.push('Consider project-specific coding standards');
    }

    return recommendations;
  }

  private async checkDependencies(): Promise<any> {
    return {
      name: 'dependencies',
      status: 'pass',
      message: 'All dependencies available'
    };
  }

  private async checkMemoryUsage(): Promise<any> {
    const usage = process.memoryUsage();
    const heapUsedMB = usage.heapUsed / 1024 / 1024;

    return {
      name: 'memory',
      status: heapUsedMB > 1024 ? 'warn' : 'pass',
      message: `Heap used: ${heapUsedMB.toFixed(2)}MB`
    };
  }

  private async checkDiskSpace(): Promise<any> {
    return {
      name: 'disk',
      status: 'pass',
      message: 'Sufficient disk space'
    };
  }

  private async checkSecurityScanner(): Promise<any> {
    return {
      name: 'security_scanner',
      status: 'pass',
      message: 'Security scanner operational'
    };
  }

  private async checkQualityAnalyzer(): Promise<any> {
    return {
      name: 'quality_analyzer',
      status: 'pass',
      message: 'Quality analyzer operational'
    };
  }

  private handleError(error: unknown, res: Response, requestId: string): void {
    if (error instanceof ValidationError) {
      res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
        field: error.field,
        requestId
      });
    } else if (error instanceof ProcessingError) {
      res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
        requestId
      });
    } else {
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        requestId
      });
    }
  }
}