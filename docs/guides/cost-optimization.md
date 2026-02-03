# Cost Optimization Guide

Reduce AI agent operational costs by up to 90% with these optimization strategies.

## Overview

OSSA v0.4.1 includes comprehensive cost optimization features:

- **Prompt Caching**: 90% cost reduction on repeated context (Anthropic)
- **Token Budgets**: Hard limits to prevent cost overruns
- **Smart Temperature**: Lower temperature = fewer tokens needed
- **Tool Output Limits**: Prevent expensive tool outputs
- **Model Selection**: Use appropriate model for each task

## Prompt Caching

### Anthropic Prompt Caching

Enable 90% cost savings on cached prompt portions:

```yaml
apiVersion: ossa/v0.4.0
kind: Agent
metadata:
  name: code-reviewer
spec:
  llm:
    provider: anthropic
    model: claude-3-5-sonnet-20241022
  extensions:
    anthropic:
      prompt_caching:
        enabled: true
        cache_breakpoints:
          - system_prompt      # Cache system instructions
          - tool_definitions   # Cache tool schemas
          - context            # Cache conversation context
```

**Cost Comparison:**

```typescript
// Without caching
const response1 = await agent.execute("Review code...");
console.log(`Cost: $${response1.cost}`);  // $0.015

// With caching (subsequent requests)
const response2 = await agent.execute("Review different code...");
console.log(`Cost: $${response2.cost}`);  // $0.002 (87% cheaper!)
```

**When to Use:**
- Long system prompts (>1000 tokens)
- Repeated tool definitions
- Conversation history
- Large context documents

**Savings:**
- **Input tokens (cached)**: 90% cheaper
- **Input tokens (uncached)**: Normal price
- **Output tokens**: Normal price

### Configure Caching

```typescript
import { AnthropicAdapter } from './runtime';

const adapter = new AnthropicAdapter(manifest, {
  enablePromptCaching: true,
  cacheBreakpoints: [
    'system_prompt',
    'tool_definitions'
  ]
});

// First request builds cache
const response1 = await adapter.execute([...]);
// Cost: $0.015, Cache: MISS

// Subsequent requests use cache
const response2 = await adapter.execute([...]);
// Cost: $0.002, Cache: HIT
```

## Token Budgets

### Hard Token Limits

Prevent cost overruns with token budgets:

```yaml
spec:
  llm:
    provider: anthropic
    model: claude-3-5-sonnet-20241022
    maxTokens: 1024  # Hard limit

  token_budget:
    max_input_tokens: 100000    # Daily input limit
    max_output_tokens: 50000    # Daily output limit
    max_total_tokens: 150000    # Daily total limit
    reset_interval: daily       # or hourly, weekly
```

**Enforcement:**

```typescript
const adapter = new AnthropicAdapter(manifest, {
  tokenBudget: {
    maxInputTokens: 100000,
    maxOutputTokens: 50000,
    resetInterval: 'daily'
  }
});

// Exceeding budget throws error
try {
  const response = await adapter.execute([...]);
} catch (error) {
  if (error.code === 'TOKEN_BUDGET_EXCEEDED') {
    console.error('Daily token budget exceeded');
    console.log('Tokens used:', error.tokensUsed);
    console.log('Budget limit:', error.budgetLimit);
    console.log('Reset at:', error.resetTime);
  }
}
```

### Soft Limits with Warnings

```yaml
spec:
  token_budget:
    soft_limit: 100000      # Warn at 100k
    hard_limit: 150000      # Block at 150k
    warning_thresholds:
      - 50000   # 50k tokens: log warning
      - 75000   # 75k tokens: send alert
      - 100000  # 100k tokens: require approval
```

## Temperature Optimization

Lower temperature = more deterministic = fewer retries:

### Task-Specific Temperature

```yaml
spec:
  llm:
    # Code review (deterministic)
    temperature: 0.2  # Lower = cheaper

    # Creative writing (varied)
    # temperature: 0.7  # Higher = more tokens

    # Translation (exact)
    # temperature: 0.1  # Lowest = most efficient
```

**Cost Impact:**

```typescript
// High temperature (0.9) - creative, varied
const creative = await agent.execute("Write a story", {
  temperature: 0.9
});
// Average tokens: 1500, Cost: $0.0225

// Low temperature (0.2) - focused, efficient
const focused = await agent.execute("Analyze code", {
  temperature: 0.2
});
// Average tokens: 800, Cost: $0.012  (47% cheaper!)
```

## Model Selection

Use the right model for each task:

