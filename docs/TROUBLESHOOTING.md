# Symfony Messenger Troubleshooting Guide

Common issues and solutions for async agent execution.

## Table of Contents

- [Messages Not Being Processed](#messages-not-being-processed)
- [High Queue Depth](#high-queue-depth)
- [Failed Message Issues](#failed-message-issues)
- [Performance Problems](#performance-problems)
- [Transport Issues](#transport-issues)
- [Worker Issues](#worker-issues)
- [Monitoring Issues](#monitoring-issues)

---

## Messages Not Being Processed

### Symptom

Messages are queued but never processed.

### Causes and Solutions

#### 1. No Workers Running

**Check**:
```bash
ps aux | grep "messenger:consume"
```

**Solution**: Start a worker
```bash
drush messenger:consume agent_async
```

#### 2. Worker Crashed

**Check logs**:
```bash
tail -f /var/log/drupal/messenger.log
```

**Solution**: Fix the error and restart worker
```bash
drush messenger:consume agent_async --limit=100
```

#### 3. Wrong Transport DSN

**Check configuration**:
```bash
drush config:get ai_agent_ossa.settings messenger_transport_dsn
```

**Solution**: Fix DSN in `.env`
```bash
MESSENGER_TRANSPORT_DSN=doctrine://default
```

#### 4. Database Table Missing

**For Doctrine transport only**

**Check**:
```bash
drush sql-query "SHOW TABLES LIKE 'messenger_messages'"
```

**Solution**: Create table
```bash
drush sql-query "
CREATE TABLE messenger_messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  body LONGTEXT NOT NULL,
  headers LONGTEXT NOT NULL,
  queue_name VARCHAR(190) NOT NULL,
  created_at DATETIME NOT NULL,
  available_at DATETIME NOT NULL,
  delivered_at DATETIME DEFAULT NULL,
  INDEX queue_name_idx (queue_name),
  INDEX available_at_idx (available_at),
  INDEX delivered_at_idx (delivered_at)
);
"
```

---

## High Queue Depth

### Symptom

Queue depth keeps growing, messages pile up.

### Causes and Solutions

#### 1. Worker Too Slow

**Check processing time**:
```bash
drush messenger:stats agent_async
```

**Solution**: Optimize agent code or scale workers
```bash
# Start more workers
drush messenger:consume agent_async &
drush messenger:consume agent_async &
drush messenger:consume agent_async &
```

#### 2. Too Many Messages

**Check rate**:
```bash
drush messenger:stats
# Look at "Messages Per Minute"
```

**Solution**: Implement rate limiting
```yaml
rate_limiting:
  enabled: true
  max_executions: 100
  window_seconds: 3600
```

#### 3. Worker Memory Limit

**Check memory**:
```bash
ps aux | grep messenger:consume
# Look at RSS column
```

**Solution**: Increase memory limit
```bash
drush messenger:consume agent_async --memory-limit=512
```

#### 4. Worker Time Limit

Workers stop after time limit.

**Solution**: Restart workers automatically
```bash
# systemd service file
ExecStart=/usr/bin/drush messenger:consume agent_async --time-limit=3600
Restart=always
```

---

## Failed Message Issues

### Symptom

Messages keep failing and going to dead letter queue.

### Causes and Solutions

#### 1. Agent Not Found

**Check error**:
```bash
drush messenger:failed:show <message-id>
```

**Solution**: Verify agent exists
```bash
drush ai-agent-ossa:list
```

#### 2. Invalid Input

**Check message data**:
```bash
drush messenger:failed:show <message-id>
```

**Solution**: Fix validation in client code
```typescript
// Validate input before dispatching
if (!validateInput(input)) {
  throw new Error('Invalid input');
}
```

#### 3. Permission Denied

**Check user permissions**:
```bash
drush user:role:list
```

**Solution**: Grant permissions
```bash
drush user:role:add-permission authenticated "execute ossa agents"
```

#### 4. Timeout

Agent takes too long to execute.

**Solution**: Increase timeout
```typescript
await messageBus.dispatch(
  new AgentExecutionMessage(
    'agent-id',
    { input: 'data' },
    { timeout: 60000 }  // 60 seconds
  )
);
```

#### 5. External Service Down

Agent depends on external service.

**Solution**: Implement circuit breaker
```typescript
if (!await isServiceHealthy()) {
  // Don't dispatch, try again later
  return;
}
```

---

## Performance Problems

### Symptom

Slow message processing, high latency.

### Causes and Solutions

#### 1. Slow Transport

**For Doctrine**: Database is bottleneck

**Solution**: Switch to RabbitMQ or Redis
```bash
MESSENGER_TRANSPORT_DSN=amqp://user:password@rabbitmq:5672/%2f
```

#### 2. Too Much Middleware

**Check middleware stack**:
```yaml
messenger.bus.default:
  middleware:
    - validation
    - logging
    - authentication
    - rate_limiting  # Too many?
```

**Solution**: Remove unnecessary middleware in production

#### 3. Synchronous Operations

Agent does synchronous I/O.

**Solution**: Use async operations
```typescript
// Bad
const result = fs.readFileSync('file.txt');

// Good
const result = await fs.promises.readFile('file.txt');
```

#### 4. No Connection Pooling

**For database operations**

**Solution**: Use connection pooling
```yaml
doctrine:
  dbal:
    connections:
      default:
        pool:
          max_connections: 20
```

#### 5. Large Messages

Message payload is too large.

**Solution**: Store data separately, pass reference
```typescript
// Bad
await messageBus.dispatch(
  new AgentExecutionMessage(
    'agent-id',
    { largeData: hugeDataObject }  // Bad
  )
);

// Good
const dataId = await storage.store(hugeDataObject);
await messageBus.dispatch(
  new AgentExecutionMessage(
    'agent-id',
    { dataId }  // Good
  )
);
```

---

## Transport Issues

### Doctrine Transport

#### Issue: Database Lock Contention

**Symptom**: Slow processing, timeouts

**Solution**: Use row-level locking
```bash
# Verify storage engine
drush sql-query "SHOW TABLE STATUS WHERE Name = 'messenger_messages'"
# Should be InnoDB, not MyISAM
```

#### Issue: Table Size Growing

**Symptom**: Database getting large

**Solution**: Clean delivered messages
```bash
drush sql-query "
DELETE FROM messenger_messages
WHERE delivered_at IS NOT NULL
  AND delivered_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
"
```

### RabbitMQ Transport

#### Issue: Connection Refused

**Symptom**: `Connection refused` error

**Solution**: Check RabbitMQ is running
```bash
rabbitmqctl status
```

#### Issue: Messages Not Persisted

**Symptom**: Messages lost on restart

**Solution**: Enable persistence
```yaml
agent_async:
  options:
    persistent: true
```

### Redis Transport

#### Issue: Connection Timeout

**Symptom**: Slow or failed connections

**Solution**: Increase timeout
```yaml
agent_async:
  dsn: 'redis://redis:6379/messages?timeout=3.0'
```

#### Issue: Stream Too Large

**Symptom**: Memory issues

**Solution**: Trim stream
```yaml
agent_async:
  options:
    maxlen: 1000  # Keep max 1000 messages
```

---

## Worker Issues

### Issue: Worker Crashes

**Check logs**:
```bash
tail -f /var/log/drupal/messenger.log
```

**Common causes**:
- Memory limit exceeded
- Unhandled exception
- PHP fatal error

**Solutions**:
```bash
# Increase memory
drush messenger:consume agent_async --memory-limit=512

# Add error handling
try {
  await agent.execute();
} catch (error) {
  logger.error('Agent failed', error);
  throw error;
}
```

### Issue: Worker Hangs

**Check process**:
```bash
ps aux | grep messenger:consume
```

**Solution**: Kill and restart
```bash
kill -9 <pid>
drush messenger:consume agent_async
```

### Issue: Worker Won't Stop

**Symptom**: SIGTERM ignored

**Solution**: Force stop
```bash
kill -9 <pid>
```

### Issue: Multiple Workers Conflict

**Symptom**: Messages processed multiple times

**Solution**: Use message locks (automatic with Symfony Messenger)

---

## Monitoring Issues

### Issue: No Metrics

**Check metrics storage**:
```bash
drush messenger:stats
```

**Solution**: Verify metrics collector is enabled
```yaml
services:
  metrics_collector:
    enabled: true
```

### Issue: Incorrect Stats

**Check data**:
```bash
drush sql-query "SELECT * FROM messenger_metrics LIMIT 10"
```

**Solution**: Clear stale data
```bash
drush sql-query "DELETE FROM messenger_metrics WHERE timestamp < DATE_SUB(NOW(), INTERVAL 30 DAY)"
```

---

## Common Patterns

### Enable Debug Logging

```yaml
services:
  logger.channel.ai_agent_ossa:
    level: debug
```

### Test Transport Connection

```typescript
import { Transport } from '@symfony/messenger';

const transport = new Transport(process.env.MESSENGER_TRANSPORT_DSN);
await transport.get();  // Should not throw
```

### Verify Message Format

```bash
# For Doctrine
drush sql-query "SELECT * FROM messenger_messages LIMIT 1"

# For RabbitMQ
rabbitmqctl list_queues

# For Redis
redis-cli XLEN ossa_agents
```

### Check Worker Health

```bash
# Create health check script
#!/bin/bash
WORKERS=$(ps aux | grep "messenger:consume" | grep -v grep | wc -l)
if [ $WORKERS -eq 0 ]; then
  echo "No workers running!"
  exit 1
fi
echo "Workers running: $WORKERS"
```

---

## Getting Help

### Collect Diagnostic Info

```bash
# System info
uname -a
php -v
drush --version

# Configuration
drush config:get ai_agent_ossa.settings
cat .env | grep MESSENGER

# Queue status
drush messenger:stats

# Recent failures
drush messenger:failed:list

# Logs
tail -100 /var/log/drupal/messenger.log
```

### Report Issues

Include:
1. Symptom description
2. Error messages
3. Diagnostic info
4. Steps to reproduce

### Resources

- [Symfony Messenger Docs](https://symfony.com/doc/current/messenger.html)
- [OSSA Documentation](https://openstandardagents.org)
- [Issue Tracker](https://gitlab.com/blueflyio/ossa/openstandardagents/-/issues)
