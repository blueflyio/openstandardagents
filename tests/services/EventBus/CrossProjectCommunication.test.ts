/**
 * OSSA v0.1.9 Cross-Project Communication - Test Suite
 */

import { CrossProjectCommunication } from '../../../src/services/EventBus/CrossProjectCommunication.js';
import { RedisEventBus } from '../../../src/services/EventBus/RedisEventBus.js';
import {
  ProjectConfig,
  CrossProjectEventContract,
  CrossProjectMessage
} from '../../../src/services/EventBus/types.js';

// Mock RedisEventBus
jest.mock('../../../src/services/EventBus/RedisEventBus.js');

describe('CrossProjectCommunication', () => {
  let crossProjectComm: CrossProjectCommunication;
  let mockEventBus: jest.Mocked<RedisEventBus>;

  beforeEach(() => {
    mockEventBus = new RedisEventBus() as jest.Mocked<RedisEventBus>;
    mockEventBus.publish = jest.fn().mockResolvedValue('message-123');
    mockEventBus.subscribe = jest.fn().mockResolvedValue(undefined);
    mockEventBus.registerContract = jest.fn().mockResolvedValue(undefined);

    crossProjectComm = new CrossProjectCommunication(mockEventBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Project Registration', () => {
    test('should register project successfully', async () => {
      const projectConfig: ProjectConfig = {
        projectId: 'test-project',
        name: 'Test Project',
        namespace: 'test',
        allowedEventTypes: ['test.event', 'data.processed'],
        allowedTargets: ['target-project']
      };

      await expect(
        crossProjectComm.registerProject(projectConfig)
      ).resolves.not.toThrow();

      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'system.configuration_changed',
        expect.objectContaining({
          action: 'project_registered',
          project: expect.objectContaining({
            id: 'test-project',
            name: 'Test Project'
          })
        })
      );
    });

    test('should validate project configuration', async () => {
      const invalidConfig = {
        projectId: '',
        name: 'Test Project',
        namespace: '',
        allowedEventTypes: [],
        allowedTargets: []
      } as ProjectConfig;

      await expect(
        crossProjectComm.registerProject(invalidConfig)
      ).rejects.toThrow('Project configuration missing required fields');
    });

    test('should register project with rate limiting', async () => {
      const projectConfig: ProjectConfig = {
        projectId: 'rate-limited-project',
        name: 'Rate Limited Project',
        namespace: 'ratelimited',
        allowedEventTypes: ['test.event'],
        allowedTargets: ['target-project'],
        rateLimiting: {
          eventsPerSecond: 10,
          burstLimit: 50
        }
      };

      await expect(
        crossProjectComm.registerProject(projectConfig)
      ).resolves.not.toThrow();
    });

    test('should register project with authentication', async () => {
      const projectConfig: ProjectConfig = {
        projectId: 'secure-project',
        name: 'Secure Project',
        namespace: 'secure',
        allowedEventTypes: ['test.event'],
        allowedTargets: ['target-project'],
        credentials: {
          apiKey: 'api-key-123',
          secret: 'secret-456'
        }
      };

      await expect(
        crossProjectComm.registerProject(projectConfig)
      ).resolves.not.toThrow();
    });
  });

  describe('Contract Registration', () => {
    test('should register cross-project contract successfully', async () => {
      const contract: CrossProjectEventContract = {
        name: 'user-events-contract',
        version: '1.0.0',
        sourceProject: 'user-service',
        targetProjects: ['notification-service', 'analytics-service'],
        eventTypes: ['user.created', 'user.updated', 'user.deleted'],
        schema: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            email: { type: 'string', format: 'email' },
            timestamp: { type: 'string', format: 'date-time' }
          },
          required: ['userId', 'timestamp']
        },
        metadata: {
          description: 'User lifecycle events contract',
          author: 'User Service Team',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['user', 'lifecycle']
        }
      };

      await expect(
        crossProjectComm.registerCrossProjectContract(contract)
      ).resolves.not.toThrow();

      expect(mockEventBus.registerContract).toHaveBeenCalledWith(contract);
    });

    test('should validate contract fields', async () => {
      const invalidContract = {
        name: '',
        version: '1.0.0',
        sourceProject: '',
        targetProjects: [],
        eventTypes: []
      } as CrossProjectEventContract;

      await expect(
        crossProjectComm.registerCrossProjectContract(invalidContract)
      ).rejects.toThrow('Contract missing required fields');
    });
  });

  describe('Message Sending', () => {
    beforeEach(async () => {
      // Register source and target projects
      const sourceProject: ProjectConfig = {
        projectId: 'source-project',
        name: 'Source Project',
        namespace: 'source',
        allowedEventTypes: ['test.event', 'data.processed'],
        allowedTargets: ['target-project']
      };

      const targetProject: ProjectConfig = {
        projectId: 'target-project',
        name: 'Target Project',
        namespace: 'target',
        allowedEventTypes: ['test.event'],
        allowedTargets: []
      };

      await crossProjectComm.registerProject(sourceProject);
      await crossProjectComm.registerProject(targetProject);
    });

    test('should send cross-project message successfully', async () => {
      const testData = {
        userId: 'user-123',
        email: 'test@example.com',
        timestamp: new Date()
      };

      const messageId = await crossProjectComm.sendMessage(
        'source-project',
        'target-project',
        'test.event',
        testData,
        { correlationId: 'correlation-123', priority: 'high' }
      );

      expect(messageId).toBeDefined();
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'target.test.event',
        expect.objectContaining({
          source: expect.objectContaining({
            projectId: 'source-project',
            namespace: 'source'
          }),
          target: expect.objectContaining({
            projectId: 'target-project',
            namespace: 'target'
          }),
          payload: expect.objectContaining({
            data: testData
          })
        }),
        { priority: 'high' }
      );
    });

    test('should reject message from unregistered source project', async () => {
      await expect(
        crossProjectComm.sendMessage(
          'unknown-project',
          'target-project',
          'test.event',
          { data: 'test' }
        )
      ).rejects.toThrow('Source project not registered: unknown-project');
    });

    test('should reject message to unregistered target project', async () => {
      await expect(
        crossProjectComm.sendMessage(
          'source-project',
          'unknown-project',
          'test.event',
          { data: 'test' }
        )
      ).rejects.toThrow('Target project not registered: unknown-project');
    });

    test('should reject message with unauthorized target', async () => {
      // Register project without permission to target
      const unauthorizedProject: ProjectConfig = {
        projectId: 'unauthorized-project',
        name: 'Unauthorized Project',
        namespace: 'unauthorized',
        allowedEventTypes: ['test.event'],
        allowedTargets: [] // No targets allowed
      };

      await crossProjectComm.registerProject(unauthorizedProject);

      await expect(
        crossProjectComm.sendMessage(
          'unauthorized-project',
          'target-project',
          'test.event',
          { data: 'test' }
        )
      ).rejects.toThrow('Communication not allowed from unauthorized-project to target-project');
    });

    test('should reject message with unauthorized event type', async () => {
      await expect(
        crossProjectComm.sendMessage(
          'source-project',
          'target-project',
          'unauthorized.event',
          { data: 'test' }
        )
      ).rejects.toThrow('Event type unauthorized.event not allowed for project source-project');
    });

    test('should apply rate limiting', async () => {
      // Register project with strict rate limiting
      const rateLimitedProject: ProjectConfig = {
        projectId: 'rate-limited',
        name: 'Rate Limited Project',
        namespace: 'ratelimited',
        allowedEventTypes: ['test.event'],
        allowedTargets: ['target-project'],
        rateLimiting: {
          eventsPerSecond: 1,
          burstLimit: 1
        }
      };

      await crossProjectComm.registerProject(rateLimitedProject);

      // First message should succeed
      await expect(
        crossProjectComm.sendMessage(
          'rate-limited',
          'target-project',
          'test.event',
          { data: 'first' }
        )
      ).resolves.toBeDefined();

      // Second message should be rate limited
      await expect(
        crossProjectComm.sendMessage(
          'rate-limited',
          'target-project',
          'test.event',
          { data: 'second' }
        )
      ).rejects.toThrow('Rate limit exceeded for project rate-limited');
    });
  });

  describe('Message Handling', () => {
    beforeEach(async () => {
      // Register target project
      const targetProject: ProjectConfig = {
        projectId: 'target-project',
        name: 'Target Project',
        namespace: 'target',
        allowedEventTypes: ['test.event'],
        allowedTargets: []
      };

      await crossProjectComm.registerProject(targetProject);
    });

    test('should setup message handler successfully', async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);

      await expect(
        crossProjectComm.setupMessageHandler(
          'target-project',
          'test.event',
          mockHandler
        )
      ).resolves.not.toThrow();

      expect(mockEventBus.subscribe).toHaveBeenCalledWith(
        'target.test.event',
        expect.any(Function),
        { group: 'project-target-project' }
      );
    });

    test('should process incoming message correctly', async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);

      await crossProjectComm.setupMessageHandler(
        'target-project',
        'test.event',
        mockHandler
      );

      // Simulate incoming message
      const subscribeCall = mockEventBus.subscribe.mock.calls[0];
      const eventHandler = subscribeCall[1] as Function;

      const mockMessage: CrossProjectMessage = {
        source: {
          projectId: 'source-project',
          namespace: 'source',
          version: '1.0.0'
        },
        target: {
          projectId: 'target-project',
          namespace: 'target'
        },
        payload: {
          metadata: {
            id: 'msg-123',
            type: 'test.event',
            source: 'source',
            timestamp: new Date(),
            version: '1.0.0',
            priority: 'normal' as any
          },
          data: { userId: 'user-123' }
        },
        security: {
          signature: 'sig-123',
          timestamp: Date.now(),
          nonce: 'nonce-123'
        }
      };

      const eventPayload = {
        metadata: {
          id: 'event-123',
          type: 'target.test.event',
          source: 'eventbus',
          timestamp: new Date(),
          version: '1.0.0',
          priority: 'normal' as any
        },
        data: mockMessage
      };

      await eventHandler(eventPayload);

      expect(mockHandler).toHaveBeenCalledWith(mockMessage);
    });

    test('should handle message processing errors', async () => {
      const mockHandler = jest.fn().mockRejectedValue(new Error('Handler error'));

      await crossProjectComm.setupMessageHandler(
        'target-project',
        'test.event',
        mockHandler
      );

      // Simulate incoming message with error
      const subscribeCall = mockEventBus.subscribe.mock.calls[0];
      const eventHandler = subscribeCall[1] as Function;

      const mockMessage: CrossProjectMessage = {
        source: {
          projectId: 'source-project',
          namespace: 'source',
          version: '1.0.0'
        },
        target: {
          projectId: 'target-project',
          namespace: 'target'
        },
        payload: {
          metadata: {
            id: 'msg-123',
            type: 'test.event',
            source: 'source',
            timestamp: new Date(),
            version: '1.0.0',
            priority: 'normal' as any,
            correlationId: 'corr-123'
          },
          data: { userId: 'user-123' }
        },
        security: {
          signature: 'sig-123',
          timestamp: Date.now(),
          nonce: 'nonce-123'
        }
      };

      const eventPayload = {
        metadata: {
          id: 'event-123',
          type: 'target.test.event',
          source: 'eventbus',
          timestamp: new Date(),
          version: '1.0.0',
          priority: 'normal' as any,
          correlationId: 'corr-123'
        },
        data: mockMessage
      };

      // Should not throw, but should handle error gracefully
      await expect(eventHandler(eventPayload)).resolves.toBeUndefined();
    });
  });

  describe('Statistics and Monitoring', () => {
    test('should return communication statistics', async () => {
      const stats = await crossProjectComm.getStats();

      expect(stats).toMatchObject({
        totalProjects: expect.any(Number),
        totalContracts: expect.any(Number),
        messagesSent: expect.any(Number),
        messagesReceived: expect.any(Number),
        messagesFailed: expect.any(Number),
        activeConnections: expect.any(Number),
        rateLimitHits: expect.any(Number),
        averageLatency: expect.any(Number)
      });
    });

    test('should return available contracts for project', async () => {
      // Register contract
      const contract: CrossProjectEventContract = {
        name: 'test-contract',
        version: '1.0.0',
        sourceProject: 'source-project',
        targetProjects: ['target-project'],
        eventTypes: ['test.event'],
        schema: {},
        metadata: {
          description: 'Test contract',
          author: 'test',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      await crossProjectComm.registerCrossProjectContract(contract);

      const availableContracts = crossProjectComm.getAvailableContracts('target-project');

      expect(availableContracts).toContainEqual(
        expect.objectContaining({
          name: 'test-contract',
          targetProjects: expect.arrayContaining(['target-project'])
        })
      );
    });
  });

  describe('Project Validation', () => {
    beforeEach(async () => {
      const testProject: ProjectConfig = {
        projectId: 'validation-project',
        name: 'Validation Project',
        namespace: 'validation',
        allowedEventTypes: ['test.event'],
        allowedTargets: ['target-project']
      };

      await crossProjectComm.registerProject(testProject);
    });

    test('should validate project setup', async () => {
      const validation = await crossProjectComm.validateProjectSetup('validation-project');

      expect(validation).toMatchObject({
        isValid: true,
        errors: expect.any(Array),
        warnings: expect.any(Array),
        recommendations: expect.any(Array)
      });
    });

    test('should return errors for unregistered project', async () => {
      const validation = await crossProjectComm.validateProjectSetup('nonexistent-project');

      expect(validation).toMatchObject({
        isValid: false,
        errors: expect.arrayContaining([
          expect.stringContaining('Project nonexistent-project is not registered')
        ])
      });
    });

    test('should provide recommendations for incomplete setup', async () => {
      const incompleteProject: ProjectConfig = {
        projectId: 'incomplete-project',
        name: 'Incomplete Project',
        namespace: 'incomplete',
        allowedEventTypes: [],
        allowedTargets: []
      };

      await crossProjectComm.registerProject(incompleteProject);

      const validation = await crossProjectComm.validateProjectSetup('incomplete-project');

      expect(validation.warnings).toContain(
        'No event types allowed - project cannot send events'
      );
      expect(validation.warnings).toContain(
        'No target projects allowed - project cannot send cross-project messages'
      );
    });
  });

  describe('Security Features', () => {
    beforeEach(async () => {
      const secureProject: ProjectConfig = {
        projectId: 'secure-project',
        name: 'Secure Project',
        namespace: 'secure',
        allowedEventTypes: ['test.event'],
        allowedTargets: ['target-project'],
        credentials: {
          apiKey: 'api-key-123',
          secret: 'secret-456'
        }
      };

      const targetProject: ProjectConfig = {
        projectId: 'target-project',
        name: 'Target Project',
        namespace: 'target',
        allowedEventTypes: ['test.event'],
        allowedTargets: []
      };

      await crossProjectComm.registerProject(secureProject);
      await crossProjectComm.registerProject(targetProject);
    });

    test('should generate message signature', async () => {
      const messageId = await crossProjectComm.sendMessage(
        'secure-project',
        'target-project',
        'test.event',
        { data: 'secure message' }
      );

      expect(messageId).toBeDefined();
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'target.test.event',
        expect.objectContaining({
          security: expect.objectContaining({
            signature: expect.any(String),
            timestamp: expect.any(Number),
            nonce: expect.any(String)
          })
        }),
        expect.any(Object)
      );
    });

    test('should validate message security with handler option', async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);

      await expect(
        crossProjectComm.setupMessageHandler(
          'target-project',
          'test.event',
          mockHandler,
          { requireSignatureValidation: true }
        )
      ).resolves.not.toThrow();
    });
  });

  describe('Error Scenarios', () => {
    test('should handle Redis publish errors', async () => {
      mockEventBus.publish.mockRejectedValueOnce(new Error('Redis error'));

      const sourceProject: ProjectConfig = {
        projectId: 'source-project',
        name: 'Source Project',
        namespace: 'source',
        allowedEventTypes: ['test.event'],
        allowedTargets: ['target-project']
      };

      const targetProject: ProjectConfig = {
        projectId: 'target-project',
        name: 'Target Project',
        namespace: 'target',
        allowedEventTypes: ['test.event'],
        allowedTargets: []
      };

      await crossProjectComm.registerProject(sourceProject);
      await crossProjectComm.registerProject(targetProject);

      await expect(
        crossProjectComm.sendMessage(
          'source-project',
          'target-project',
          'test.event',
          { data: 'test' }
        )
      ).rejects.toThrow('Redis error');
    });

    test('should handle contract registration errors', async () => {
      mockEventBus.registerContract.mockRejectedValueOnce(new Error('Contract registration failed'));

      const contract: CrossProjectEventContract = {
        name: 'failing-contract',
        version: '1.0.0',
        sourceProject: 'source-project',
        targetProjects: ['target-project'],
        eventTypes: ['test.event'],
        schema: {},
        metadata: {
          description: 'Failing contract',
          author: 'test',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      await expect(
        crossProjectComm.registerCrossProjectContract(contract)
      ).rejects.toThrow('Contract registration failed');
    });
  });
});