# OSSA Symfony Bundle - Production Architecture

## Architecture Overview

This document describes how all production gap implementations work together to create a robust, production-ready agent execution system.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Symfony Application                          │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                         Controller                              │ │
│  │  - Rate limit checking                                          │ │
│  │  - Request validation                                           │ │
│  │  - Response formatting                                          │ │
│  └────────────────┬───────────────────────────────────────────────┘ │
│                   │                                                   │
│                   ▼                                                   │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    RateLimiter Service                          │ │
│  │  - Check user limits (Redis/Memcached)                          │ │
│  │  - Check global limits                                          │ │
│  │  - Token bucket algorithm                                       │ │
│  └────────────────┬───────────────────────────────────────────────┘ │
│                   │ ✓ Within limits                                  │
│                   ▼                                                   │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                CachedAgentExecutor Service                      │ │
│  │  - Generate cache key (agent + input hash)                      │ │
│  │  - Check cache (Redis/File)                                     │ │
│  │  - Return cached response OR execute                            │ │
│  └────────────────┬───────────────────────────────────────────────┘ │
│                   │ Cache miss                                        │
│                   ▼                                                   │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                      AgentExecutor                              │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │ 1. Load agent from registry                              │  │ │
│  │  │ 2. Dispatch AgentExecutionStartEvent ────────┐           │  │ │
│  │  │ 3. Get LLM provider                           │           │  │ │
│  │  │ 4. Build prompt                               │           │  │ │
│  │  │ 5. Execute LLM                                │           │  │ │
│  │  │ 6. Dispatch AgentExecutionCompleteEvent ─────┤           │  │ │
│  │  │    OR AgentExecutionErrorEvent ──────────────┤           │  │ │
│  │  │ 7. Return response                            │           │  │ │
│  │  └──────────────────────────────────────────────│───────────┘  │ │
│  └─────────────────────────────┬──────────────────│───────────────┘ │
│                                 │                  │                  │
│                                 │                  │ Events           │
│                                 │                  ▼                  │
│                                 │  ┌────────────────────────────────┐│
│                                 │  │    Event Subscribers           ││
│                                 │  │  - AgentExecutionListener      ││
│                                 │  │  - MetricsCollector            ││
│                                 │  │  - CustomHandlers              ││
│                                 │  └────────────────────────────────┘│
│                                 │                                     │
│                                 ▼                                     │
│               ┌─────────────────────────────────┐                    │
│               │  SecureProviderFactory          │                    │
│               │  - Validate API keys            │                    │
│               │  - Create provider instance     │                    │
│               │  - Apply decorators:            │                    │
│               │    1. AuditLoggingProvider      │                    │
│               │    2. CircuitBreakerProvider    │                    │
│               └──────────────┬──────────────────┘                    │
│                              │                                        │
│                              ▼                                        │
│               ┌─────────────────────────────────┐                    │
│               │  CircuitBreakerProvider         │                    │
│               │  ┌───────────────────────────┐  │                    │
│               │  │ State: Closed/Open/Half   │  │                    │
│               │  │                           │  │                    │
│               │  │ 1. Check circuit state    │  │                    │
│               │  │ 2. Execute with retries   │  │                    │
│               │  │    - Exponential backoff  │  │                    │
│               │  │ 3. On failure threshold:  │  │                    │
│               │  │    - Open circuit         │  │                    │
│               │  │    - Try fallback chain   │  │                    │
│               │  │ 4. On success: reset      │  │                    │
│               │  └───────────┬───────────────┘  │                    │
│               └──────────────┼───────────────────┘                    │
│                              │                                        │
│                              ▼                                        │
│               ┌─────────────────────────────────┐                    │
│               │  AuditLoggingProvider           │                    │
│               │  - Log all LLM requests         │                    │
│               │  - Log all responses            │                    │
│               │  - Log all errors               │                    │
│               │  - Include request ID           │                    │
│               └──────────────┬──────────────────┘                    │
│                              │                                        │
│                              ▼                                        │
│               ┌─────────────────────────────────┐                    │
│               │  Base LLM Provider              │                    │
│               │  (Anthropic/OpenAI/etc)         │                    │
│               │  - Make API call                │                    │
│               │  - Return response              │                    │
│               └──────────────┬──────────────────┘                    │
└───────────────────────────────┼─────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   External LLM API    │
                    │   (Anthropic, etc)    │
                    └───────────────────────┘
