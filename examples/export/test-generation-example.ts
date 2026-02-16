/**
 * Test Generation Example
 *
 * Demonstrates how to use the TestGenerator to create comprehensive
 * test suites for exported OSSA agents.
 */

import { TestGenerator } from '../../src/services/export/testing/index.js';
import type { OssaAgent } from '../../src/types/index.js';

// Example OSSA manifest
const manifest: OssaAgent = {
  apiVersion: 'ossa.blueflyio.dev/v0.4.1',
  kind: 'Agent',
  metadata: {
    name: 'customer-support-agent',
    version: '1.0.0',
    description: 'AI agent for customer support with tool usage',
    license: 'MIT',
  },
  spec: {
    role: `You are a helpful customer support agent.
You can search the knowledge base, create tickets, and check order status.
Always be polite and professional.`,
    llm: {
      provider: 'openai',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2000,
    },
    tools: [
      {
        name: 'search_knowledge_base',
        description: 'Search the knowledge base for articles',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'create_ticket',
        description: 'Create a support ticket',
        parameters: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Ticket title',
            },
            description: {
              type: 'string',
              description: 'Ticket description',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              description: 'Ticket priority',
            },
          },
          required: ['title', 'description'],
        },
      },
      {
        name: 'check_order_status',
        description: 'Check the status of an order',
        parameters: {
          type: 'object',
          properties: {
            order_id: {
              type: 'string',
              description: 'Order ID',
            },
          },
          required: ['order_id'],
        },
      },
    ],
  },
};

/**
 * Example 1: Generate comprehensive LangChain test suite
 */
function example1_comprehensive_langchain_tests() {
  console.log('\n=== Example 1: Comprehensive LangChain Tests ===\n');

  const generator = new TestGenerator();

  // Generate full test suite
  const testSuite = generator.generateLangChainTests(manifest, {
    includeUnit: true,
    includeIntegration: true,
    includeLoad: true,
    includeSecurity: true,
    includeCost: true,
    mockLLM: true,
  });

  console.log('Generated files:');
  testSuite.files.forEach((file) => {
    console.log(`  📄 ${file.path} (${file.type})`);
  });

  console.log('\nGenerated configs:');
  testSuite.configs.forEach((file) => {
    console.log(`  ⚙️  ${file.path}`);
  });

  console.log('\nGenerated fixtures:');
  testSuite.fixtures.forEach((file) => {
    console.log(`  📦 ${file.path}`);
  });

  console.log(`\nTotal: ${testSuite.files.length + testSuite.configs.length + testSuite.fixtures.length} files`);

  // Preview a test file
  const unitTest = testSuite.files.find((f) => f.path.includes('test_agent.py'));
  if (unitTest) {
    console.log('\n--- Preview: tests/unit/test_agent.py ---');
    console.log(unitTest.content.substring(0, 500) + '...\n');
  }
}

/**
 * Example 2: Generate only unit and security tests
 */
function example2_selective_tests() {
  console.log('\n=== Example 2: Selective Tests (Unit + Security) ===\n');

  const generator = new TestGenerator();

  // Generate only specific test types
  const testSuite = generator.generateLangChainTests(manifest, {
    includeUnit: true,
    includeIntegration: false,
    includeLoad: false,
    includeSecurity: true,
    includeCost: false,
  });

  console.log('Generated files:');
  testSuite.files.forEach((file) => {
    console.log(`  📄 ${file.path}`);
  });

  console.log(`\nTotal: ${testSuite.files.length} test files`);
}

/**
 * Example 3: Generate Kubernetes manifest tests
 */
function example3_kubernetes_tests() {
  console.log('\n=== Example 3: Kubernetes Manifest Tests ===\n');

  const generator = new TestGenerator();

  // Generate K8s manifest validation tests
  const testSuite = generator.generateKubernetesTests(manifest, {
    includeUnit: true,
  });

  console.log('Generated files:');
  testSuite.files.forEach((file) => {
    console.log(`  📄 ${file.path}`);
  });

  console.log('\nGenerated configs:');
  testSuite.configs.forEach((file) => {
    console.log(`  ⚙️  ${file.path}`);
  });

  // Preview manifest test
  const manifestTest = testSuite.files[0];
  if (manifestTest) {
    console.log('\n--- Preview: tests/test_manifests.py ---');
    console.log(manifestTest.content.substring(0, 600) + '...\n');
  }
}

/**
 * Example 4: Generate Drupal PHPUnit tests
 */
function example4_drupal_tests() {
  console.log('\n=== Example 4: Drupal PHPUnit Tests ===\n');

  const generator = new TestGenerator();

  // Generate Drupal module tests
  const testSuite = generator.generateDrupalTests(manifest, {
    includeUnit: true,
    includeIntegration: true,
  });

  console.log('Generated files:');
  testSuite.files.forEach((file) => {
    console.log(`  📄 ${file.path} (${file.language})`);
  });

  console.log('\nGenerated configs:');
  testSuite.configs.forEach((file) => {
    console.log(`  ⚙️  ${file.path}`);
  });

  console.log(`\nTotal: ${testSuite.files.length} test files`);

  // Preview kernel test
  const kernelTest = testSuite.files.find((f) => f.path.includes('Kernel'));
  if (kernelTest) {
    console.log('\n--- Preview: Kernel Test ---');
    console.log(kernelTest.content.substring(0, 500) + '...\n');
  }
}

/**
 * Example 5: Generate Temporal workflow replay tests
 */
