/**
 * OSSA v0.1.8 Automated Compliance Reporting System
 * Generate comprehensive compliance reports in multiple formats
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  ComplianceValidationResult,
  ComplianceReport,
  ComplianceDetail,
  ActionPlanItem,
  ComplianceConfiguration,
  SupportedFramework
} from '../types';
import { ComplianceMetrics } from '../scoring/compliance-scorer';

export interface ReportOptions {
  format: 'json' | 'pdf' | 'html' | 'csv' | 'xlsx';
  template?: string;
  includeExecutiveSummary: boolean;
  includeDetailedFindings: boolean;
  includeActionPlan: boolean;
  includeMetrics: boolean;
  includeEvidence: boolean;
  outputPath?: string;
  customBranding?: {
    organizationName: string;
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

export interface ReportTemplate {
  name: string;
  description: string;
  framework: SupportedFramework;
  sections: ReportSection[];
  styling?: ReportStyling;
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'executive_summary' | 'metrics' | 'findings' | 'action_plan' | 'evidence' | 'appendix';
  required: boolean;
  template: string;
}

export interface ReportStyling {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    danger: string;
  };
  fonts: {
    heading: string;
    body: string;
    code: string;
  };
  layout: {
    headerHeight: string;
    footerHeight: string;
    margins: string;
  };
}

export class ComplianceReporter {
  private readonly templatesPath: string;
  private readonly outputPath: string;
  private readonly templates: Map<string, ReportTemplate>;

  constructor(
    private readonly ossaRoot: string = process.cwd(),
    private readonly config?: ComplianceConfiguration
  ) {
    this.templatesPath = path.join(this.ossaRoot, 'src', 'compliance', 'templates');
    this.outputPath = path.join(this.ossaRoot, 'compliance-reports');
    this.templates = new Map();
    this.initializeTemplates();
    this.ensureOutputDirectory();
  }

  /**
   * Generate comprehensive compliance report
   */
  async generateReport(
    validationResult: ComplianceValidationResult,
    metrics: ComplianceMetrics,
    options: ReportOptions
  ): Promise<string> {
    const reportData = await this.prepareReportData(validationResult, metrics, options);
    
    switch (options.format) {
      case 'json':
        return this.generateJSONReport(reportData, options);
      case 'pdf':
        return this.generatePDFReport(reportData, options);
      case 'html':
        return this.generateHTMLReport(reportData, options);
      case 'csv':
        return this.generateCSVReport(reportData, options);
      case 'xlsx':
        return this.generateExcelReport(reportData, options);
      default:
        throw new Error(`Unsupported report format: ${options.format}`);
    }
  }

  /**
   * Generate executive summary report
   */
  async generateExecutiveSummary(
    validationResult: ComplianceValidationResult,
    metrics: ComplianceMetrics
  ): Promise<string> {
    const summary = this.createExecutiveSummary(validationResult, metrics);
    
    const reportId = this.generateReportId();
    const filePath = path.join(this.outputPath, `executive-summary-${reportId}.json`);
    
    fs.writeFileSync(filePath, JSON.stringify(summary, null, 2));
    return filePath;
  }

  /**
   * Generate action plan from validation results
   */
  async generateActionPlan(
    validationResult: ComplianceValidationResult,
    metrics: ComplianceMetrics
  ): Promise<ActionPlanItem[]> {
    const actionPlan: ActionPlanItem[] = [];
    let priorityCounter = { critical: 1, high: 1, medium: 1, low: 1 };

    // Sort controls by criticality and compliance status
    const sortedControls = [...validationResult.controlResults]
      .sort((a, b) => {
        // Prioritize non-compliant critical controls
        if (a.status === 'non_compliant' && b.status !== 'non_compliant') return -1;
        if (b.status === 'non_compliant' && a.status !== 'non_compliant') return 1;
        return b.score - a.score; // Higher scores last
      });

    for (const control of sortedControls) {
      if (control.status !== 'compliant' && control.recommendations.length > 0) {
        const priority = this.determineActionPriority(control, validationResult.framework);
        
        for (const recommendation of control.recommendations) {
          const actionItem: ActionPlanItem = {
            id: `${validationResult.framework}-${control.controlId}-${priorityCounter[priority]++}`,
            priority,
            title: `Remediate ${control.controlId}: ${recommendation.substring(0, 50)}...`,
            description: recommendation,
            assignee: 'Security Team', // Default assignee
            dueDate: this.calculateDueDate(priority),
            status: 'planned',
            controls: [control.controlId],
            estimatedEffort: this.estimateEffort(recommendation, priority)
          };
          
          actionPlan.push(actionItem);
        }
      }
    }

    // Add strategic recommendations based on metrics
    if (metrics.overallScore < 80) {
      actionPlan.unshift({
        id: `${validationResult.framework}-strategic-1`,
        priority: 'high',
        title: 'Comprehensive Compliance Assessment',
        description: 'Conduct detailed gap analysis and develop comprehensive remediation strategy',
        assignee: 'Compliance Team',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
        status: 'planned',
        controls: [],
        estimatedEffort: '2-3 weeks'
      });
    }

    return actionPlan;
  }

  /**
   * Generate compliance dashboard data
   */
  async generateDashboardData(
    validationResult: ComplianceValidationResult,
    metrics: ComplianceMetrics
  ): Promise<any> {
    return {
      overview: {
        framework: validationResult.framework,
        overallScore: metrics.overallScore,
        riskScore: metrics.riskScore,
        maturityLevel: validationResult.summary.maturityLevel,
        lastAssessment: validationResult.timestamp,
        trend: metrics.trendAnalysis.trend
      },
      metrics: {
        controlCompliance: {
          total: validationResult.summary.totalControls,
          compliant: validationResult.summary.compliantControls,
          partiallyCompliant: validationResult.summary.partiallyCompliantControls,
          nonCompliant: validationResult.summary.nonCompliantControls
        },
        familyScores: metrics.controlFamilyScores,
        criticalFindings: validationResult.criticalFindings.length,
        recommendationsCount: validationResult.recommendations.length
      },
      riskAssessment: {
        overallRisk: this.calculateOverallRisk(metrics.riskScore),
        topRisks: this.identifyTopRisks(validationResult),
        mitigation: this.generateRiskMitigation(validationResult)
      },
      compliance: {
        benchmark: metrics.benchmarkComparison,
        projection: metrics.trendAnalysis.projectedCompliance,
        timeToCompliance: metrics.trendAnalysis.timeToFullCompliance
      }
    };
  }

  /**
   * Prepare comprehensive report data
   */
  private async prepareReportData(
    validationResult: ComplianceValidationResult,
    metrics: ComplianceMetrics,
    options: ReportOptions
  ): Promise<ComplianceReport> {
    const reportId = this.generateReportId();
    const executiveSummary = this.createExecutiveSummary(validationResult, metrics);
    const detailedFindings = this.createDetailedFindings(validationResult);
    const actionPlan = await this.generateActionPlan(validationResult, metrics);

    return {
      id: reportId,
      framework: validationResult.framework,
      version: validationResult.version,
      generatedAt: new Date(),
      generatedBy: 'OSSA v0.1.8 Compliance System',
      scope: 'Full Workspace Assessment',
      validationResult,
      executiveSummary,
      detailedFindings,
      actionPlan,
      metadata: {
        assessmentPeriod: this.formatAssessmentPeriod(validationResult.timestamp),
        nextAssessmentDue: this.calculateNextAssessmentDate(),
        assessorCredentials: 'OSSA v0.1.8 Automated Assessment',
        approvalStatus: 'draft'
      }
    };
  }

  /**
   * Generate JSON report
   */
  private async generateJSONReport(
    reportData: ComplianceReport,
    options: ReportOptions
  ): Promise<string> {
    const fileName = `compliance-report-${reportData.id}.json`;
    const filePath = path.join(options.outputPath || this.outputPath, fileName);
    
    const jsonData = {
      ...reportData,
      generationOptions: options,
      metrics: options.includeMetrics ? await this.getMetricsData(reportData) : undefined
    };

    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
    return filePath;
  }

  /**
   * Generate HTML report
   */
  private async generateHTMLReport(
    reportData: ComplianceReport,
    options: ReportOptions
  ): Promise<string> {
    const template = options.template ? 
      this.templates.get(options.template) : 
      this.getDefaultTemplate(reportData.framework);
    
    if (!template) {
      throw new Error(`Template not found: ${options.template}`);
    }

    const htmlContent = await this.renderHTMLTemplate(reportData, template, options);
    const fileName = `compliance-report-${reportData.id}.html`;
    const filePath = path.join(options.outputPath || this.outputPath, fileName);
    
    fs.writeFileSync(filePath, htmlContent);
    return filePath;
  }

  /**
   * Generate PDF report (placeholder - would need PDF library)
   */
  private async generatePDFReport(
    reportData: ComplianceReport,
    options: ReportOptions
  ): Promise<string> {
    // Generate HTML first, then convert to PDF
    const htmlPath = await this.generateHTMLReport(reportData, {
      ...options,
      format: 'html'
    });
    
    // In a real implementation, you would use puppeteer or similar:
    // const pdf = await page.pdf({ path: pdfPath, format: 'A4' });
    
    const pdfPath = htmlPath.replace('.html', '.pdf');
    // Placeholder: copy HTML file as PDF for now
    fs.copyFileSync(htmlPath, pdfPath);
    
    return pdfPath;
  }

  /**
   * Generate CSV report
   */
  private async generateCSVReport(
    reportData: ComplianceReport,
    options: ReportOptions
  ): Promise<string> {
    const csvData: string[] = [];
    
    // Header
    csvData.push([
      'Control ID',
      'Status',
      'Score',
      'Findings Count',
      'Evidence Count',
      'Recommendations Count'
    ].join(','));

    // Control data
    for (const control of reportData.validationResult.controlResults) {
      csvData.push([
        control.controlId,
        control.status,
        control.score.toString(),
        control.findings.length.toString(),
        control.evidence.length.toString(),
        control.recommendations.length.toString()
      ].join(','));
    }

    const fileName = `compliance-data-${reportData.id}.csv`;
    const filePath = path.join(options.outputPath || this.outputPath, fileName);
    
    fs.writeFileSync(filePath, csvData.join('\n'));
    return filePath;
  }

  /**
   * Generate Excel report (placeholder)
   */
  private async generateExcelReport(
    reportData: ComplianceReport,
    options: ReportOptions
  ): Promise<string> {
    // Would use a library like 'exceljs' in real implementation
    const csvPath = await this.generateCSVReport(reportData, options);
    const xlsxPath = csvPath.replace('.csv', '.xlsx');
    
    // Placeholder: copy CSV as XLSX for now
    fs.copyFileSync(csvPath, xlsxPath);
    return xlsxPath;
  }

  /**
   * Create executive summary
   */
  private createExecutiveSummary(
    validationResult: ComplianceValidationResult,
    metrics: ComplianceMetrics
  ): string {
    const summary = validationResult.summary;
    const riskLevel = metrics.riskScore > 70 ? 'High' : metrics.riskScore > 40 ? 'Medium' : 'Low';
    
    return `
# Executive Summary - ${validationResult.framework} Compliance Assessment

## Overview
This assessment evaluated ${summary.totalControls} security controls against ${validationResult.framework} ${validationResult.version} requirements.

## Key Findings
- **Overall Compliance Score**: ${metrics.overallScore.toFixed(1)}%
- **Risk Score**: ${metrics.riskScore.toFixed(1)} (${riskLevel} Risk)
- **Maturity Level**: ${summary.maturityLevel}
- **Compliant Controls**: ${summary.compliantControls}/${summary.totalControls} (${summary.compliancePercentage}%)

## Risk Assessment
${validationResult.criticalFindings.length > 0 ? 
  `**CRITICAL**: ${validationResult.criticalFindings.length} critical findings require immediate attention.` :
  'No critical findings identified in this assessment.'
}

## Recommendations
${validationResult.recommendations.length > 0 ?
  `${validationResult.recommendations.length} recommendations identified for compliance improvement.` :
  'Current implementation meets all assessed requirements.'
}

## Next Steps
${metrics.trendAnalysis.timeToFullCompliance ?
  `Estimated ${metrics.trendAnalysis.timeToFullCompliance} months to achieve full compliance with current improvement rate.` :
  'Maintain current compliance posture through continuous monitoring.'
}
    `.trim();
  }

  /**
   * Create detailed findings
   */
  private createDetailedFindings(validationResult: ComplianceValidationResult): ComplianceDetail[] {
    const findings: ComplianceDetail[] = [];
    
    // Group findings by control family
    const familyGroups = new Map<string, any[]>();
    
    for (const control of validationResult.controlResults) {
      const family = control.controlId.split('-')[0];
      if (!familyGroups.has(family)) {
        familyGroups.set(family, []);
      }
      familyGroups.get(family)!.push(control);
    }

    for (const [family, controls] of familyGroups.entries()) {
      const nonCompliantControls = controls.filter(c => c.status !== 'compliant');
      
      if (nonCompliantControls.length > 0) {
        findings.push({
          section: `Control Family ${family}`,
          findings: nonCompliantControls.flatMap(c => c.findings),
          evidence: nonCompliantControls.flatMap(c => c.evidence),
          riskLevel: this.assessFamilyRiskLevel(nonCompliantControls),
          impact: this.assessFamilyImpact(family, nonCompliantControls),
          recommendations: [...new Set(nonCompliantControls.flatMap(c => c.recommendations))]
        });
      }
    }

    return findings;
  }

  /**
   * Helper methods
   */
  private generateReportId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  private determineActionPriority(
    control: any,
    framework: string
  ): ActionPlanItem['priority'] {
    if (control.status === 'non_compliant') {
      // Critical controls get high/critical priority
      const criticalControls = ['AC-3', 'AC-6', 'SC-7', 'SC-8', 'IA-2'];
      if (criticalControls.includes(control.controlId)) {
        return 'critical';
      }
      return 'high';
    } else if (control.status === 'partially_compliant') {
      return control.score < 50 ? 'medium' : 'low';
    }
    return 'low';
  }

  private calculateDueDate(priority: ActionPlanItem['priority']): Date {
    const now = new Date();
    switch (priority) {
      case 'critical':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week
      case 'high':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 1 month
      case 'medium':
        return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 3 months
      case 'low':
        return new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000); // 6 months
    }
  }

  private estimateEffort(recommendation: string, priority: ActionPlanItem['priority']): string {
    const effortMap = {
      critical: '1-2 weeks',
      high: '2-4 weeks',
      medium: '1-2 months',
      low: '1-3 months'
    };
    return effortMap[priority];
  }

  private calculateOverallRisk(riskScore: number): 'Low' | 'Medium' | 'High' | 'Critical' {
    if (riskScore >= 80) return 'Critical';
    if (riskScore >= 60) return 'High';
    if (riskScore >= 40) return 'Medium';
    return 'Low';
  }

  private identifyTopRisks(validationResult: ComplianceValidationResult): string[] {
    return validationResult.controlResults
      .filter(c => c.status === 'non_compliant')
      .sort((a, b) => b.findings.length - a.findings.length)
      .slice(0, 5)
      .map(c => `${c.controlId}: ${c.findings[0] || 'Non-compliant'}`);
  }

  private generateRiskMitigation(validationResult: ComplianceValidationResult): string[] {
    const mitigation = new Set<string>();
    
    for (const control of validationResult.controlResults) {
      if (control.status === 'non_compliant') {
        control.recommendations.forEach(rec => mitigation.add(rec));
      }
    }
    
    return Array.from(mitigation).slice(0, 10);
  }

  private assessFamilyRiskLevel(controls: any[]): string {
    const avgScore = controls.reduce((sum, c) => sum + c.score, 0) / controls.length;
    if (avgScore < 40) return 'High';
    if (avgScore < 70) return 'Medium';
    return 'Low';
  }

  private assessFamilyImpact(family: string, controls: any[]): string {
    const impactMap: Record<string, string> = {
      'AC': 'Unauthorized access to system resources',
      'AU': 'Reduced audit trail visibility and accountability',
      'SC': 'Compromised system and data protection',
      'IA': 'Authentication and identity management vulnerabilities',
      'CM': 'Configuration drift and baseline deviations',
      'SI': 'System integrity and malware protection gaps'
    };
    
    return impactMap[family] || 'Potential compliance and security risks';
  }

  private formatAssessmentPeriod(timestamp: Date): string {
    return timestamp.toISOString().split('T')[0];
  }

  private calculateNextAssessmentDate(): Date {
    // Default to quarterly assessments
    return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  }

  private async getMetricsData(reportData: ComplianceReport): Promise<any> {
    // Return additional metrics data if needed
    return {
      generatedAt: new Date().toISOString(),
      version: 'OSSA v0.1.8'
    };
  }

  private getDefaultTemplate(framework: SupportedFramework): ReportTemplate | undefined {
    // Return default template for framework
    return undefined; // Placeholder
  }

  private async renderHTMLTemplate(
    reportData: ComplianceReport,
    template: ReportTemplate,
    options: ReportOptions
  ): Promise<string> {
    // Basic HTML template rendering
    return `
<!DOCTYPE html>
<html>
<head>
    <title>${reportData.framework} Compliance Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; }
        .summary { background: #f5f5f5; padding: 20px; margin: 20px 0; }
        .finding { margin: 10px 0; padding: 10px; border-left: 4px solid #007cba; }
        .critical { border-left-color: #d32f2f; }
        .high { border-left-color: #f57c00; }
        .medium { border-left-color: #fbc02d; }
        .low { border-left-color: #388e3c; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${reportData.framework} Compliance Assessment Report</h1>
        <p>Generated: ${reportData.generatedAt.toISOString()}</p>
    </div>
    
    <div class="summary">
        <h2>Executive Summary</h2>
        <pre>${reportData.executiveSummary}</pre>
    </div>
    
    ${options.includeDetailedFindings ? this.renderDetailedFindingsHTML(reportData.detailedFindings) : ''}
    
    ${options.includeActionPlan ? this.renderActionPlanHTML(reportData.actionPlan) : ''}
</body>
</html>
    `;
  }

  private renderDetailedFindingsHTML(findings: ComplianceDetail[]): string {
    return `
    <div class="detailed-findings">
        <h2>Detailed Findings</h2>
        ${findings.map(finding => `
            <div class="finding ${finding.riskLevel.toLowerCase()}">
                <h3>${finding.section}</h3>
                <p><strong>Risk Level:</strong> ${finding.riskLevel}</p>
                <p><strong>Impact:</strong> ${finding.impact}</p>
                <ul>
                    ${finding.findings.map(f => `<li>${f}</li>`).join('')}
                </ul>
            </div>
        `).join('')}
    </div>
    `;
  }

  private renderActionPlanHTML(actionPlan: ActionPlanItem[]): string {
    return `
    <div class="action-plan">
        <h2>Action Plan</h2>
        <table border="1" style="width: 100%; border-collapse: collapse;">
            <tr>
                <th>Priority</th>
                <th>Title</th>
                <th>Due Date</th>
                <th>Estimated Effort</th>
            </tr>
            ${actionPlan.map(item => `
                <tr class="${item.priority}">
                    <td>${item.priority.toUpperCase()}</td>
                    <td>${item.title}</td>
                    <td>${item.dueDate.toDateString()}</td>
                    <td>${item.estimatedEffort}</td>
                </tr>
            `).join('')}
        </table>
    </div>
    `;
  }

  private initializeTemplates(): void {
    // Initialize report templates - placeholder for now
    this.ensureDirectoryExists(this.templatesPath);
  }

  private ensureOutputDirectory(): void {
    this.ensureDirectoryExists(this.outputPath);
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}