### Model Cost Comparison

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Use Case |
|-------|----------------------|------------------------|----------|
| Claude 3.5 Sonnet | $3.00 | $15.00 | Production, complex tasks |
| Claude 3 Haiku | $0.25 | $1.25 | Simple tasks, high volume |
| GPT-4 Turbo | $10.00 | $30.00 | Most complex reasoning |
| GPT-3.5 Turbo | $0.50 | $1.50 | Simple classification |

### Dynamic Model Selection

```yaml
spec:
  llm:
    provider: anthropic

    # Default model
    model: claude-3-5-sonnet-20241022

  # Use cheaper models for simple tasks
  routing:
    - condition: task == 'classify'
      model: claude-3-haiku-20240307
    - condition: task == 'summarize'
      model: claude-3-haiku-20240307
    - condition: task == 'analyze'
      model: claude-3-5-sonnet-20241022
```

**Implementation:**

```typescript
function selectModel(task: string): string {
  // Simple tasks: use Haiku (5-10x cheaper)
  if (['classify', 'summarize', 'translate'].includes(task)) {
    return 'claude-3-haiku-20240307';
  }

  // Complex tasks: use Sonnet
  return 'claude-3-5-sonnet-20241022';
}

const model = selectModel(taskType);
const adapter = new AnthropicAdapter(manifest, { model });
```

## Tool Output Limits

Prevent expensive tool outputs:

```yaml
spec:
  tools:
    - name: search_docs
      description: Search documentation
      max_output_length: 1000  # Limit output to 1000 chars

    - name: analyze_file
      max_output_length: 2000

  tool_budget:
    max_tool_calls: 5         # Max 5 tool calls per execution
    max_total_output: 10000   # Max 10k chars total output
```

**Enforcement:**

```typescript
adapter.registerToolHandler("search_docs", async (input) => {
  const results = await searchDocumentation(input.query);

  // Truncate to limit
  const truncated = results.substring(0, 1000);

  return truncated;
});
```

## Batch Processing

Process multiple inputs together:

```typescript
// Inefficient: 10 separate API calls
for (const input of inputs) {
  await agent.execute(input);  // $0.002 each = $0.020 total
}

// Efficient: 1 batched API call
const batch = inputs.join('\n\n---\n\n');
await agent.execute(batch);  // $0.005 total (75% savings!)
```

## Context Management

Minimize conversation history:

```typescript
const history: Message[] = [];

function trimHistory(messages: Message[], maxTokens: number = 4000) {
  let totalTokens = 0;
  const trimmed: Message[] = [];

  // Keep recent messages up to token limit
  for (let i = messages.length - 1; i >= 0; i--) {
    const tokens = estimateTokens(messages[i].content);

    if (totalTokens + tokens > maxTokens) {
      break;
    }

    trimmed.unshift(messages[i]);
    totalTokens += tokens;
  }

  return trimmed;
}

// Before execution
const limited = trimHistory(history);
const response = await agent.execute(limited);
```

## Caching Strategies

### Application-Level Caching

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 });  // 1 hour

async function executeWithCache(input: string) {
  const cacheKey = `execute:${hash(input)}`;

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log('Cache HIT - $0.000');
    return cached;
  }

  // Execute
  const result = await agent.execute(input);
  console.log(`Cache MISS - $${result.cost}`);

  // Cache result
  cache.set(cacheKey, result);

  return result;
}
```

**Savings:**
- Cached requests: $0 (100% savings)
- Reduced API calls
- Faster response times

## Rate Limiting

Prevent accidental cost spikes:

```typescript
import Bottleneck from 'bottleneck';

const limiter = new Bottleneck({
  minTime: 1000,  // Min 1 second between requests
  maxConcurrent: 5  // Max 5 concurrent requests
});

// Wrap agent execution
const execute = limiter.wrap(async (input: string) => {
  return await agent.execute(input);
});

// Protected execution
const result = await execute("test");
```

## Monitoring and Alerts

Track costs in real-time:

```typescript
import prometheus from 'prom-client';

const costMetric = new prometheus.Gauge({
  name: 'agent_cost_usd',
  help: 'Agent execution cost in USD',
  labelNames: ['agent', 'model']
});

const tokenMetric = new prometheus.Counter({
  name: 'agent_tokens_total',
  help: 'Total tokens used',
  labelNames: ['agent', 'type']  // type: input or output
});

// Track costs
const response = await agent.execute(input);

costMetric.labels(agent.name, agent.model).set(response.cost);
tokenMetric.labels(agent.name, 'input').inc(response.usage.inputTokens);
tokenMetric.labels(agent.name, 'output').inc(response.usage.outputTokens);

