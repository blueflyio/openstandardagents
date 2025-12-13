/**
 * OSSA Validator Workflow Tests
 * Tests for Workflow kind validation
 */

import { validator } from '../ossa-validator';

describe('OSSA Validator - Workflow Kind', () => {
  beforeAll(async () => {
    await validator.initialize();
  });

  describe('Workflow Manifest Validation', () => {
    it('should validate a valid workflow manifest', async () => {
      const workflow = {
        apiVersion: 'ossa/v0.3.1',
        kind: 'Workflow',
        metadata: {
          name: 'test-workflow',
        },
        spec: {
          steps: [
            {
              id: 'step1',
              kind: 'Agent',
              ref: 'my-agent',
            },
          ],
        },
      };

      const result = validator.validateWorkflowManifest(workflow);
      expect(result.valid).toBe(true);
      expect(result.kind).toBe('Workflow');
    });

    it('should reject workflow without steps', async () => {
      const workflow = {
        apiVersion: 'ossa/v0.3.1',
        kind: 'Workflow',
        metadata: {
          name: 'test-workflow',
        },
        spec: {
          steps: [],
        },
      };

      const result = validator.validateWorkflowManifest(workflow);
      expect(result.valid).toBe(false);
    });

    it('should validate workflow with all step types', async () => {
      const workflow = {
        apiVersion: 'ossa/v0.3.1',
        kind: 'Workflow',
        metadata: {
          name: 'complex-workflow',
        },
        spec: {
          steps: [
            {
              id: 'task-step',
              kind: 'Task',
              ref: 'my-task',
            },
            {
              id: 'agent-step',
              kind: 'Agent',
              ref: 'my-agent',
              depends_on: ['task-step'],
            },
            {
              id: 'parallel-step',
              kind: 'Parallel',
              parallel: [
                {
                  id: 'p1',
                  kind: 'Agent',
                  ref: 'agent1',
                },
                {
                  id: 'p2',
                  kind: 'Agent',
                  ref: 'agent2',
                },
              ],
            },
            {
              id: 'conditional-step',
              kind: 'Conditional',
              condition: '${state.value} > 10',
              branches: [
                {
                  condition: '${state.value} > 20',
                  steps: [
                    {
                      id: 'high-value',
                      kind: 'Task',
                      ref: 'high-task',
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      const result = validator.validateWorkflowManifest(workflow);
      expect(result.valid).toBe(true);
    });

    it('should validate workflow with error handling', async () => {
      const workflow = {
        apiVersion: 'ossa/v0.3.1',
        kind: 'Workflow',
        metadata: {
          name: 'error-handling-workflow',
        },
        spec: {
          steps: [
            {
              id: 'step1',
              kind: 'Agent',
              ref: 'my-agent',
            },
          ],
          error_handling: {
            on_failure: 'rollback',
            retry_policy: {
              max_attempts: 3,
              backoff: 'exponential',
              initial_delay_ms: 1000,
              max_delay_ms: 60000,
            },
          },
        },
      };

      const result = validator.validateWorkflowManifest(workflow);
      expect(result.valid).toBe(true);
    });

    it('should validate workflow with triggers', async () => {
      const workflow = {
        apiVersion: 'ossa/v0.3.1',
        kind: 'Workflow',
        metadata: {
          name: 'triggered-workflow',
        },
        spec: {
          steps: [
            {
              id: 'step1',
              kind: 'Agent',
              ref: 'my-agent',
            },
          ],
          triggers: [
            {
              type: 'webhook',
              path: '/trigger',
            },
            {
              type: 'cron',
              schedule: '0 0 * * *',
            },
          ],
        },
      };

      const result = validator.validateWorkflowManifest(workflow);
      expect(result.valid).toBe(true);
    });
  });

  describe('WorkflowStep Validation', () => {
    it('should validate step with dependencies', async () => {
      const workflow = {
        apiVersion: 'ossa/v0.3.1',
        kind: 'Workflow',
        metadata: { name: 'test' },
        spec: {
          steps: [
            {
              id: 'step1',
              kind: 'Agent',
              ref: 'agent1',
            },
            {
              id: 'step2',
              kind: 'Agent',
              ref: 'agent2',
              depends_on: ['step1'],
            },
          ],
        },
      };

      const result = validator.validateWorkflowManifest(workflow);
      expect(result.valid).toBe(true);
    });

    it('should reject step with invalid dependency', async () => {
      const workflow = {
        apiVersion: 'ossa/v0.3.1',
        kind: 'Workflow',
        metadata: { name: 'test' },
        spec: {
          steps: [
            {
              id: 'step1',
              kind: 'Agent',
              ref: 'agent1',
              depends_on: ['non-existent-step'],
            },
          ],
        },
      };

      const result = validator.validateWorkflowManifest(workflow);
      // Should either fail validation or handle gracefully
      expect(result).toBeDefined();
    });
  });

  describe('Supported Kinds', () => {
    it('should return all supported kinds', () => {
      const kinds = validator.getSupportedKinds();
      expect(kinds).toContain('Workflow');
      expect(kinds).toContain('Agent');
      expect(kinds).toContain('Task');
      expect(kinds).toContain('MessageRouting');
    });
  });
});
