# Best Practices Guide

Production best practices for OSSA agent development and deployment.

## Agent Development

### 1. Version Your Agents

Use semantic versioning for all agents:

```yaml
apiVersion: ossa/v0.4.0
kind: Agent
metadata:
  name: code-reviewer
  version: 1.2.3  # Major.Minor.Patch
```

**Versioning Rules:**

- **Major (1.x.x)**: Breaking changes to interface or behavior
- **Minor (x.1.x)**: New features, backward compatible
- **Patch (x.x.1)**: Bug fixes only

### 2. Document Everything

```yaml
metadata:
  name: code-reviewer
  description: |
    AI-powered code review agent with security analysis.

    ## Capabilities
    - Static code analysis
    - Security vulnerability detection
    - Style and formatting checks

    ## Requirements
    - Anthropic API key
    - Python 3.9+

  author: Your Name <email@example.com>
  tags:
    - code-review
    - security
    - python
```

### 3. Define Clear Capabilities

```yaml
metadata:
  capabilities:
    - code-review        # What the agent can do
    - security-analysis
    - documentation

spec:
  tools:
    - name: analyze_code       # How it does it
      description: Analyze code for issues
    - name: scan_security
      description: Scan for vulnerabilities
```

### 4. Use Appropriate LLM Settings

```yaml
spec:
  llm:
    provider: anthropic
    model: claude-3-5-sonnet-20241022

    # Deterministic tasks (code review, analysis)
    temperature: 0.2

    # Creative tasks (documentation, explanations)
    # temperature: 0.7

    # Reasonable max tokens (don't waste tokens)
    maxTokens: 2048  # Not 4096 if you don't need it
```

### 5. Validate Before Export

```bash
# Always validate manifests before exporting
ossa validate agent.ossa.yaml

# Check for warnings
ossa lint agent.ossa.yaml

# Standardize format
ossa standardize agent.ossa.yaml
```

## Export Best Practices

### 1. Choose the Right Platform

```bash
# For npm distribution
ossa export agent.ossa.yaml --platform npm

# For Python/LangChain workflows
ossa export agent.ossa.yaml --platform langchain

# For direct Claude integration
ossa export agent.ossa.yaml --platform anthropic

# For multiple platforms
ossa export agent.ossa.yaml --platform npm,langchain,anthropic
```

### 2. Use Dry Run First

```bash
# Preview export without writing files
ossa export agent.ossa.yaml --platform npm --dry-run --verbose

# Check what will be generated
# Verify file structure
# Then do actual export
ossa export agent.ossa.yaml --platform npm --output ./package
```

### 3. Include API Endpoints

```bash
# Production exports should include API
ossa export agent.ossa.yaml --platform anthropic --with-api

# Benefits:
# - HTTP access
# - OpenAPI documentation
# - Client code generation
# - Monitoring and metrics
```

### 4. Add Skills for Claude Code

```bash
# Include Claude Code skill in npm packages
ossa export agent.ossa.yaml --platform npm --skill

# Easy integration: cp SKILL.md ~/.claude/skills/
```

## API Development

### 1. Implement Proper Error Handling

```typescript
app.post('/api/v1/execute', async (req, res) => {
  try {
    // Validate input
    if (!req.body.input) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Input is required'
        }
      });
    }

    // Execute agent
    const result = await agent.execute(req.body.input);

    res.json({
      success: true,
      output: result
    });

  } catch (error) {
    // Log error
    logger.error('Execution failed:', error);

    // Return appropriate status code
    if (error.name === 'RateLimitError') {
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: error.message,
          retryAfter: 60
        }
      });
    }

    // Generic error
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Agent execution failed'
      }
    });
  }
});
```

### 2. Add Request Validation

```typescript
import { z } from 'zod';

const ExecuteRequestSchema = z.object({
  input: z.string().min(1).max(10000),
  context: z.object({}).optional(),
  options: z.object({
    temperature: z.number().min(0).max(1).optional(),
    maxTokens: z.number().int().min(1).max(4096).optional(),
  }).optional(),
});

app.post('/api/v1/execute', async (req, res) => {
  // Validate request
  const validation = ExecuteRequestSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: validation.error.errors
      }
    });
  }

  // Process validated request
  const data = validation.data;
  // ...
});
```

