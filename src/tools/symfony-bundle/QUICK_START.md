# OSSA Symfony Bundle - Quick Start Guide

## 5-Minute Setup

Get production-ready OSSA agent execution in 5 minutes.

---

## Installation

```bash
composer require ossa/symfony-bundle
```

---

## Basic Configuration

Create `config/packages/ossa.yaml`:

```yaml
ossa:
  # Basic settings
  default_provider: 'anthropic'
  default_model: 'claude-sonnet-4-20250514'

  # Provider API keys (use Symfony Secrets!)
  providers:
    anthropic:
      api_key: '%env(ANTHROPIC_API_KEY)%'
      timeout: 60
```

Set your API key:

```bash
# Production (encrypted)
php bin/console secrets:set ANTHROPIC_API_KEY

# Development (plain .env.local)
echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" >> .env.local
```

---

## Create Your First Agent

Create `config/agents/hello.ossa.yaml`:

```yaml
name: hello
version: 0.1.0
description: A friendly greeting agent

llm:
  provider: anthropic
  model: claude-sonnet-4-20250514
  temperature: 0.7

role: "You are a friendly assistant"
prompt: |
  Greet the user warmly and offer to help them.
```

---

## Use in Controller

```php
use Ossa\SymfonyBundle\Agent\AgentExecutor;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

class AgentController extends AbstractController
{
    #[Route('/api/agent/{name}', methods: ['POST'])]
    public function execute(
        string $name,
        AgentExecutor $executor
    ): JsonResponse {
        $input = $this->request->get('input');

        $response = $executor->execute($name, $input);

        return new JsonResponse([
            'output' => $response->getOutput(),
            'metadata' => $response->getMetadata(),
        ]);
    }
}
```

Test it:

```bash
curl -X POST http://localhost/api/agent/hello \
  -H "Content-Type: application/json" \
  -d '{"input": "Hi there!"}'
```

---

## Enable Production Features

### 1. Rate Limiting (Protect Your API)

```yaml
# config/packages/ossa.yaml
ossa:
  rate_limit:
    enabled: true
    user:
      limit: 100          # 100 requests per user
      interval: '1 hour'  # per hour
    global:
      limit: 1000         # 1000 total requests
      interval: '1 hour'  # per hour
    storage: 'cache.app'  # Or 'redis.cache'
```

Use in controller:

```php
use Ossa\SymfonyBundle\Service\RateLimiter;

class AgentController extends AbstractController
{
    #[Route('/api/agent/{name}', methods: ['POST'])]
    public function execute(
        string $name,
        AgentExecutor $executor,
        RateLimiter $rateLimiter
    ): JsonResponse {
        // Check rate limits
        $userId = $this->getUser()->getId();
        $rateLimiter->checkLimits($userId);

        // Execute agent
        $response = $executor->execute($name, $input);

        return new JsonResponse([
            'output' => $response->getOutput(),
        ]);
    }
}
```

---

### 2. Caching (Faster Responses)

```yaml
# config/packages/ossa.yaml
ossa:
  cache:
    enabled: true
    response_ttl: 3600    # 1 hour
    manifest_ttl: 86400   # 24 hours
    pool: 'cache.app'     # Or 'redis.cache'
```

Use in controller:

```php
use Ossa\SymfonyBundle\Service\CachedAgentExecutor;

class AgentController extends AbstractController
{
    #[Route('/api/agent/{name}', methods: ['POST'])]
    public function execute(
        string $name,
        CachedAgentExecutor $executor  // Changed from AgentExecutor
    ): JsonResponse {
        // Automatically cached!
        $response = $executor->execute($name, $input);

        return new JsonResponse([
            'output' => $response->getOutput(),
            'cache_enabled' => $executor->isEnabled(),
        ]);
    }
}
```

---

### 3. Circuit Breaker (Resilience)

```yaml
# config/packages/ossa.yaml
ossa:
  providers:
    anthropic:
      api_key: '%env(ANTHROPIC_API_KEY)%'
      circuit_breaker:
        enabled: true
        failure_threshold: 5      # Open after 5 failures
        reset_timeout: 60         # Try again after 60 seconds
        fallback_providers:       # Fallback chain
          - openai
          - google

    openai:
      api_key: '%env(OPENAI_API_KEY)%'

    google:
      api_key: '%env(GOOGLE_API_KEY)%'
```

**Automatic!** Circuit breaker is applied transparently. If Anthropic fails, automatically falls back to OpenAI.

---

### 4. Event Monitoring (Observability)

Listen to agent execution events:

```php
use Ossa\SymfonyBundle\Event\AgentExecutionCompleteEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class AgentMetricsCollector implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            AgentExecutionCompleteEvent::class => 'onAgentComplete',
        ];
    }

    public function onAgentComplete(AgentExecutionCompleteEvent $event): void
    {
        // Send metrics to monitoring system
        $this->metrics->timing('agent.duration', $event->getDurationMs(), [
            'agent' => $event->getAgentName(),
        ]);

        $this->metrics->increment('agent.success', [
            'agent' => $event->getAgentName(),
        ]);
    }
}
```

Register in `config/services.yaml`:

```yaml
services:
  App\EventSubscriber\AgentMetricsCollector:
    tags:
      - { name: kernel.event_subscriber }
```

---

### 5. Security Audit Logging

```yaml
# config/packages/ossa.yaml
ossa:
  security:
    audit_logging: true
    enforce_https: true
    audit_log_channel: 'ossa_audit'
```

Configure audit log channel in `config/packages/monolog.yaml`:

```yaml
monolog:
  channels: ['ossa_audit']
  handlers:
    ossa_audit:
      type: stream
      path: '%kernel.logs_dir%/ossa_audit.log'
      level: info
      channels: ['ossa_audit']
```

