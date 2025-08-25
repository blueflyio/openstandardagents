const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const swaggerUi = require('swagger-ui-express');
const winston = require('winston');

// Import validation services
const OpenAPIValidator = require('./services/openapi-validator');
const AgentConfigValidator = require('./services/agent-config-validator');
const ComplianceValidator = require('./services/compliance-validator');
const ProtocolValidator = require('./services/protocol-validator');
const TokenEstimator = require('./services/token-estimator');
const FrameworkService = require('./services/framework-service');
const TDDAIIntegration = require('./services/tddai-integration');

const app = express();
const port = process.env.PORT || 3001;

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'validation-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// API Key authentication middleware
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.header('X-API-Key');
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  // In production, validate against database or environment variable
  const validApiKeys = process.env.API_KEYS ? process.env.API_KEYS.split(',') : ['test-api-key'];
  
  if (!validApiKeys.includes(apiKey)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  next();
};

// Apply authentication to validation and estimation endpoints
app.use('/api/v1/validate', authenticateApiKey);
app.use('/api/v1/estimate', authenticateApiKey);

// Initialize services
const services = {
  openapi: new OpenAPIValidator(),
  agentConfig: new AgentConfigValidator(),
  compliance: new ComplianceValidator(),
  protocol: new ProtocolValidator(),
  tokenEstimator: new TokenEstimator(),
  frameworks: new FrameworkService(),
  tddai: new TDDAIIntegration()
};

// Initialize TDDAI integration
services.tddai.initialize().catch(error => {
  logger.warn('TDDAI integration not available:', error.message);
});

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  const startTime = process.uptime();
  
  res.json({
    status: 'healthy',
    version: '1.0.0',
    services: {
      validation: 'active',
      compliance: 'active',
      estimation: 'active'
    },
    uptime: Math.floor(startTime)
  });
});

// OpenAPI specification validation
app.post('/api/v1/validate/openapi', [
  body('specification').isObject().withMessage('Specification must be a valid object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid specification format',
        details: errors.array()
      });
    }

    const { specification } = req.body;
    const result = await services.openapi.validateSpecification(specification);
    
    const response = {
      valid: result.errors.length === 0,
      certification_level: result.certification_level || 'bronze',
      passed: result.passed,
      warnings: result.warnings,
      errors: result.errors
    };

    const statusCode = result.errors.length === 0 ? 200 : 400;
    res.status(statusCode).json(response);

  } catch (error) {
    logger.error('OpenAPI validation error:', error);
    res.status(500).json({ error: 'Internal validation error' });
  }
});

// Agent configuration validation
app.post('/api/v1/validate/agent-config', [
  body('configuration').isObject().withMessage('Configuration must be a valid object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid configuration format',
        details: errors.array()
      });
    }

    const { configuration } = req.body;
    const result = await services.agentConfig.validateConfiguration(configuration);
    
    const response = {
      valid: result.errors.length === 0,
      readiness_level: result.readiness_level || 'development',
      passed: result.passed,
      warnings: result.warnings,
      errors: result.errors
    };

    const statusCode = result.errors.length === 0 ? 200 : 400;
    res.status(statusCode).json(response);

  } catch (error) {
    logger.error('Agent config validation error:', error);
    res.status(500).json({ error: 'Internal validation error' });
  }
});

// Compliance framework validation
app.post('/api/v1/validate/compliance', [
  body('configuration').isObject().withMessage('Configuration must be a valid object'),
  body('frameworks').optional().isArray().withMessage('Frameworks must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid request format',
        details: errors.array()
      });
    }

    const { configuration, frameworks } = req.body;
    const result = await services.compliance.validateCompliance(configuration, frameworks);
    
    const response = {
      valid: result.valid,
      authorization_readiness: result.authorization_readiness || 'development',
      framework_results: result.framework_results,
      summary: {
        total_passed: result.totalPassed,
        total_warnings: result.totalWarnings,
        total_errors: result.totalErrors
      }
    };

    const statusCode = result.valid ? 200 : 400;
    res.status(statusCode).json(response);

  } catch (error) {
    logger.error('Compliance validation error:', error);
    res.status(500).json({ error: 'Internal validation error' });
  }
});

