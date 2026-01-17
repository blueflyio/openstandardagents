/**
 * Tests for OSSA v0.3.0 Workflow Schema
 */
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as fs from 'fs';
import * as path from 'path';
import {
  isOssaWorkflow,
  createWorkflowManifest,
  createStep,
  expr,
} from '../../src/types/workflow';
import { getApiVersion } from '../../src/utils/version.js';

describe('OSSA v0.3.0 Workflow Schema', () => {
  let ajv: Ajv;
  let schema: object;

  beforeAll(() => {
    // Load the v0.3.x schema
    const schemaPath = path.join(
      __dirname,
      '../../spec/v0.3/ossa-0.3.5.schema.json'
    );
    schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

    // Setup AJV validator
    ajv = new Ajv({ strict: false, allErrors: true });
    addFormats(ajv);
    ajv.addSchema(schema, 'ossa-0.3.0');
  });

  describe('kind: Workflow validation', () => {
    it('should validate a minimal Workflow manifest', () => {
      const manifest = {
        apiVersion: 'ossa/v0.3.3',
        kind: 'Workflow',
        metadata: {
          name: 'minimal-workflow',
        },
        spec: {
          steps: [
            {
              id: 'step-1',
            },
          ],
        },
      };

      const validate = ajv.getSchema('ossa-0.3.0');
      const valid = validate!(manifest);
      expect(valid).toBe(true);
    });

    it('should validate a Workflow with triggers', () => {
      const manifest = {
        apiVersion: 'ossa/v0.3.3',
        kind: 'Workflow',
        metadata: {
          name: 'triggered-workflow',
          version: '1.0.0',
        },
        spec: {
          triggers: [
            {
              type: 'webhook',
              path: '/api/trigger',
            },
            {
              type: 'cron',
              schedule: '0 9 * * *',
            },
            {
              type: 'event',
              source: 'drupal',
              event: 'node.created',
            },
          ],
          steps: [
            {
              id: 'process',
              kind: 'Task',
              ref: './tasks/process.yaml',
            },
          ],
        },
      };

      const validate = ajv.getSchema('ossa-0.3.0');
      const valid = validate!(manifest);
      expect(valid).toBe(true);
    });

    it('should validate a Workflow with mixed Task and Agent steps', () => {
      const manifest = {
        apiVersion: 'ossa/v0.3.3',
        kind: 'Workflow',
        metadata: {
          name: 'hybrid-workflow',
        },
        spec: {
          steps: [
            {
              id: 'fetch',
              kind: 'Task',
              ref: './tasks/fetch-data.yaml',
            },
            {
              id: 'analyze',
              kind: 'Agent',
              ref: './agents/analyzer.yaml',
              input: {
                data: '${{ steps.fetch.output.data }}',
              },
            },
            {
              id: 'publish',
              kind: 'Task',
              ref: './tasks/publish.yaml',
              condition: '${{ steps.analyze.output.approved }}',
            },
          ],
        },
      };

      const validate = ajv.getSchema('ossa-0.3.0');
      const valid = validate!(manifest);
      expect(valid).toBe(true);
    });

    it('should validate a Workflow with parallel steps', () => {
      const manifest = {
        apiVersion: 'ossa/v0.3.3',
        kind: 'Workflow',
        metadata: {
          name: 'parallel-workflow',
        },
        spec: {
          steps: [
            {
              id: 'parallel-tasks',
              kind: 'Parallel',
              parallel: [
                {
                  id: 'task-a',
                  kind: 'Task',
                  ref: './tasks/a.yaml',
                },
                {
                  id: 'task-b',
                  kind: 'Task',
                  ref: './tasks/b.yaml',
                },
              ],
            },
          ],
        },
      };

      const validate = ajv.getSchema('ossa-0.3.0');
      const valid = validate!(manifest);
      expect(valid).toBe(true);
    });

    it('should validate a Workflow with conditional branches', () => {
      const manifest = {
        apiVersion: 'ossa/v0.3.3',
        kind: 'Workflow',
        metadata: {
          name: 'conditional-workflow',
        },
        spec: {
          steps: [
            {
              id: 'check',
              kind: 'Task',
              ref: './tasks/check.yaml',
            },
            {
              id: 'branch',
              kind: 'Conditional',
              branches: [
                {
                  condition: '${{ steps.check.output.status == "ready" }}',
                  steps: [
                    {
                      id: 'process',
                      kind: 'Task',
                      ref: './tasks/process.yaml',
                    },
                  ],
                },
              ],
              else: [
                {
                  id: 'wait',
                  kind: 'Task',
                  ref: './tasks/wait.yaml',
                },
              ],
            },
          ],
        },
      };

      const validate = ajv.getSchema('ossa-0.3.0');
      const valid = validate!(manifest);
      expect(valid).toBe(true);
    });

    it('should validate a Workflow with loop', () => {
      const manifest = {
        apiVersion: 'ossa/v0.3.3',
        kind: 'Workflow',
        metadata: {
          name: 'loop-workflow',
        },
        spec: {
          inputs: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
              },
            },
          },
          steps: [
            {
              id: 'process-items',
              kind: 'Loop',
              loop: {
                over: '${{ workflow.input.items }}',
                as: 'item',
                parallelism: 5,
              },
              steps: [
                {
                  id: 'process-item',
                  kind: 'Task',
                  ref: './tasks/process-item.yaml',
                  input: {
                    item: '${{ item }}',
                  },
                },
              ],
            },
          ],
        },
      };

      const validate = ajv.getSchema('ossa-0.3.0');
      const valid = validate!(manifest);
      expect(valid).toBe(true);
    });

    it('should validate a Workflow with error handling', () => {
      const manifest = {
        apiVersion: 'ossa/v0.3.3',
        kind: 'Workflow',
        metadata: {
          name: 'error-handling-workflow',
        },
        spec: {
          steps: [
            {
              id: 'risky-task',
              kind: 'Task',
              ref: './tasks/risky.yaml',
              on_error: {
                action: 'compensate',
              },
            },
          ],
          error_handling: {
            on_failure: 'notify',
            notification: {
              channels: ['slack', 'email'],
              template: 'workflow_failure',
            },
            retry_policy: {
              max_attempts: 3,
              backoff: 'exponential',
              initial_delay_ms: 1000,
            },
          },
        },
      };

      const validate = ajv.getSchema('ossa-0.3.0');
      const valid = validate!(manifest);
      expect(valid).toBe(true);
    });

    it('should validate a Workflow with concurrency control', () => {
      const manifest = {
        apiVersion: 'ossa/v0.3.3',
        kind: 'Workflow',
        metadata: {
          name: 'concurrent-workflow',
        },
        spec: {
          concurrency: {
            group: 'deploy-production',
            cancel_in_progress: true,
          },
          steps: [
            {
              id: 'deploy',
              kind: 'Task',
              ref: './tasks/deploy.yaml',
            },
          ],
        },
      };

      const validate = ajv.getSchema('ossa-0.3.0');
      const valid = validate!(manifest);
      expect(valid).toBe(true);
    });

    it('should reject Workflow without steps', () => {
      const manifest = {
        apiVersion: 'ossa/v0.3.3',
        kind: 'Workflow',
        metadata: {
          name: 'invalid-workflow',
        },
        spec: {
          // Missing required 'steps' field
        },
      };

      const validate = ajv.getSchema('ossa-0.3.0');
      const valid = validate!(manifest);
      expect(valid).toBe(false);
    });

    it('should reject Workflow with empty steps array', () => {
      const manifest = {
        apiVersion: 'ossa/v0.3.3',
        kind: 'Workflow',
        metadata: {
          name: 'invalid-workflow',
        },
        spec: {
          steps: [], // Empty array violates minItems: 1
        },
      };

      const validate = ajv.getSchema('ossa-0.3.0');
      const valid = validate!(manifest);
      expect(valid).toBe(false);
    });
  });

  describe('TypeScript type guards', () => {
    it('isOssaWorkflow should return true for Workflow manifests', () => {
      const workflow = {
        apiVersion: 'ossa/v0.3.3',
        kind: 'Workflow',
        metadata: { name: 'test' },
        spec: { steps: [{ id: 'step-1' }] },
      };
      expect(isOssaWorkflow(workflow)).toBe(true);
    });

    it('isOssaWorkflow should return false for Task manifests', () => {
      const task = {
        apiVersion: 'ossa/v0.3.3',
        kind: 'Task',
        metadata: { name: 'test' },
        spec: { execution: { type: 'deterministic' } },
      };
      expect(isOssaWorkflow(task)).toBe(false);
    });

    it('createWorkflowManifest should create valid manifest', () => {
      const workflow = createWorkflowManifest('my-workflow', {
        metadata: { description: 'Test workflow' },
        spec: {
          steps: [{ id: 'step-1', kind: 'Task', ref: './task.yaml' }],
        },
      });

      expect(workflow.kind).toBe('Workflow');
      expect(workflow.apiVersion).toBe(getApiVersion());
      expect(workflow.metadata.name).toBe('my-workflow');
      expect(workflow.spec.steps).toHaveLength(1);

      const validate = ajv.getSchema('ossa-0.3.0');
      const valid = validate!(workflow);
      expect(valid).toBe(true);
    });

    it('createStep should create a valid step', () => {
      const step = createStep('process', 'Task', {
        ref: './tasks/process.yaml',
        input: { data: '${{ steps.fetch.output }}' },
      });

      expect(step.id).toBe('process');
      expect(step.kind).toBe('Task');
      expect(step.ref).toBe('./tasks/process.yaml');
    });

    it('expr should create expression syntax', () => {
      expect(expr('steps.fetch.output.data')).toBe(
        '${{ steps.fetch.output.data }}'
      );
      expect(expr('workflow.input.id')).toBe('${{ workflow.input.id }}');
    });
  });
});
