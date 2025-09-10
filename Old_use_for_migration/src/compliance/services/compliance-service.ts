/**
 * OSSA v0.1.8 Main Compliance Validation Service
 * Orchestrates all compliance validation, scoring, and reporting
 */

import { FedRAMPValidationService } from './fedramp-service';
import { NIST80053ValidationService } from './nist-800-53-service';
import { ComplianceScorer, ComplianceMetrics } from '../scoring/compliance-scorer';
import { ComplianceReporter, ReportOptions } from '../reporting/compliance-reporter';
import {
  OSSAWorkspaceContext,
  ComplianceValidationResult,
  ComplianceReport,
  SupportedFramework,
  ComplianceConfiguration,
  ComplianceFrameworks
} from '../types';

export interface ComplianceAssessmentOptions {
  frameworks: SupportedFramework[];
  includeMetrics: boolean;
  includeReporting: boolean;
  reportFormats: ('json' | 'pdf' | 'html')[];
  detailedAnalysis: boolean;
  benchmarkComparison: boolean;
}

export interface ComplianceAssessmentResult {
  workspacePath: string;
  assessmentId: string;
  timestamp: Date;
  frameworks: Record<SupportedFramework, {
    validationResult: ComplianceValidationResult;
    metrics?: ComplianceMetrics;
    reportPaths?: string[];
  }>;
  consolidatedMetrics?: {
    averageScore: number;
    overallRisk: number;
    maturityLevel: string;
    crossFrameworkGaps: string[];
    prioritizedRecommendations: string[];
  };
  summary: {
    totalControlsAssessed: number;
    overallCompliancePercentage: number;
    criticalFindingsCount: number;
    highPriorityRecommendations: number;
  };
}

export class ComplianceService {
  private readonly fedRampService: FedRAMPValidationService;
  private readonly nistService: NIST80053ValidationService;
  private readonly scorer: ComplianceScorer;
  private readonly reporter: ComplianceReporter;
  
  constructor(
    private readonly ossaRoot: string = process.cwd(),
    private readonly config: ComplianceConfiguration = this.getDefaultConfig()
  ) {
    this.fedRampService = new FedRAMPValidationService(this.ossaRoot);
    this.nistService = new NIST80053ValidationService(this.ossaRoot);
    this.scorer = new ComplianceScorer();
    this.reporter = new ComplianceReporter(this.ossaRoot, this.config);
  }

  /**
   * Perform comprehensive compliance assessment
   */
  async assessCompliance(
    workspaceContext: OSSAWorkspaceContext,
    options: ComplianceAssessmentOptions
  ): Promise<ComplianceAssessmentResult> {
    const assessmentId = this.generateAssessmentId();
    const frameworks: ComplianceAssessmentResult['frameworks'] = {} as any;
    
    // Validate against each requested framework
    for (const framework of options.frameworks) {
      try {
        const validationResult = await this.validateFramework(framework, workspaceContext);
        
        const frameworkResult: any = {
          validationResult
        };

        // Calculate metrics if requested
        if (options.includeMetrics) {
          frameworkResult.metrics = await this.scorer.calculateComplianceScore(
            validationResult,
            framework
          );
        }

        // Generate reports if requested
        if (options.includeReporting && frameworkResult.metrics) {
          frameworkResult.reportPaths = await this.generateFrameworkReports(
            validationResult,
            frameworkResult.metrics,
            options.reportFormats
          );
        }

        frameworks[framework] = frameworkResult;

      } catch (error) {
        console.error(`Framework ${framework} assessment failed:`, error);
        frameworks[framework] = {
          validationResult: this.createErrorResult(framework, error.message),
          reportPaths: []
        };
      }
    }

    // Calculate consolidated metrics
    let consolidatedMetrics;
    if (options.includeMetrics) {
      consolidatedMetrics = this.calculateConsolidatedMetrics(frameworks);
    }

    // Create summary
    const summary = this.createAssessmentSummary(frameworks);

    return {
      workspacePath: workspaceContext.path,
      assessmentId,
      timestamp: new Date(),
      frameworks,
      consolidatedMetrics,
      summary
    };
  }

  /**
   * Quick compliance check for single framework
   */
  async quickCheck(
    workspaceContext: OSSAWorkspaceContext,
    framework: SupportedFramework
  ): Promise<{
    score: number;
    status: 'compliant' | 'partially_compliant' | 'non_compliant';
    criticalIssues: string[];
    recommendations: string[];
  }> {
    const validationResult = await this.validateFramework(framework, workspaceContext);
    const metrics = await this.scorer.calculateComplianceScore(validationResult, framework);
    
    let status: 'compliant' | 'partially_compliant' | 'non_compliant';
    if (metrics.overallScore >= 90) {
      status = 'compliant';
    } else if (metrics.overallScore >= 70) {
      status = 'partially_compliant';
    } else {
      status = 'non_compliant';
    }

    return {
      score: metrics.overallScore,
      status,
      criticalIssues: validationResult.criticalFindings,
      recommendations: validationResult.recommendations.slice(0, 5) // Top 5
    };
  }