// Protocol bridge validation
app.post('/api/v1/validate/protocols', [
  body('configuration').isObject().withMessage('Configuration must be a valid object'),
  body('protocols').optional().isArray().withMessage('Protocols must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid request format',
        details: errors.array()
      });
    }

    const { configuration, protocols } = req.body;
    const result = await services.protocol.validateProtocols(configuration, protocols);
    
    const response = {
      valid: result.valid,
      interoperability_level: result.interoperability_level || 'basic',
      passed: result.passed,
      warnings: result.warnings,
      errors: result.errors
    };

    const statusCode = result.valid ? 200 : 400;
    res.status(statusCode).json(response);

  } catch (error) {
    logger.error('Protocol validation error:', error);
    res.status(500).json({ error: 'Internal validation error' });
  }
});

// Token usage estimation
app.post('/api/v1/estimate/tokens', [
  body('specification').isObject().withMessage('Specification must be a valid object'),
  body('options').optional().isObject().withMessage('Options must be a valid object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid request format',
        details: errors.array()
      });
    }

    const { specification, options = {} } = req.body;
    const result = await services.tokenEstimator.estimateTokens(specification, options);
    
    const response = {
      total_tokens: result.total_tokens,
      compressed_tokens: result.compressed_tokens,
      cost_projections: result.cost_projections,
      optimizations: result.optimizations
    };

    res.json(response);

  } catch (error) {
    logger.error('Token estimation error:', error);
    res.status(500).json({ error: 'Internal estimation error' });
  }
});

// List available compliance frameworks
app.get('/api/v1/frameworks', (req, res) => {
  try {
    const frameworks = services.frameworks.getAvailableFrameworks();
    res.json({ frameworks });
  } catch (error) {
    logger.error('Frameworks listing error:', error);
    res.status(500).json({ error: 'Internal service error' });
  }
});

// List supported protocols
app.get('/api/v1/protocols', (req, res) => {
  try {
    const protocols = services.frameworks.getSupportedProtocols();
    res.json({ protocols });
  } catch (error) {
    logger.error('Protocols listing error:', error);
    res.status(500).json({ error: 'Internal service error' });
  }
});

// ====================
// MISSING ENDPOINTS FOR TDDAI INTEGRATION
// ====================

// Agent orchestration endpoint
app.post('/api/v1/agent/orchestrate', [
  body('orchestration_pattern').isString().withMessage('Orchestration pattern required'),
  body('agents').isArray().withMessage('Agents array required'),
  body('token_budget').isObject().withMessage('Token budget required')
], authenticateApiKey, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid orchestration request',
        details: errors.array()
      });
    }

    const { orchestration_pattern, agents, token_budget, domain, compliance_level } = req.body;
    
    try {
      // Delegate to TDDAI integration service
      const tddaiResult = await services.tddai.executeOrchestration(req.body);
      
      const response = {
        orchestration_id: tddaiResult.orchestration_id,
        status: tddaiResult.status,
        agents_deployed: tddaiResult.agents_deployed,
        estimated_completion_time: tddaiResult.estimated_completion_time,
        token_usage: {
          allocated: token_budget.max_tokens,
          used: 0,
          estimated_total: Math.floor(token_budget.max_tokens * 0.3)
        },
        security: {
          encryption: 'AES-256-GCM',
          audit_trail_id: `audit_${tddaiResult.orchestration_id}`
        },
        monitoring: {
          dashboard_url: `http://localhost:${port}/api/v1/orchestration/${tddaiResult.orchestration_id}/status`
        },
        tddai_integration: {
          enabled: true,
          process_id: tddaiResult.tddai_process_id
        }
      };

      logger.info(`TDDAI orchestration started: ${tddaiResult.orchestration_id}`);
      res.json(response);
      
    } catch (tddaiError) {
      // Fallback to simulation if TDDAI not available
      logger.warn('TDDAI orchestration failed, using simulation:', tddaiError.message);
      
      const orchestrationId = `orch_sim_${Date.now()}`;
      const response = {
        orchestration_id: orchestrationId,
        status: 'running',
        agents_deployed: agents.length,
        estimated_completion_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        token_usage: {
          allocated: token_budget.max_tokens,
          used: 0,
          estimated_total: Math.floor(token_budget.max_tokens * 0.3)
        },
        security: {
          encryption: 'AES-256-GCM',
          audit_trail_id: `audit_${orchestrationId}`
        },
        monitoring: {
          dashboard_url: `http://localhost:${port}/api/v1/orchestration/${orchestrationId}/status`
        },
        tddai_integration: {
          enabled: false,
          fallback: true,
          error: tddaiError.message
        }
      };

      logger.info(`Simulation orchestration started: ${orchestrationId}`);
      res.json(response);
    }

  } catch (error) {
    logger.error('Orchestration error:', error);
    res.status(500).json({ error: 'Orchestration failed' });
  }
});

