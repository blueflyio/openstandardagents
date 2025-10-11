# OSSA LangChain Integration

## Overview

The OSSA LangChain integration provides seamless conversion of OSSA agent definitions to LangChain chains, enabling developers to leverage OSSA's standardized agent specifications within the LangChain ecosystem. This integration supports multiple composition patterns, provider-agnostic LLM usage, and advanced chain orchestration.

## Features

- ** Automatic Conversion**: Convert OSSA YAML definitions to LangChain chains
- **🎭 Multiple Patterns**: Support for sequential, parallel, conditional, map-reduce, and pipeline patterns
- **🤖 Multi-Provider**: Compatible with OpenAI, Anthropic, and other LangChain-supported providers
- ** Streaming Support**: Built-in streaming capabilities using LangChain's Runnable interface
- ** Flexible Composition**: Create complex agent workflows from simple OSSA definitions
- ** Error Handling**: Comprehensive validation and error handling throughout the chain lifecycle

## Installation

The LangChain integration is included with OSSA v0.1.8+:

```bash
npm install @bluefly/open-standards-scalable-agents
```

Required dependencies are automatically installed:
- `langchain` - Core LangChain library
- `@langchain/core` - LangChain core components
- `@langchain/community` - Community integrations
- `@langchain/openai` - OpenAI provider
- `@langchain/anthropic` - Anthropic provider

## Quick Start

### 1. Basic Agent Creation

```javascript
import { LangChainAgentFactory } from '@bluefly/open-standards-scalable-agents/lib/integrations/langchain/langchain-agent-factory.js';

// Initialize factory
const factory = new LangChainAgentFactory();

// Create agent from OSSA definition
const agent = await factory.createBasicAgent(
  './path/to/agent.yml',
  {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    temperature: 0.1
  }
);

// Use the agent
const result = await agent.invoke({
  task: 'code analysis',
  input: 'function add(a, b) { return a + b; }'
});

console.log(result.output);
```

### 2. Capability-Specific Agents

```javascript
// Create an agent for a specific capability
const codeAnalyzer = await factory.createCapabilityAgent(
  './agent.yml',
  'analyze_code',
  { provider: 'anthropic', model: 'claude-3-haiku-20240307' }
);

const analysis = await codeAnalyzer.invoke({
  code: 'const items = [1, 2, 3]; items.map(x => x * 2);'
});
```

### 3. Multi-Capability Routing

```javascript
// Create agent that automatically routes to appropriate capabilities
const multiAgent = await factory.createMultiCapabilityAgent('./agent.yml', llmConfig);

// Automatic routing based on input content
const result1 = await multiAgent.invoke('Analyze this code for bugs');  // → analyze_code
const result2 = await multiAgent.invoke('Generate documentation');      // → generate_docs

// Direct capability invocation
const result3 = await multiAgent.invokeCapability('suggest_improvements', {
  code: 'var x = 1; var y = 2;'
});
```

## Chain Composition Patterns

### Sequential Chains

Process data through multiple capabilities in sequence:

```javascript
import { OssaChainComposer } from '@bluefly/open-standards-scalable-agents/lib/integrations/langchain/chain-composer.js';

const composer = new OssaChainComposer();
const sequentialChain = await composer.createSequentialChain(
  './agent.yml',
  llm,
  ['analyze_code', 'suggest_improvements', 'generate_docs']
);

const result = await sequentialChain.invoke('function factorial(n) { ... }');
// Returns outputs from all three capabilities
```

### Parallel Chains

Execute multiple capabilities simultaneously:

```javascript
const parallelChain = await composer.createParallelChain(
  './agent.yml',
  llm,
  ['analyze_code', 'validate_syntax', 'suggest_improvements']
);

const results = await parallelChain.invoke({
  code: 'def fibonacci(n): ...',
  language: 'python'
});
// All capabilities execute in parallel
```

### Conditional Routing

Intelligently route inputs to appropriate capabilities:

