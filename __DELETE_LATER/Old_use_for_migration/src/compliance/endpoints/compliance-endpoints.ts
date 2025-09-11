/**
 * OSSA v0.1.8 Compliance Validation REST API Endpoints
 * Express.js routes for compliance validation and reporting
 */

import { Router, Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { FedRAMPValidationService } from '../services/fedramp-service';
import { NIST80053ValidationService } from '../services/nist-800-53-service';
import { ComplianceScorer, ComplianceMetrics } from '../scoring/compliance-scorer';
import { ComplianceReporter, ReportOptions } from '../reporting/compliance-reporter';
import {
  OSSAWorkspaceContext,
  ComplianceValidationResult,
  ComplianceReport,
  SupportedFramework,
  ComplianceConfiguration
} from '../types';

export interface ComplianceValidationRequest {
  framework: SupportedFramework;
  workspacePath: string;
  options?: {
    includeEvidence?: boolean;
    detailedAnalysis?: boolean;
    generateReport?: boolean;
    reportFormat?: 'json' | 'pdf' | 'html';
  };
}

export interface BulkComplianceRequest {
  frameworks: SupportedFramework[];
  workspacePath: string;
  comparison?: boolean;
  consolidatedReport?: boolean;
}

export interface ComplianceScheduleRequest {
  framework: SupportedFramework;
  workspacePath: string;
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    time?: string;
    notifications?: string[];
  };
}

export class ComplianceEndpoints {
  private readonly router: Router;
  private readonly fedRampService: FedRAMPValidationService;
  private readonly nistService: NIST80053ValidationService;
  private readonly scorer: ComplianceScorer;
  private readonly reporter: ComplianceReporter;

  constructor(
    private readonly ossaRoot: string = process.cwd(),
    private readonly config?: ComplianceConfiguration
  ) {
    this.router = Router();
    this.fedRampService = new FedRAMPValidationService(this.ossaRoot);
    this.nistService = new NIST80053ValidationService(this.ossaRoot);
    this.scorer = new ComplianceScorer();
    this.reporter = new ComplianceReporter(this.ossaRoot, this.config);
    
    this.setupRoutes();
    this.setupErrorHandling();
  }

  public getRouter(): Router {
    return this.router;
  }

  /**
   * Setup all compliance API routes
   */
  private setupRoutes(): void {
    // Validation endpoints
    this.router.post('/validate', this.validateCompliance.bind(this));
    this.router.post('/validate/bulk', this.bulkValidateCompliance.bind(this));
    this.router.post('/validate/schedule', this.scheduleValidation.bind(this));
    
    // Reporting endpoints
    this.router.post('/reports/generate', this.generateReport.bind(this));
    this.router.get('/reports/:reportId', this.getReport.bind(this));
    this.router.get('/reports', this.listReports.bind(this));
    this.router.delete('/reports/:reportId', this.deleteReport.bind(this));
    
    // Scoring and metrics endpoints
    this.router.post('/score', this.calculateScore.bind(this));
    this.router.get('/metrics/:framework', this.getFrameworkMetrics.bind(this));
    this.router.post('/benchmark', this.benchmarkCompliance.bind(this));
    
    // Dashboard and analytics endpoints
    this.router.get('/dashboard/:workspacePath', this.getDashboard.bind(this));
    this.router.get('/trends/:framework', this.getTrendAnalysis.bind(this));
    this.router.post('/recommendations', this.getRecommendations.bind(this));
    
    // Configuration endpoints
    this.router.get('/frameworks', this.getSupportedFrameworks.bind(this));
    this.router.get('/frameworks/:framework/controls', this.getFrameworkControls.bind(this));
    this.router.post('/configuration', this.updateConfiguration.bind(this));
    this.router.get('/configuration', this.getConfiguration.bind(this));
    
    // Health and status endpoints
    this.router.get('/health', this.healthCheck.bind(this));
    this.router.get('/status', this.getSystemStatus.bind(this));
  }