**Automatic!** All LLM API calls are now logged to `var/log/ossa_audit.log`.

---

## Complete Production Configuration

```yaml
# config/packages/ossa.yaml
ossa:
  # Core
  default_provider: 'anthropic'
  default_model: 'claude-sonnet-4-20250514'
  default_temperature: 0.7

  # Providers
  providers:
    anthropic:
      api_key: '%env(ANTHROPIC_API_KEY)%'
      timeout: 60
      max_retries: 3
      circuit_breaker:
        enabled: true
        failure_threshold: 5
        reset_timeout: 60
        backoff_multiplier: 2.0
        initial_backoff_ms: 1000
        fallback_providers: ['openai']

    openai:
      api_key: '%env(OPENAI_API_KEY)%'
      timeout: 60

  # Security
  security:
    audit_logging: true
    enforce_https: true
    sign_requests: true
    audit_log_channel: 'ossa_audit'

  # Rate Limiting
  rate_limit:
    enabled: true
    user:
      limit: 100
      interval: '1 hour'
    global:
      limit: 1000
      interval: '1 hour'
    storage: 'redis.cache'

  # Caching
  cache:
    enabled: true
    response_ttl: 3600
    manifest_ttl: 86400
    pool: 'redis.cache'

  # Observability
  observability:
    enabled: true
    log_level: 'info'

  # Safety
  safety:
    pii_detection: true
    secrets_detection: true
    max_cost_per_day: 100.0
    max_tokens_per_day: 1000000

  # Agent Discovery
  manifest_paths:
    - '%kernel.project_dir%/config/agents'
  auto_discover: true
```

---

## Redis Setup (Recommended)

### 1. Install Redis

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt install redis-server
sudo systemctl start redis
```

### 2. Install Symfony Redis

```bash
composer require symfony/redis-bundle
```

### 3. Configure Redis

```yaml
# config/packages/cache.yaml
framework:
  cache:
    app: cache.adapter.redis
    default_redis_provider: redis://localhost

# config/packages/framework.yaml
framework:
  rate_limiter:
    redis:
      dsn: 'redis://localhost'
```

### 4. Update OSSA config

```yaml
# config/packages/ossa.yaml
ossa:
  rate_limit:
    storage: 'cache.redis'  # Changed from cache.app
  cache:
    pool: 'cache.redis'     # Changed from cache.app
```

---

## Testing

### Unit Tests

```bash
vendor/bin/phpunit
```

### Integration Test

```php
// tests/Controller/AgentControllerTest.php
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class AgentControllerTest extends WebTestCase
{
    public function testExecuteAgent(): void
    {
        $client = static::createClient();

        $client->request('POST', '/api/agent/hello', [
            'input' => 'Hi there!',
        ]);

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains([
            'output' => '@string@',
            'metadata' => '@array@',
        ]);
    }
}
```

---

## CLI Commands

### List Agents

```bash
php bin/console ossa:agent:list
```

### Execute Agent

```bash
php bin/console ossa:agent:execute hello "Hi there!"
```

### Validate Agent

```bash
php bin/console ossa:agent:validate hello
```

### List MCP Servers

```bash
php bin/console ossa:mcp:list
```

---

## Common Issues

### "API key not configured"

**Solution**: Set your API key in Symfony Secrets:

```bash
php bin/console secrets:set ANTHROPIC_API_KEY
```

### "Rate limit exceeded"

**Solution**: Increase limits or use Redis for distributed rate limiting:

```yaml
ossa:
  rate_limit:
    user:
      limit: 200  # Increased from 100
```

### "Cache not working"

**Solution**: Check cache pool configuration:

```bash
# Clear cache
php bin/console cache:clear

# Check Redis connection
redis-cli ping
```

### "Circuit breaker always open"

**Solution**: Check provider API keys and network:

```bash
# Test provider directly
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01"
```

---

## Monitoring

### Check Rate Limits

```php
$capacity = $rateLimiter->getUserCapacity('user-123');
// ['available' => 95, 'limit' => 100, 'reset_time' => 1706745600]
```

### Check Cache Stats

```php
$stats = $cachedExecutor->getStats();
// ['enabled' => true, 'response_ttl' => 3600, 'manifest_ttl' => 86400]
```

### Check Circuit Breaker

```php
$provider = $providerFactory->create('anthropic');
if ($provider instanceof CircuitBreakerProvider) {
    $state = $provider->getState();
    // ['state' => 'closed', 'failure_count' => 0, ...]
}
```

### Check Security

```php
$result = $secureFactory->validateProviderSecurity('anthropic');
// ['valid' => true, 'issues' => []]
```

---

## Next Steps

1. **Read Full Documentation**:
   - `PRODUCTION_GAPS_FILLED.md` - Complete feature reference
   - `ARCHITECTURE.md` - System architecture
   - `README.md` - Bundle overview

2. **Set Up Monitoring**:
   - Integrate with Prometheus/Grafana
   - Set up alerting for circuit breaker state changes
   - Track cache hit rates

3. **Optimize**:
   - Tune cache TTLs based on your use case
   - Adjust rate limits for your traffic patterns
   - Configure fallback providers

4. **Secure**:
   - Rotate API keys regularly
   - Review audit logs
   - Set up security alerts

---

## Support

- **Documentation**: See `docs/` directory
- **Examples**: See `examples/` directory
- **Tests**: See `tests/` directory for usage examples
- **Issues**: Create GitHub issue for bugs/features

---

## Summary

You now have a production-ready agent execution system with:

✅ Rate limiting (prevent abuse)
✅ Caching (faster responses)
✅ Circuit breaker (resilience)
✅ Event monitoring (observability)
✅ Security audit logging (compliance)

**Next**: Deploy to production and monitor your agents!

---

**Last Updated**: 2026-02-04