function example5_temporal_tests() {
  console.log('\n=== Example 5: Temporal Workflow Replay Tests ===\n');

  const generator = new TestGenerator();

  // Generate Temporal workflow tests
  const testSuite = generator.generateTemporalTests(manifest, {
    includeUnit: true,
  });

  console.log('Generated files:');
  testSuite.files.forEach((file) => {
    console.log(`  📄 ${file.path}`);
  });

  // Preview workflow test
  const workflowTest = testSuite.files[0];
  if (workflowTest) {
    console.log('\n--- Preview: tests/workflow_test.py ---');
    console.log(workflowTest.content.substring(0, 500) + '...\n');
  }
}

/**
 * Example 6: Generate N8N workflow tests
 */
function example6_n8n_tests() {
  console.log('\n=== Example 6: N8N Workflow Tests ===\n');

  const generator = new TestGenerator();

  // Generate N8N workflow tests
  const testSuite = generator.generateN8NTests(manifest, {
    includeUnit: true,
  });

  console.log('Generated files:');
  testSuite.files.forEach((file) => {
    console.log(`  📄 ${file.path} (${file.language})`);
  });

  // Preview workflow test
  const workflowTest = testSuite.files[0];
  if (workflowTest) {
    console.log('\n--- Preview: tests/workflow_test.js ---');
    console.log(workflowTest.content.substring(0, 400) + '...\n');
  }
}

/**
 * Example 7: Integration with export workflow
 */
async function example7_export_with_tests() {
  console.log('\n=== Example 7: Export with Tests ===\n');

  // This shows how test generation integrates with exports
  const { LangChainExporter } = await import('../../src/services/export/langchain/index.js');

  const exporter = new LangChainExporter();

  // Export with comprehensive tests
  const result = await exporter.export(manifest, {
    includeApi: true,
    includeOpenApi: true,
    includeDocker: true,
    includeTests: true,
    testOptions: {
      includeUnit: true,
      includeIntegration: true,
      includeLoad: true,
      includeSecurity: true,
      includeCost: true,
    },
  });

  if (result.success) {
    console.log(`✅ Export successful!`);
    console.log(`Generated ${result.files.length} files\n`);

    // Count test files
    const testFiles = result.files.filter((f) => f.type === 'test');
    console.log(`Test files: ${testFiles.length}`);

    testFiles.forEach((file) => {
      console.log(`  🧪 ${file.path}`);
    });
  }
}

/**
 * Example 8: Custom test data generation
 */
function example8_custom_test_data() {
  console.log('\n=== Example 8: Custom Test Data ===\n');

  const generator = new TestGenerator();

  // Generate test suite to get fixtures
  const testSuite = generator.generateLangChainTests(manifest, {
    includeUnit: true,
  });

  // Find test data fixture
  const testDataFile = testSuite.fixtures.find((f) => f.path.includes('test_data.json'));

  if (testDataFile) {
    console.log('Generated test data:');
    const testData = JSON.parse(testDataFile.content);

    console.log('\nSample prompts:');
    testData.sample_prompts.forEach((prompt: string, i: number) => {
      console.log(`  ${i + 1}. "${prompt}"`);
    });

    console.log('\nTool test data:');
    testData.tools.forEach((tool: any) => {
      console.log(`  - ${tool.tool_name}: ${tool.description}`);
    });

    console.log('\nTest scenarios:');
    testData.test_scenarios.forEach((scenario: any) => {
      console.log(`  - ${scenario.name} (${scenario.steps.length} steps)`);
    });
  }
}

/**
 * Example 9: Running tests after export
 */
function example9_running_tests() {
  console.log('\n=== Example 9: Running Tests ===\n');

  console.log('After exporting with tests, run:\n');

  console.log('# Install test dependencies');
  console.log('pip install pytest pytest-asyncio pytest-mock\n');

  console.log('# Run all tests');
  console.log('pytest tests/ -v\n');

  console.log('# Run specific test types');
  console.log('pytest tests/unit/ -v              # Unit tests');
  console.log('pytest tests/integration/ -v       # Integration tests');
  console.log('pytest tests/security/ -v          # Security tests\n');

  console.log('# Run with coverage');
  console.log('pytest tests/ --cov=. --cov-report=html\n');

  console.log('# Run with real LLM (requires API keys)');
  console.log('pytest tests/ --use-real-llm\n');

  console.log('# Skip slow tests');
  console.log('pytest tests/ -m "not slow"\n');
}

/**
 * Example 10: CI/CD integration
 */
function example10_cicd() {
  console.log('\n=== Example 10: CI/CD Integration ===\n');

  console.log('GitHub Actions workflow:\n');

  const workflow = `
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Run tests
        run: pytest tests/ -v --cov=.

      - name: Upload coverage
        uses: codecov/codecov-action@v3
`;

  console.log(workflow);
}

// Run all examples
async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║       OSSA Test Generation Examples                   ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  try {
    example1_comprehensive_langchain_tests();
    example2_selective_tests();
    example3_kubernetes_tests();
    example4_drupal_tests();
    example5_temporal_tests();
    example6_n8n_tests();
    await example7_export_with_tests();
    example8_custom_test_data();
    example9_running_tests();
    example10_cicd();

    console.log('\n✅ All examples completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  example1_comprehensive_langchain_tests,
  example2_selective_tests,
  example3_kubernetes_tests,
  example4_drupal_tests,
  example5_temporal_tests,
  example6_n8n_tests,
  example7_export_with_tests,
  example8_custom_test_data,
  example9_running_tests,
  example10_cicd,
};
