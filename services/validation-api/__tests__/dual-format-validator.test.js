const DualFormatValidator = require('../services/dual-format-validator');

describe('DualFormatValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new DualFormatValidator();
  });

  describe('Agent Configuration Validation', () => {
    test('should validate compliant agent configuration', async () => {
      const agentConfig = {
        apiVersion: 'openapi-ai-agents/v0.1.0',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0',
          namespace: 'test-namespace',
          labels: {
            domain: 'test',
            certification_level: 'gold'
          }
        },
        spec: {
          openapi_spec: './openapi.yaml',
          capabilities: [
            'universal_agent_interface',
            'protocol_bridging',
            'token_optimization'
          ],
          protocols: ['openapi', 'mcp'],
          security: {
            authentication: 'oauth2',
            authorization: 'rbac',
            encryption: 'tls1.3',
            audit_logging: true
          },
          governance: {
            policies: ['Policy 1', 'Policy 2'],
            roles: ['Role 1', 'Role 2'],
            accountability: 'Clear accountability'
          },
          risk_management: {
            assessment: 'Risk assessment',
            mitigation: ['Mitigation 1', 'Mitigation 2'],
            monitoring: 'Risk monitoring'
          },
          data_quality: {
            validation: 'Data validation',
            cleansing: 'Data cleansing',
            monitoring: 'Data monitoring'
          },
          monitoring: {
            metrics: ['Performance', 'Quality', 'Security', 'Audit'],
            alerts: ['Alert 1', 'Alert 2'],
            reporting: 'Regular reporting'
          }
        }
      };

      const result = await validator.validateAgentConfig(agentConfig);
      
      expect(result.valid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.passed).toContain('✅ Agent configuration schema validation passed');
    });

    test('should reject invalid agent configuration', async () => {
      const agentConfig = {
        // Missing required fields
        metadata: {
          name: 'test-agent'
        }
      };

      const result = await validator.validateAgentConfig(agentConfig);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Agent config:');
    });

    test('should validate agent name format', async () => {
      const agentConfig = {
        apiVersion: 'openapi-ai-agents/v0.1.0',
        kind: 'Agent',
        metadata: {
          name: 'INVALID-NAME-WITH-UPPERCASE', // Invalid format
          version: '1.0.0'
        },
        spec: {
          openapi_spec: './openapi.yaml',
          capabilities: ['universal_agent_interface']
        }
      };

      const result = await validator.validateAgentConfig(agentConfig);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('name'))).toBe(true);
    });

    test('should validate version format', async () => {
      const agentConfig = {
        apiVersion: 'openapi-ai-agents/v0.1.0',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: 'invalid-version' // Invalid format
        },
        spec: {
          openapi_spec: './openapi.yaml',
          capabilities: ['universal_agent_interface']
        }
      };

      const result = await validator.validateAgentConfig(agentConfig);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('version'))).toBe(true);
    });

    test('should validate capabilities enum', async () => {
      const agentConfig = {
        apiVersion: 'openapi-ai-agents/v0.1.0',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0'
        },
        spec: {
          openapi_spec: './openapi.yaml',
          capabilities: ['invalid_capability'] // Invalid capability
        }
      };

      const result = await validator.validateAgentConfig(agentConfig);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('capabilities'))).toBe(true);
    });

    test('should validate protocols enum', async () => {
      const agentConfig = {
        apiVersion: 'openapi-ai-agents/v0.1.0',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0'
        },
        spec: {
          openapi_spec: './openapi.yaml',
          capabilities: ['universal_agent_interface'],
          protocols: ['invalid_protocol'] // Invalid protocol
        }
      };

      const result = await validator.validateAgentConfig(agentConfig);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('protocols'))).toBe(true);
    });
  });

  describe('OpenAPI Specification Validation', () => {
    test('should validate compliant OpenAPI specification', async () => {
      const openApiSpec = {
        openapi: '3.1.0',
        info: {
          title: 'Test Agent API',
          version: '1.0.0',
          description: 'Test agent API description',
          contact: {
            name: 'Test Team',
            email: 'test@example.com'
          }
        },
        servers: [
          {
            url: 'https://api.example.com/v1',
            description: 'Production server'
          }
        ],
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
            OAuth2PKCE: {
              type: 'oauth2',
              flows: {
                authorizationCode: {
                  authorizationUrl: 'https://example.com/oauth/authorize',
                  tokenUrl: 'https://example.com/oauth/token'
                }
              }
            }
          }
        },
        security: [
          {
            OAuth2PKCE: []
          }
        ],
        'x-agent-metadata': {
          class: 'specialist',
          certification_level: 'gold',
          protocols: ['openapi'],
          capabilities: ['universal_agent_interface']
        },
        'x-token-estimate': 1000,
        'x-security-level': 'enterprise'
      };

      const result = await validator.validateOpenApiSpec(openApiSpec);
      
      expect(result.valid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.passed).toContain('✅ OpenAPI schema validation passed');
    });

    test('should reject invalid OpenAPI specification', async () => {
      const openApiSpec = {
        openapi: '2.0.0', // Wrong version
        info: {
          title: 'Test'
          // Missing required fields
        }
      };

      const result = await validator.validateOpenApiSpec(openApiSpec);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('OpenAPI:');
    });

    test('should validate OpenAPI version pattern', async () => {
      const openApiSpec = {
        openapi: '3.1', // Missing patch version
        info: {
          title: 'Test',
          version: '1.0.0'
        },
        paths: {
          '/test': {
            get: {
              responses: {
                '200': {
                  description: 'Success'
                }
              }
            }
          }
        }
      };

      const result = await validator.validateOpenApiSpec(openApiSpec);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('openapi'))).toBe(true);
    });

    test('should validate info title length', async () => {
      const openApiSpec = {
        openapi: '3.1.0',
        info: {
          title: 'A'.repeat(201), // Too long
          version: '1.0.0'
        },
        paths: {
          '/test': {
            get: {
              responses: {
                '200': {
                  description: 'Success'
                }
              }
            }
          }
        }
      };

      const result = await validator.validateOpenApiSpec(openApiSpec);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('title'))).toBe(true);
    });

    test('should validate paths requirement', async () => {
      const openApiSpec = {
        openapi: '3.1.0',
        info: {
          title: 'Test',
          version: '1.0.0'
        }
        // Missing paths
      };

      const result = await validator.validateOpenApiSpec(openApiSpec);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('paths'))).toBe(true);
    });
  });

  describe('Cross-Format Validation', () => {
    test('should validate consistency between agent config and OpenAPI spec', async () => {
      const agentConfig = {
        apiVersion: 'openapi-ai-agents/v0.1.0',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0'
        },
        spec: {
          openapi_spec: './openapi.yaml',
          capabilities: ['universal_agent_interface', 'multi_agent_orchestration'],
          protocols: ['openapi']
        }
      };

      const openApiSpec = {
        openapi: '3.1.0',
        info: {
          title: 'Test Agent API', // Consistent with agent name
          version: '1.0.0'
        },
        paths: {
          '/agent/orchestrate': {
            post: {
              operationId: 'orchestrateAgents',
              summary: 'Orchestrate agents'
            }
          },
          '/agents': {
            get: {
              operationId: 'listAgents',
              summary: 'List agents'
            }
          },
          '/health': {
            get: {
              operationId: 'healthCheck',
              summary: 'Health check'
            }
          }
        }
      };

      const result = await validator.validateCrossFormatConsistency(agentConfig, openApiSpec);
      
      expect(result.valid).toBe(true);
      expect(result.passed).toContain('✅ Agent name and OpenAPI title consistency verified');
      expect(result.passed).toContain('✅ OpenAPI protocol and endpoints consistency verified');
    });

    test('should warn about name inconsistency', async () => {
      const agentConfig = {
        apiVersion: 'openapi-ai-agents/v0.1.0',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0'
        },
        spec: {
          openapi_spec: './openapi.yaml',
          capabilities: ['universal_agent_interface'],
          protocols: ['openapi']
        }
      };

      const openApiSpec = {
        openapi: '3.1.0',
        info: {
          title: 'Completely Different API', // Inconsistent with agent name
          version: '1.0.0'
        },
        paths: {
          '/test': {
            get: {
              responses: {
                '200': {
                  description: 'Success'
                }
              }
            }
          }
        }
      };

      const result = await validator.validateCrossFormatConsistency(agentConfig, openApiSpec);
      
      expect(result.warnings).toContain('Agent name and OpenAPI title should be consistent');
    });

    test('should error on protocol mismatch', async () => {
      const agentConfig = {
        apiVersion: 'openapi-ai-agents/v0.1.0',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0'
        },
        spec: {
          openapi_spec: './openapi.yaml',
          capabilities: ['universal_agent_interface'],
          protocols: ['openapi'] // Claims OpenAPI support
        }
      };

      const openApiSpec = {
        openapi: '3.1.0',
        info: {
          title: 'Test Agent API',
          version: '1.0.0'
        }
        // No paths defined
      };

      const result = await validator.validateCrossFormatConsistency(agentConfig, openApiSpec);
      
      expect(result.errors).toContain('OpenAPI protocol specified but no API endpoints found');
    });

    test('should warn about capability-endpoint mismatch', async () => {
      const agentConfig = {
        apiVersion: 'openapi-ai-agents/v0.1.0',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0'
        },
        spec: {
          openapi_spec: './openapi.yaml',
          capabilities: ['multi_agent_orchestration'], // Claims orchestration capability
          protocols: ['openapi']
        }
      };

      const openApiSpec = {
        openapi: '3.1.0',
        info: {
          title: 'Test Agent API',
          version: '1.0.0'
        },
        paths: {
          '/test': {
            get: {
              responses: {
                '200': {
                  description: 'Success'
                }
              }
            }
          }
        }
      };

      const result = await validator.validateCrossFormatConsistency(agentConfig, openApiSpec);
      
      expect(result.warnings).toContain('Multi-agent orchestration capability requires more API endpoints');
    });
  });

  describe('Security Compliance Validation', () => {
    test('should validate security schemes presence', async () => {
      const agentConfig = {
        apiVersion: 'openapi-ai-agents/v0.1.0',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0'
        },
        spec: {
          openapi_spec: './openapi.yaml',
          capabilities: ['universal_agent_interface'],
          monitoring: {
            metrics: ['audit_logs', 'security_events'],
            alerts: ['Security alert'],
            reporting: 'Security reporting'
          }
        }
      };

      const openApiSpec = {
        openapi: '3.1.0',
        info: {
          title: 'Test Agent API',
          version: '1.0.0'
        },
        paths: {
          '/test': {
            get: {
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
            OAuth2PKCE: {
              type: 'oauth2'
            }
          }
        }
      };

      const result = await validator.validateSecurityCompliance(agentConfig, openApiSpec);
      
      expect(result.valid).toBe(true);
      expect(result.passed).toContain('✅ Security schemes defined');
      expect(result.passed).toContain('✅ Audit logging metrics configured');
    });

    test('should error on missing security schemes', async () => {
      const agentConfig = {
        apiVersion: 'openapi-ai-agents/v0.1.0',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0'
        },
        spec: {
          openapi_spec: './openapi.yaml',
          capabilities: ['universal_agent_interface']
        }
      };

      const openApiSpec = {
        openapi: '3.1.0',
        info: {
          title: 'Test Agent API',
          version: '1.0.0'
        },
        paths: {
          '/test': {
            get: {
              responses: {
                '200': {
                  description: 'Success'
                }
              }
            }
          }
        }
        // No security schemes
      };

      const result = await validator.validateSecurityCompliance(agentConfig, openApiSpec);
      
      expect(result.errors).toContain('Security schemes must be defined for production agents');
    });

    test('should warn about missing global security', async () => {
      const agentConfig = {
        apiVersion: 'openapi-ai-agents/v0.1.0',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0'
        },
        spec: {
          openapi_spec: './openapi.yaml',
          capabilities: ['universal_agent_interface']
        }
      };

      const openApiSpec = {
        openapi: '3.1.0',
        info: {
          title: 'Test Agent API',
          version: '1.0.0'
        },
        paths: {
          '/test': {
            get: {
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
            OAuth2PKCE: {
              type: 'oauth2'
            }
          }
        },
        security: [] // Empty global security
      };

      const result = await validator.validateSecurityCompliance(agentConfig, openApiSpec);
      
      expect(result.warnings).toContain('Global security should be defined for sensitive operations');
    });
  });

  describe('Agent Extensions Validation', () => {
    test('should validate agent metadata extensions', async () => {
      const openApiSpec = {
        openapi: '3.1.0',
        info: {
          title: 'Test Agent API',
          version: '1.0.0'
        },
        paths: {
          '/test': {
            get: {
              responses: {
                '200': {
                  description: 'Success'
                }
              }
            }
          }
        },
        'x-agent-metadata': {
          class: 'specialist',
          certification_level: 'gold',
          protocols: ['openapi'],
          capabilities: ['universal_agent_interface']
        }
      };

      const result = validator.validateAgentExtensions(openApiSpec);
      
      expect(result.passed).toContain('✅ Agent metadata extensions present');
      expect(result.errors.length).toBe(0);
    });

    test('should warn about missing agent metadata', async () => {
      const openApiSpec = {
        openapi: '3.1.0',
        info: {
          title: 'Test Agent API',
          version: '1.0.0'
        },
        paths: {
          '/test': {
            get: {
              responses: {
                '200': {
                  description: 'Success'
                }
              }
            }
          }
        }
        // No x-agent-metadata
      };

      const result = validator.validateAgentExtensions(openApiSpec);
      
      expect(result.warnings).toContain('x-agent-metadata extension recommended for better agent identification');
    });

    test('should validate certification level enum', async () => {
      const openApiSpec = {
        openapi: '3.1.0',
        info: {
          title: 'Test Agent API',
          version: '1.0.0'
        },
        paths: {
          '/test': {
            get: {
              responses: {
                '200': {
                  description: 'Success'
                }
              }
            }
          }
        },
        'x-agent-metadata': {
          class: 'specialist',
          certification_level: 'invalid_level', // Invalid level
          protocols: ['openapi']
        }
      };

      const result = validator.validateAgentExtensions(openApiSpec);
      
      expect(result.errors).toContain('Invalid certification level in x-agent-metadata');
    });

    test('should recommend token estimation', async () => {
      const openApiSpec = {
        openapi: '3.1.0',
        info: {
          title: 'Test Agent API',
          version: '1.0.0'
        },
        paths: {
          '/test': {
            get: {
              responses: {
                '200': {
                  description: 'Success'
                }
              }
            }
          }
        }
        // No x-token-estimate
      };

      const result = validator.validateAgentExtensions(openApiSpec);
      
      expect(result.warnings).toContain('x-token-estimate extension recommended for cost optimization');
    });
  });

  describe('Business Logic Validation', () => {
    test('should warn about outdated API version', async () => {
      const agentConfig = {
        apiVersion: 'openapi-ai-agents/v0.1.0', // Old version
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0'
        },
        spec: {
          openapi_spec: './openapi.yaml',
          capabilities: ['universal_agent_interface']
        }
      };

      const result = validator.validateAgentBusinessLogic(agentConfig);
      
      expect(result.warnings).toContain('Consider upgrading to latest API version for new features');
    });

    test('should warn about missing governance for compliance capability', async () => {
      const agentConfig = {
        apiVersion: 'openapi-ai-agents/v0.1.0',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0'
        },
        spec: {
          openapi_spec: './openapi.yaml',
          capabilities: ['compliance_validation'] // Claims compliance capability
          // But no governance section
        }
      };

      const result = validator.validateAgentBusinessLogic(agentConfig);
      
      expect(result.warnings).toContain('Compliance validation capability requires governance configuration');
    });

    test('should warn about missing protocol bridging for MCP', async () => {
      const agentConfig = {
        apiVersion: 'openapi-ai-agents/v0.1.0',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0'
        },
        spec: {
          openapi_spec: './openapi.yaml',
          capabilities: ['universal_agent_interface'], // Missing protocol_bridging
          protocols: ['mcp'] // Claims MCP support
        }
      };

      const result = validator.validateAgentBusinessLogic(agentConfig);
      
      expect(result.warnings).toContain('MCP protocol requires protocol bridging capability');
    });
  });

  describe('Certification Level Determination', () => {
    test('should determine platinum certification for excellent compliance', () => {
      // Mock a perfect validation result
      validator.errors = [];
      validator.warnings = [];
      validator.passed = [
        '✅ Test 1', '✅ Test 2', '✅ Test 3', '✅ Test 4', '✅ Test 5',
        '✅ Test 6', '✅ Test 7', '✅ Test 8', '✅ Test 9', '✅ Test 10'
      ];

      const level = validator.determineCertificationLevel();
      
      expect(level).toBe('platinum');
    });

    test('should determine gold certification for good compliance', () => {
      validator.errors = [];
      validator.warnings = ['⚠️ Warning 1', '⚠️ Warning 2']; // 2 warnings
      validator.passed = [
        '✅ Test 1', '✅ Test 2', '✅ Test 3', '✅ Test 4', '✅ Test 5',
        '✅ Test 6', '✅ Test 7', '✅ Test 8' // 8 passed
      ];

      const level = validator.determineCertificationLevel();
      
      expect(level).toBe('gold');
    });

    test('should determine silver certification for acceptable compliance', () => {
      validator.errors = [];
      validator.warnings = ['⚠️ Warning 1', '⚠️ Warning 2', '⚠️ Warning 3', '⚠️ Warning 4', '⚠️ Warning 5']; // 5 warnings
      validator.passed = [
        '✅ Test 1', '✅ Test 2', '✅ Test 3', '✅ Test 4', '✅ Test 5',
        '✅ Test 6' // 6 passed
      ];

      const level = validator.determineCertificationLevel();
      
      expect(level).toBe('silver');
    });

    test('should determine bronze certification for basic compliance', () => {
      validator.errors = ['❌ Error 1', '❌ Error 2']; // 2 errors
      validator.warnings = ['⚠️ Warning 1', '⚠️ Warning 2', '⚠️ Warning 3', '⚠️ Warning 4', '⚠️ Warning 5', '⚠️ Warning 6', '⚠️ Warning 7', '⚠️ Warning 8']; // 8 warnings
      validator.passed = [
        '✅ Test 1', '✅ Test 2', '✅ Test 3', '✅ Test 4' // 4 passed
      ];

      const level = validator.determineCertificationLevel();
      
      expect(level).toBe('bronze');
    });

    test('should determine no certification for poor compliance', () => {
      validator.errors = ['❌ Error 1', '❌ Error 2', '❌ Error 3']; // 3 errors
      validator.warnings = ['⚠️ Warning 1', '⚠️ Warning 2', '⚠️ Warning 3', '⚠️ Warning 4', '⚠️ Warning 5', '⚠️ Warning 6', '⚠️ Warning 7', '⚠️ Warning 8', '⚠️ Warning 9']; // 9 warnings
      validator.passed = [
        '✅ Test 1', '✅ Test 2', '✅ Test 3' // Only 3 passed
      ];

      const level = validator.determineCertificationLevel();
      
      expect(level).toBe('none');
    });
  });

  describe('Score Calculation', () => {
    test('should calculate agent score correctly', () => {
      const result = {
        errors: ['Error 1', 'Error 2'], // 2 errors
        warnings: ['Warning 1', 'Warning 2', 'Warning 3'] // 3 warnings
      };

      const score = validator.calculateAgentScore(result);
      
      // 100 - (2 * 15) - (3 * 5) = 100 - 30 - 15 = 55
      expect(score).toBe(55);
    });

    test('should calculate OpenAPI score correctly', () => {
      const result = {
        errors: ['Error 1'], // 1 error
        warnings: ['Warning 1', 'Warning 2'] // 2 warnings
      };

      const score = validator.calculateOpenApiScore(result);
      
      // 100 - (1 * 15) - (2 * 5) = 100 - 15 - 10 = 75
      expect(score).toBe(75);
    });

    test('should calculate cross-validation score correctly', () => {
      const result = {
        errors: ['Error 1'], // 1 error
        warnings: ['Warning 1'] // 1 warning
      };

      const score = validator.calculateCrossValidationScore(result);
      
      // 100 - (1 * 20) - (1 * 5) = 100 - 20 - 5 = 75
      expect(score).toBe(75);
    });

    test('should calculate security score correctly', () => {
      const result = {
        errors: ['Error 1'], // 1 error
        warnings: ['Warning 1', 'Warning 2'] // 2 warnings
      };

      const score = validator.calculateSecurityScore(result);
      
      // 100 - (1 * 25) - (2 * 8) = 100 - 25 - 16 = 59
      expect(score).toBe(59);
    });

    test('should not return negative scores', () => {
      const result = {
        errors: ['Error 1', 'Error 2', 'Error 3', 'Error 4', 'Error 5', 'Error 6', 'Error 7', 'Error 8'], // 8 errors
        warnings: ['Warning 1', 'Warning 2', 'Warning 3', 'Warning 4', 'Warning 5'] // 5 warnings
      };

      const score = validator.calculateAgentScore(result);
      
      // 100 - (8 * 15) - (5 * 5) = 100 - 120 - 25 = -45, but should be 0
      expect(score).toBe(0);
    });
  });

  describe('Report Generation', () => {
    test('should generate comprehensive validation report', async () => {
      const agentConfig = {
        apiVersion: 'openapi-ai-agents/v0.1.0',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0'
        },
        spec: {
          openapi_spec: './openapi.yaml',
          capabilities: ['universal_agent_interface']
        }
      };

      const openApiSpec = {
        openapi: '3.1.0',
        info: {
          title: 'Test Agent API',
          version: '1.0.0'
        },
        paths: {
          '/test': {
            get: {
              responses: {
                '200': {
                  description: 'Success'
                }
              }
            }
          }
        }
      };

      const report = await validator.validateDualFormat(agentConfig, openApiSpec);
      
      expect(report).toHaveProperty('valid');
      expect(report).toHaveProperty('certification_level');
      expect(report).toHaveProperty('overall_score');
      expect(report).toHaveProperty('errors');
      expect(report).toHaveProperty('warnings');
      expect(report).toHaveProperty('passed');
      expect(report).toHaveProperty('detailed_results');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('next_steps');
      
      expect(report.detailed_results).toHaveProperty('agent_config');
      expect(report.detailed_results).toHaveProperty('openapi_spec');
      expect(report.detailed_results).toHaveProperty('cross_format');
      expect(report.detailed_results).toHaveProperty('security');
    });

    test('should generate appropriate recommendations', async () => {
      const agentConfig = {
        apiVersion: 'openapi-ai-agents/v0.1.0',
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
          version: '1.0.0'
        },
        spec: {
          openapi_spec: './openapi.yaml',
          capabilities: ['universal_agent_interface']
        }
      };

      const openApiSpec = {
        openapi: '3.1.0',
        info: {
          title: 'Test Agent API',
          version: '1.0.0'
        },
        paths: {
          '/test': {
            get: {
              responses: {
                '200': {
                  description: 'Success'
                }
              }
            }
          }
        }
      };

      const report = await validator.validateDualFormat(agentConfig, openApiSpec);
      
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.next_steps.length).toBeGreaterThan(0);
    });
  });
});
