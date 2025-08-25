const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const winston = require('winston');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const axios = require('axios');
const { get_encoding } = require('tiktoken');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3002;

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'toolkit.log' })
  ]
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

// Universal Agent Toolkit Service
class UniversalAgentToolkit {
  constructor() {
    this.validationApiUrl = 'http://localhost:3001/api/v1';
    this.tiktoken = get_encoding('o200k_base'); // GPT-4o encoding
    this.templates = this.loadTemplates();
    this.protocolBridges = this.initializeProtocolBridges();
  }

  loadTemplates() {
    try {
      const agentTemplate = yaml.load(fs.readFileSync(path.join(__dirname, '../../examples/basic/agent.yml'), 'utf8'));
      const openapiTemplate = yaml.load(fs.readFileSync(path.join(__dirname, '../../examples/basic/openapi.yaml'), 'utf8'));
      return { agent: agentTemplate, openapi: openapiTemplate };
    } catch (error) {
      logger.error('Failed to load templates:', error);
      return { agent: null, openapi: null };
    }
  }

  initializeProtocolBridges() {
    return {
      mcp: {
        enabled: true,
        version: '1.0',
        endpoint: '/bridges/mcp',
        latency_target: 100 // ms
      },
      a2a: {
        enabled: true,
        version: '1.0', 
        endpoint: '/bridges/a2a',
        latency_target: 100 // ms
      },
      aitp: {
        enabled: false,
        version: 'experimental',
        endpoint: '/bridges/aitp',
        latency_target: 150 // ms
      }
    };
  }

  discoverAgents() {
    const agents = [];
    const searchPaths = [
      path.join(__dirname, '../../examples/agents'),
      path.join(__dirname, '../../services')
    ];

    for (const searchPath of searchPaths) {
      try {
        if (fs.existsSync(searchPath)) {
          const entries = fs.readdirSync(searchPath, { withFileTypes: true });
          
          for (const entry of entries) {
            if (entry.isDirectory()) {
              const agentPath = path.join(searchPath, entry.name);
              const agentYmlPath = path.join(agentPath, 'agent.yml');
              const openapiYmlPath = path.join(agentPath, 'openapi.yaml');
              
              if (fs.existsSync(agentYmlPath) && fs.existsSync(openapiYmlPath)) {
                try {
                  const agentConfig = yaml.load(fs.readFileSync(agentYmlPath, 'utf8'));
                  const openapiSpec = yaml.load(fs.readFileSync(openapiYmlPath, 'utf8'));
                  
                  agents.push({
                    name: entry.name,
                    path: agentPath,
                    type: searchPath.includes('examples') ? 'example' : 'service',
                    agent_config: agentConfig,
                    openapi_spec: openapiSpec,
                    endpoints: Object.keys(openapiSpec.paths || {}),
                    capabilities: agentConfig.spec?.capabilities || [],
                    certification_level: agentConfig.metadata?.labels?.['openapi-ai-agents.org/certification-level'] || 'bronze'
                  });
                } catch (parseError) {
                  logger.warn(`Failed to parse agent ${entry.name}:`, parseError.message);
                }
              }
            }
          }
        }
      } catch (error) {
        logger.warn(`Failed to scan directory ${searchPath}:`, error.message);
      }
    }

    return agents;
  }

