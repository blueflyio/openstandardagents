# OSSA Advanced Patterns

This directory contains advanced design patterns and implementations for OSSA (Open Standards for Scalable Agents) that demonstrate best practices for building robust, scalable agent-based systems.

## Available Patterns

### 1. Model Router

**File**: `model-router.ts`  
**Description**: A basic implementation of a model router that selects the most appropriate language model based on task requirements.

**Key Features**:
- Simple model selection
- Basic cost and performance considerations
- Easy to extend

**Usage**:
```typescript
import { ModelRouter } from './model-router';

const router = new ModelRouter();
const response = await router.process({
  prompt: 'Your prompt here',
  requirements: {
    maxCostPerToken: 0.00001,
    maxLatencyMs: 2000
  }
});
```

### 2. Smart Model Router

**File**: `smart-model-routing.ts`  
**Description**: An advanced model routing solution with support for multiple providers, dynamic model selection, and fallback strategies.

**Key Features**:
- Multi-provider support (Ollama, OpenAI, Anthropic)
- Dynamic model selection based on requirements
- Cost optimization
- Performance monitoring
- Fallback strategies

**Usage**:
```typescript
import { SmartModelRouter } from './smart-model-routing';

const router = new SmartModelRouter();

// For quick responses with cost constraints
const fastResponse = await router.process({
  prompt: 'Quick answer needed',
  requirements: {
    maxCostPerToken: 0.000005,
    maxLatencyMs: 2000,
    minCapabilities: ['text-generation']
  }
});

// For complex tasks with higher budget
const complexResponse = await router.process({
  prompt: 'Detailed analysis required...',
  requirements: {
    maxCostPerToken: 0.00002,
    maxLatencyMs: 10000,
    minCapabilities: ['analysis', 'reasoning'],
    minContextLength: 16000
  }
});
```

## Getting Started

### Prerequisites

- Node.js 18+ with TypeScript
- Ollama running locally (for local models)
- API keys for cloud providers (if using cloud models)

### Installation

1. Install dependencies:
   ```bash
   npm install @ossa/core dotenv axios
   ```

2. Start Ollama (for local models):
   ```bash
   ollama serve
   ```

3. Pull required models:
   ```bash
   ollama pull llama3
   ollama pull mixtral
   ```

## Configuration

### Environment Variables

Create a `.env` file in the examples directory:

```env
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434

# OpenAI (optional)
OPENAI_API_KEY=your-openai-key

# Anthropic (optional)
ANTHROPIC_API_KEY=your-anthropic-key
```

### Model Configuration

You can customize the available models and their parameters in the respective router implementation files.

## Running Examples

### Basic Model Router

```bash
npx ts-node model-router.ts
```

### Smart Model Router

```bash
npx ts-node smart-model-routing.ts
```

## Best Practices

1. **Cost Management**
   - Set conservative default cost limits
   - Monitor usage and adjust budgets as needed
   - Use local models when possible to reduce costs

2. **Performance**
   - Consider both latency and throughput requirements
   - Implement caching for repeated queries
   - Use connection pooling for cloud providers

3. **Reliability**
   - Implement retries with exponential backoff
   - Set appropriate timeouts
   - Monitor error rates and performance metrics

## Extending the Patterns

### Adding New Models

1. Add the model configuration to the `MODEL_CONFIGS` object
2. Implement the corresponding handler method if needed
3. Update the router's capabilities

### Adding New Providers

1. Add the provider to the `ModelConfig` type
2. Implement the provider-specific logic in the router
3. Update the router's provider handling

## Troubleshooting

### Common Issues

1. **Local Model Not Responding**
   - Verify Ollama is running: `curl http://localhost:11434/api/tags`
   - Check if models are downloaded: `ollama list`

2. **API Key Issues**
   - Verify API keys are set in `.env`
   - Check provider documentation for rate limits

3. **Performance Problems**
   - Monitor system resources
   - Adjust batch sizes and concurrency settings
   - Check network latency to cloud providers

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## Resources

- [OSSA Documentation](https://docs.ossa.io)
- [Ollama Documentation](https://ollama.ai/docs)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Anthropic API Reference](https://docs.anthropic.com/)

---
*Last updated: October 2024*
