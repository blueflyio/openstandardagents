/**
 * OSSA Compliance Engine API Server v0.1.9-alpha.1
 * 
 * Enterprise compliance and governance REST API for OSSA Platform.
 * Provides endpoints for conformance validation, regulatory compliance,
 * policy enforcement, and audit trail management.
 */

import express from 'express';
import { z } from 'zod';
import { ComplianceEngine, ComplianceContext, ComplianceValidationResult } from '../../core/compliance/ComplianceEngine.js';
import { OSSAAgent } from '../../types/agents/index.js';

const app = express();
app.use(express.json({ limit: '10mb' }));

// CORS middleware for enterprise environments
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.OSSA_CORS_ORIGIN || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-OSSA-Context');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Request validation schemas
const ComplianceContextSchema = z.object({
  environment: z.enum(['development', 'staging', 'production']),
  classification: z.enum(['public', 'internal', 'confidential', 'restricted']),
  region: z.string(),
  industry: z.string().optional(),
  dataTypes: z.array(z.string()).optional()
});

const ValidateConformanceSchema = z.object({
  agent: z.object({
    apiVersion: z.string(),
    kind: z.string(),
    metadata: z.object({
      name: z.string(),
      version: z.string(),
      description: z.string().optional(),
      author: z.string().optional()
    }),
    spec: z.object({
      type: z.string(),
      subtype: z.string().optional(),
      capabilities: z.any(),
      protocols: z.any().optional(),
      conformance: z.any().optional(),
      performance: z.any().optional(),
      budgets: z.any().optional()
    })
  }),
  context: ComplianceContextSchema,
  frameworks: z.array(z.string()).optional().default([])
});

const BatchValidationSchema = z.object({
  agents: z.array(z.any()),
  context: ComplianceContextSchema,
  frameworks: z.array(z.string()).optional().default([])
});

// Initialize compliance engine
const complianceEngine = new ComplianceEngine();

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    service: 'ossa-compliance-engine',
    version: '0.1.9-alpha.1',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    capabilities: [
      'ossa-conformance-validation',
      'regulatory-compliance',
      'enterprise-policy-enforcement',
      'audit-trail-management'
    ]
  });
});

/**
 * Get supported compliance frameworks
 * GET /api/v1/compliance/frameworks
 */