  async validateWithAPI(specification) {
    try {
      const response = await axios.post(`${this.validationApiUrl}/validate/openapi`, {
        specification
      }, {
        headers: {
          'X-API-Key': 'toolkit-service',
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      logger.error('Validation API call failed:', error.message);
      throw new Error('Validation service unavailable');
    }
  }

  async validateDualFormatWithAPI(agentConfig, openApiSpec) {
    try {
      const response = await axios.post(`${this.validationApiUrl}/validate/dual-format`, {
        agent_config: agentConfig,
        openapi_spec: openApiSpec
      }, {
        headers: {
          'X-API-Key': 'toolkit-service',
          'Content-Type': 'application/json'
        },
        timeout: 15000 // Longer timeout for dual-format validation
      });
      return response.data;
    } catch (error) {
      logger.error('Dual-format validation API call failed:', error.message);
      throw new Error('Dual-format validation service unavailable');
    }
  }

  optimizeTokens(text, targetReduction = 0.4) {
    try {
      const tokens = this.tiktoken.encode(text);
      const originalCount = tokens.length;
      
      // Simple optimization strategies
      let optimizedText = text
        .replace(/\s+/g, ' ')           // Multiple spaces -> single space
        .replace(/\n\s*\n/g, '\n')     // Multiple newlines -> single
        .trim();                        // Remove leading/trailing whitespace

      // More aggressive optimization for larger reductions
      if (targetReduction > 0.3) {
        optimizedText = optimizedText
          .replace(/\b(the|a|an)\b\s+/gi, '')  // Remove articles
          .replace(/\b(very|really|quite)\b\s+/gi, ''); // Remove intensifiers
      }

      const optimizedTokens = this.tiktoken.encode(optimizedText);
      const optimizedCount = optimizedTokens.length;
      const actualReduction = (originalCount - optimizedCount) / originalCount;

      return {
        original_text: text,
        optimized_text: optimizedText,
        original_tokens: originalCount,
        optimized_tokens: optimizedCount,
        reduction_achieved: actualReduction,
        reduction_percentage: Math.round(actualReduction * 100),
        savings: originalCount - optimizedCount
      };
    } catch (error) {
      logger.error('Token optimization failed:', error);
      return {
        error: 'Token optimization failed',
        original_text: text,
        optimized_text: text,
        reduction_achieved: 0
      };
    }
  }

  async executeAgent(agentConfig, task) {
    logger.info(`Executing agent: ${agentConfig.metadata?.name || 'unknown'}`);
    
    // Simulate agent execution
    const startTime = Date.now();
    
    // Token optimization
    const tokenOptimization = this.optimizeTokens(JSON.stringify(task));
    
    // Simulate task processing
    const result = {
      agent: agentConfig.metadata?.name || 'unknown',
      task_id: `task_${Date.now()}`,
      status: 'completed',
      execution_time_ms: Date.now() - startTime,
      token_optimization: tokenOptimization,
      protocol_bridge: 'openapi', // Default protocol
      result: {
        message: 'Agent execution simulated successfully',
        data: task,
        timestamp: new Date().toISOString()
      }
    };

    return result;
  }

  async orchestrateAgents(pattern, agents, task) {
    logger.info(`Orchestrating ${agents.length} agents with pattern: ${pattern}`);
    
    const startTime = Date.now();
    const results = [];

    switch (pattern) {
      case 'sequential':
        for (const agent of agents) {
          const result = await this.executeAgent(agent, task);
          results.push(result);
        }
        break;
        
      case 'parallel':
        const promises = agents.map(agent => this.executeAgent(agent, task));
        const parallelResults = await Promise.all(promises);
        results.push(...parallelResults);
        break;
        
      case 'diagnostic_first':
        // Research -> Analysis -> Implementation
        const phases = ['research', 'analysis', 'implementation'];
        for (let i = 0; i < Math.min(phases.length, agents.length); i++) {
          const phaseTask = { ...task, phase: phases[i] };
          const result = await this.executeAgent(agents[i], phaseTask);
          results.push(result);
        }
        break;
        
      default:
        throw new Error(`Unknown orchestration pattern: ${pattern}`);
    }

    return {
      pattern,
      agents_count: agents.length,
      execution_time_ms: Date.now() - startTime,
      results,
      summary: {
        successful: results.filter(r => r.status === 'completed').length,
        failed: results.filter(r => r.status === 'failed').length,
        total_token_savings: results.reduce((sum, r) => sum + (r.token_optimization?.savings || 0), 0)
      }
    };
  }
}

const toolkit = new UniversalAgentToolkit();

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'universal-agent-toolkit',
    version: '1.0.0',
    port: port,
    validation_api: toolkit.validationApiUrl,
    protocol_bridges: toolkit.protocolBridges,
    tiktoken_ready: !!toolkit.tiktoken
  });
});