### 3. Implement Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 100,              // 100 requests per window
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests'
    }
  },
  standardHeaders: true,  // Return rate limit info in headers
  legacyHeaders: false,
});

app.use('/api/v1', limiter);
```

### 4. Add Monitoring

```typescript
import prometheus from 'prom-client';

const requestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status']
});

const requestCount = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status']
});

app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;

    requestDuration.labels(req.method, req.path, res.statusCode.toString())
      .observe(duration);

    requestCount.labels(req.method, req.path, res.statusCode.toString())
      .inc();
  });

  next();
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});
```

## Security

### 1. Never Commit Secrets

```bash
# Use environment variables
export ANTHROPIC_API_KEY=sk-ant-...
export DATABASE_URL=postgres://...

# Add to .gitignore
echo ".env" >> .gitignore
echo "secrets.json" >> .gitignore
echo "*.key" >> .gitignore
```

### 2. Implement API Key Authentication

```typescript
function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'API key required'
      }
    });
  }

  // Validate API key (from database, env var, etc.)
  if (apiKey !== process.env.VALID_API_KEY) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid API key'
      }
    });
  }

  next();
}

app.use('/api/v1', authenticateApiKey);
```

### 3. Sanitize Inputs and Outputs

```typescript
import DOMPurify from 'isomorphic-dompurify';

function sanitizeInput(input: string): string {
  // Remove dangerous content
  return DOMPurify.sanitize(input);
}

function sanitizeOutput(output: string): string {
  // Remove sensitive data
  return output
    .replace(/API_KEY=\w+/g, 'API_KEY=***')
    .replace(/sk-[a-zA-Z0-9-]+/g, 'sk-***');
}

app.post('/api/v1/execute', async (req, res) => {
  const sanitized = sanitizeInput(req.body.input);
  const result = await agent.execute(sanitized);
  const cleaned = sanitizeOutput(result);

  res.json({ output: cleaned });
});
```

### 4. Use HTTPS in Production

```typescript
import https from 'https';
import fs from 'fs';

const options = {
  key: fs.readFileSync('privkey.pem'),
  cert: fs.readFileSync('cert.pem')
};

https.createServer(options, app).listen(443);
```

### 5. Implement CORS Properly

```typescript
import cors from 'cors';

