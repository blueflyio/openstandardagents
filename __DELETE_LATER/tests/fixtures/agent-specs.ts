export const validAgentSpec = {
  name: 'Test Agent',
  version: '1.0.0',
  description: 'A test agent for validation',
  endpoint: 'http://localhost:8080',
  spec: {
    conformance_tier: 'core' as const,
    class: 'general' as const,
    category: 'assistant' as const,
    capabilities: {
      primary: ['chat', 'reasoning'],
      secondary: ['search', 'analysis']
    },
    protocols: [
      {
        name: 'openapi' as const,
        version: '3.1.0',
        required: true,
        extensions: ['json-schema']
      }
    ],
    endpoints: {
      health: 'http://localhost:8080/health',
      capabilities: 'http://localhost:8080/capabilities',
      api: 'http://localhost:8080/api'
    }
  }
};

export const invalidAgentSpec = {
  name: 'Invalid Agent',
  version: '1.0.0',
  // Missing required fields
  spec: {
    conformance_tier: 'invalid_tier', // Invalid enum value
    class: 'general',
    // Missing required capabilities field
    protocols: [],
    endpoints: {
      // Missing required health endpoint
      api: 'http://localhost:8080/api'
    }
  }
};

export const specialistAgentSpec = {
  ...validAgentSpec,
  name: 'Specialist Agent',
  spec: {
    ...validAgentSpec.spec,
    conformance_tier: 'advanced' as const,
    class: 'specialist' as const,
    category: 'tool' as const,
    capabilities: {
      primary: ['code_generation', 'testing'],
      secondary: ['documentation', 'refactoring']
    }
  }
};

export const workflowAgentSpec = {
  ...validAgentSpec,
  name: 'Workflow Agent',
  spec: {
    ...validAgentSpec.spec,
    conformance_tier: 'governed' as const,
    class: 'workflow' as const,
    category: 'coordinator' as const,
    capabilities: {
      primary: ['orchestration', 'coordination'],
      secondary: ['monitoring', 'error_handling']
    }
  }
};