  /**
   * Generate executive summary report
   */
  async generateExecutiveSummary(
    assessmentResult: ComplianceAssessmentResult
  ): Promise<{
    summary: string;
    keyMetrics: Record<string, any>;
    strategicRecommendations: string[];
    riskAssessment: string;
  }> {
    const keyMetrics: Record<string, any> = {};
    const allRecommendations: string[] = [];
    let totalScore = 0;
    let frameworkCount = 0;

    // Aggregate data from all frameworks
    for (const [framework, result] of Object.entries(assessmentResult.frameworks)) {
      if (result.metrics) {
        keyMetrics[framework] = {
          score: result.metrics.overallScore,
          riskScore: result.metrics.riskScore,
          maturityLevel: result.validationResult.summary.maturityLevel
        };
        
        totalScore += result.metrics.overallScore;
        frameworkCount++;
      }
      
      allRecommendations.push(...result.validationResult.recommendations);
    }

    const averageScore = frameworkCount > 0 ? totalScore / frameworkCount : 0;
    
    // Strategic recommendations (top 3 most common)
    const recommendationCounts = new Map<string, number>();
    allRecommendations.forEach(rec => {
      recommendationCounts.set(rec, (recommendationCounts.get(rec) || 0) + 1);
    });
    
    const strategicRecommendations = Array.from(recommendationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([rec]) => rec);

    // Risk assessment
    let riskLevel = 'Low';
    if (averageScore < 60) riskLevel = 'High';
    else if (averageScore < 80) riskLevel = 'Medium';

    const summary = this.createExecutiveSummaryText(
      assessmentResult,
      averageScore,
      riskLevel
    );

    return {
      summary,
      keyMetrics,
      strategicRecommendations,
      riskAssessment: `Overall Risk Level: ${riskLevel} (${averageScore.toFixed(1)}% compliance)`
    };
  }

  /**
   * Get compliance trends (requires historical data)
   */
  async getComplianceTrends(
    workspaceContext: OSSAWorkspaceContext,
    framework: SupportedFramework,
    timeframe: '30d' | '90d' | '1y' = '90d'
  ): Promise<{
    trend: 'improving' | 'stable' | 'declining';
    dataPoints: Array<{ date: string; score: number }>;
    projection: number;
    insights: string[];
  }> {
    // This would typically query historical data from a database
    // For now, return mock trend data
    
    const mockData = [
      { date: '2024-09-01', score: 72 },
      { date: '2024-10-01', score: 75 },
      { date: '2024-11-01', score: 78 },
      { date: '2024-12-01', score: 82 }
    ];

    const trend = mockData[mockData.length - 1].score > mockData[0].score ? 'improving' : 'stable';
    const projection = mockData[mockData.length - 1].score + (trend === 'improving' ? 3 : 0);

    return {
      trend,
      dataPoints: mockData,
      projection,
      insights: [
        'Steady improvement in access control implementation',
        'Consistent progress in audit logging coverage',
        'Encryption standards showing strong compliance'
      ]
    };
  }

  /**
   * Validate specific framework
   */
  private async validateFramework(
    framework: SupportedFramework,
    workspaceContext: OSSAWorkspaceContext
  ): Promise<ComplianceValidationResult> {
    switch (framework) {
      case 'FEDRAMP':
        return await this.fedRampService.validateWorkspace(workspaceContext);
      case 'NIST_800_53':
        return await this.nistService.validateWorkspace(workspaceContext);
      default:
        throw new Error(`Unsupported framework: ${framework}`);
    }
  }

  /**
   * Generate reports for framework
   */
  private async generateFrameworkReports(
    validationResult: ComplianceValidationResult,
    metrics: ComplianceMetrics,
    formats: ('json' | 'pdf' | 'html')[]
  ): Promise<string[]> {
    const reportPaths: string[] = [];

    for (const format of formats) {
      const reportOptions: ReportOptions = {
        format,
        includeExecutiveSummary: true,
        includeDetailedFindings: true,
        includeActionPlan: true,
        includeMetrics: true,
        includeEvidence: true
      };

      try {
        const reportPath = await this.reporter.generateReport(
          validationResult,
          metrics,
          reportOptions
        );
        reportPaths.push(reportPath);
      } catch (error) {
        console.error(`Failed to generate ${format} report:`, error);
      }
    }

    return reportPaths;
  }