app.get('/api/v1/compliance/frameworks', (req, res) => {
  try {
    const frameworks = complianceEngine.getSupportedFrameworks();
    res.json({
      success: true,
      data: frameworks.map(f => ({
        id: f.id,
        name: f.name,
        version: f.version,
        standard: f.standard,
        requirementCount: f.requirements.length,
        conformanceMappings: f.mappings.map(m => ({
          ossaLevel: m.ossaLevel,
          requirementCount: m.requirementIds.length
        }))
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve compliance frameworks',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get enterprise policies
 * GET /api/v1/compliance/policies
 */
app.get('/api/v1/compliance/policies', (req, res) => {
  try {
    const policies = complianceEngine.getEnterprisePolicies();
    res.json({
      success: true,
      data: policies.map(p => ({
        policyId: p.policyId,
        enforcementLevel: p.enforcementLevel,
        scope: p.scope,
        ruleCount: p.rules.length
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve enterprise policies',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Validate single agent OSSA conformance
 * POST /api/v1/compliance/validate
 */
app.post('/api/v1/compliance/validate', async (req, res) => {
  try {
    const validation = ValidateConformanceSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: validation.error.issues
      });
    }

    const { agent, context, frameworks } = validation.data;
    
    const result = await complianceEngine.validateOSSAConformance(
      agent as OSSAAgent,
      context,
      frameworks
    );

    res.json({
      success: true,
      data: {
        agentName: agent.metadata.name,
        agentVersion: agent.metadata.version,
        compliant: result.compliant,
        score: result.score,
        findings: result.findings.map(f => ({
          id: f.id,
          severity: f.severity,
          category: f.category,
          requirement: f.requirement,
          description: f.description,
          remediation: f.remediation
        })),
        recommendations: result.recommendations,
        context,
        frameworks,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Compliance validation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Validate multiple agents (batch processing)
 * POST /api/v1/compliance/validate/batch
 */
app.post('/api/v1/compliance/validate/batch', async (req, res) => {
  try {
    const validation = BatchValidationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: validation.error.issues
      });
    }

    const { agents, context, frameworks } = validation.data;
    
    const report = await complianceEngine.generateComplianceReport(
      agents as OSSAAgent[],
      context,
      frameworks
    );

    res.json({
      success: true,
      data: {
        summary: report.summary,
        results: report.agentResults.map(r => ({
          agentName: r.agent.metadata.name,
          agentVersion: r.agent.metadata.version,
          compliant: r.result.compliant,
          score: r.result.score,
          criticalFindings: r.result.findings.filter(f => f.severity === 'critical').length,
          totalFindings: r.result.findings.length
        })),
        recommendations: report.recommendations,
        context,
        frameworks,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Batch compliance validation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get compliance audit trail
 * GET /api/v1/compliance/audit
 */
app.get('/api/v1/compliance/audit', (req, res) => {
  try {
    const since = req.query.since as string | undefined;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    let auditTrail = complianceEngine.getAuditTrail(since);
    
    // Pagination
    const total = auditTrail.length;
    auditTrail = auditTrail.slice(offset, offset + limit);

    res.json({
      success: true,
      data: {
        entries: auditTrail,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve audit trail',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate comprehensive compliance report
 * POST /api/v1/compliance/report
 */
app.post('/api/v1/compliance/report', async (req, res) => {
  try {
    const validation = BatchValidationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: validation.error.issues
      });
    }

    const { agents, context, frameworks } = validation.data;
    
    const report = await complianceEngine.generateComplianceReport(
      agents as OSSAAgent[],
      context,
      frameworks
    );

    // Generate detailed report format
    const detailedReport = {
      executiveSummary: {
        ...report.summary,
        complianceRate: (report.summary.compliantAgents / report.summary.totalAgents * 100).toFixed(1) + '%',
        riskLevel: report.summary.criticalFindings > 0 ? 'High' : 
                  report.summary.averageScore < 70 ? 'Medium' : 'Low'
      },
      agentDetails: report.agentResults.map(r => ({
        agent: {
          name: r.agent.metadata.name,
          version: r.agent.metadata.version,
          type: r.agent.spec.type,
          conformanceLevel: r.agent.spec.conformance?.level || 'bronze'
        },
        compliance: {
          compliant: r.result.compliant,
          score: r.result.score,
          findings: r.result.findings,
          recommendations: r.result.recommendations
        }
      })),
      systemRecommendations: report.recommendations,
      auditMetadata: {
        context,
        frameworks,
        reportGenerated: new Date().toISOString(),
        auditTrailEntries: report.auditTrail.length
      }
    };

    res.json({
      success: true,
      data: detailedReport
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate compliance report',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get OSSA conformance levels and requirements
 * GET /api/v1/compliance/conformance-levels
 */
app.get('/api/v1/compliance/conformance-levels', (req, res) => {
  try {
    const levels = complianceEngine.getConformanceLevels();
    
    res.json({
      success: true,
      data: {
        ossaVersion: '0.1.9-alpha.1',
        levels: Object.entries(levels).map(([level, requirements]) => ({
          level,
          requirements: {
            minCapabilities: requirements.minCapabilities,
            minProtocols: requirements.minProtocols,
            features: {
              auditLogging: requirements.auditLogging,
              feedbackLoop: requirements.feedbackLoop,
              propsTokens: requirements.propsTokens,
              learningSignals: requirements.learningSignals
            }
          }
        }))
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve conformance levels',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Enterprise dashboard metrics
 * GET /api/v1/compliance/metrics
 */
app.get('/api/v1/compliance/metrics', (req, res) => {
  try {
    const auditTrail = complianceEngine.getAuditTrail();
    const recentEntries = auditTrail.filter(entry => 
      new Date(entry.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    const metrics = {
      totalValidations: auditTrail.filter(e => e.action === 'validate-conformance').length,
      validationsLast24h: recentEntries.filter(e => e.action === 'validate-conformance').length,
      successRate: auditTrail.length > 0 ? 
        (auditTrail.filter(e => e.outcome === 'success').length / auditTrail.length * 100).toFixed(1) + '%' : 
        '0%',
      supportedFrameworks: complianceEngine.getSupportedFrameworks().length,
      enterprisePolicies: complianceEngine.getEnterprisePolicies().length,
      lastValidation: auditTrail.length > 0 ? auditTrail[auditTrail.length - 1].timestamp : null
    };

    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve compliance metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Compliance Engine API Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `${req.method} ${req.path} is not a valid compliance engine endpoint`
  });
});

const PORT = process.env.OSSA_COMPLIANCE_PORT || 3004;

export function startComplianceServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const server = app.listen(PORT, () => {
        console.log(`🛡️  OSSA Compliance Engine running on port ${PORT}`);
        console.log(`📊 Enterprise governance and compliance validation active`);
        console.log(`🔍 Supported frameworks: ${complianceEngine.getSupportedFrameworks().length}`);
        console.log(`📋 Enterprise policies: ${complianceEngine.getEnterprisePolicies().length}`);
        resolve();
      });

      server.on('error', (error) => {
        console.error('Failed to start compliance engine server:', error);
        reject(error);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => {
        console.log('Shutting down compliance engine server...');
        server.close(() => {
          console.log('Compliance engine server stopped');
          process.exit(0);
        });
      });

    } catch (error) {
      reject(error);
    }
  });
}

export default app;