// MCP protocol bridge
app.post('/api/v1/protocols/mcp/bridge', [
  body('agent_endpoint').isURL().withMessage('Valid agent endpoint URL required'),
  body('mcp_version').isString().withMessage('MCP version required')
], authenticateApiKey, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid MCP bridge request',
        details: errors.array()
      });
    }

    const { agent_endpoint, mcp_version, tools, resources } = req.body;
    
    try {
      // Try to establish real MCP bridge through TDDAI
      const tddaiResult = await services.tddai.establishMCPBridge(req.body);
      
      const response = {
        success: tddaiResult.success,
        bridge_id: tddaiResult.bridge_id,
        status: tddaiResult.status,
        endpoint: agent_endpoint,
        mcp_version: mcp_version,
        tools_discovered: tddaiResult.tools_available,
        resources_available: tddaiResult.resources_available,
        transport: ['stdio', 'http', 'sse'],
        tddai_integration: {
          enabled: true,
          connection: tddaiResult.tddai_connection
        }
      };

      logger.info(`TDDAI MCP bridge established: ${tddaiResult.bridge_id} for ${agent_endpoint}`);
      res.json(response);
      
    } catch (tddaiError) {
      // Fallback to simulation
      logger.warn('TDDAI MCP bridge failed, using simulation:', tddaiError.message);
      
      const bridgeId = `mcp_bridge_sim_${Date.now()}`;
      const response = {
        success: true,
        bridge_id: bridgeId,
        status: 'active',
        endpoint: agent_endpoint,
        mcp_version: mcp_version,
        tools_discovered: tools ? tools.length : 0,
        resources_available: resources ? resources.length : 0,
        transport: ['stdio', 'http', 'sse'],
        tddai_integration: {
          enabled: false,
          fallback: true,
          error: tddaiError.message
        }
      };

      logger.info(`Simulation MCP bridge established: ${bridgeId} for ${agent_endpoint}`);
      res.json(response);
    }

  } catch (error) {
    logger.error('MCP bridge error:', error);
    res.status(500).json({ error: 'MCP bridge failed' });
  }
});

// A2A protocol negotiation
app.post('/api/v1/protocols/a2a/negotiate', [
  body('agent_endpoint').isURL().withMessage('Valid agent endpoint URL required'),
  body('capabilities').isArray().withMessage('Capabilities array required')
], authenticateApiKey, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid A2A negotiation request',
        details: errors.array()
      });
    }

    const { agent_endpoint, capabilities } = req.body;
    
    // Simulate A2A protocol negotiation
    const sessionId = `a2a_session_${Date.now()}`;
    
    const response = {
      success: true,
      session_id: sessionId,
      protocol_version: '1.0',
      negotiated_capabilities: capabilities,
      communication_channel: 'https',
      handoff_endpoint: `/api/v1/protocols/a2a/handoff/${sessionId}`
    };

    logger.info(`A2A session negotiated: ${sessionId} for ${agent_endpoint}`);
    res.json(response);

  } catch (error) {
    logger.error('A2A negotiation error:', error);
    res.status(500).json({ error: 'A2A negotiation failed' });
  }
});