  /**
   * Calculate consolidated metrics across frameworks
   */
  private calculateConsolidatedMetrics(
    frameworks: ComplianceAssessmentResult['frameworks']
  ): ComplianceAssessmentResult['consolidatedMetrics'] {
    const scores: number[] = [];
    const riskScores: number[] = [];
    const maturityLevels: string[] = [];
    const allRecommendations: string[] = [];
    const crossFrameworkGaps: string[] = [];

    for (const [framework, result] of Object.entries(frameworks)) {
      if (result.metrics) {
        scores.push(result.metrics.overallScore);
        riskScores.push(result.metrics.riskScore);
        maturityLevels.push(result.validationResult.summary.maturityLevel);
        allRecommendations.push(...result.validationResult.recommendations);
      }
    }

    const averageScore = scores.length > 0 ? 
      scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    
    const overallRisk = riskScores.length > 0 ?
      riskScores.reduce((sum, risk) => sum + risk, 0) / riskScores.length : 0;

    // Determine overall maturity level
    const maturityLevelPriority = ['Initial', 'Developing', 'Defined', 'Managed', 'Optimizing'];
    const avgMaturityIndex = maturityLevels.reduce((sum, level) => {
      return sum + maturityLevelPriority.indexOf(level);
    }, 0) / maturityLevels.length;
    const maturityLevel = maturityLevelPriority[Math.round(avgMaturityIndex)] || 'Initial';

    // Identify cross-framework gaps (common issues)
    const recommendationCounts = new Map<string, number>();
    allRecommendations.forEach(rec => {
      recommendationCounts.set(rec, (recommendationCounts.get(rec) || 0) + 1);
    });

    const prioritizedRecommendations = Array.from(recommendationCounts.entries())
      .filter(([, count]) => count > 1) // Issues across multiple frameworks
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([rec]) => rec);

    return {
      averageScore,
      overallRisk,
      maturityLevel,
      crossFrameworkGaps,
      prioritizedRecommendations
    };
  }

  /**
   * Create assessment summary
   */
  private createAssessmentSummary(
    frameworks: ComplianceAssessmentResult['frameworks']
  ): ComplianceAssessmentResult['summary'] {
    let totalControls = 0;
    let totalCompliantControls = 0;
    let totalCriticalFindings = 0;
    let totalRecommendations = 0;

    for (const result of Object.values(frameworks)) {
      const summary = result.validationResult.summary;
      totalControls += summary.totalControls;
      totalCompliantControls += summary.compliantControls;
      totalCriticalFindings += result.validationResult.criticalFindings.length;
      totalRecommendations += result.validationResult.recommendations.length;
    }

    const overallCompliancePercentage = totalControls > 0 ?
      Math.round((totalCompliantControls / totalControls) * 100) : 0;

    return {
      totalControlsAssessed: totalControls,
      overallCompliancePercentage,
      criticalFindingsCount: totalCriticalFindings,
      highPriorityRecommendations: Math.min(totalRecommendations, 10)
    };
  }

  /**
   * Create error result for failed framework validation
   */
  private createErrorResult(framework: string, errorMessage: string): ComplianceValidationResult {
    return {
      framework,
      version: 'unknown',
      timestamp: new Date(),
      overallScore: 0,
      controlResults: [],
      recommendations: [`Fix validation error: ${errorMessage}`],
      criticalFindings: [`Framework ${framework} validation failed: ${errorMessage}`],
      summary: {
        totalControls: 0,
        compliantControls: 0,
        partiallyCompliantControls: 0,
        nonCompliantControls: 0,
        notApplicableControls: 0,
        compliancePercentage: 0,
        riskScore: 100,
        maturityLevel: 'Initial'
      }
    };
  }

  /**
   * Create executive summary text
   */
  private createExecutiveSummaryText(
    assessmentResult: ComplianceAssessmentResult,
    averageScore: number,
    riskLevel: string
  ): string {
    const frameworkNames = Object.keys(assessmentResult.frameworks);
    const frameworkList = frameworkNames.map(f => ComplianceFrameworks[f as SupportedFramework]?.name || f).join(', ');

    return `
# Compliance Assessment Executive Summary

## Assessment Overview
This comprehensive compliance assessment evaluated your OSSA workspace against ${frameworkNames.length} frameworks: ${frameworkList}.

## Key Results
- **Overall Compliance Score**: ${averageScore.toFixed(1)}%
- **Risk Level**: ${riskLevel}
- **Total Controls Assessed**: ${assessmentResult.summary.totalControlsAssessed}
- **Critical Findings**: ${assessmentResult.summary.criticalFindingsCount}

## Strategic Recommendations
${assessmentResult.consolidatedMetrics?.prioritizedRecommendations.slice(0, 3).map(rec => `- ${rec}`).join('\n') || 'No strategic recommendations at this time.'}

## Next Steps
${riskLevel === 'High' ? 
  'Immediate action required to address critical compliance gaps.' :
  'Continue current compliance improvement efforts with regular monitoring.'
}

*Assessment completed on ${assessmentResult.timestamp.toDateString()} by OSSA v0.1.8 Compliance System*
    `.trim();
  }

  /**
   * Generate assessment ID
   */
  private generateAssessmentId(): string {
    return `assessment-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): ComplianceConfiguration {
    return {
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
    };
  }
}