// Execute single agent
app.post('/execute/agent', [
  body('agent_config').isObject(),
  body('task').isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { agent_config, task } = req.body;
    const result = await toolkit.executeAgent(agent_config, task);
    
    res.json({
      success: true,
      execution_result: result
    });
  } catch (error) {
    logger.error('Agent execution failed:', error);
    res.status(500).json({ error: 'Agent execution failed', details: error.message });
  }
});

// Orchestrate multiple agents  
app.post('/orchestrate', [
  body('pattern').isIn(['sequential', 'parallel', 'diagnostic_first']),
  body('agents').isArray(),
  body('task').isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { pattern, agents, task } = req.body;
    const result = await toolkit.orchestrateAgents(pattern, agents, task);
    
    res.json({
      success: true,
      orchestration_result: result
    });
  } catch (error) {
    logger.error('Agent orchestration failed:', error);
    res.status(500).json({ error: 'Agent orchestration failed', details: error.message });
  }
});

// Optimize tokens
app.post('/optimize/tokens', [
  body('text').isString().isLength({ min: 1, max: 100000 }),
  body('target_reduction').optional().isFloat({ min: 0.1, max: 0.8 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { text, target_reduction = 0.4 } = req.body;
    const optimization = toolkit.optimizeTokens(text, target_reduction);
    
    res.json({
      success: true,
      token_optimization: optimization
    });
  } catch (error) {
    logger.error('Token optimization failed:', error);
    res.status(500).json({ error: 'Token optimization failed', details: error.message });
  }
});

// Validate agent configuration
app.post('/validate', [
  body('specification').isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const validation = await toolkit.validateWithAPI(req.body.specification);
    
    res.json({
      success: true,
      validation_result: validation,
      next_steps: validation.valid ? 
        ['Execute agent', 'Add to orchestration'] :
        ['Fix validation errors', 'Re-validate']
    });
  } catch (error) {
    logger.error('Agent validation failed:', error);
    res.status(500).json({ error: 'Validation failed', details: error.message });
  }
});

// Validate dual-format (agent.yml + openapi.yaml)
app.post('/validate/dual-format', [
  body('agent_config').isObject(),
  body('openapi_spec').isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { agent_config, openapi_spec } = req.body;
    const validation = await toolkit.validateDualFormatWithAPI(agent_config, openapi_spec);
    
    res.json({
      success: true,
      validation_result: validation,
      certification_level: validation.certification_level,
      consistency_checks: validation.details?.relationship_validation || {},
      next_steps: validation.valid ? 
        ['Execute agent with full compliance', 'Add to orchestration', 'Deploy to production'] :
        ['Fix validation errors', 'Address warnings', 'Re-validate dual-format']
    });
  } catch (error) {
    logger.error('Dual-format validation failed:', error);
    res.status(500).json({ error: 'Dual-format validation failed', details: error.message });
  }
});

// Protocol bridges
app.get('/bridges/:protocol', (req, res) => {
  const { protocol } = req.params;
  const bridge = toolkit.protocolBridges[protocol];
  
  if (!bridge) {
    return res.status(404).json({ error: `Protocol bridge '${protocol}' not found` });
  }
  
  res.json({
    protocol,
    bridge_config: bridge,
    status: bridge.enabled ? 'active' : 'disabled'
  });
});

// Get available templates
app.get('/templates', (req, res) => {
  res.json({
    available_templates: {
      agent: toolkit.templates.agent ? 'Available' : 'Not loaded',
      openapi: toolkit.templates.openapi ? 'Available' : 'Not loaded'
    },
    endpoints: {
      agent_template: '/templates/agent',
      openapi_template: '/templates/openapi'
    }
  });
});