```

---

## Request Flow

### 1. Successful Request (Cache Hit)

```
User Request
    │
    ├─→ RateLimiter.checkLimits(userId) ✓
    │
    ├─→ CachedAgentExecutor.execute()
    │       │
    │       ├─→ Cache.get(cacheKey)
    │       │       │
    │       │       └─→ HIT! Return cached response
    │       │
    │       └─→ Return AgentResponse
    │
    └─→ Return JSON response (fast, no LLM call)
```

**Time**: ~10-50ms (cache lookup only)

---

### 2. Successful Request (Cache Miss)

```
User Request
    │
    ├─→ RateLimiter.checkLimits(userId) ✓
    │
    ├─→ CachedAgentExecutor.execute()
    │       │
    │       ├─→ Cache.get(cacheKey) → MISS
    │       │
    │       ├─→ AgentExecutor.execute()
    │       │       │
    │       │       ├─→ Dispatch AgentExecutionStartEvent
    │       │       │       └─→ EventListener logs start
    │       │       │
    │       │       ├─→ SecureProviderFactory.create()
    │       │       │       │
    │       │       │       ├─→ Validate API key security
    │       │       │       │
    │       │       │       ├─→ Wrap with AuditLoggingProvider
    │       │       │       │       └─→ Log request
    │       │       │       │
    │       │       │       └─→ Wrap with CircuitBreakerProvider
    │       │       │               │
    │       │       │               ├─→ Check circuit state (closed)
    │       │       │               │
    │       │       │               ├─→ Call base provider
    │       │       │               │       │
    │       │       │               │       └─→ LLM API call ✓
    │       │       │               │
    │       │       │               └─→ Log response
    │       │       │
    │       │       ├─→ Dispatch AgentExecutionCompleteEvent
    │       │       │       └─→ EventListener logs completion
    │       │       │
    │       │       └─→ Return AgentResponse
    │       │
    │       ├─→ Cache.set(cacheKey, response, ttl)
    │       │
    │       └─→ Return AgentResponse
    │
    └─→ Return JSON response
```

**Time**: ~1-5 seconds (full LLM execution + caching)

---

### 3. Rate Limited Request

```
User Request
    │
    ├─→ RateLimiter.checkLimits(userId)
    │       │
    │       └─→ RateLimitExceededException!
    │
    └─→ Return 429 Rate Limit Exceeded
```

**Time**: ~1-5ms (fast rejection)

---

### 4. Circuit Breaker Open (Provider Failing)

```
User Request
    │
    ├─→ RateLimiter.checkLimits(userId) ✓
    │
    ├─→ CachedAgentExecutor.execute() → Cache MISS
    │
    ├─→ AgentExecutor.execute()
    │       │
    │       ├─→ Dispatch AgentExecutionStartEvent
    │       │
    │       ├─→ CircuitBreakerProvider.complete()
    │       │       │
    │       │       ├─→ Check circuit state → OPEN!
    │       │       │
    │       │       ├─→ Try fallback provider chain
    │       │       │       │
    │       │       │       ├─→ OpenAIProvider.complete()
    │       │       │       │       │
    │       │       │       │       └─→ LLM API call ✓
    │       │       │       │
    │       │       │       └─→ Success!
    │       │       │
    │       │       └─→ Return response
    │       │
    │       ├─→ Dispatch AgentExecutionCompleteEvent
    │       │
    │       └─→ Return AgentResponse
    │
    └─→ Return JSON response (fallback provider used)
