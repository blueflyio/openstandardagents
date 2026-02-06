/**
 * Tests for OSSA v0.4.1 Task Schema
 */
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as fs from 'fs';
import * as path from 'path';
import { isOssaTask, createTaskManifest } from '../../src/types/task';
import { getApiVersion } from '../../src/utils/version';
import { API_VERSION } from '../../src/version.js';

describe('OSSA v0.4.1 Task Schema', () => {
  let ajv: Ajv;
  let schema: object;

  beforeAll(() => {
    // Load the v0.4 schema
    const schemaPath = path.join(
      __dirname,
      '../../spec/v0.4/agent.schema.json'
    );
    schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

    // Setup AJV validator
    ajv = new Ajv({ strict: false, allErrors: true });
    addFormats(ajv);
    ajv.addSchema(schema, 'ossa-0.4');
  });

  describe('kind: Task validation', () => {
    it('should validate a minimal Task manifest', () => {
      const manifest = {
        apiVersion: API_VERSION,
        kind: 'Task',
        metadata: {
          name: 'minimal-task',
        },
        spec: {
          execution: {
            type: 'deterministic',
          },
        },
      };

      const validate = ajv.getSchema('ossa-0.4');
      const valid = validate!(manifest);
      expect(valid).toBe(true);
    });

    it('should validate a full Task manifest with all fields', () => {
      const manifest = {
        apiVersion: API_VERSION,
        kind: 'Task',
        metadata: {
          name: 'publish-content',
          version: '1.0.0',
          description: 'Publishes draft content to the live site',
          labels: {
            domain: 'content-management',
            type: 'deterministic',
          },
          annotations: {
            owner: 'platform-team',
          },
        },
        spec: {
          execution: {
            type: 'deterministic',
            runtime: 'drupal',
            entrypoint: 'Drupal\\node\\Publisher::publish',
            timeout_seconds: 60,
          },
          capabilities: ['publish_content', 'send_notification'],
          input: {
            type: 'object',
            properties: {
              content_id: { type: 'string' },
              notify_author: { type: 'boolean' },
            },
            required: ['content_id'],
          },
          output: {
            type: 'object',
            properties: {
              published: { type: 'boolean' },
              url: { type: 'string' },
            },
          },
          batch: {
            enabled: false,
            parallelism: 10,
            chunk_size: 100,
            retry: {
              max_attempts: 3,
              backoff_strategy: 'exponential',
              initial_delay_ms: 1000,
            },
            on_item_error: 'retry',
          },
          preconditions: [
            {
              expression: "${{ input.content_id != '' }}",
              error_message: 'Content ID is required',
            },
          ],
          postconditions: [
            {
              expression: '${{ output.published == true }}',
              error_message: 'Content must be published',
            },
          ],
          error_handling: {
            on_error: 'retry',
            error_mapping: {
              CONTENT_NOT_FOUND: 'fail',
              NETWORK_ERROR: 'retry',
            },
          },
          observability: {
            logging: {
              level: 'info',
              include_input: false,
              include_output: true,
            },
            metrics: {
              enabled: true,
              custom_labels: {
                task_type: 'publish',
              },
            },
            tracing: {
              enabled: true,
              sample_rate: 1.0,
            },
          },
        },
        runtime: {
          type: 'drupal',
          bindings: {
            publish_content: {
              handler: 'Drupal\\node\\Entity\\Node::setPublished',
            },
            send_notification: {
              handler:
                'Drupal\\ai_agents\\Service\\NotificationService::notify',
            },
          },
        },
      };

      const validate = ajv.getSchema('ossa-0.4');
      const valid = validate!(manifest);
      if (!valid) {
        console.error(
          'Validation errors:',
          JSON.stringify(validate!.errors, null, 2)
        );
      }
      expect(valid).toBe(true);
    });

    it('should reject Task without required execution field', () => {
      const manifest = {
        apiVersion: API_VERSION,
        kind: 'Task',
        metadata: {
          name: 'invalid-task',
        },
        spec: {
          // Missing required 'execution' field
          capabilities: ['some_capability'],
        },
      };

      const validate = ajv.getSchema('ossa-0.4');
      const valid = validate!(manifest);
      expect(valid).toBe(false);
    });

    it('should reject invalid execution type', () => {
      const manifest = {
        apiVersion: API_VERSION,
        kind: 'Task',
        metadata: {
          name: 'invalid-task',
        },
        spec: {
          execution: {
            type: 'invalid_type', // Invalid
          },
        },
      };

      const validate = ajv.getSchema('ossa-0.4');
      const valid = validate!(manifest);
      expect(valid).toBe(false);
    });

    it('should validate batch processing configuration', () => {
      const manifest = {
        apiVersion: API_VERSION,
        kind: 'Task',
        metadata: {
          name: 'batch-task',
        },
        spec: {
          execution: {
            type: 'idempotent',
            runtime: 'node',
          },
          batch: {
            enabled: true,
            parallelism: 50,
            chunk_size: 100,
            retry: {
              max_attempts: 3,
              backoff_strategy: 'exponential',
            },
            on_item_error: 'skip',
          },
        },
      };

      const validate = ajv.getSchema('ossa-0.4');
      const valid = validate!(manifest);
      expect(valid).toBe(true);
    });
  });

  describe('kind differentiation', () => {
    it('should accept Agent kind', () => {
      const manifest = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: {
          name: 'test-agent',
        },
        spec: {
          role: 'Test agent role',
        },
      };

      const validate = ajv.getSchema('ossa-0.4');
      const valid = validate!(manifest);
      expect(valid).toBe(true);
    });

    it('should reject unknown kind', () => {
      const manifest = {
        apiVersion: API_VERSION,
        kind: 'Unknown',
        metadata: {
          name: 'test',
        },
        spec: {},
      };

      const validate = ajv.getSchema('ossa-0.4');
      const valid = validate!(manifest);
      expect(valid).toBe(false);
    });
  });

  describe('TypeScript type guards', () => {
    it('isOssaTask should return true for Task manifests', () => {
      const task = {
        apiVersion: API_VERSION,
        kind: 'Task',
        metadata: { name: 'test' },
        spec: { execution: { type: 'deterministic' } },
      };
      expect(isOssaTask(task)).toBe(true);
    });

    it('isOssaTask should return false for Agent manifests', () => {
      const agent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: { name: 'test' },
        spec: { role: 'test' },
      };
      expect(isOssaTask(agent)).toBe(false);
    });

    it('createTaskManifest should create valid manifest', () => {
      const task = createTaskManifest('my-task', {
        metadata: { description: 'Test task' },
        spec: { capabilities: ['do_something'] },
      });

      expect(task.kind).toBe('Task');

      expect(task.apiVersion).toBe(getApiVersion());
      expect(task.metadata.name).toBe('my-task');
      expect(task.spec.capabilities).toContain('do_something');
      const validate = ajv.getSchema('ossa-0.4');
      const valid = validate!(task);
      expect(valid).toBe(true);
    });
  });
});