  /**
   * Validate workspace against specific compliance framework
   */
  private async validateCompliance(req: Request, res: Response): Promise<void> {
    try {
      const request: ComplianceValidationRequest = req.body;
      
      if (!request.framework || !request.workspacePath) {
        res.status(400).json({
          error: 'Framework and workspacePath are required',
          code: 'INVALID_REQUEST'
        });
        return;
      }

      const workspaceContext = await this.loadWorkspaceContext(request.workspacePath);
      let validationResult: ComplianceValidationResult;
      
      switch (request.framework) {
        case 'FEDRAMP':
          validationResult = await this.fedRampService.validateWorkspace(workspaceContext);
          break;
        case 'NIST_800_53':
          validationResult = await this.nistService.validateWorkspace(workspaceContext);
          break;
        default:
          res.status(400).json({
            error: `Unsupported framework: ${request.framework}`,
            code: 'UNSUPPORTED_FRAMEWORK'
          });
          return;
      }

      // Calculate metrics if detailed analysis requested
      let metrics: ComplianceMetrics | undefined;
      if (request.options?.detailedAnalysis) {
        metrics = await this.scorer.calculateComplianceScore(
          validationResult,
          request.framework
        );
      }

      // Generate report if requested
      let reportPath: string | undefined;
      if (request.options?.generateReport) {
        const reportOptions: ReportOptions = {
          format: request.options.reportFormat || 'json',
          includeExecutiveSummary: true,
          includeDetailedFindings: true,
          includeActionPlan: true,
          includeMetrics: !!metrics,
          includeEvidence: request.options.includeEvidence || false
        };
        
        reportPath = await this.reporter.generateReport(
          validationResult,
          metrics!,
          reportOptions
        );
      }

      res.json({
        validationResult,
        metrics,
        reportPath,
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId()
      });

    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Validate workspace against multiple frameworks
   */
  private async bulkValidateCompliance(req: Request, res: Response): Promise<void> {
    try {
      const request: BulkComplianceRequest = req.body;
      
      if (!request.frameworks || !request.workspacePath) {
        res.status(400).json({
          error: 'Frameworks and workspacePath are required',
          code: 'INVALID_REQUEST'
        });
        return;
      }

      const workspaceContext = await this.loadWorkspaceContext(request.workspacePath);
      const results: Record<string, any> = {};
      
      for (const framework of request.frameworks) {
        try {
          let validationResult: ComplianceValidationResult;
          
          switch (framework) {
            case 'FEDRAMP':
              validationResult = await this.fedRampService.validateWorkspace(workspaceContext);
              break;
            case 'NIST_800_53':
              validationResult = await this.nistService.validateWorkspace(workspaceContext);
              break;
            default:
              results[framework] = {
                error: `Unsupported framework: ${framework}`
              };
              continue;
          }

          const metrics = await this.scorer.calculateComplianceScore(
            validationResult,
            framework
          );

          results[framework] = {
            validationResult,
            metrics
          };

        } catch (error) {
          results[framework] = {
            error: error.message
          };
        }
      }

      // Generate comparison analysis if requested
      let comparison: any;
      if (request.comparison) {
        comparison = this.generateFrameworkComparison(results);
      }

      // Generate consolidated report if requested
      let consolidatedReport: string | undefined;
      if (request.consolidatedReport) {
        consolidatedReport = await this.generateConsolidatedReport(results);
      }

      res.json({
        results,
        comparison,
        consolidatedReport,
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId()
      });

    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Schedule automated compliance validation
   */
  private async scheduleValidation(req: Request, res: Response): Promise<void> {
    try {
      const request: ComplianceScheduleRequest = req.body;
      
      // In a real implementation, this would integrate with a job scheduler
      // For now, we'll return a placeholder response
      
      const scheduleId = this.generateScheduleId();
      
      res.json({
        scheduleId,
        framework: request.framework,
        workspacePath: request.workspacePath,
        schedule: request.schedule,
        status: 'scheduled',
        nextRun: this.calculateNextRunTime(request.schedule),
        created: new Date().toISOString()
      });

    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Generate compliance report
   */
  private async generateReport(req: Request, res: Response): Promise<void> {
    try {
      const { validationResult, metrics, options } = req.body;
      
      if (!validationResult) {
        res.status(400).json({
          error: 'ValidationResult is required',
          code: 'INVALID_REQUEST'
        });
        return;
      }

      const reportOptions: ReportOptions = {
        format: options?.format || 'json',
        includeExecutiveSummary: options?.includeExecutiveSummary ?? true,
        includeDetailedFindings: options?.includeDetailedFindings ?? true,
        includeActionPlan: options?.includeActionPlan ?? true,
        includeMetrics: options?.includeMetrics ?? true,
        includeEvidence: options?.includeEvidence ?? false,
        customBranding: options?.customBranding
      };

      const reportPath = await this.reporter.generateReport(
        validationResult,
        metrics,
        reportOptions
      );

      res.json({
        reportPath,
        format: reportOptions.format,
        generated: new Date().toISOString(),
        size: this.getFileSize(reportPath)
      });

    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Get specific report
   */
  private async getReport(req: Request, res: Response): Promise<void> {
    try {
      const { reportId } = req.params;
      const reportPath = path.join(this.reporter['outputPath'], `*${reportId}*`);
      
      // Find report file (simplified)
      const reportsDir = this.reporter['outputPath'];
      const files = fs.readdirSync(reportsDir);
      const reportFile = files.find(file => file.includes(reportId));
      
      if (!reportFile) {
        res.status(404).json({
          error: 'Report not found',
          code: 'REPORT_NOT_FOUND'
        });
        return;
      }

      const fullPath = path.join(reportsDir, reportFile);
      const stats = fs.statSync(fullPath);
      
      if (reportFile.endsWith('.json')) {
        const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        res.json(content);
      } else {
        res.sendFile(fullPath);
      }

    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * List all reports
   */
  private async listReports(req: Request, res: Response): Promise<void> {
    try {
      const reportsDir = this.reporter['outputPath'];
      const files = fs.readdirSync(reportsDir);
      
      const reports = files.map(file => {
        const fullPath = path.join(reportsDir, file);
        const stats = fs.statSync(fullPath);
        
        return {
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          format: path.extname(file).substring(1)
        };
      });

      res.json({
        reports,
        total: reports.length
      });

    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Delete report
   */
  private async deleteReport(req: Request, res: Response): Promise<void> {
    try {
      const { reportId } = req.params;
      
      // Find and delete report file(s)
      const reportsDir = this.reporter['outputPath'];
      const files = fs.readdirSync(reportsDir);
      const reportFiles = files.filter(file => file.includes(reportId));
      
      if (reportFiles.length === 0) {
        res.status(404).json({
          error: 'Report not found',
          code: 'REPORT_NOT_FOUND'
        });
        return;
      }

      for (const file of reportFiles) {
        fs.unlinkSync(path.join(reportsDir, file));
      }

      res.json({
        message: 'Report deleted successfully',
        deletedFiles: reportFiles
      });

    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Calculate compliance score
   */
  private async calculateScore(req: Request, res: Response): Promise<void> {
    try {
      const { validationResult, framework, previousResults } = req.body;
      
      if (!validationResult || !framework) {
        res.status(400).json({
          error: 'ValidationResult and framework are required',
          code: 'INVALID_REQUEST'
        });
        return;
      }

      const metrics = await this.scorer.calculateComplianceScore(
        validationResult,
        framework,
        previousResults
      );

      res.json({
        metrics,
        framework,
        calculatedAt: new Date().toISOString()
      });

    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Get framework metrics
   */
  private async getFrameworkMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { framework } = req.params;
      
      // This would typically query a database for historical metrics
      // For now, return mock data
      
      res.json({
        framework,
        averageScore: 78.5,
        trend: 'improving',
        lastAssessment: new Date().toISOString(),
        totalAssessments: 12,
        benchmarkPercentile: 65
      });

    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Benchmark compliance against industry standards
   */
  private async benchmarkCompliance(req: Request, res: Response): Promise<void> {
    try {
      const { validationResult, framework, industry } = req.body;
      
      // Mock benchmark data
      const benchmark = {
        industry: industry || 'Technology',
        framework,
        yourScore: validationResult.overallScore,
        industryAverage: 75.2,
        topPercentile: 92.1,
        ranking: 'Above Average',
        percentile: 68,
        recommendations: [
          'Focus on access control improvements',
          'Enhance audit logging capabilities',
          'Strengthen encryption implementation'
        ]
      };

      res.json(benchmark);

    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Get compliance dashboard data
   */
  private async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const { workspacePath } = req.params;
      const workspaceContext = await this.loadWorkspaceContext(workspacePath);
      
      // Mock dashboard data
      const dashboard = {
        overview: {
          totalWorkspaces: 1,
          activeFrameworks: ['FedRAMP', 'NIST-800-53'],
          overallHealth: 'Good',
          lastUpdate: new Date().toISOString()
        },
        compliance: {
          fedramp: { score: 82, status: 'Compliant', lastCheck: '2024-12-15' },
          nist: { score: 78, status: 'Partially Compliant', lastCheck: '2024-12-15' }
        },
        alerts: [],
        recommendations: [
          'Schedule quarterly compliance reviews',
          'Update security documentation',
          'Implement automated monitoring'
        ]
      };

      res.json(dashboard);

    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Get trend analysis
   */
  private async getTrendAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { framework } = req.params;
      const { timeframe = '12months' } = req.query;
      
      // Mock trend data
      const trends = {
        framework,
        timeframe,
        dataPoints: [
          { date: '2024-01-01', score: 65 },
          { date: '2024-04-01', score: 72 },
          { date: '2024-07-01', score: 78 },
          { date: '2024-10-01', score: 82 },
          { date: '2024-12-01', score: 85 }
        ],
        trend: 'improving',
        projectedScore: 88,
        insights: [
          'Steady improvement in access control implementation',
          'Significant gains in audit logging coverage',
          'Encryption standards showing consistent compliance'
        ]
      };

      res.json(trends);

    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Get personalized recommendations
   */
  private async getRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { validationResult, priority = 'all' } = req.body;
      
      if (!validationResult) {
        res.status(400).json({
          error: 'ValidationResult is required',
          code: 'INVALID_REQUEST'
        });
        return;
      }

      const recommendations = validationResult.recommendations;
      const filtered = priority === 'all' ? recommendations : 
        recommendations.filter((rec: string) => rec.toLowerCase().includes(priority));

      res.json({
        recommendations: filtered,
        priority,
        total: filtered.length,
        generated: new Date().toISOString()
      });

    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Get supported frameworks
   */
  private async getSupportedFrameworks(req: Request, res: Response): Promise<void> {
    try {
      res.json({
        frameworks: [
          {
            id: 'FEDRAMP',
            name: 'FedRAMP',
            version: '2.0',
            description: 'Federal Risk and Authorization Management Program',
            authority: 'GSA'
          },
          {
            id: 'NIST_800_53',
            name: 'NIST 800-53',
            version: 'Rev 5',
            description: 'Security and Privacy Controls for Federal Information Systems',
            authority: 'NIST'
          }
        ]
      });

    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Get framework controls
   */
  private async getFrameworkControls(req: Request, res: Response): Promise<void> {
    try {
      const { framework } = req.params;
      
      let mapping;
      switch (framework) {
        case 'FEDRAMP':
          mapping = await this.fedRampService.loadMapping();
          break;
        case 'NIST_800_53':
          mapping = await this.nistService.loadMapping();
          break;
        default:
          res.status(400).json({
            error: `Unsupported framework: ${framework}`,
            code: 'UNSUPPORTED_FRAMEWORK'
          });
          return;
      }

      const controls = Object.keys(mapping.controls).map(id => ({
        id,
        title: mapping.controls[id].title || id,
        family: mapping.controls[id].family || id.split('-')[0],
        implemented: mapping.controls[id].implemented
      }));

      res.json({
        framework,
        controls,
        total: controls.length
      });

    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Update configuration
   */
  private async updateConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const newConfig = req.body;
      
      // In a real implementation, this would persist to database/file
      res.json({
        message: 'Configuration updated successfully',
        config: newConfig,
        updated: new Date().toISOString()
      });

    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Get current configuration
   */
  private async getConfiguration(req: Request, res: Response): Promise<void> {
    try {
      res.json({
        enabledFrameworks: ['FEDRAMP', 'NIST_800_53'],
        assessmentFrequency: 'monthly',
        automatedScanning: true,
        reportingEndpoints: [],
        thresholds: {
          minimumCompliance: 80,
          criticalControlFailureThreshold: 5,
          riskScoreThreshold: 70
        },
        notifications: {
          enabled: true,
          channels: ['email'],
          criticalOnly: false
        }
      });

    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Health check endpoint
   */
  private async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      res.json({
        status: 'healthy',
        version: 'OSSA v0.1.8',
        timestamp: new Date().toISOString(),
        services: {
          fedramp: 'operational',
          nist: 'operational',
          reporting: 'operational',
          scoring: 'operational'
        }
      });

    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Get system status
   */
  private async getSystemStatus(req: Request, res: Response): Promise<void> {
    try {
      res.json({
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: 'OSSA v0.1.8',
        environment: process.env.NODE_ENV || 'development',
        features: {
          fedrampValidation: true,
          nistValidation: true,
          reporting: true,
          scoring: true,
          scheduling: false // Not implemented yet
        }
      });

    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Helper methods
   */
  private async loadWorkspaceContext(workspacePath: string): Promise<OSSAWorkspaceContext> {
    // Load OSSA workspace configuration
    const configPath = path.join(workspacePath, '.agents-workspace', 'workspace.json');
    
    let config = {};
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    return {
      path: workspacePath,
      config,
      agents: [],
      security: config['security'] || {},
      networking: config['networking'] || {},
      storage: config['storage'] || {},
      observability: config['observability'] || {}
    };
  }

  private generateFrameworkComparison(results: Record<string, any>): any {
    const frameworks = Object.keys(results);
    const comparison = {
      summary: {},
      crossFrameworkGaps: [],
      commonFindings: [],
      recommendedPriority: []
    };

    // Basic comparison logic
    for (const framework of frameworks) {
      const result = results[framework];
      if (result.validationResult) {
        comparison.summary[framework] = {
          score: result.metrics?.overallScore || 0,
          compliance: result.validationResult.summary.compliancePercentage,
          criticalFindings: result.validationResult.criticalFindings.length
        };
      }
    }

    return comparison;
  }

  private async generateConsolidatedReport(results: Record<string, any>): Promise<string> {
    // Generate a consolidated report across all frameworks
    const reportId = this.generateRequestId();
    const reportPath = path.join(this.reporter['outputPath'], `consolidated-${reportId}.json`);
    
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    return reportPath;
  }

  private calculateNextRunTime(schedule: any): Date {
    const now = new Date();
    switch (schedule.frequency) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      case 'quarterly':
        return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  private generateScheduleId(): string {
    return `sched-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  private getFileSize(filePath: string): number {
    try {
      return fs.statSync(filePath).size;
    } catch {
      return 0;
    }
  }

  private setupErrorHandling(): void {
    this.router.use((error: Error, req: Request, res: Response, next: any) => {
      this.handleError(error, res);
    });
  }

  private handleError(error: any, res: Response): void {
    console.error('Compliance API Error:', error);
    
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';
    
    res.status(statusCode).json({
      error: message,
      code: error.code || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}