```

**Time**: ~1-5 seconds (fallback execution)

---

### 5. Complete Failure (All Providers Down)

```
User Request
    │
    ├─→ RateLimiter.checkLimits(userId) ✓
    │
    ├─→ CachedAgentExecutor.execute() → Cache MISS
    │
    ├─→ AgentExecutor.execute()
    │       │
    │       ├─→ Dispatch AgentExecutionStartEvent
    │       │
    │       ├─→ CircuitBreakerProvider.complete()
    │       │       │
    │       │       ├─→ Check circuit state → OPEN
    │       │       │
    │       │       ├─→ Try fallback 1 → FAIL
    │       │       │
    │       │       ├─→ Try fallback 2 → FAIL
    │       │       │
    │       │       └─→ Throw exception
    │       │
    │       ├─→ Catch exception
    │       │
    │       ├─→ Dispatch AgentExecutionErrorEvent
    │       │       └─→ EventListener logs error
    │       │
    │       └─→ Throw exception
    │
    └─→ Return 500 Internal Server Error
```

**Time**: ~5-15 seconds (retry attempts + fallbacks)

---

## Component Interactions

### Rate Limiter + Cache

```
┌─────────────┐         ┌──────────────┐
│ RateLimiter │────────→│    Cache     │
└─────────────┘         └──────────────┘
      │                        │
      │                        │
      ├─ User limits ─────────┤
      │  (Redis storage)       │
      │                        │
      └─ Global limits ────────┘
         (shared counter)
```

**Benefit**: Rate limiter prevents cache thrashing by rejecting excessive requests early

---

### Circuit Breaker + Events

```
┌────────────────────┐         ┌────────────────┐
│ CircuitBreaker     │────────→│  Event System  │
└────────────────────┘         └────────────────┘
      │                               │
      │ State changes                 │
      │                               │
      ├─ Closed → Open ──────────────→│
      │                               ├─→ AgentExecutionErrorEvent
      │                               │
      ├─ Open → Half-Open ───────────→│
      │                               ├─→ Custom monitoring event
      │                               │
      └─ Half-Open → Closed ─────────→│
                                      └─→ AgentExecutionCompleteEvent
```

**Benefit**: Events provide visibility into circuit state changes for monitoring and alerting

---

### Security + Audit Logging

```
┌────────────────────┐
│ SecureProviderFactory│
└──────────┬──────────┘
           │
           ├─ Validate API keys
           │  (Secrets Vault)
           │
           ├─ Wrap provider:
           │     │
           │     ├─→ AuditLoggingProvider
           │     │      │
           │     │      ├─ Log request
           │     │      ├─ Execute
           │     │      └─ Log response
           │     │
           │     └─→ CircuitBreakerProvider
           │            │
           │            ├─ Check state
           │            ├─ Retry logic
           │            └─ Fallback
           │
           └─→ Base Provider (Anthropic, etc)
```

**Benefit**: Decorator pattern allows composable security and resilience features

---

## Data Flow

### Event Data Flow

```
AgentExecutor
    │
    ├─→ AgentExecutionStartEvent
    │       ├─ agent: Agent
    │       ├─ input: string
    │       ├─ context: array
    │       └─ startTime: float
    │
    ├─→ [Execution happens]
    │
    ├─→ AgentExecutionCompleteEvent
    │       ├─ agent: Agent
    │       ├─ response: AgentResponse
    │       ├─ startTime: float
    │       ├─ endTime: float
    │       └─ duration: float (calculated)
    │
    └─→ AgentExecutionErrorEvent (on failure)
            ├─ agent: Agent
            ├─ error: Throwable
            ├─ input: string
            ├─ context: array
            ├─ startTime: float
            ├─ errorTime: float
            └─ duration: float (calculated)
