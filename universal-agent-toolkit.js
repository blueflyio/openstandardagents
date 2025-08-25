#!/usr/bin/env node

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

// Initialize Express app
const app = express();
const port = process.env.PORT || 3002;

// Logger configuration
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

// Universal Agent Toolkit API
class UniversalAgentToolkit {
  constructor() {
    this.validationApiUrl = 'http://localhost:3000/api/v1';
    this.templates = this.loadTemplates();
  }

  loadTemplates() {
    try {
      const agentTemplate = yaml.load(fs.readFileSync(path.join(__dirname, 'agent.yml'), 'utf8'));
      const openapiTemplate = yaml.load(fs.readFileSync(path.join(__dirname, 'openapi.yaml'), 'utf8'));
      return { agent: agentTemplate, openapi: openapiTemplate };
    } catch (error) {
      logger.error('Failed to load templates:', error);
      return { agent: null, openapi: null };
    }
  }

  async validateWithAPI(specification) {
    try {
      const response = await axios.post(`${this.validationApiUrl}/validate/openapi`, {
        specification
      }, {
        headers: {
          'X-API-Key': 'toolkit-service',
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Validation API call failed:', error.message);
      throw new Error('Validation service unavailable');
    }
  }

  generateAgentFromTemplate(params) {
    const { name, version, domain, capabilities, protocols } = params;
    
    if (!this.templates.agent) {
      throw new Error('Agent template not available');
    }

    // Clone the template
    const agentConfig = JSON.parse(JSON.stringify(this.templates.agent));
    
    // Customize the agent configuration
    agentConfig.metadata.name = name || 'generated-agent';
    agentConfig.metadata.version = version || '1.0.0';
    agentConfig.metadata.labels.domain = domain || 'general';
    
    if (capabilities) {
      agentConfig.agent_template.required_capabilities = capabilities;
    }
    
    if (protocols) {
      Object.keys(protocols).forEach(protocol => {
        if (agentConfig.protocol_support.bridges[protocol]) {
          agentConfig.protocol_support.bridges[protocol].enabled = protocols[protocol];
        }
      });
    }

    return agentConfig;
  }

  generateOpenAPISpec(params) {
    const { title, description, version, paths } = params;
    
    const spec = {
      openapi: '3.1.0',
      info: {
        title: title || 'Generated Agent API',
        version: version || '1.0.0',
        description: description || 'Auto-generated agent API specification',
        'x-openapi-ai-agents-standard': {
          version: '0.1.0',
          certification_level: 'bronze'
        },
        'x-agent-metadata': {
          class: 'specialist',
          protocols: ['openapi'],
          capabilities: ['reasoning'],
          domains: ['general']
        }
      },
      paths: paths || {
        '/health': {
          get: {
            summary: 'Agent health check',
            responses: {
              '200': {
                description: 'Agent is healthy'
              }
            }
          }
        }
      }
    };

    return spec;
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
    validation_api: toolkit.validationApiUrl
  });
});

// Generate agent configuration
app.post('/generate/agent', [
  body('name').isString().isLength({ min: 1, max: 100 }),
  body('version').optional().isString(),
  body('domain').optional().isString(),
  body('capabilities').optional().isArray(),
  body('protocols').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const agentConfig = toolkit.generateAgentFromTemplate(req.body);
    
    res.json({
      success: true,
      agent_configuration: agentConfig,
      validation_url: `${toolkit.validationApiUrl}/validate/agent-config`
    });
  } catch (error) {
    logger.error('Agent generation failed:', error);
    res.status(500).json({ error: 'Agent generation failed', details: error.message });
  }
});

// Generate OpenAPI specification
app.post('/generate/openapi', [
  body('title').isString().isLength({ min: 1, max: 200 }),
  body('description').optional().isString(),
  body('version').optional().isString(),
  body('paths').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const spec = toolkit.generateOpenAPISpec(req.body);
    
    res.json({
      success: true,
      openapi_specification: spec,
      validation_url: `${toolkit.validationApiUrl}/validate/openapi`
    });
  } catch (error) {
    logger.error('OpenAPI generation failed:', error);
    res.status(500).json({ error: 'OpenAPI generation failed', details: error.message });
  }
});

// Validate agent configuration
app.post('/validate/agent', [
  body('configuration').isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Call validation API
    const validation = await toolkit.validateWithAPI(req.body.configuration);
    
    res.json({
      success: true,
      validation_result: validation,
      toolkit_recommendations: {
        next_steps: validation.valid ? 
          ['Deploy to production', 'Apply for certification'] :
          ['Fix validation errors', 'Re-validate configuration']
      }
    });
  } catch (error) {
    logger.error('Agent validation failed:', error);
    res.status(500).json({ error: 'Validation failed', details: error.message });
  }
});

// Get available templates
app.get('/templates', (req, res) => {
  res.json({
    available_templates: {
      agent: toolkit.templates.agent ? 'Available' : 'Not loaded',
      openapi: toolkit.templates.openapi ? 'Available' : 'Not loaded'
    },
    template_endpoints: {
      agent: '/templates/agent',
      openapi: '/templates/openapi'
    }
  });
});

// Get agent template
app.get('/templates/agent', (req, res) => {
  if (!toolkit.templates.agent) {
    return res.status(404).json({ error: 'Agent template not available' });
  }
  res.json(toolkit.templates.agent);
});

// Get OpenAPI template
app.get('/templates/openapi', (req, res) => {
  if (!toolkit.templates.openapi) {
    return res.status(404).json({ error: 'OpenAPI template not available' });
  }
  res.json(toolkit.templates.openapi);
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
    logger.info(`📚 Templates: http://localhost:${port}/templates`);
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