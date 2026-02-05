# Production-Grade Quick Reference

**TL;DR**: How to use production-grade error handling and logging in OSSA

---

## 🚨 Error Handling

### Import

```typescript
import {
  ValidationError,
  ManifestValidationError,
  AgentNotFoundError,
  RegistryUnavailableError,
  TimeoutError,
  RateLimitError,
  toOssaError,
  isRetryable,
} from '@/errors';
```

### Throw Errors

```typescript
// ✅ Validation error
throw new ValidationError('Invalid input', { field: 'name', value: null });

// ✅ Manifest validation error
throw new ManifestValidationError('Schema validation failed', {
  schema: 'ossa/v0.4.1',
  errors: validationErrors,
});

// ✅ Agent not found (404)
throw new AgentNotFoundError(agentId, {
  registry: registryUrl,
  searchFilters: filters,
});

// ✅ Registry unavailable (503)
throw new RegistryUnavailableError(registryUrl, {
  statusCode: 503,
  retryAfter: 60,
});

// ✅ Timeout (504)
throw new TimeoutError(5000, { operation: 'fetch-agent', agentId });

// ✅ Rate limit (429)
throw new RateLimitError(60, { endpoint: '/api/agents' });
```

### Catch Errors

```typescript
try {
  await dangerousOperation();
} catch (error) {
  // Convert to OssaError
  const ossaError = toOssaError(error);

  // Check if retryable
  if (isRetryable(ossaError)) {
    await retry(dangerousOperation);
  } else {
    throw ossaError;
  }
}
```

### Express Error Handling

```typescript
// Error handler middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const ossaError = toOssaError(err);

  logger.error({
    err: ossaError,
    req: { method: req.method, url: req.url },
    msg: 'Request failed',
  });

  res.status(ossaError.statusCode).json(ossaError.toJSON());
});

// Route handler
app.post('/api/agents', async (req, res, next) => {
  try {
    const agent = await validateAgent(req.body);
    res.json(agent);
  } catch (error) {
    next(error); // Middleware handles it
  }
});
```

---

## 📝 Structured Logging

### Import

```typescript
import {
  logger,
  createModuleLogger,
  measurePerformance,
  PerformanceLogger,
  logError,
} from '@/utils/logger';
```

### Basic Logging

```typescript
// Info
logger.info({
  operation: 'validate-manifest',
  agentId: 'mycompany/my-agent',
  msg: 'Starting validation',
});

// Warn
logger.warn({
  operation: 'cache-miss',
  key: 'agent-registry',
  msg: 'Cache miss, fetching from registry',
});

// Error
logger.error({
  err: error,
  operation: 'export-agent',
  agentId: 'mycompany/my-agent',
  msg: 'Export failed',
});

// Debug (only in LOG_LEVEL=debug)
logger.debug({
  operation: 'parse-manifest',
  manifestSize: 1234,
  msg: 'Parsing manifest',
});
```

### Module Logger

```typescript
// Create module-specific logger
const validationLogger = createModuleLogger('validation-service');

validationLogger.info({
  agentId: 'mycompany/my-agent',
  msg: 'Validating agent',
  // Automatically includes: { module: 'validation-service' }
});
```

### Performance Measurement

```typescript
// Option 1: measurePerformance (async function)
const result = await measurePerformance(logger, 'export-agent', async () => {
  return await exportAgent(agentId, platform);
});
// Logs: { operation: 'export-agent', duration: 1234, msg: 'Completed export-agent' }

// Option 2: PerformanceLogger (manual control)
const perf = new PerformanceLogger(logger, 'index-knowledge-graph');

try {
  await indexKnowledgeGraph();
  perf.end({ entities: 1234 }); // Logs duration + context
} catch (error) {
  perf.error(error as Error, { entities: 1234 }); // Logs error + duration
  throw error;
}
```

### Log Error Helper

```typescript
import { logError } from '@/utils/logger';

try {
  await operation();
} catch (error) {
  logError(logger, error as Error, {
    operation: 'my-operation',
    agentId: 'mycompany/my-agent',
  });
  throw error;
}
```

---

## 🎯 Error Codes Reference

### Validation (OSSA-VAL-XXX)

- `OSSA-VAL-001` - ValidationError (generic validation)
- `OSSA-VAL-002` - SchemaValidationError (JSON Schema)
- `OSSA-VAL-003` - ManifestValidationError (OSSA manifest)
- `OSSA-VAL-004` - VersionValidationError (version mismatch)

### Export (OSSA-EXP-XXX)