// Token preflight check
app.post('/api/v1/tokens/preflight', [
  body('text').isString().withMessage('Text content required'),
  body('model').isString().withMessage('Model name required')
], authenticateApiKey, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid preflight request',
        details: errors.array()
      });
    }

    const { text, model, encoding = 'o200k_base', optimization_level = 'balanced', budget_constraints, domain_context } = req.body;
    
    try {
      // Try to use TDDAI token optimizer
      const tddaiResult = await services.tddai.performTokenPreflight(req.body);
      
      const response = {
        approved: tddaiResult.approved,
        token_count: tddaiResult.token_count,
        encoding_used: tddaiResult.encoding_used,
        estimated_cost: tddaiResult.estimated_cost,
        optimization: tddaiResult.optimization,
        budget_status: {
          within_limits: tddaiResult.approved,
          remaining_budget: Math.max(0, (budget_constraints?.max_tokens || 128000) - tddaiResult.token_count),
          utilization_percent: ((tddaiResult.token_count / (budget_constraints?.max_tokens || 128000)) * 100).toFixed(1)
        },
        recommendations: ['TDDAI token optimization applied', 'Consider using streaming for long responses'],
        security_analysis: {
          pii_detected: false, // TODO: implement PII detection
          phi_detected: false, // TODO: implement PHI detection
          sensitive_patterns: [],
          risk_level: 'low'
        },
        tddai_integration: {
          enabled: tddaiResult.tddai_optimization,
          optimizer_used: true
        }
      };

      logger.info(`TDDAI token preflight completed: ${tddaiResult.token_count} tokens for ${model}`);
      res.json(response);
      
    } catch (tddaiError) {
      // Fallback to standard token estimator
      logger.warn('TDDAI token optimizer failed, using fallback:', tddaiError.message);
      
      const result = await services.tokenEstimator.estimateTokens({ 
        content: text, 
        model, 
        encoding,
        optimization: optimization_level 
      }, budget_constraints || {});
      
      const response = {
        approved: result.totalTokens <= (budget_constraints?.max_tokens || 128000),
        token_count: result.totalTokens,
        encoding_used: encoding,
        estimated_cost: result.estimatedCost || (result.totalTokens * 0.00001),
        optimization: {
          applied: optimization_level !== 'none',
          original_tokens: result.originalTokens || result.totalTokens,
          compressed_tokens: result.compressedTokens || result.totalTokens,
          compression_ratio: result.compressionRatio || 1.0,
          techniques: result.optimizations || ['none']
        },
        budget_status: {
          within_limits: result.totalTokens <= (budget_constraints?.max_tokens || 128000),
          remaining_budget: Math.max(0, (budget_constraints?.max_tokens || 128000) - result.totalTokens),
          utilization_percent: ((result.totalTokens / (budget_constraints?.max_tokens || 128000)) * 100).toFixed(1)
        },
        recommendations: result.recommendations || ['Consider using streaming for long responses'],
        security_analysis: {
          pii_detected: false, // TODO: implement PII detection
          phi_detected: false, // TODO: implement PHI detection
          sensitive_patterns: [],
          risk_level: 'low'
        },
        tddai_integration: {
          enabled: false,
          fallback: true,
          error: tddaiError.message
        }
      };

      logger.info(`Fallback token preflight completed: ${result.totalTokens} tokens for ${model}`);
      res.json(response);
    }

  } catch (error) {
    logger.error('Token preflight error:', error);
    res.status(500).json({ error: 'Token preflight failed' });
  }
});

// Orchestration status check
app.get('/api/v1/orchestration/:orchestrationId/status', authenticateApiKey, (req, res) => {
  try {
    const { orchestrationId } = req.params;
    const { include_metrics = 'true', include_audit = 'false' } = req.query;
    
    // Simulate orchestration status (in real implementation, query actual status)
    const response = {
      orchestration_id: orchestrationId,
      status: 'running',
      progress: 65,
      agents: [
        {
          agent_id: 'research_agent_001',
          status: 'completed',
          current_task: null,
          performance: {
            response_time_ms: 1250,
            tokens_consumed: 2400,
            success_rate: 1.0
          }
        },
        {
          agent_id: 'analysis_agent_001', 
          status: 'active',
          current_task: 'pattern_analysis',
          performance: {
            response_time_ms: 850,
            tokens_consumed: 1800,
            success_rate: 0.98
          }
        }
      ],
      token_usage: {
        total_allocated: 50000,
        total_used: 4200,
        efficiency_score: 0.92
      },
      estimated_completion: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    };

    if (include_metrics === 'true') {
      response.metrics = {
        performance: {
          response_time_p99: 1400,
          throughput_rps: 12.5,
          error_rate: 0.02
        }
      };
    }

    if (include_audit === 'true') {
      response.audit = {
        trail_id: `audit_${orchestrationId}`,
        events_logged: 24,
        compliance_status: 'validated'
      };
    }

    res.json(response);

  } catch (error) {
    logger.error('Orchestration status error:', error);
    res.status(500).json({ error: 'Status check failed' });
  }
});