// Get agent template
app.get('/templates/agent', (req, res) => {
  if (!toolkit.templates.agent) {
    return res.status(404).json({ error: 'Agent template not loaded' });
  }
  res.json({
    template: toolkit.templates.agent,
    source: 'examples/basic/agent.yml'
  });
});

// Get OpenAPI template
app.get('/templates/openapi', (req, res) => {
  if (!toolkit.templates.openapi) {
    return res.status(404).json({ error: 'OpenAPI template not loaded' });
  }
  res.json({
    template: toolkit.templates.openapi,
    source: 'examples/basic/openapi.yaml'
  });
});

// Discover all agents in new structure
app.get('/agents/discover', async (req, res) => {
  try {
    const agents = toolkit.discoverAgents();
    const validateOnDiscovery = req.query.validate === 'true';
    
    // If validation requested, validate each agent using dual-format validation
    if (validateOnDiscovery) {
      const validatedAgents = [];
      
      for (const agent of agents) {
        try {
          const validation = await toolkit.validateDualFormatWithAPI(agent.agent_config, agent.openapi_spec);
          validatedAgents.push({
            ...agent,
            validation_result: {
              valid: validation.valid,
              certification_level: validation.certification_level,
              passed_checks: validation.passed?.length || 0,
              warnings: validation.warnings?.length || 0,
              errors: validation.errors?.length || 0,
              last_validated: new Date().toISOString()
            }
          });
        } catch (validationError) {
          validatedAgents.push({
            ...agent,
            validation_result: {
              valid: false,
              error: 'Validation service unavailable',
              last_validated: new Date().toISOString()
            }
          });
        }
      }
      
      return res.json({
        success: true,
        agents_found: agents.length,
        search_paths: ['examples/agents/', 'services/'],
        validation_enabled: true,
        agents: validatedAgents.map(agent => ({
          name: agent.name,
          type: agent.type,
          certification_level: agent.validation_result?.certification_level || agent.certification_level,
          capabilities: agent.capabilities,
          endpoints: agent.endpoints.length,
          validation_status: agent.validation_result?.valid ? 'valid' : 'invalid',
          validation_summary: {
            passed: agent.validation_result?.passed_checks || 0,
            warnings: agent.validation_result?.warnings || 0,
            errors: agent.validation_result?.errors || 0
          }
        })),
        detailed_agents: validatedAgents
      });
    }
    
    // Default behavior without validation
    res.json({
      success: true,
      agents_found: agents.length,
      search_paths: ['examples/agents/', 'services/'],
      validation_enabled: false,
      validation_hint: 'Add ?validate=true to enable dual-format validation on discovery',
      agents: agents.map(agent => ({
        name: agent.name,
        type: agent.type,
        certification_level: agent.certification_level,
        capabilities: agent.capabilities,
        endpoints: agent.endpoints.length
      })),
      detailed_agents: agents
    });
  } catch (error) {
    logger.error('Agent discovery failed:', error);
    res.status(500).json({ error: 'Agent discovery failed', details: error.message });
  }
});

// Get specific agent details
app.get('/agents/:agentName', (req, res) => {
  try {
    const { agentName } = req.params;
    const agents = toolkit.discoverAgents();
    const agent = agents.find(a => a.name === agentName);
    
    if (!agent) {
      return res.status(404).json({ error: `Agent '${agentName}' not found` });
    }
    
    res.json({
      success: true,
      agent: agent
    });
  } catch (error) {
    logger.error(`Failed to get agent ${req.params.agentName}:`, error);
    res.status(500).json({ error: 'Failed to get agent', details: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(port, () => {
    logger.info(`🔧 Universal Agent Toolkit running on port ${port}`);
    logger.info(`🔗 Validation API: ${toolkit.validationApiUrl}`);
    logger.info(`🚀 Protocol bridges: ${Object.keys(toolkit.protocolBridges).join(', ')}`);
    logger.info(`⚡ Token optimization: tiktoken ready`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
      logger.info('Universal Agent Toolkit server closed');
      process.exit(0);
    });
  });
}

module.exports = app;