/**
 * Test Scenarios
 * Pre-defined test scenarios for common agent testing patterns
 */

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  tests: Array<{
    id: string;
    name: string;
    prompt: string;
    expectedPatterns?: string[]; // Patterns that should appear in response
    expectedToolCalls?: string[]; // Tool names that should be called
    shouldFail?: boolean; // Whether this test should fail
    errorPattern?: string; // Pattern to match in error message
  }>;
}

export const TEST_SCENARIOS: Record<string, TestScenario> = {
  'basic-interaction': {
    id: 'basic-interaction',
    name: 'Basic Interaction',
    description: 'Test basic agent responses',
    tests: [
      {
        id: 'greeting',
        name: 'Agent responds to greetings',
        prompt: 'Hello, how are you?',
        expectedPatterns: ['hello', 'help'],
      },
      {
        id: 'simple-question',
        name: 'Agent handles simple questions',
        prompt: 'What can you do?',
        expectedPatterns: ['mock', 'assistant'],
      },
    ],
  },

  'tool-usage': {
    id: 'tool-usage',
    name: 'Tool Usage',
    description: 'Test agent tool calling capabilities',
    tests: [
      {
        id: 'tool-detection',
        name: 'Agent detects when to use tools',
        prompt: 'Please search for information about AI',
        expectedToolCalls: ['search'],
      },
      {
        id: 'multiple-tools',
        name: 'Agent can use multiple tools',
        prompt: 'Search for data and then calculate the results',
        expectedToolCalls: ['search', 'calculate'],
      },
    ],
  },

  'error-handling': {
    id: 'error-handling',
    name: 'Error Handling',
    description: 'Test agent error handling and recovery',
    tests: [
      {
        id: 'graceful-failure',
        name: 'Agent handles errors gracefully',
        prompt: 'Please cause an error',
        expectedPatterns: ['error', 'mock'],
      },
      {
        id: 'invalid-tool',
        name: 'Agent handles invalid tool calls',
        prompt: 'Use a tool that does not exist',
        expectedPatterns: ['mock'],
      },
    ],
  },

  'code-generation': {
    id: 'code-generation',
    name: 'Code Generation',
    description: 'Test agent code generation capabilities',
    tests: [
      {
        id: 'function-generation',
        name: 'Agent generates code',
        prompt: 'Write a function to add two numbers',
        expectedPatterns: ['function', 'typescript', '```'],
      },
      {
        id: 'code-explanation',
        name: 'Agent explains code',
        prompt: 'Explain this code: function add(a, b) { return a + b; }',
        expectedPatterns: ['mock'],
      },
    ],
  },

  'content-processing': {
    id: 'content-processing',
    name: 'Content Processing',
    description: 'Test agent content processing capabilities',
    tests: [
      {
        id: 'summarization',
        name: 'Agent summarizes content',
        prompt: 'Summarize this: Lorem ipsum dolor sit amet...',
        expectedPatterns: ['summary', 'mock'],
      },
      {
        id: 'translation',
        name: 'Agent translates text',
        prompt: 'Translate "hello" to Spanish',
        expectedPatterns: ['translate', 'mock'],
      },
      {
        id: 'analysis',
        name: 'Agent analyzes content',
        prompt: 'Analyze the sentiment of: I love this!',
        expectedPatterns: ['analysis', 'mock'],
      },
    ],
  },

  performance: {
    id: 'performance',
    name: 'Performance',
    description: 'Test agent performance characteristics',
    tests: [
      {
        id: 'response-time',
        name: 'Agent responds in reasonable time',
        prompt: 'Quick question: what is 2+2?',
        expectedPatterns: ['mock'],
      },
      {
        id: 'long-context',
        name: 'Agent handles long context',
        prompt: 'Process this long text: ' + 'Lorem ipsum '.repeat(100),
        expectedPatterns: ['mock'],
      },
    ],
  },

  'edge-cases': {
    id: 'edge-cases',
    name: 'Edge Cases',
    description: 'Test agent handling of edge cases',
    tests: [
      {
        id: 'empty-prompt',
        name: 'Agent handles empty prompt',
        prompt: '',
        expectedPatterns: ['mock'],
      },
      {
        id: 'special-characters',
        name: 'Agent handles special characters',
        prompt: 'Process: !@#$%^&*()_+{}[]|\\:";\'<>?,./`~',
        expectedPatterns: ['mock'],
      },
      {
        id: 'unicode',
        name: 'Agent handles unicode',
        prompt: 'Translate: 你好世界 🌍',
        expectedPatterns: ['mock'],
      },
    ],
  },

  comprehensive: {
    id: 'comprehensive',
    name: 'Comprehensive Test Suite',
    description: 'Full test suite covering all scenarios',
    tests: [],
  },
};

// Populate comprehensive scenario after all scenarios are defined
TEST_SCENARIOS['comprehensive'].tests.push(
  ...(TEST_SCENARIOS['basic-interaction']?.tests || []),
  ...(TEST_SCENARIOS['tool-usage']?.tests || []),
  ...(TEST_SCENARIOS['error-handling']?.tests || []),
  ...(TEST_SCENARIOS['code-generation']?.tests || []),
  ...(TEST_SCENARIOS['content-processing']?.tests || [])
);

/**
 * Get scenario by ID
 */
export function getScenario(id: string): TestScenario | undefined {
  return TEST_SCENARIOS[id];
}

/**
 * List all available scenarios
 */
export function listScenarios(): Array<{
  id: string;
  name: string;
  description: string;
}> {
  return Object.values(TEST_SCENARIOS).map((scenario) => ({
    id: scenario.id,
    name: scenario.name,
    description: scenario.description,
  }));
}

/**
 * Get scenario by category
 */
export function getScenariosByCategory(
  category: 'basic' | 'advanced' | 'all'
): TestScenario[] {
  const basic = ['basic-interaction', 'tool-usage'];
  const advanced = [
    'error-handling',
    'code-generation',
    'content-processing',
    'performance',
    'edge-cases',
  ];

  let scenarioIds: string[];
  if (category === 'basic') {
    scenarioIds = basic;
  } else if (category === 'advanced') {
    scenarioIds = advanced;
  } else {
    scenarioIds = [...basic, ...advanced];
  }

  return scenarioIds
    .map((id) => TEST_SCENARIOS[id])
    .filter((s): s is TestScenario => s !== undefined);
}