- `OSSA-EXP-001` - ExportError (generic export)
- `OSSA-EXP-002` - PlatformNotSupportedError (invalid platform)
- `OSSA-EXP-003` - TemplateNotFoundError (template missing)

### Migration (OSSA-MIG-XXX)

- `OSSA-MIG-001` - MigrationError (generic migration)
- `OSSA-MIG-002` - UnsupportedVersionError (version not supported)

### Generation (OSSA-GEN-XXX)

- `OSSA-GEN-001` - GenerationError (generic generation)
- `OSSA-GEN-002` - TypeGenerationError (TypeScript generation)
- `OSSA-GEN-003` - ZodGenerationError (Zod schema generation)

### Registry (OSSA-REG-XXX)

- `OSSA-REG-001` - RegistryError (generic registry)
- `OSSA-REG-002` - AgentNotFoundError (404)
- `OSSA-REG-003` - RegistryUnavailableError (503)

### Knowledge Graph (OSSA-KG-XXX)

- `OSSA-KG-001` - KnowledgeGraphError (generic KG)
- `OSSA-KG-002` - VectorDBConnectionError (DB connection)
- `OSSA-KG-003` - EntityIndexingError (indexing failed)

### API (OSSA-API-XXX)

- `OSSA-API-001` - ApiError (generic API)
- `OSSA-API-002` - RateLimitError (429)
- `OSSA-API-003` - UnauthorizedError (401)
- `OSSA-API-004` - ForbiddenError (403)

### Configuration (OSSA-CFG-XXX)

- `OSSA-CFG-001` - ConfigurationError (generic config)
- `OSSA-CFG-002` - MissingEnvVarError (missing env var)
- `OSSA-CFG-003` - InvalidConfigError (invalid config)

### Network (OSSA-NET-XXX)

- `OSSA-NET-001` - NetworkError (generic network)
- `OSSA-NET-002` - TimeoutError (504)
- `OSSA-NET-003` - ConnectionRefusedError (connection refused)

### Authentication (OSSA-AUTH-XXX)

- `OSSA-AUTH-001` - AuthenticationError (generic auth)
- `OSSA-AUTH-002` - TokenExpiredError (token expired)
- `OSSA-AUTH-003` - InvalidTokenError (invalid token)

---

## 🔧 Configuration

### Environment Variables

```bash
# Logging
LOG_LEVEL=info              # trace|debug|info|warn|error|fatal
NODE_ENV=production         # development|production

# OpenTelemetry (optional, for trace correlation)
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SERVICE_NAME=ossa
```

### Log Levels

- `trace` (10) - Very detailed debugging
- `debug` (20) - Debugging information
- `info` (30) - Normal operations ✅ Default production
- `warn` (40) - Warning conditions
- `error` (50) - Error conditions
- `fatal` (60) - Fatal errors (process exits)

---

## 📚 Full Documentation

- [Migration Guide](./docs/PRODUCTION_GRADE_MIGRATION.md) - Complete migration examples
- [Error Classes](./src/errors/index.ts) - All error classes with JSDoc
- [Logger](./src/utils/logger.ts) - Logger implementation
- [Production Readiness Plan](./PRODUCTION_READINESS_PLAN.md) - Complete plan
- [Implementation Status](../../_CURRENT_WORK/ai_agents_ossa/PRODUCTION_GRADE_IMPLEMENTATION.md)

---

## 🚀 Quick Start

```typescript
import { logger, createModuleLogger, measurePerformance } from '@/utils/logger';
import {
  ValidationError,
  ManifestValidationError,
  AgentNotFoundError,
  toOssaError,
  isRetryable,
} from '@/errors';

// 1. Create module logger
const myLogger = createModuleLogger('my-service');

// 2. Log operations
myLogger.info({ operation: 'start', msg: 'Service started' });

// 3. Throw typed errors
if (!manifest) {
  throw new ManifestValidationError('Manifest is required', {
    received: typeof manifest,
  });
}

// 4. Measure performance
const result = await measurePerformance(myLogger, 'process', async () => {
  return await process();
});

// 5. Handle errors
try {
  await dangerousOperation();
} catch (error) {
  const ossaError = toOssaError(error);

  if (isRetryable(ossaError)) {
    await retry(dangerousOperation);
  } else {
    myLogger.error({ err: ossaError, msg: 'Operation failed' });
    throw ossaError;
  }
}
```

---

**Need help?** See [Migration Guide](./docs/PRODUCTION_GRADE_MIGRATION.md) for complete examples
