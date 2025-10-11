# OSSA + Ollama Integration Guide

Use free local AI models with OSSA to avoid paying for API tokens.

## Quick Setup

### 1. Ollama Already Installed 
Ollama is already installed and running on your system with the following models:
- `gpt-oss:20b` (13 GB) - Primary model
- `gpt-oss:120b` (65 GB) - Large model for complex tasks
- `mistral:7b` (4.4 GB) - Alternative model
- `codellama:7b` (3.8 GB) - Code-focused model
- `qwen2.5:7b` (4.7 GB) - Another option

### 2. Environment Configuration
Your `.env` file is configured with:
```bash
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gpt-oss:20b
FALLBACK_MODEL=gpt-oss:120b
```

### 3. OSSA Integration
The `OSSALlmAgent` class now connects to Ollama instead of paid APIs.

## Usage Examples

### Basic Test
```bash
# Make sure Ollama is running
ollama serve

# Test the integration with TypeScript examples
npm run test
```

### Using Different Models
```bash
# Switch to different model
export OLLAMA_MODEL=mistral:7b
npm run test

# Or for code tasks
export OLLAMA_MODEL=codellama:7b
npm run test
```

### From TypeScript/JavaScript
```typescript
import { OSSALlmAgent } from './dist/adk/agents/llm-agent.js';

const agent = new OSSALlmAgent({
  name: 'MyAgent',
  instruction: 'You are a helpful assistant.',
  tools: []
});

const result = await agent.invoke({
  question: 'Explain TypeScript interfaces'
});

console.log(result.output);
```

## Performance Comparison

| Model | Size | Speed | Best For |
|-------|------|-------|----------|
| `gpt-oss:20b` | 13 GB | ~13s | General tasks |
| `mistral:7b` | 4.4 GB | ~5s | Quick responses |
| `codellama:7b` | 3.8 GB | ~5s | Code generation |
| `qwen2.5:7b` | 4.7 GB | ~6s | Balanced performance |

## Benefits

-  **Zero API costs** - Run unlimited queries locally
-  **Privacy** - No data sent to external services
-  **Speed** - No network latency after model loading
-  **Offline** - Works without internet connection
-  **Control** - Choose your own models and parameters

## Available Commands

```bash
# List installed models
ollama list

# Start server (if not running)
ollama serve

# Pull new models
ollama pull llama3.2:3b

# Test OSSA integration
node test-ollama.js

# Build and run OSSA with Ollama
npm run build
npm start
```

## Troubleshooting

### Ollama Not Running
```bash
# Start Ollama server
ollama serve
```

### Model Not Found
```bash
# Check available models
ollama list

# Pull missing model
ollama pull gpt-oss:20b
```

### Memory Issues
```bash
# Use smaller model
export OLLAMA_MODEL=mistral:7b

# Or tiny model for testing
export OLLAMA_MODEL=llama3.2:3b
```

## Cost Savings

Using Ollama with OSSA eliminates:
- OpenAI API costs (~$0.002-0.06 per 1K tokens)
- Claude API costs (~$0.008-0.024 per 1K tokens)
- Google AI costs (~$0.0007-0.002 per 1K tokens)

**Result**: Unlimited AI inference at zero cost after initial setup!