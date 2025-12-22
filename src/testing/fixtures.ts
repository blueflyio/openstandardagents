/**
 * Test Fixtures
 * Sample agent manifests and test data for testing
 */

import type { OssaAgent } from '../types/index.js';

/**
 * Basic valid agent manifest
 */
export const basicAgentManifest: OssaAgent = {
  apiVersion: 'ossa/v0.3.0',
  kind: 'Agent',
  metadata: {
    name: 'test-agent',
    version: '1.0.0',
    description: 'Test agent for unit tests',
    labels: {
      env: 'test',
    },
  },
  spec: {
    role: 'You are a helpful test assistant',
    llm: {
      provider: 'openai',
      model: 'gpt-4',
    },
    tools: [],
  },
};

/**
 * Agent with capabilities
 */
export const agentWithCapabilities: OssaAgent = {
  ...basicAgentManifest,
  metadata: {
    ...basicAgentManifest.metadata,
    name: 'capability-agent',
  },
  spec: {
    ...basicAgentManifest.spec,
    capabilities: [
      {
        name: 'search',
        description: 'Search for information',
        inputs: [
          {
            name: 'query',
            type: 'string',
            description: 'Search query',
            required: true,
          },
        ],
        outputs: [
          {
            name: 'results',
            type: 'array',
            description: 'Search results',
          },
        ],
      },
      {
        name: 'calculate',
        description: 'Perform calculations',
        inputs: [
          {
            name: 'expression',
            type: 'string',
            description: 'Mathematical expression',
            required: true,
          },
        ],
        outputs: [
          {
            name: 'result',
            type: 'number',
            description: 'Calculation result',
          },
        ],
      },
    ],
  } as any,
};

/**
 * Agent with policies
 */
export const agentWithPolicies: OssaAgent = {
  ...basicAgentManifest,
  metadata: {
    ...basicAgentManifest.metadata,
    name: 'policy-agent',
  },
  spec: {
    ...basicAgentManifest.spec,
    policies: [
      {
        name: 'rate-limit',
        type: 'rate-limit',
        rules: [
          {
            condition: 'requests > 100',
            action: 'throttle',
          },
        ],
      },
      {
        name: 'content-filter',
        type: 'content-filter',
        rules: [
          {
            condition: 'contains_profanity',
            action: 'block',
          },
        ],
      },
    ],
  } as any,
};

/**
 * Agent with tests defined
 */
export const agentWithTests: OssaAgent = {
  ...basicAgentManifest,
  metadata: {
    ...basicAgentManifest.metadata,
    name: 'tested-agent',
  },
  spec: {
    ...basicAgentManifest.spec,
    tests: [
      {
        id: 'test-name',
        name: 'Check agent name',
        type: 'unit',
        assertions: [
          {
            type: 'equals',
            actual: 'metadata.name',
            expected: 'tested-agent',
          },
        ],
      },
      {
        id: 'test-version',
        name: 'Check version format',
        type: 'unit',
        assertions: [
          {
            type: 'type',
            actual: 'metadata.version',
            expected: 'string',
          },
          {
            type: 'exists',
            actual: 'metadata.version',
            expected: true,
          },
        ],
      },
      {
        id: 'test-role',
        name: 'Check role exists',
        type: 'unit',
        assertions: [
          {
            type: 'exists',
            actual: 'spec.role',
            expected: true,
          },
          {
            type: 'type',
            actual: 'spec.role',
            expected: 'string',
          },
        ],
      },
    ],
  } as any,
};

/**
 * Invalid agent manifest (missing required fields)
 */
export const invalidAgentManifest: any = {
  apiVersion: 'ossa/v0.3.0',
  kind: 'Agent',
  metadata: {
    name: 'invalid-agent',
    // Missing version
  },
  spec: {
    // Missing role
    llm: {
      provider: 'openai',
      // Missing model
    },
  },
};

/**
 * Agent with complex tests
 */
export const agentWithComplexTests: OssaAgent = {
  ...basicAgentManifest,
  metadata: {
    ...basicAgentManifest.metadata,
    name: 'complex-agent',
    description: 'Agent with complex test scenarios',
  },
  spec: {
    ...basicAgentManifest.spec,
    capabilities: [
      {
        name: 'data-processing',
        description: 'Process data',
        inputs: [
          {
            name: 'data',
            type: 'object',
            description: 'Input data',
            required: true,
          },
        ],
        outputs: [
          {
            name: 'processed',
            type: 'object',
            description: 'Processed data',
          },
        ],
      },
    ],
    tests: [
      {
        id: 'integration-test-1',
        name: 'Test capability integration',
        type: 'integration',
        assertions: [
          {
            type: 'exists',
            actual: 'spec.capabilities',
            expected: true,
          },
          {
            type: 'type',
            actual: 'spec.capabilities',
            expected: 'object',
          },
        ],
      },
    ],
  } as any,
};

/**
 * Mock LLM response for testing
 */
export const mockLLMResponse = {
  id: 'mock-response',
  model: 'gpt-4',
  choices: [
    {
      message: {
        role: 'assistant',
        content: 'This is a mock response',
      },
    },
  ],
};

/**
 * Sample test results
 */
export const sampleTestResults = [
  {
    id: 'test-1',
    name: 'Test 1',
    type: 'unit' as const,
    status: 'passed' as const,
    duration: 50,
  },
  {
    id: 'test-2',
    name: 'Test 2',
    type: 'unit' as const,
    status: 'passed' as const,
    duration: 75,
  },
  {
    id: 'test-3',
    name: 'Test 3',
    type: 'integration' as const,
    status: 'failed' as const,
    duration: 100,
    message: 'Assertion failed',
  },
];