```

---

### Audit Log Data Flow

```
AuditLoggingProvider
    │
    ├─→ llm_request
    │       ├─ request_id: string
    │       ├─ provider: string
    │       ├─ model: string
    │       ├─ prompt_length: int
    │       ├─ temperature: float
    │       ├─ max_tokens: int
    │       ├─ tools_count: int
    │       └─ timestamp: int
    │
    ├─→ [LLM call happens]
    │
    ├─→ llm_response
    │       ├─ request_id: string (same)
    │       ├─ provider: string
    │       ├─ model: string
    │       ├─ duration_ms: float
    │       ├─ response_length: int
    │       ├─ tokens_used: {input, output}
    │       └─ timestamp: int
    │
    └─→ llm_error (on failure)
            ├─ request_id: string (same)
            ├─ provider: string
            ├─ model: string
            ├─ duration_ms: float
            ├─ error_class: string
            ├─ error_message: string
            └─ timestamp: int
```

---

## Configuration Flow

```yaml
config/packages/ossa.yaml
    │
    ├─→ rate_limit
    │       │
    │       └─→ RateLimiter service
    │               └─→ Redis/Memcached storage
    │
    ├─→ cache
    │       │
    │       └─→ CachedAgentExecutor service
    │               └─→ Cache pool (Redis/File)
    │
    ├─→ security
    │       │
    │       └─→ SecureProviderFactory
    │               ├─→ Audit logger
    │               └─→ Secrets validation
    │
    └─→ providers.{name}.circuit_breaker
            │
            └─→ CircuitBreakerProvider
                    ├─→ Retry config
                    ├─→ Backoff config
                    └─→ Fallback chain
```

---

## State Management

### Circuit Breaker States

```
                    ┌──────────┐
                    │  CLOSED  │ ◄──────┐
                    └────┬─────┘        │
                         │              │
                         │ Failure      │ Success
                         │ threshold    │ in half-open
                         │              │
                    ┌────▼─────┐        │
                    │   OPEN   │        │
                    └────┬─────┘        │
                         │              │
                         │ Reset        │
                         │ timeout      │
                         │              │
                    ┌────▼─────┐        │
                    │HALF-OPEN │────────┘
                    └──────────┘
                         │
                         │ Failure
                         │
                         └──────────────→ OPEN
```

**State Transitions**:
- `CLOSED → OPEN`: After N consecutive failures
- `OPEN → HALF-OPEN`: After reset timeout expires
- `HALF-OPEN → CLOSED`: On first successful request
- `HALF-OPEN → OPEN`: On any failure

---

### Cache State

```
Request arrives
    │
    ├─→ Generate cache key
    │       (agent name + input hash)
    │
    ├─→ Check cache
    │       │
    │       ├─ HIT → Return cached
    │       │
    │       └─ MISS → Execute → Cache result
    │
    └─→ Return response