// Production - whitelist specific origins
const corsOptions = {
  origin: [
    'https://example.com',
    'https://www.example.com'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Development - allow all (not for production!)
// app.use(cors());
```

## Testing

### 1. Write Unit Tests

```typescript
import { describe, test, expect } from 'vitest';
import { validateManifest } from '@bluefly/openstandardagents/validation';

describe('Agent Manifest', () => {
  test('validates successfully', async () => {
    const manifest = {
      apiVersion: "ossa/v0.4.0",
      kind: "Agent",
      metadata: {
        name: "test-agent"
      },
      spec: {
        role: "Assistant"
      }
    };

    const result = await validateManifest(manifest);
    expect(result.valid).toBe(true);
  });

  test('rejects invalid manifest', async () => {
    const manifest = {
      apiVersion: "invalid",  // Wrong version
      kind: "Agent"
    };

    const result = await validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });
});
```

### 2. Test API Endpoints

```typescript
import request from 'supertest';
import app from './app';

describe('API Endpoints', () => {
  test('POST /api/v1/execute', async () => {
    const response = await request(app)
      .post('/api/v1/execute')
      .set('X-API-Key', 'test-key')
      .send({ input: 'test' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.output).toBeDefined();
  });

  test('rejects missing API key', async () => {
    const response = await request(app)
      .post('/api/v1/execute')
      .send({ input: 'test' })
      .expect(401);

    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  test('validates request body', async () => {
    const response = await request(app)
      .post('/api/v1/execute')
      .set('X-API-Key', 'test-key')
      .send({})  // Missing 'input'
      .expect(400);

    expect(response.body.error.code).toBe('INVALID_INPUT');
  });
});
```

### 3. Integration Tests

```typescript
describe('Agent Integration', () => {
  test('executes agent end-to-end', async () => {
    const agent = new AnthropicAdapter(manifest, {
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const response = await agent.execute([
      { role: 'user', content: 'What is 2+2?' }
    ]);

    expect(response.text).toContain('4');
    expect(response.usage.totalTokens).toBeGreaterThan(0);
    expect(response.cost).toBeGreaterThan(0);
  });
});
```

## Deployment

### 1. Use Environment-Specific Configs

```typescript
// config/production.ts
export default {
  port: 8080,
  logLevel: 'warn',
  rateLimit: {
    windowMs: 60000,
    max: 100
  }
};

// config/development.ts
export default {
  port: 3000,
  logLevel: 'debug',
  rateLimit: {
    windowMs: 60000,
    max: 1000
  }
};

// Load config
import config from `./config/${process.env.NODE_ENV || 'development'}`;
```

### 2. Use Health Checks

```typescript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    checks: {
      api: 'healthy',
      llm: 'healthy'
    }
  });
});

app.get('/health/ready', async (req, res) => {
  try {
    // Check external dependencies
    await checkLLMConnection();
    await checkDatabase();

    res.json({ ready: true });
  } catch (error) {
    res.status(503).json({
      ready: false,
      error: error.message
    });
  }
});
```

### 3. Implement Graceful Shutdown

```typescript
const server = app.listen(PORT);

function gracefulShutdown() {
  console.log('Shutting down gracefully...');

  server.close(() => {
    console.log('HTTP server closed');

    // Close database connections
    // Close LLM connections
    // Cleanup

    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Forcing shutdown');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
```

### 4. Use Process Manager

```bash
# PM2 for Node.js
npm install -g pm2

pm2 start dist/server.js --name my-agent
pm2 save
pm2 startup

# Or Docker
docker run -d \
  --name my-agent \
  --restart unless-stopped \
  -p 3000:3000 \
  my-agent:latest
```

## Performance

### 1. Enable Caching

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 });  // 5 minute TTL

app.post('/api/v1/execute', async (req, res) => {
  const cacheKey = `execute:${JSON.stringify(req.body)}`;

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  // Execute
  const result = await agent.execute(req.body.input);

  // Cache result
  cache.set(cacheKey, result);

  res.json(result);
});
```

### 2. Use Compression

```typescript
import compression from 'compression';

app.use(compression());
```

### 3. Optimize Token Usage

```yaml
spec:
  llm:
    # Use lower temperature for deterministic tasks
    temperature: 0.2

    # Set reasonable max tokens
    maxTokens: 1024  # Not 4096 if you don't need it

  # Enable prompt caching (Anthropic)
  extensions:
    anthropic:
      prompt_caching:
        enabled: true
```

## Logging

### 1. Structured Logging

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

logger.info('Agent execution started', {
  input: sanitizedInput,
  userId: req.user.id
});
```

### 2. Log Important Events

```typescript
// Execution start
logger.info('Executing agent', {
  agent: manifest.metadata.name,
  input: req.body.input
});

// Execution complete
logger.info('Agent execution complete', {
  duration: Date.now() - start,
  tokens: response.usage.totalTokens,
  cost: response.cost
});

// Errors
logger.error('Agent execution failed', {
  error: error.message,
  stack: error.stack
});

// Security events
logger.warn('Invalid API key attempt', {
  ip: req.ip,
  key: apiKey.substring(0, 10) + '***'
});
```

## Documentation

### 1. Document API

Use OpenAPI spec + README:

```markdown
# My Agent API

AI-powered agent for code review.

## Quick Start

\`\`\`bash
curl -X POST http://localhost:3000/api/v1/execute \
  -H "X-API-Key: your-key" \
  -d '{"input":"test"}'
\`\`\`

## API Documentation

Full API docs: http://localhost:3000/api-docs

## Authentication

Requires API key in `X-API-Key` header.

## Rate Limits

- 100 requests/minute per IP
- 1000 requests/minute per API key
```

### 2. Document Agent Capabilities

```yaml
metadata:
  name: code-reviewer
  description: |
    Comprehensive code review agent.

    ## Features
    - Static code analysis
    - Security scanning
    - Style checking

    ## Supported Languages
    - Python
    - JavaScript/TypeScript
    - Go
    - Rust

    ## Requirements
    - Anthropic API key
    - 2GB RAM minimum

  tags:
    - code-review
    - security
    - multi-language
```

## Next Steps

- [Cost Optimization](./cost-optimization.md) - Reduce operational costs
- [API Endpoints](./api-endpoints.md) - Complete API reference
- [OpenAPI Specs](./openapi-specs.md) - OpenAPI documentation guide