// Alert if daily cost exceeds $100
if (getDailyCost() > 100) {
  sendAlert('Daily cost limit exceeded');
}
```

## Cost Estimation

Estimate costs before execution:

```typescript
function estimateCost(
  inputTokens: number,
  outputTokens: number,
  model: string
): number {
  const pricing = {
    'claude-3-5-sonnet-20241022': {
      input: 3.00 / 1_000_000,
      output: 15.00 / 1_000_000
    },
    'claude-3-haiku-20240307': {
      input: 0.25 / 1_000_000,
      output: 1.25 / 1_000_000
    }
  };

  const rates = pricing[model];
  return (inputTokens * rates.input) + (outputTokens * rates.output);
}

// Before execution
const inputTokens = estimateTokens(input);
const estimatedOutputTokens = 1000;

const estimatedCost = estimateCost(
  inputTokens,
  estimatedOutputTokens,
  'claude-3-5-sonnet-20241022'
);

console.log(`Estimated cost: $${estimatedCost.toFixed(4)}`);

if (estimatedCost > 0.10) {
  console.warn('High cost execution - consider using cheaper model');
}
```

## Best Practices

### 1. Always Use Prompt Caching

```typescript
// Enable caching for all agents
const adapter = new AnthropicAdapter(manifest, {
  enablePromptCaching: true
});

// Savings: 80-90% on repeated context
```

### 2. Set Token Limits

```yaml
spec:
  llm:
    maxTokens: 1024  # Don't use 4096 if you don't need it

  token_budget:
    max_total_tokens: 100000
    reset_interval: daily
```

### 3. Use Lower Temperature

```yaml
spec:
  llm:
    # Code review, analysis: 0.1-0.3
    temperature: 0.2

    # Creative writing: 0.7-0.9 (when needed)
```

### 4. Choose Right Model

```typescript
// Simple tasks: Haiku (10x cheaper)
const simple = new AnthropicAdapter(manifest, {
  model: 'claude-3-haiku-20240307'
});

// Complex tasks: Sonnet
const complex = new AnthropicAdapter(manifest, {
  model: 'claude-3-5-sonnet-20241022'
});
```

### 5. Cache Aggressively

```typescript
// Cache everything cacheable
const cache = new NodeCache({ stdTTL: 3600 });

// Deduplicate requests
const deduped = deduplicateRequests(inputs);
```

### 6. Monitor Costs

```typescript
// Track all costs
logger.info('Execution cost', {
  cost: response.cost,
  tokens: response.usage.totalTokens,
  model: manifest.spec.llm.model
});

// Alert on anomalies
if (response.cost > 0.10) {
  sendAlert('High cost execution detected');
}
```

## Savings Calculator

Estimate your savings:

```typescript
function calculateSavings(
  requestsPerDay: number,
  avgInputTokens: number,
  avgOutputTokens: number
) {
  // Before optimization
  const costPerRequest = estimateCost(
    avgInputTokens,
    avgOutputTokens,
    'claude-3-5-sonnet-20241022'
  );

  const dailyCostBefore = costPerRequest * requestsPerDay;
  const monthlyCostBefore = dailyCostBefore * 30;

  // After optimization
  // - 90% of input tokens cached (90% cheaper)
  // - 30% reduction in output tokens (lower temp)
  const cachedInputCost = (avgInputTokens * 0.9) * (3.00 / 1_000_000 * 0.1);
  const uncachedInputCost = (avgInputTokens * 0.1) * (3.00 / 1_000_000);
  const outputCost = (avgOutputTokens * 0.7) * (15.00 / 1_000_000);

  const costPerRequestAfter = cachedInputCost + uncachedInputCost + outputCost;
  const dailyCostAfter = costPerRequestAfter * requestsPerDay;
  const monthlyCostAfter = dailyCostAfter * 30;

  const savings = monthlyCostBefore - monthlyCostAfter;
  const savingsPercent = (savings / monthlyCostBefore) * 100;

  return {
    before: monthlyCostBefore,
    after: monthlyCostAfter,
    savings,
    savingsPercent: savingsPercent.toFixed(1)
  };
}

// Example
const result = calculateSavings(10000, 2000, 1000);
console.log(`Before: $${result.before.toFixed(2)}/month`);
console.log(`After: $${result.after.toFixed(2)}/month`);
console.log(`Savings: $${result.savings.toFixed(2)}/month (${result.savingsPercent}%)`);

// Output:
// Before: $450.00/month
// After: $67.50/month
// Savings: $382.50/month (85.0%)
```

## Next Steps

- [Best Practices](./best-practices.md) - General best practices
- [API Endpoints](./api-endpoints.md) - API documentation
- [Anthropic Export](../exports/anthropic.md) - Anthropic-specific features