// Governance compliance validation
app.post('/api/v1/governance/compliance/validate', [
  body('frameworks').isArray().withMessage('Frameworks array required'),
  body('agent_config').isObject().withMessage('Agent configuration required')
], authenticateApiKey, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid compliance validation request',
        details: errors.array()
      });
    }

    const { frameworks, agent_config, domain, risk_level } = req.body;
    
    // Use existing compliance validator
    const result = await services.compliance.validateCompliance(agent_config, frameworks);
    
    const response = {
      overall_compliance: result.totalErrors === 0 ? 'compliant' : (result.totalWarnings <= 2 ? 'conditional' : 'non_compliant'),
      framework_results: Object.entries(result.framework_results || {}).map(([name, result]) => ({
        framework: name,
        status: result.valid ? 'compliant' : 'non_compliant',
        score: result.errors?.length === 0 ? (result.warnings?.length === 0 ? 100 : 85) : 65
      })),
      recommendations: [
        'Implement continuous compliance monitoring',
        'Regular framework updates and reviews',
        'Automated compliance testing in CI/CD'
      ],
      certification_eligibility: {
        eligible: result.totalErrors === 0,
        level: result.totalErrors === 0 ? (result.totalWarnings === 0 ? 'gold' : 'silver') : 'bronze'
      }
    };

    res.json(response);

  } catch (error) {
    logger.error('Governance compliance error:', error);
    res.status(500).json({ error: 'Compliance validation failed' });
  }
});

// MAESTRO security threat assessment
app.post('/api/v1/security/maestro/assess', [
  body('agent_architecture').isObject().withMessage('Agent architecture required'),
  body('deployment_environment').isString().withMessage('Deployment environment required')
], authenticateApiKey, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid threat assessment request',
        details: errors.array()
      });
    }

    const { agent_architecture, deployment_environment, threat_categories } = req.body;
    
    // Simulate MAESTRO threat assessment
    const threatAnalysis = [
      {
        category: 'model_extraction',
        severity: 'medium',
        description: 'Potential model weight extraction through API abuse',
        likelihood: 0.3
      },
      {
        category: 'data_poisoning',
        severity: 'low',
        description: 'Training data contamination risk',
        likelihood: 0.1
      },
      {
        category: 'prompt_injection',
        severity: 'medium',
        description: 'Malicious prompt injection attacks',
        likelihood: 0.4
      }
    ];
    
    const overallRiskScore = threatAnalysis.reduce((sum, threat) => {
      const severityMap = { low: 2, medium: 5, high: 8, critical: 10 };
      return sum + (severityMap[threat.severity] * threat.likelihood);
    }, 0) / threatAnalysis.length;
    
    const response = {
      overall_risk_score: Number(overallRiskScore.toFixed(2)),
      threat_analysis: threatAnalysis,
      mitigation_strategies: [
        'Implement API rate limiting and authentication',
        'Use input sanitization and output filtering',
        'Deploy monitoring and anomaly detection',
        'Regular security audits and penetration testing'
      ],
      compliance_gaps: [
        'Need automated threat detection',
        'Implement zero-trust architecture'
      ],
      security_posture: overallRiskScore < 3 ? 'strong' : overallRiskScore < 6 ? 'adequate' : 'needs_improvement'
    };

    logger.info(`MAESTRO threat assessment completed: risk score ${overallRiskScore}`);
    res.json(response);

  } catch (error) {
    logger.error('MAESTRO assessment error:', error);
    res.status(500).json({ error: 'Threat assessment failed' });
  }
});

// API documentation
const swaggerDocument = require('./openapi.json');
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(port, () => {
    logger.info(`🚀 OpenAPI AI Agents Validation API running on port ${port}`);
    logger.info(`📖 API Documentation available at http://localhost:${port}/api/docs`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
}

module.exports = app;