```javascript
const conditionalChain = await composer.createConditionalChain('./agent.yml', llm);

// Routes based on input content keywords
await conditionalChain.invoke('Check syntax errors');     // → validate_syntax
await conditionalChain.invoke('Document this function');  // → generate_docs
await conditionalChain.invoke('Find performance issues'); // → analyze_code
```

### Map-Reduce Pattern

Process multiple inputs and combine results:

```javascript
const mapReduceChain = await composer.createMapReduceChain(
  './agent.yml',
  llm,
  'analyze_code'  // Map capability
);

const codeSamples = [
  { code: 'function quickSort() { ... }' },
  { code: 'class Stack { ... }' },
  { code: 'const fibonacci = () => { ... }' }
];

const result = await mapReduceChain.invoke(codeSamples);
// Returns individual analyses + combined summary
```

### Pipeline Processing

Create data transformation pipelines:

```javascript
const pipelineChain = await composer.createPipelineChain('./agent.yml', llm);

const result = await pipelineChain.invoke('public class BinarySearch { ... }');
// Processes through: analyze → improve → document with transformations
```

## Provider Configuration

### OpenAI Configuration

```javascript
const openAIConfig = {
  provider: 'openai',
  model: 'gpt-4',  // or 'gpt-3.5-turbo'
  temperature: 0.1,
  apiKey: process.env.OPENAI_API_KEY,  // optional, uses env var by default
  maxTokens: 2000,
  topP: 1.0
};
```

### Anthropic Configuration

```javascript
const anthropicConfig = {
  provider: 'anthropic',
  model: 'claude-3-sonnet-20240229',  // or 'claude-3-haiku-20240307'
  temperature: 0.1,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,  // optional
  maxTokens: 1000
};
```

## OSSA Agent Structure

The LangChain integration works with standard OSSA v0.1.6+ agent definitions:

```yaml
apiVersion: open-standards-scalable-agents/v0.1.6
kind: Agent
metadata:
  name: code-assistant
  version: 1.0.0
  description: AI assistant for code analysis and improvement
spec:
  agent:
    name: Code Assistant
    expertise: Code analysis, documentation, and improvement suggestions
  capabilities:
    - name: analyze_code
      description: Analyzes code quality and structure
    - name: generate_docs
      description: Creates documentation from code
    - name: validate_syntax
      description: Checks syntax errors and formatting
    - name: suggest_improvements
      description: Recommends code improvements
  frameworks:
    langchain:
      enabled: true
  security:
    authentication: api_key
    authorization: rbac
```

## Advanced Usage

### Custom Composition Configuration

```javascript
const customComposition = await composer.createComposition('./agent.yml', llm, {
  pattern: 'conditional',
  routingRules: {
    analyze_code: ['bug', 'error', 'issue'],
    generate_docs: ['document', 'explain'],
    validate_syntax: ['syntax', 'compile'],
    suggest_improvements: ['optimize', 'improve']
  }
});
```

### Streaming Support

```javascript
const runnableAgent = await factory.createRunnableAgent('./agent.yml', llmConfig);

// Stream responses
const streamResults = await runnableAgent.stream({
  task: 'documentation',
  input: 'Explain unit testing best practices'
});

for (const chunk of streamResults) {
  console.log('Chunk:', chunk.output);
}
```

### Tool Integration (OpenAI only)

```javascript
import { SerpAPI } from 'langchain/tools';
import { Calculator } from 'langchain/tools/calculator';

const tools = [new SerpAPI(), new Calculator()];
const toolAgent = await factory.createToolAgent('./agent.yml', tools, {
  provider: 'openai',
  model: 'gpt-4'
});

const result = await toolAgent.invoke('Search for Python best practices and calculate ROI');
```

## Error Handling

The integration provides comprehensive error handling:

