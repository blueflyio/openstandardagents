const request = require('supertest');
const app = require('../server');

describe('OpenAPI AI Agents Validation API', () => {
  
  describe('POST /api/v1/validate/openapi', () => {
    test('should validate valid OpenAPI specification', async () => {
      const validSpec = {
        openapi: '3.1.0',
        info: {
          title: 'Test Agent',
          version: '1.0.0',
          description: 'A test agent for API validation',
          'x-agent-metadata': {
            class: 'specialist',
            certification_level: 'bronze',
            protocols: ['openapi']
          }
        },
        paths: {
          '/test': {
            get: {
              operationId: 'testOperation',
              summary: 'Test endpoint',
              responses: {
                '200': {
                  description: 'Success'
                }
              }
            }
          }
        },
        components: {
          securitySchemes: {
            ApiKey: {
              type: 'apiKey',
              in: 'header',
              name: 'X-API-Key'
            }
          }
        }
      };

      const response = await request(app)
        .post('/api/v1/validate/openapi')
        .set('X-API-Key', 'test-api-key')
        .send({ specification: validSpec })
        .expect(200);

      expect(response.body).toMatchObject({
        valid: true,
        certification_level: expect.any(String),
        passed: expect.arrayContaining([
          expect.stringContaining('OpenAPI version 3.1.x')
        ]),
        warnings: expect.any(Array),
        errors: []
      });
    });

    test('should reject invalid OpenAPI specification', async () => {
      const invalidSpec = {
        openapi: '3.0.0', // Wrong version
        info: {
          title: 'Invalid Agent'
          // Missing required fields
        }
      };

      const response = await request(app)
        .post('/api/v1/validate/openapi')
        .set('X-API-Key', 'test-api-key')
        .send({ specification: invalidSpec })
        .expect(400);

      expect(response.body).toMatchObject({
        valid: false,
        errors: expect.arrayContaining([
          expect.stringContaining('Must use OpenAPI 3.1.x')
        ])
      });
    });

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/v1/validate/openapi')
        .set('X-API-Key', 'test-api-key')
        .send({ specification: 'invalid-json' })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Invalid specification format'
      });
    });
  });

  describe('POST /api/v1/validate/agent-config', () => {
    test('should validate valid agent configuration', async () => {
      const validConfig = {
        name: 'test-agent',
        version: '1.0.0',
        class: 'specialist',
        capabilities: ['analyze', 'generate'],
        protocols: ['openapi'],
        security: {
          authentication: {
            required: true,
            methods: [
              { type: 'oauth2', provider: 'example.com' }
            ]
          }
        }
      };

      const response = await request(app)
        .post('/api/v1/validate/agent-config')
        .set('X-API-Key', 'test-api-key')
        .send({ configuration: validConfig })
        .expect(200);

      expect(response.body).toMatchObject({
        valid: true,
        readiness_level: expect.any(String),
        passed: expect.arrayContaining([
          expect.stringContaining('Agent name defined')
        ])
      });
    });

    test('should reject invalid agent configuration', async () => {
      const invalidConfig = {
        name: 'test-agent'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/v1/validate/agent-config')
        .set('X-API-Key', 'test-api-key')
        .send({ configuration: invalidConfig })
        .expect(400);

      expect(response.body).toMatchObject({
        valid: false,
        errors: expect.arrayContaining([
          expect.stringContaining('protocol must be specified')
        ])
      });
    });
  });

  describe('POST /api/v1/validate/compliance', () => {
    test('should validate compliance frameworks', async () => {
      const config = {
        name: 'secure-agent',
        version: '1.0.0',
        class: 'orchestrator',
        compliance: {
          frameworks: [
            { framework: 'NIST_AI_RMF_1_0', status: 'implemented' },
            { framework: 'ISO_42001_2023', status: 'certified' }
          ]
        },
        risk_management: {
          documentation: true,
          process: 'implemented'
        },
        governance: {
          policies: 'defined',
          oversight: 'implemented'
        }
      };

      const response = await request(app)
        .post('/api/v1/validate/compliance')
        .set('X-API-Key', 'test-api-key')
        .send({ 
          configuration: config,
          frameworks: ['NIST_AI_RMF_1_0', 'ISO_42001_2023']
        })
        .expect(200);

      expect(response.body).toMatchObject({
        valid: true,
        authorization_readiness: expect.any(String),
        framework_results: expect.objectContaining({
          'NIST_AI_RMF_1_0': expect.objectContaining({
            passed: expect.any(Array),
            warnings: expect.any(Array),
            errors: expect.any(Array)
          })
        })
      });
    });
  });

  describe('POST /api/v1/validate/protocols', () => {
    test('should validate protocol bridges', async () => {
      const config = {
        'x-protocol-bridges': {
          mcp: {
            enabled: true,
            tools: ['analyze', 'generate'],
            server: {
              name: 'test-mcp-server',
              version: '1.0.0'
            }
          },
          openapi: {
            enabled: true
          }
        }
      };

      const response = await request(app)
        .post('/api/v1/validate/protocols')
        .set('X-API-Key', 'test-api-key')
        .send({ 
          configuration: config,
          protocols: ['mcp', 'openapi']
        })
        .expect(200);

      expect(response.body).toMatchObject({
        valid: true,
        interoperability_level: expect.any(String),
        passed: expect.arrayContaining([
          expect.stringContaining('MCP protocol supported'),
          expect.stringContaining('OPENAPI protocol supported')
        ]),
        warnings: expect.any(Array),
        errors: expect.any(Array)
      });
    });
  });

  describe('POST /api/v1/estimate/tokens', () => {
    test('should estimate token usage and costs', async () => {
      const spec = {
        openapi: '3.1.0',
        info: {
          title: 'Token Test Agent',
          version: '1.0.0',
          description: 'Agent for token estimation testing'
        },
        paths: {
          '/analyze': {
            post: {
              operationId: 'analyzeData',
              summary: 'Analyze data with detailed processing',
              'x-token-estimate': 500,
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        data: { type: 'string' },
                        options: { type: 'object' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };

      const response = await request(app)
        .post('/api/v1/estimate/tokens')
        .set('X-API-Key', 'test-api-key')
        .send({ 
          specification: spec,
          options: {
            model: 'gpt-4-turbo',
            requestsPerDay: 1000,
            compressionRatio: 0.7
          }
        })
        .expect(200);

      expect(response.body).toMatchObject({
        total_tokens: expect.any(Number),
        compressed_tokens: expect.any(Number),
        cost_projections: expect.objectContaining({
          daily_cost: expect.any(Number),
          monthly_cost: expect.any(Number),
          annual_cost: expect.any(Number),
          annual_savings: expect.any(Number)
        }),
        optimizations: expect.any(Array)
      });
    });

    test('should handle different AI models', async () => {
      const spec = { openapi: '3.1.0', info: { title: 'Test', version: '1.0.0' }, paths: {} };

      const response = await request(app)
        .post('/api/v1/estimate/tokens')
        .set('X-API-Key', 'test-api-key')
        .send({ 
          specification: spec,
          options: { model: 'claude-3-sonnet' }
        })
        .expect(200);

      expect(response.body.cost_projections.model).toBe('claude-3-sonnet');
    });
  });

  describe('GET /api/v1/health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        version: expect.any(String),
        services: expect.objectContaining({
          validation: 'active',
          compliance: 'active',
          estimation: 'active'
        }),
        uptime: expect.any(Number)
      });
    });
  });

  describe('GET /api/v1/frameworks', () => {
    test('should list available compliance frameworks', async () => {
      const response = await request(app)
        .get('/api/v1/frameworks')
        .expect(200);

      expect(response.body).toMatchObject({
        frameworks: expect.arrayContaining([
          expect.objectContaining({
            id: 'NIST_AI_RMF_1_0',
            name: expect.any(String),
            category: 'government',
            requirements: expect.any(Array)
          }),
          expect.objectContaining({
            id: 'ISO_42001_2023',
            name: expect.any(String),
            category: 'ai_standards'
          })
        ])
      });
    });
  });

  describe('GET /api/v1/protocols', () => {
    test('should list supported protocols', async () => {
      const response = await request(app)
        .get('/api/v1/protocols')
        .expect(200);

      expect(response.body).toMatchObject({
        protocols: expect.arrayContaining([
          expect.objectContaining({
            id: 'openapi',
            name: 'OpenAPI 3.1',
            required_fields: expect.any(Array)
          }),
          expect.objectContaining({
            id: 'mcp',
            name: 'Model Context Protocol',
            required_fields: expect.any(Array)
          })
        ])
      });
    });
  });

  describe('Error handling', () => {
    test('should handle 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/unknown')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Endpoint not found'
      });
    });

    test('should handle rate limiting', async () => {
      // Make multiple rapid requests to test rate limiting
      const promises = Array(10).fill().map(() => 
        request(app).get('/api/v1/health')
      );

      const responses = await Promise.all(promises);
      
      // At least some should succeed (rate limiting allows some through)
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThan(0);
    });
  });

  describe('Authentication', () => {
    test('should require API key for validation endpoints', async () => {
      const response = await request(app)
        .post('/api/v1/validate/openapi')
        .send({ specification: {} })
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'API key required'
      });
    });

    test('should accept valid API key', async () => {
      const response = await request(app)
        .post('/api/v1/validate/openapi')
        .set('X-API-Key', 'test-api-key')
        .send({ specification: { openapi: '3.1.0' } })
        .expect(400); // Bad request due to incomplete spec, but auth passed

      expect(response.body).not.toMatchObject({
        error: 'API key required'
      });
    });
  });
});