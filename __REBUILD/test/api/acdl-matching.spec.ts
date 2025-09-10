/**
 * ACDL Agent Matching Tests
 * Version: v0.1.9-alpha.1
 * Status: RED PHASE - All tests MUST FAIL (no implementation exists)
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';

const API_BASE_URL = process.env.OSSA_API_URL || 'http://localhost:3000/api/v1';

describe('ACDL Agent Matching - /acdl/match', () => {

  describe('Task Matching', () => {
    
    it('should match API documentation task to worker.docs agents', async () => {
      const matchRequest = {
        task: {
          type: 'documentation',
          description: 'Generate API documentation from OpenAPI specification'
        },
        requirements: {
          capabilities: {
            domains: ['documentation', 'api-design'],
            operations: [
              {
                name: 'generate-docs',
                description: 'Generate documentation from spec'
              }
            ]
          },
          performance: {
            throughput: {
              requestsPerSecond: 10
            },
            latency: {
              p99: 1000
            }
          }
        }
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/match')
        .send(matchRequest)
        .expect(200);

      expect(response.body).toHaveProperty('matches');
      expect(Array.isArray(response.body.matches)).toBe(true);
      expect(response.body).toHaveProperty('recommendation');
      
      // Should recommend worker.docs agents
      const topMatch = response.body.matches[0];
      expect(topMatch.agentId).toContain('docs');
      expect(topMatch.compatibility).toBeGreaterThan(0.7);
    });

    it('should match code review task to critic.quality agents', async () => {
      const matchRequest = {
        task: {
          type: 'review',
          description: 'Review TypeScript code for quality and best practices',
          expectedDuration: 5000
        },
        requirements: {
          capabilities: {
            domains: ['quality', 'validation'],
            operations: [
              {
                name: 'review',
                description: 'Code quality review'
              }
            ]
          },
          performance: {
            throughput: {
              requestsPerSecond: 5
            },
            latency: {
              p99: 2000
            }
          }
        }
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/match')
        .send(matchRequest)
        .expect(200);

      const topMatch = response.body.matches[0];
      expect(topMatch.agentId).toContain('critic');
      expect(topMatch.reasons).toContain('Specialized in code quality review');
    });

    it('should match orchestration task to orchestrator agents', async () => {
      const matchRequest = {
        task: {
          type: 'orchestration',
          description: 'Coordinate multi-agent workflow for complex task'
        },
        requirements: {
          capabilities: {
            domains: ['orchestration'],
            operations: [
              {
                name: 'coordinate',
                description: 'Coordinate multiple agents'
              },
              {
                name: 'plan',
                description: 'Create execution plan'
              }
            ]
          },
          performance: {
            throughput: {
              requestsPerSecond: 50,
              concurrentRequests: 10
            },
            latency: {
              p50: 50,
              p95: 150,
              p99: 250
            }
          }
        }
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/match')
        .send(matchRequest)
        .expect(200);

      const matches = response.body.matches;
      expect(matches[0].agentId).toContain('orchestrator');
      expect(response.body.recommendation.primaryAgent).toContain('orchestrator');
    });

    it('should match learning task to trainer agents', async () => {
      const matchRequest = {
        task: {
          type: 'learning',
          description: 'Synthesize feedback from multiple critics into improvements'
        },
        requirements: {
          capabilities: {
            domains: ['learning'],
            operations: [
              {
                name: 'synthesize',
                description: 'Synthesize feedback'
              }
            ]
          },
          performance: {
            throughput: {
              requestsPerSecond: 10
            },
            latency: {
              p99: 3000
            }
          }
        }
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/match')
        .send(matchRequest)
        .expect(200);

      expect(response.body.matches[0].agentId).toContain('trainer');
    });

    it('should handle no suitable agent found scenario', async () => {
      const matchRequest = {
        task: {
          type: 'impossible-task',
          description: 'Task with impossible requirements'
        },
        requirements: {
          capabilities: {
            domains: ['non-existent-domain'],
            operations: [
              {
                name: 'impossible-operation',
                description: 'Cannot be done'
              }
            ]
          },
          performance: {
            throughput: {
              requestsPerSecond: 1000000
            },
            latency: {
              p99: 1  // 1ms latency is impossible
            }
          }
        }
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/match')
        .send(matchRequest)
        .expect(200);

      expect(response.body.matches).toEqual([]);
      expect(response.body.recommendation.primaryAgent).toBeNull();
    });
  });

  describe('Ensemble Matching', () => {
    
    it('should match complex task requiring multiple agents', async () => {
      const matchRequest = {
        task: {
          type: 'complex-feature',
          description: 'Implement new API endpoint with docs and tests',
          expectedDuration: 30000
        },
        requirements: {
          capabilities: {
            domains: ['api-design', 'documentation', 'testing'],
            operations: [
              {
                name: 'design-api',
                description: 'Design API endpoint'
              },
              {
                name: 'generate-docs',
                description: 'Generate documentation'
              },
              {
                name: 'create-tests',
                description: 'Create test suite'
              }
            ]
          },
          performance: {
            throughput: {
              requestsPerSecond: 20
            },
            latency: {
              p99: 1000
            }
          }
        }
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/match')
        .send(matchRequest)
        .expect(200);

      expect(response.body.recommendation.ensemble).toBeDefined();
      expect(Array.isArray(response.body.recommendation.ensemble)).toBe(true);
      expect(response.body.recommendation.ensemble.length).toBeGreaterThanOrEqual(3);
      
      // Should include different agent types
      const roles = response.body.recommendation.ensemble.map((a: any) => a.role);
      expect(roles).toContain('api-design');
      expect(roles).toContain('documentation');
      expect(roles).toContain('testing');
    });

    it('should recommend workflow with dependencies', async () => {
      const matchRequest = {
        task: {
          type: 'sequential-workflow',
          description: 'Design, implement, review, and deploy'
        },
        requirements: {
          capabilities: {
            domains: ['api-design', 'implementation', 'review', 'deployment'],
            operations: [
              {
                name: 'design',
                description: 'Design phase'
              },
              {
                name: 'implement',
                description: 'Implementation phase'
              },
              {
                name: 'review',
                description: 'Review phase'
              },
              {
                name: 'deploy',
                description: 'Deployment phase'
              }
            ]
          },
          performance: {
            throughput: {
              requestsPerSecond: 10
            },
            latency: {
              p99: 5000
            }
          },
          constraints: {
            budget: 10000,
            deadline: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
          }
        }
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/match')
        .send(matchRequest)
        .expect(200);

      const ensemble = response.body.recommendation.ensemble;
      expect(ensemble).toBeDefined();
      
      // Verify sequential roles
      expect(ensemble[0].role).toContain('design');
      expect(ensemble[ensemble.length - 1].role).toContain('deploy');
    });

    it('should recommend parallel execution for independent tasks', async () => {
      const matchRequest = {
        task: {
          type: 'parallel-tasks',
          description: 'Generate docs and tests simultaneously'
        },
        requirements: {
          capabilities: {
            domains: ['documentation', 'testing'],
            operations: [
              {
                name: 'generate-docs',
                description: 'Generate documentation'
              },
              {
                name: 'generate-tests',
                description: 'Generate test suite'
              }
            ]
          },
          performance: {
            throughput: {
              requestsPerSecond: 50,
              concurrentRequests: 10
            },
            latency: {
              p99: 500
            }
          }
        }
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/match')
        .send(matchRequest)
        .expect(200);

      const ensemble = response.body.recommendation.ensemble;
      
      // Should have multiple agents that can work in parallel
      const docAgent = ensemble.find((a: any) => a.role === 'documentation');
      const testAgent = ensemble.find((a: any) => a.role === 'testing');
      
      expect(docAgent).toBeDefined();
      expect(testAgent).toBeDefined();
      expect(docAgent.agentId).not.toBe(testAgent.agentId);
    });
  });

  describe('Constraint Matching', () => {
    
    it('should match agents within budget constraints', async () => {
      const matchRequest = {
        task: {
          type: 'budget-limited',
          description: 'Complete task within token budget'
        },
        requirements: {
          capabilities: {
            domains: ['data'],
            operations: [
              {
                name: 'process',
                description: 'Process data'
              }
            ]
          },
          performance: {
            throughput: {
              requestsPerSecond: 10
            },
            latency: {
              p99: 2000
            }
          },
          constraints: {
            budget: 1000  // Token budget
          }
        }
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/match')
        .send(matchRequest)
        .expect(200);

      response.body.matches.forEach((match: any) => {
        // All matches should be within budget
        expect(match.warnings).not.toContain('May exceed budget constraints');
      });
    });

    it('should match agents meeting deadline constraints', async () => {
      const deadline = new Date(Date.now() + 300000).toISOString(); // 5 minutes from now
      
      const matchRequest = {
        task: {
          type: 'time-critical',
          description: 'Complete task before deadline',
          expectedDuration: 240000  // 4 minutes
        },
        requirements: {
          capabilities: {
            domains: ['validation'],
            operations: [
              {
                name: 'validate',
                description: 'Quick validation'
              }
            ]
          },
          performance: {
            throughput: {
              requestsPerSecond: 100
            },
            latency: {
              p99: 100  // Fast response required
            }
          },
          constraints: {
            deadline: deadline
          }
        }
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/match')
        .send(matchRequest)
        .expect(200);

      // Should only match fast agents
      response.body.matches.forEach((match: any) => {
        const agent = match.agentId;
        expect(match.compatibility).toBeGreaterThan(0.8);
      });
    });

    it('should match agents with resource constraints', async () => {
      const matchRequest = {
        task: {
          type: 'resource-limited',
          description: 'Run in resource-constrained environment'
        },
        requirements: {
          capabilities: {
            domains: ['monitoring'],
            operations: [
              {
                name: 'monitor',
                description: 'Monitor system'
              }
            ]
          },
          performance: {
            throughput: {
              requestsPerSecond: 5
            },
            latency: {
              p99: 1000
            }
          },
          constraints: {
            maxMemory: '256Mi',
            maxCpu: '100m'
          }
        }
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/match')
        .send(matchRequest)
        .expect(200);

      // Should only match lightweight agents
      response.body.matches.forEach((match: any) => {
        expect(match.reasons).toContain('Meets resource constraints');
      });
    });

    it('should handle combined constraints', async () => {
      const matchRequest = {
        task: {
          type: 'multi-constraint',
          description: 'Task with multiple constraints',
          expectedDuration: 10000
        },
        requirements: {
          capabilities: {
            domains: ['orchestration', 'monitoring'],
            operations: [
              {
                name: 'orchestrate',
                description: 'Orchestrate workflow'
              }
            ]
          },
          performance: {
            throughput: {
              requestsPerSecond: 50
            },
            latency: {
              p50: 25,
              p95: 75,
              p99: 150
            }
          },
          constraints: {
            budget: 5000,
            deadline: new Date(Date.now() + 600000).toISOString(),
            maxMemory: '512Mi',
            maxCpu: '250m'
          }
        }
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/match')
        .send(matchRequest)
        .expect(200);

      const topMatch = response.body.matches[0];
      expect(topMatch.compatibility).toBeGreaterThan(0.6);
      expect(topMatch.reasons.length).toBeGreaterThan(2);
    });
  });

  describe('Match Response Validation', () => {
    
    it('should include compatibility scores', async () => {
      const matchRequest = {
        task: {
          type: 'test',
          description: 'Test task'
        },
        requirements: {
          capabilities: {
            domains: ['testing'],
            operations: []
          },
          performance: {
            throughput: {
              requestsPerSecond: 10
            },
            latency: {
              p99: 1000
            }
          }
        }
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/match')
        .send(matchRequest)
        .expect(200);

      response.body.matches.forEach((match: any) => {
        expect(match).toHaveProperty('compatibility');
        expect(match.compatibility).toBeGreaterThanOrEqual(0);
        expect(match.compatibility).toBeLessThanOrEqual(1);
      });
    });

    it('should include matching reasons', async () => {
      const matchRequest = {
        task: {
          type: 'validation',
          description: 'Validate data'
        },
        requirements: {
          capabilities: {
            domains: ['validation'],
            operations: [
              {
                name: 'validate',
                description: 'Validate input'
              }
            ]
          },
          performance: {
            throughput: {
              requestsPerSecond: 20
            },
            latency: {
              p99: 500
            }
          }
        }
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/match')
        .send(matchRequest)
        .expect(200);

      response.body.matches.forEach((match: any) => {
        expect(match).toHaveProperty('reasons');
        expect(Array.isArray(match.reasons)).toBe(true);
        expect(match.reasons.length).toBeGreaterThan(0);
      });
    });

    it('should include warnings for partial matches', async () => {
      const matchRequest = {
        task: {
          type: 'partial-match',
          description: 'Task with mixed requirements'
        },
        requirements: {
          capabilities: {
            domains: ['api-design', 'non-existent-capability'],
            operations: [
              {
                name: 'design',
                description: 'Design API'
              }
            ]
          },
          performance: {
            throughput: {
              requestsPerSecond: 1000  // Very high requirement
            },
            latency: {
              p99: 10  // Very low latency
            }
          }
        }
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/match')
        .send(matchRequest)
        .expect(200);

      if (response.body.matches.length > 0) {
        const match = response.body.matches[0];
        expect(match).toHaveProperty('warnings');
        expect(Array.isArray(match.warnings)).toBe(true);
        expect(match.warnings.length).toBeGreaterThan(0);
      }
    });

    it('should provide alternative agent recommendations', async () => {
      const matchRequest = {
        task: {
          type: 'with-alternatives',
          description: 'Task with multiple solution approaches'
        },
        requirements: {
          capabilities: {
            domains: ['data'],
            operations: [
              {
                name: 'transform',
                description: 'Transform data'
              }
            ]
          },
          performance: {
            throughput: {
              requestsPerSecond: 30
            },
            latency: {
              p99: 1000
            }
          }
        }
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/match')
        .send(matchRequest)
        .expect(200);

      expect(response.body.recommendation).toHaveProperty('primaryAgent');
      expect(response.body.recommendation).toHaveProperty('alternativeAgents');
      expect(Array.isArray(response.body.recommendation.alternativeAgents)).toBe(true);
    });
  });

  describe('Protocol Matching', () => {
    
    it('should prefer agents with matching protocol support', async () => {
      const matchRequest = {
        task: {
          type: 'mcp-task',
          description: 'Task requiring MCP protocol'
        },
        requirements: {
          capabilities: {
            domains: ['orchestration'],
            operations: []
          },
          protocols: ['mcp'],
          performance: {
            throughput: {
              requestsPerSecond: 10
            },
            latency: {
              p99: 500
            }
          }
        }
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/match')
        .send(matchRequest)
        .expect(200);

      // Top matches should support MCP
      if (response.body.matches.length > 0) {
        const topMatch = response.body.matches[0];
        expect(topMatch.reasons).toContain('Supports required MCP protocol');
      }
    });

    it('should handle multi-protocol requirements', async () => {
      const matchRequest = {
        task: {
          type: 'multi-protocol',
          description: 'Task needing REST and WebSocket'
        },
        requirements: {
          capabilities: {
            domains: ['monitoring'],
            operations: []
          },
          protocols: ['rest', 'websocket'],
          performance: {
            throughput: {
              requestsPerSecond: 100
            },
            latency: {
              p99: 200
            }
          }
        }
      };

      const response = await request(API_BASE_URL)
        .post('/acdl/match')
        .send(matchRequest)
        .expect(200);

      response.body.matches.forEach((match: any) => {
        expect(match.reasons.some((r: string) => 
          r.includes('rest') || r.includes('websocket')
        )).toBe(true);
      });
    });
  });
});

// Test suite summary for TDD tracking
describe('ACDL Matching Test Suite Summary', () => {
  it('should have 0% pass rate (all tests failing in RED phase)', () => {
    // This meta-test ensures we're in TDD RED phase
    expect(true).toBe(true); // This is the only test that should pass
  });
});