```javascript
try {
  const agent = await factory.createBasicAgent('./agent.yml', llmConfig);
  const result = await agent.invoke(input);
} catch (error) {
  if (error.message.includes('ENOENT')) {
    console.error('OSSA file not found');
  } else if (error.message.includes('API key')) {
    console.error('Invalid or missing API key');
  } else if (error.message.includes('Capability')) {
    console.error('Requested capability not supported');
  } else {
    console.error('General error:', error.message);
  }
}
```

## Supported Capabilities

The current integration supports these OSSA capabilities:

| Capability | Description | Template Available |
|------------|-------------|-------------------|
| `analyze_code` | Code quality and structure analysis |  |
| `generate_docs` | Documentation generation from code |  |
| `validate_syntax` | Syntax and formatting validation |  |
| `suggest_improvements` | Performance and quality improvements |  |
| `text_processing` | General text processing tasks |  |
| `data_analysis` | Data analysis and interpretation |  |
| `code_review` | Comprehensive code reviews |  |
| `planning` | Task and strategy planning |  |

## Examples

Complete working examples are available in the `/examples/langchain/` directory:

- `ossa-langchain-basic-example.js` - Basic agent creation and usage
- `ossa-langchain-runnable-example.js` - Runnable interface and streaming
- `ossa-langchain-composition-example.js` - Advanced composition patterns

Run examples:

```bash
# Set your API key
export OPENAI_API_KEY="your-key-here"
# or
export ANTHROPIC_API_KEY="your-key-here"

# Run basic example
node examples/langchain/ossa-langchain-basic-example.js

# Run composition examples
node examples/langchain/ossa-langchain-composition-example.js
```

## Best Practices

### 1. Capability Design

- **Keep capabilities focused**: Each capability should have a single, well-defined purpose
- **Use descriptive names**: Capability names should clearly indicate their function
- **Provide schemas**: Include input/output schemas for better validation

### 2. Template Optimization

- **Clear instructions**: Templates should provide clear, specific instructions to the LLM
- **Context inclusion**: Include relevant context and constraints in templates
- **Variable naming**: Use descriptive variable names in templates

### 3. Chain Composition

- **Choose appropriate patterns**: Select composition patterns based on your use case
  - Sequential: When outputs depend on previous steps
  - Parallel: When capabilities can run independently
  - Conditional: When routing logic is needed
  - Map-Reduce: When processing multiple similar inputs
  - Pipeline: When data transformation is required

### 4. Error Handling

- **Validate inputs**: Always validate OSSA definitions and inputs
- **Handle API limits**: Implement retry logic for rate limits
- **Graceful degradation**: Provide fallbacks for unsupported capabilities

### 5. Performance Optimization

- **Cache agents**: Reuse agent instances when possible
- **Optimize prompts**: Keep templates concise but informative
- **Use appropriate models**: Balance cost and performance based on requirements

## Limitations

- **Provider dependency**: Tool agents require OpenAI-compatible providers
- **Template coverage**: Not all capabilities may have optimized templates
- **Streaming support**: Varies by provider and model configuration
- **Memory usage**: Large compositions may require significant memory

## Troubleshooting

### Common Issues

1. **"Failed to load OSSA definition"**
   - Check file path and ensure YAML is valid
   - Verify required fields are present

2. **"Unsupported provider"**
   - Ensure provider is 'openai' or 'anthropic'
   - Check API key configuration

3. **"Capability not found"**
   - Verify capability exists in OSSA definition
   - Check if capability is supported by integration

4. **API Key Issues**
   - Set environment variables: `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
   - Ensure keys have appropriate permissions

### Debug Mode

Enable verbose logging:

```javascript
const agent = await factory.createBasicAgent('./agent.yml', {
  ...llmConfig,
  verbose: true
});
```

## Contributing

To contribute to the LangChain integration:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/langchain-enhancement`
3. Add tests for new capabilities or patterns
4. Update documentation
5. Submit a pull request

## License

This integration is part of OSSA and is licensed under the Apache 2.0 License.