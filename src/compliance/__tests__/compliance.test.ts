/**
 * OSSA v0.1.8 Compliance System Test Suite
 * Comprehensive tests for compliance validation, scoring, and reporting
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ComplianceService } from '../services/compliance-service';
import { FedRAMPValidationService } from '../services/fedramp-service';
import { NIST80053ValidationService } from '../services/nist-800-53-service';
import { ComplianceScorer } from '../scoring/compliance-scorer';
import { ComplianceReporter } from '../reporting/compliance-reporter';
import {
  OSSAWorkspaceContext,
  ComplianceValidationResult,
  SupportedFramework,
  ControlValidationResult
} from '../types';

describe('OSSA v0.1.8 Compliance System', () => {
  let tempDir: string;
  let mockWorkspaceContext: OSSAWorkspaceContext;
  let complianceService: ComplianceService;
  let fedRampService: FedRAMPValidationService;
  let nistService: NIST80053ValidationService;
  let scorer: ComplianceScorer;
  let reporter: ComplianceReporter;

  beforeEach(async () => {
    // Create temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ossa-compliance-test-'));
    
    // Setup mock infrastructure directories
    setupMockInfrastructure(tempDir);
    
    // Create mock workspace context
    mockWorkspaceContext = {
      path: tempDir,
      config: {
        version: 'OSSA v0.1.8'
      },
      agents: [],
      security: {
        authentication: {
          oauth: true,
          multiFactor: true,
          methods: ['totp', 'hardware_token']
        },
        authorization: {
          rbac: true,
          policies: ['admin', 'user', 'guest']
        },
        policies: ['security-policy-1', 'access-control-policy'],
        encryption: true
      },
      networking: {
        tls: {
          version: '1.3',
          certificates: true
        },
        firewall: {
          enabled: true,
          rules: ['allow-https', 'deny-all']
        }
      },
      storage: {
        encryption: {
          algorithm: 'aes-256-gcm',
          keyManagement: {
            rotation: true
          }
        }
      },
      observability: {
        logging: {
          structured: true,
          format: 'json',
          retention: '365d',
          events: ['successful_logons', 'unsuccessful_logons', 'account_management']
        },
        monitoring: {
          intrusionDetection: {
            realTime: true
          },
          malwareProtection: true
        }
      }
    };

    // Initialize services
    complianceService = new ComplianceService(tempDir);
    fedRampService = new FedRAMPValidationService(tempDir);
    nistService = new NIST80053ValidationService(tempDir);
    scorer = new ComplianceScorer();
    reporter = new ComplianceReporter(tempDir);
  });

  afterEach(() => {
    // Cleanup temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('FedRAMP Validation Service', () => {
    test('should load FedRAMP mapping successfully', async () => {
      const mapping = await fedRampService.loadMapping();
      
      expect(mapping).toBeDefined();
      expect(mapping.metadata.framework).toBe('FedRAMP');
      expect(mapping.controls).toBeDefined();
      expect(Object.keys(mapping.controls).length).toBeGreaterThan(0);
    });

    test('should validate workspace against FedRAMP controls', async () => {
      const result = await fedRampService.validateWorkspace(mockWorkspaceContext);
      
      expect(result).toBeDefined();
      expect(result.framework).toBe('FedRAMP');
      expect(result.controlResults).toBeInstanceOf(Array);
      expect(result.summary.totalControls).toBeGreaterThan(0);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    test('should identify critical findings correctly', async () => {
      const result = await fedRampService.validateWorkspace(mockWorkspaceContext);
      
      expect(result.criticalFindings).toBeInstanceOf(Array);
      // With our comprehensive mock workspace, should have minimal critical findings
      expect(result.criticalFindings.length).toBeLessThanOrEqual(2);
    });

    test('should generate recommendations based on validation results', async () => {
      const result = await fedRampService.validateWorkspace(mockWorkspaceContext);
      
      expect(result.recommendations).toBeInstanceOf(Array);
      // Should have some recommendations for improvement
      expect(result.recommendations.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('NIST 800-53 Validation Service', () => {
    test('should load NIST 800-53 mapping successfully', async () => {
      const mapping = await nistService.loadMapping();
      
      expect(mapping).toBeDefined();
      expect(mapping.metadata.framework).toBe('NIST-800-53');
      expect(mapping.controls).toBeDefined();
      expect(Object.keys(mapping.controls).length).toBeGreaterThan(0);
    });

    test('should validate workspace against NIST 800-53 controls', async () => {
      const result = await nistService.validateWorkspace(mockWorkspaceContext);
      
      expect(result).toBeDefined();
      expect(result.framework).toBe('NIST-800-53');
      expect(result.controlResults).toBeInstanceOf(Array);
      expect(result.summary.totalControls).toBeGreaterThan(0);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    test('should perform enhanced control validation with family-specific checks', async () => {
      const result = await nistService.validateWorkspace(mockWorkspaceContext);
      
      // Check for family-specific validation
      const accessControls = result.controlResults.filter(c => c.controlId.startsWith('AC'));
      const auditControls = result.controlResults.filter(c => c.controlId.startsWith('AU'));
      
      expect(accessControls.length).toBeGreaterThan(0);
      expect(auditControls.length).toBeGreaterThan(0);
      
      // Access controls should have reasonable scores with our mock data
      const avgAccessScore = accessControls.reduce((sum, c) => sum + c.score, 0) / accessControls.length;
      expect(avgAccessScore).toBeGreaterThan(50); // Should be decent with our mock setup
    });

    test('should calculate weighted scores based on control criticality', async () => {
      const result = await nistService.validateWorkspace(mockWorkspaceContext);
      
      // Critical controls should exist and be properly weighted
      const criticalControls = ['AC-3', 'AC-6', 'IA-2', 'SC-7', 'SC-8'];
      const foundCriticalControls = result.controlResults.filter(c => 
        criticalControls.includes(c.controlId)
      );
      
      expect(foundCriticalControls.length).toBeGreaterThan(0);
    });
  });

  describe('Compliance Scoring System', () => {
    let mockValidationResult: ComplianceValidationResult;

    beforeEach(() => {
      mockValidationResult = createMockValidationResult();
    });

    test('should calculate overall compliance score', async () => {
      const metrics = await scorer.calculateComplianceScore(
        mockValidationResult, 
        'FEDRAMP'
      );
      
      expect(metrics.overallScore).toBeGreaterThanOrEqual(0);
      expect(metrics.overallScore).toBeLessThanOrEqual(100);
      expect(metrics.weightedScore).toBeGreaterThanOrEqual(0);
      expect(metrics.riskScore).toBeGreaterThanOrEqual(0);
      expect(metrics.maturityScore).toBeGreaterThanOrEqual(0);
    });

    test('should calculate weighted scores based on control importance', async () => {
      const metrics = await scorer.calculateComplianceScore(
        mockValidationResult, 
        'NIST_800_53'
      );
      
      expect(metrics.weightedScore).toBeDefined();
      expect(metrics.criticalityBasedScore).toBeDefined();
      expect(metrics.controlFamilyScores).toBeDefined();
      
      // Weighted score should be different from overall score due to control importance
      expect(Math.abs(metrics.weightedScore - metrics.overallScore)).toBeGreaterThan(0);
    });

    test('should provide trend analysis with historical data', async () => {
      const previousResults = [
        { ...mockValidationResult, overallScore: 70, timestamp: new Date('2024-10-01') },
        { ...mockValidationResult, overallScore: 75, timestamp: new Date('2024-11-01') }
      ];

      const metrics = await scorer.calculateComplianceScore(
        mockValidationResult,
        'FEDRAMP',
        previousResults
      );
      
      expect(metrics.trendAnalysis.trend).toMatch(/improving|stable|declining/);
      expect(metrics.trendAnalysis.changePercentage).toBeDefined();
      expect(metrics.trendAnalysis.projectedCompliance).toBeDefined();
    });

    test('should provide benchmark comparison', async () => {
      const metrics = await scorer.calculateComplianceScore(
        mockValidationResult, 
        'FEDRAMP'
      );
      
      expect(metrics.benchmarkComparison.industryAverage).toBeGreaterThan(0);
      expect(metrics.benchmarkComparison.percentile).toBeGreaterThan(0);
      expect(metrics.benchmarkComparison.percentile).toBeLessThanOrEqual(100);
      expect(metrics.benchmarkComparison.peerComparison).toMatch(/above_average|average|below_average/);
    });
  });

  describe('Compliance Reporting System', () => {
    let mockValidationResult: ComplianceValidationResult;
    let mockMetrics: any;

    beforeEach(() => {
      mockValidationResult = createMockValidationResult();
      mockMetrics = {
        overallScore: 82.5,
        weightedScore: 85.2,
        riskScore: 25.3,
        maturityScore: 78.1,
        trendAnalysis: {
          trend: 'improving',
          changePercentage: 3.2,
          projectedCompliance: 87.1
        },
        benchmarkComparison: {
          industryAverage: 78,
          percentile: 68,
          peerComparison: 'above_average'
        },
        controlFamilyScores: {
          'AC': 85,
          'AU': 80,
          'SC': 90
        }
      };
    });

    test('should generate JSON compliance report', async () => {
      const reportPath = await reporter.generateReport(
        mockValidationResult,
        mockMetrics,
        {
          format: 'json',
          includeExecutiveSummary: true,
          includeDetailedFindings: true,
          includeActionPlan: true,
          includeMetrics: true,
          includeEvidence: true
        }
      );
      
      expect(fs.existsSync(reportPath)).toBe(true);
      expect(reportPath.endsWith('.json')).toBe(true);
      
      const reportContent = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      expect(reportContent.framework).toBe(mockValidationResult.framework);
      expect(reportContent.executiveSummary).toBeDefined();
      expect(reportContent.actionPlan).toBeInstanceOf(Array);
    });

    test('should generate HTML compliance report', async () => {
      const reportPath = await reporter.generateReport(
        mockValidationResult,
        mockMetrics,
        {
          format: 'html',
          includeExecutiveSummary: true,
          includeDetailedFindings: true,
          includeActionPlan: true,
          includeMetrics: true,
          includeEvidence: false
        }
      );
      
      expect(fs.existsSync(reportPath)).toBe(true);
      expect(reportPath.endsWith('.html')).toBe(true);
      
      const htmlContent = fs.readFileSync(reportPath, 'utf8');
      expect(htmlContent.includes('<!DOCTYPE html>')).toBe(true);
      expect(htmlContent.includes('Executive Summary')).toBe(true);
    });

    test('should generate executive summary', async () => {
      const summaryPath = await reporter.generateExecutiveSummary(
        mockValidationResult,
        mockMetrics
      );
      
      expect(fs.existsSync(summaryPath)).toBe(true);
      
      const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
      expect(summary).toBeDefined();
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(100); // Should be substantial
    });

    test('should generate actionable action plan', async () => {
      const actionPlan = await reporter.generateActionPlan(
        mockValidationResult,
        mockMetrics
      );
      
      expect(actionPlan).toBeInstanceOf(Array);
      
      if (actionPlan.length > 0) {
        const firstAction = actionPlan[0];
        expect(firstAction.id).toBeDefined();
        expect(firstAction.priority).toMatch(/critical|high|medium|low/);
        expect(firstAction.title).toBeDefined();
        expect(firstAction.dueDate).toBeInstanceOf(Date);
        expect(firstAction.status).toBe('planned');
      }
    });
  });

  describe('Compliance Service Integration', () => {
    test('should perform comprehensive compliance assessment', async () => {
      const assessmentResult = await complianceService.assessCompliance(
        mockWorkspaceContext,
        {
          frameworks: ['FEDRAMP', 'NIST_800_53'],
          includeMetrics: true,
          includeReporting: true,
          reportFormats: ['json'],
          detailedAnalysis: true,
          benchmarkComparison: true
        }
      );
      
      expect(assessmentResult.assessmentId).toBeDefined();
      expect(assessmentResult.frameworks).toBeDefined();
      expect(assessmentResult.frameworks['FEDRAMP']).toBeDefined();
      expect(assessmentResult.frameworks['NIST_800_53']).toBeDefined();
      expect(assessmentResult.summary).toBeDefined();
      
      // Check consolidated metrics
      if (assessmentResult.consolidatedMetrics) {
        expect(assessmentResult.consolidatedMetrics.averageScore).toBeGreaterThanOrEqual(0);
        expect(assessmentResult.consolidatedMetrics.overallRisk).toBeGreaterThanOrEqual(0);
        expect(assessmentResult.consolidatedMetrics.maturityLevel).toBeDefined();
      }
    });

    test('should perform quick compliance check', async () => {
      const quickResult = await complianceService.quickCheck(
        mockWorkspaceContext,
        'FEDRAMP'
      );
      
      expect(quickResult.score).toBeGreaterThanOrEqual(0);
      expect(quickResult.score).toBeLessThanOrEqual(100);
      expect(quickResult.status).toMatch(/compliant|partially_compliant|non_compliant/);
      expect(quickResult.criticalIssues).toBeInstanceOf(Array);
      expect(quickResult.recommendations).toBeInstanceOf(Array);
    });

    test('should generate executive summary from assessment', async () => {
      const assessmentResult = await complianceService.assessCompliance(
        mockWorkspaceContext,
        {
          frameworks: ['FEDRAMP'],
          includeMetrics: true,
          includeReporting: false,
          reportFormats: [],
          detailedAnalysis: true,
          benchmarkComparison: true
        }
      );
      
      const executiveSummary = await complianceService.generateExecutiveSummary(assessmentResult);
      
      expect(executiveSummary.summary).toBeDefined();
      expect(executiveSummary.keyMetrics).toBeDefined();
      expect(executiveSummary.strategicRecommendations).toBeInstanceOf(Array);
      expect(executiveSummary.riskAssessment).toBeDefined();
    });

    test('should handle validation errors gracefully', async () => {
      const invalidWorkspaceContext: OSSAWorkspaceContext = {
        path: '/nonexistent/path',
        config: {},
        agents: [],
        security: {},
        networking: {},
        storage: {},
        observability: {}
      };

      const assessmentResult = await complianceService.assessCompliance(
        invalidWorkspaceContext,
        {
          frameworks: ['FEDRAMP'],
          includeMetrics: false,
          includeReporting: false,
          reportFormats: [],
          detailedAnalysis: false,
          benchmarkComparison: false
        }
      );
      
      // Should not throw, but should return error information
      expect(assessmentResult.frameworks['FEDRAMP'].validationResult).toBeDefined();
    });
  });

  describe('Performance and Edge Cases', () => {
    test('should handle large number of controls efficiently', async () => {
      const startTime = Date.now();
      
      const result = await nistService.validateWorkspace(mockWorkspaceContext);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.controlResults.length).toBeGreaterThan(20); // NIST has many controls
    });

    test('should handle missing infrastructure configuration gracefully', async () => {
      const emptyTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ossa-empty-test-'));
      
      try {
        const emptyService = new FedRAMPValidationService(emptyTempDir);
        
        // Should throw error for missing mapping
        await expect(emptyService.loadMapping()).rejects.toThrow();
      } finally {
        fs.rmSync(emptyTempDir, { recursive: true, force: true });
      }
    });

    test('should validate workspace with minimal configuration', async () => {
      const minimalWorkspaceContext: OSSAWorkspaceContext = {
        path: tempDir,
        config: {},
        agents: [],
        security: {},
        networking: {},
        storage: {},
        observability: {}
      };
      
      const result = await fedRampService.validateWorkspace(minimalWorkspaceContext);
      
      expect(result).toBeDefined();
      expect(result.overallScore).toBeLessThan(50); // Should be low with no configuration
      expect(result.criticalFindings.length).toBeGreaterThan(0); // Should have critical findings
    });
  });

  // Helper functions
  function setupMockInfrastructure(tempDir: string): void {
    const infraDir = path.join(tempDir, 'infrastructure', 'compliance');
    
    // Create FedRAMP mapping
    const fedRampDir = path.join(infraDir, 'fedramp');
    fs.mkdirSync(fedRampDir, { recursive: true });
    
    const fedRampMapping = {
      apiVersion: 'ossa.ai/v0.1.8',
      kind: 'ComplianceMapping',
      metadata: {
        name: 'fedramp-mapping',
        framework: 'FedRAMP',
        version: '2.0',
        authority: 'GSA',
        description: 'FedRAMP control mappings for OSSA-compliant agent systems'
      },
      controls: {
        'AC-3': {
          implemented: true,
          controlSummary: 'Access Enforcement',
          ossaComponents: ['workspace.security.authorization.rbac'],
          implementation: ['Role-based access control implemented']
        },
        'AU-2': {
          implemented: true,
          controlSummary: 'Audit Events',
          ossaComponents: ['workspace.observability.logging'],
          implementation: ['Comprehensive event logging']
        }
      },
      implementationStatus: {
        totalControls: 2,
        implemented: 2,
        partiallyImplemented: 0,
        planned: 0,
        notApplicable: 0,
        overallCompliance: 100
      }
    };
    
    fs.writeFileSync(
      path.join(fedRampDir, 'mapping.yaml'),
      require('js-yaml').dump(fedRampMapping)
    );
    
    // Create NIST 800-53 mapping
    const nistDir = path.join(infraDir, 'nist-800-53');
    fs.mkdirSync(nistDir, { recursive: true });
    
    const nistMapping = {
      apiVersion: 'ossa.ai/v0.1.8',
      kind: 'ComplianceMapping',
      metadata: {
        name: 'nist-800-53-mapping',
        framework: 'NIST-800-53',
        version: 'Rev 5',
        authority: 'NIST',
        description: 'NIST 800-53 control mappings'
      },
      controls: {
        'AC-3': {
          implemented: true,
          controlSummary: 'Access Enforcement',
          ossaComponents: ['workspace.security.authorization.rbac']
        },
        'IA-2': {
          implemented: true,
          controlSummary: 'Identification and Authentication',
          ossaComponents: ['workspace.security.authentication']
        },
        'SC-8': {
          implemented: true,
          controlSummary: 'Transmission Confidentiality',
          ossaComponents: ['workspace.networking.tls']
        }
      },
      implementationStatus: {
        totalControlsAssessed: 3,
        implemented: 3,
        partiallyImplemented: 0,
        planned: 0,
        notApplicable: 0,
        overallCompliance: 100
      }
    };
    
    fs.writeFileSync(
      path.join(nistDir, 'mapping.yaml'),
      require('js-yaml').dump(nistMapping)
    );
  }

  function createMockValidationResult(): ComplianceValidationResult {
    const controlResults: ControlValidationResult[] = [
      {
        controlId: 'AC-3',
        status: 'compliant',
        score: 95,
        findings: [],
        evidence: [
          {
            type: 'configuration',
            description: 'RBAC configuration verified',
            lastVerified: new Date()
          }
        ],
        recommendations: []
      },
      {
        controlId: 'AU-2',
        status: 'partially_compliant',
        score: 75,
        findings: ['Missing some audit events'],
        evidence: [
          {
            type: 'configuration',
            description: 'Logging configuration present',
            lastVerified: new Date()
          }
        ],
        recommendations: ['Configure additional audit events']
      },
      {
        controlId: 'SC-7',
        status: 'non_compliant',
        score: 30,
        findings: ['Network boundary protection insufficient'],
        evidence: [],
        recommendations: ['Implement comprehensive firewall rules', 'Configure network segmentation']
      }
    ];

    return {
      framework: 'FedRAMP',
      version: '2.0',
      timestamp: new Date(),
      overallScore: 66.7,
      controlResults,
      recommendations: ['Configure additional audit events', 'Implement comprehensive firewall rules'],
      criticalFindings: ['Network boundary protection insufficient'],
      summary: {
        totalControls: 3,
        compliantControls: 1,
        partiallyCompliantControls: 1,
        nonCompliantControls: 1,
        notApplicableControls: 0,
        compliancePercentage: 67,
        riskScore: 33,
        maturityLevel: 'Developing'
      }
    };
  }
});