# Production-Grade Migration Guide

This guide shows how to migrate existing OSSA code to use production-grade error handling and logging.

## Table of Contents

1. [Error Handling](#error-handling)
2. [Structured Logging](#structured-logging)
3. [Performance Monitoring](#performance-monitoring)
4. [Migration Examples](#migration-examples)

---

## Error Handling

### Before (Old Way)

```typescript
// ❌ Generic error, no error code, hard to handle
throw new Error('Validation failed');

// ❌ String errors, not typed
throw 'Something went wrong';

// ❌ No context, hard to debug
if (!manifest) {
  throw new Error('Manifest not found');
}
```

### After (Production-Grade)

```typescript
import {
  ValidationError,
  ManifestValidationError,
  AgentNotFoundError,
  toOssaError,
  isRetryable,
} from '@/errors';

// ✅ Typed error with code and context
throw new ValidationError('Validation failed', {
  field: 'metadata.name',
  value: invalidValue,
  expected: 'string',
});

// ✅ Specific error class with automatic code
throw new ManifestValidationError('Invalid manifest structure', {
  schema: 'ossa/v0.4.1',
  errors: validationErrors,
});

// ✅ Rich context for debugging
if (!agent) {
  throw new AgentNotFoundError(agentId, {
    registry: registryUrl,
    searchFilters: filters,
  });
}

// ✅ Convert unknown errors safely
try {
  await dangerousOperation();
} catch (error) {
  const ossaError = toOssaError(error);

  // Check if retryable
  if (isRetryable(ossaError)) {
    await retry(dangerousOperation);
  } else {
    throw ossaError;
  }
}
```

### Error Handling in Express

```typescript
import { OssaError, ApiError, toOssaError } from '@/errors';
import { logger } from '@/utils/logger';

// Error handler middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const ossaError = toOssaError(err);

  // Log error with full context
  logger.error({
    err: ossaError,
    req: {
      method: req.method,
      url: req.url,
      headers: req.headers,
    },
    msg: 'Request failed',
  });

  // Send structured error response
  res.status(ossaError.statusCode).json(ossaError.toJSON());
});

// Route with error handling
app.post('/api/agents', async (req, res, next) => {
  try {
    const agent = await validateAgent(req.body);
    res.json(agent);
  } catch (error) {
    next(error); // Middleware handles conversion
  }
});
```

---

## Structured Logging

### Before (Old Way)

```typescript
// ❌ Unstructured console logs
console.log('Starting validation...');
console.error('Validation failed:', error.message);

// ❌ Hard to parse, no context
console.log(`Agent ${agentId} deployed successfully`);

// ❌ No trace correlation
console.log('Processing request...');
```

### After (Production-Grade)

```typescript
import { logger, createModuleLogger, measurePerformance } from '@/utils/logger';

// ✅ Structured logging with context
const moduleLogger = createModuleLogger('validation-service');

moduleLogger.info({
  operation: 'validate-manifest',
  agentId: 'mycompany/my-agent',
  version: '1.0.0',
  msg: 'Starting manifest validation',
});

// ✅ Error logging with full context
try {
  await validateManifest(manifest);
} catch (error) {
  moduleLogger.error({
    err: error,
    manifest: {
      name: manifest.metadata.name,
      version: manifest.metadata.version,
    },
    msg: 'Manifest validation failed',
  });
}

// ✅ Performance measurement
await measurePerformance(logger, 'agent-deployment', async () => {
  await deployAgent(agentId);
});

// ✅ Automatic trace correlation (OpenTelemetry)
// Logs automatically include traceId, spanId, traceFlags
logger.info({
  agentId,
  msg: 'Agent deployed successfully',
  // Automatically includes: { traceId, spanId, traceFlags }
});
```

### Development vs Production Logging

```typescript
// Development: Pretty-printed, colorized
// LOG_LEVEL=debug npm run dev
// Output:
// [14:32:45] INFO (validation-service): Starting manifest validation
//     operation: "validate-manifest"
//     agentId: "mycompany/my-agent"

// Production: JSON logs for machine parsing
// NODE_ENV=production npm start
// Output:
// {"level":30,"time":1706801565123,"pid":12345,"hostname":"prod-server","name":"ossa","module":"validation-service","operation":"validate-manifest","agentId":"mycompany/my-agent","msg":"Starting manifest validation"}
```

---

## Performance Monitoring

### Before (Old Way)

```typescript
// ❌ Manual timing, no structure
const start = Date.now();
await processAgent();
console.log(`Took ${Date.now() - start}ms`);
```

### After (Production-Grade)

```typescript
import { PerformanceLogger, measurePerformance } from '@/utils/logger';

// ✅ Option 1: Measure function performance
const result = await measurePerformance(logger, 'process-agent', async () => {
  return await processAgent(agentId);
});

// ✅ Option 2: Manual control with PerformanceLogger
const perf = new PerformanceLogger(logger, 'agent-export');

try {
  await exportAgent(agentId, platform);
  perf.end({ agentId, platform }); // Logs duration + context
} catch (error) {
  perf.error(error as Error, { agentId, platform }); // Logs error + duration
  throw error;
}
```

---

## Migration Examples

### Example 1: Validation Service

#### Before

```typescript
// src/services/validation.service.ts (OLD)
export class ValidationService {
  async validate(manifest: unknown): Promise<OssaManifest> {
    // ❌ Generic errors
    if (!manifest) {
      throw new Error('Manifest is required');
    }

    // ❌ No logging
    const result = await this.schema.validate(manifest);

    if (!result.success) {
      throw new Error('Validation failed: ' + JSON.stringify(result.errors));
    }

    return result.data;
  }
}
```

#### After

```typescript
// src/services/validation.service.ts (PRODUCTION-GRADE)
import { ManifestValidationError, SchemaValidationError } from '@/errors';
import { logger, measurePerformance } from '@/utils/logger';

export class ValidationService {
  private logger = logger.child({ service: 'validation' });

  async validate(manifest: unknown): Promise<OssaManifest> {
    // ✅ Typed error with context
    if (!manifest) {
      throw new ManifestValidationError('Manifest is required', {
        received: typeof manifest,
      });
    }

    // ✅ Performance measurement + structured logging
    return await measurePerformance(
      this.logger,
      'validate-manifest',
      async () => {
        this.logger.debug({
          manifestType: typeof manifest,
          msg: 'Starting validation',
        });

        const result = await this.schema.validate(manifest);

        if (!result.success) {
          // ✅ Rich error context
          throw new SchemaValidationError('Schema validation failed', {
            errors: result.errors,
            schema: this.schema.id,
            path: result.path,
          });
        }

        this.logger.info({
          manifestName: result.data.metadata.name,
          manifestVersion: result.data.metadata.version,
          msg: 'Validation successful',
        });

        return result.data;
      }
    );
  }
}
```

### Example 2: Registry Client

#### Before

```typescript
// src/services/registry-client.ts (OLD)
export class RegistryClient {
  async getAgent(agentId: string): Promise<Agent> {
    console.log('Fetching agent:', agentId);

    const response = await fetch(`${this.registryUrl}/agents/${agentId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch agent: ${response.statusText}`);
    }

    return response.json();
  }
}
```

#### After

```typescript
// src/services/registry-client.ts (PRODUCTION-GRADE)
import {
  AgentNotFoundError,
  RegistryUnavailableError,
  TimeoutError,
  RateLimitError,
} from '@/errors';
import { logger } from '@/utils/logger';

export class RegistryClient {
  private logger = logger.child({ service: 'registry-client' });

  async getAgent(agentId: string): Promise<Agent> {
    this.logger.info({
      agentId,
      registryUrl: this.registryUrl,
      msg: 'Fetching agent from registry',
    });

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `${this.registryUrl}/agents/${agentId}`,
        { signal: controller.signal }
      );

      clearTimeout(timeout);

      // ✅ Specific error handling
      if (response.status === 404) {
        throw new AgentNotFoundError(agentId, {
          registryUrl: this.registryUrl,
        });
      }

      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        throw new RateLimitError(
          retryAfter ? parseInt(retryAfter) : undefined,
          { agentId, registryUrl: this.registryUrl }
        );
      }

      if (response.status === 503) {
        throw new RegistryUnavailableError(this.registryUrl, {
          agentId,
          statusCode: response.status,
        });
      }

      if (!response.ok) {
        throw new ApiError(
          `Registry request failed: ${response.statusText}`,
          response.status,
          { agentId, registryUrl: this.registryUrl }
        );
      }

      const agent = await response.json();

      this.logger.info({
        agentId,
        agentName: agent.metadata.name,
        agentVersion: agent.metadata.version,
        msg: 'Agent fetched successfully',
      });

      return agent;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new TimeoutError(5000, {
          agentId,
          registryUrl: this.registryUrl,
        });
      }

      // Re-throw OSSA errors
      if (error instanceof OssaError) {
        throw error;
      }

      // Wrap unknown errors
      this.logger.error({
        err: error,
        agentId,
        registryUrl: this.registryUrl,
        msg: 'Unexpected error fetching agent',
      });

      throw toOssaError(error);
    }
  }
}
```

---

## Migration Checklist

### Phase 1: Replace Console Logs

- [ ] Replace `console.log()` with `logger.info()`
- [ ] Replace `console.error()` with `logger.error()`
- [ ] Replace `console.warn()` with `logger.warn()`
- [ ] Replace `console.debug()` with `logger.debug()`
- [ ] Add structured context to all log statements

### Phase 2: Replace Generic Errors

- [ ] Replace `throw new Error()` with specific OssaError classes
- [ ] Add error context (details parameter)
- [ ] Use error codes (OSSA-XXX-###)
- [ ] Add error handling middleware

### Phase 3: Add Performance Monitoring

- [ ] Wrap critical operations with `measurePerformance()`
- [ ] Add PerformanceLogger to long-running tasks
- [ ] Log operation start/end with context

### Phase 4: Testing

- [ ] Write tests for error handling
- [ ] Test error codes and status codes
- [ ] Test log output (structured JSON in production)
- [ ] Test OpenTelemetry trace correlation

---

## Configuration

### Environment Variables

```bash
# Logging
LOG_LEVEL=info              # trace|debug|info|warn|error|fatal
NODE_ENV=production         # development|production

# OpenTelemetry (automatic trace correlation)
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SERVICE_NAME=ossa
```

### TypeScript Configuration

Ensure `tsconfig.json` has strict mode enabled:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

---

## Benefits

### Before Migration

- ❌ Generic errors hard to handle
- ❌ Unstructured console logs
- ❌ No error codes
- ❌ No trace correlation
- ❌ Hard to debug production issues

### After Migration

- ✅ Typed errors with codes (OSSA-XXX-###)
- ✅ Structured JSON logs (machine-parsable)
- ✅ Automatic OpenTelemetry trace correlation
- ✅ Performance metrics built-in
- ✅ Easy to debug production issues
- ✅ Production-grade error handling

---

## Resources

- [Error Classes Documentation](./errors/README.md)
- [Logger Documentation](./logger/README.md)
- [OpenTelemetry Setup](./observability/README.md)
- [Production Readiness Plan](../PRODUCTION_READINESS_PLAN.md)