```

**Cache Invalidation**:
- Time-based: TTL expiration (automatic)
- Manual: `invalidateAgent(name)` or `invalidateResponse(name, input)`
- Global: `clearAll()`

---

## Performance Characteristics

| Component | Latency | Throughput | Resource |
|-----------|---------|------------|----------|
| RateLimiter | 1-5ms | 10k+ req/s | Redis |
| Cache (hit) | 5-50ms | 1k+ req/s | Redis/File |
| Cache (miss) | 1-5s | 100 req/s | LLM API |
| CircuitBreaker (closed) | +0ms | N/A | Memory |
| CircuitBreaker (open) | +0ms | N/A | Memory |
| AuditLogger | +1ms | N/A | Disk/Stream |
| Events | +0ms | N/A | Memory |

**Optimization**:
- Cache hit rate > 80% → Latency ~50ms avg
- Cache hit rate < 20% → Latency ~2s avg

---

## Failure Modes

### 1. Provider Failure

**Circuit Breaker Handles**:
- Detects failures (5 consecutive)
- Opens circuit
- Routes to fallback provider
- Periodically retries primary

---

### 2. Cache Failure

**Graceful Degradation**:
- Cache error caught
- Falls back to direct execution
- Logged as warning
- System continues operating

---

### 3. Rate Limiter Failure

**Graceful Degradation**:
- Rate limiter disabled → pass-through
- Redis connection error → allow request
- Prevents cache stampede

---

### 4. Event Dispatcher Failure

**Graceful Handling**:
- Event errors caught
- Logged as error
- Execution continues
- Response still returned

---

## Monitoring Points

### Key Metrics

1. **Rate Limiting**:
   - `rate_limit.user.remaining`
   - `rate_limit.global.remaining`
   - `rate_limit.rejections_total`

2. **Caching**:
   - `cache.hit_rate`
   - `cache.miss_rate`
   - `cache.evictions_total`

3. **Circuit Breaker**:
   - `circuit_breaker.state` (closed/open/half-open)
   - `circuit_breaker.failures_total`
   - `circuit_breaker.fallback_calls_total`

4. **Execution**:
   - `agent.execution.duration_ms`
   - `agent.execution.success_total`
   - `agent.execution.error_total`

5. **Security**:
   - `security.api_calls_total`
   - `security.plaintext_keys_detected`
   - `security.key_rotations_total`

---

## Security Architecture

### Secrets Management

```
Environment Variables
    │
    ├─→ Symfony Secrets Vault
    │       │
    │       └─→ Encrypted secrets
    │               │
    │               └─→ Runtime decryption
    │                       │
    │                       └─→ SecureProviderFactory
    │                               │
    │                               └─→ Provider API key
    │
    └─→ Plain environment (development only)
```

**Best Practice**: Always use Secrets Vault in production

---

### Audit Trail

```
Request → AuditLoggingProvider → Audit Log Channel
    │                                    │
    │                                    ├─→ File
    │                                    ├─→ Syslog
    │                                    └─→ External SIEM
    │
    └─→ Includes:
            ├─ Request ID (correlation)
            ├─ User/context (if available)
            ├─ Provider/model used
            ├─ Duration
            ├─ Token usage
            └─ Success/error status
```

**Compliance**: GDPR, SOC2, HIPAA compatible with proper configuration

---

## Scalability

### Horizontal Scaling

All components are stateless except:

1. **Rate Limiter**: Requires shared Redis
2. **Cache**: Requires shared cache store
3. **Circuit Breaker**: Per-instance state (coordination via shared cache possible)

**Recommendation**:
- Use Redis for rate limiter and cache
- Circuit breaker state can be per-instance (eventual consistency acceptable)

---

### Vertical Scaling

**Memory Usage**:
- Events: Negligible (event objects)
- Rate Limiter: Minimal (Redis client)
- Cache: Minimal (cache client)
- Circuit Breaker: ~1KB per provider

**CPU Usage**:
- Events: <1% overhead
- Rate Limiter: <1% overhead
- Cache: <1% overhead (on hit)
- Circuit Breaker: <1% overhead

---

## Deployment Considerations

### Required Services

1. **Redis** (recommended):
   - Rate limiter storage
   - Cache storage
   - Session storage

2. **Logging** (required):
   - Application logs (Monolog)
   - Audit logs (separate channel)

3. **Secrets Vault** (production):
   - API key storage
   - Credential management

### Configuration Checklist

- ✅ Configure Redis connection
- ✅ Set up Secrets Vault
- ✅ Configure audit log channel
- ✅ Set rate limits appropriately
- ✅ Configure cache TTLs
- ✅ Set circuit breaker thresholds
- ✅ Configure fallback providers
- ✅ Enable HTTPS enforcement
- ✅ Test event subscribers
- ✅ Validate security settings

---

## Conclusion

The OSSA Symfony Bundle now features a robust, production-ready architecture with:

- **Multi-layer protection**: Rate limiting → Cache → Circuit breaker
- **Complete observability**: Events + Audit logs
- **Security first**: Secrets management + Validation
- **High availability**: Circuit breaker + Fallback chains
- **Performance optimized**: Caching + Fast-fail patterns

**Status**: Production Ready ✅

---

**Last Updated**: 2026-02-04
