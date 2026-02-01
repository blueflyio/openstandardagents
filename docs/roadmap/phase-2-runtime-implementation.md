# Phase 2: Runtime Implementation (Weeks 3-4)

**Status:** Not Started  
**Timeline:** Weeks 3-4  
**Version Target:** v{{VERSION}}

---

## 🎯 Goal

Implement OSSA in Symfony Messenger and Drupal ECA to validate the specification with real runtime execution.

**Principle**: "Real-World Validation" - Use production frameworks to validate patterns work in practice.

---

## 📋 Issues

| Issue | Title | Status | Priority |
|-------|-------|--------|----------|
| [#126](https://gitlab.com/blueflyio/openstandardagents/-/issues/126) | Symfony Messenger Adapter | ⚪ Closed | P0 |
| TBD | API Normalizer Integration | ⚪ Not Started | P0 |

---

## 📦 Deliverables

### 1. Symfony Messenger Runtime Adapter

**Package**: `ossa/symfony-runtime`

**Features:**
- Messenger integration for async execution
- Service auto-wiring for OSSA capabilities
- Stamp support for OSSA metadata
- Task execution via message handlers
- Workflow coordination
- State management (Redis/Doctrine)
- Error handling (retry, DLQ)

**Example:**
```php
// Symfony service that handles OSSA messages
namespace Ossa\SymfonyRuntime;

#[AsMessageHandler]
class OssaTaskHandler {
    public function __invoke(OssaTaskMessage $message): void {
        $manifest = $message->getManifest();
        $executor = $this->executorFactory->create($manifest);
        $executor->run($message->getInput());
    }
}
```

**Configuration:**
```yaml
# config/packages/ossa.yaml
ossa:
  runtime:
    transport: async
    state_backend: redis
    retry:
      max_attempts: 3
      backoff: exponential
```

### 2. Drupal ECA Event Plugins

**Module**: `ossa_eca`

**Features:**
- ECA event plugins for OSSA tasks
- Workflow integration with ECA
- Message routing via Drupal queues
- State management via Drupal State API
- Integration with existing ECA workflows

**Example:**
```yaml
# ossa_eca.eca.yaml
ossa_task_execute:
  label: 'Execute OSSA Task'
  event: ossa.task.execute
  conditions:
    - plugin: ossa_task_condition
      task_name: 'phpcs-check'
  actions:
    - plugin: ossa_task_action
      task_manifest: 'path/to/task.ossa.yaml'
```

### 3. Message Routing Implementation

**Features:**
- Channel-based routing (security.*, dependency.*, etc.)
- Filter support (severity, priority, etc.)
- Transform support (extract fields, enrich data)
- Priority queues (low, normal, high, critical)
- Dead letter queue (DLQ) handling

**Example:**
```yaml
# routing.yaml
apiVersion: ossa/v0.3.0
kind: MessageRouting
metadata:
  name: security-workflow
spec:
  rules:
    - source: dependency-healer
      channel: security.vulnerabilities
      targets:
        - security-scanner
        - monitoring-agent
      filter:
        severity: [high, critical]
      priority: high
```

### 4. State Management

**Features:**
- Workflow state persistence
- Variable storage and retrieval
- Context sharing between tasks
- State cleanup policies
- State export for debugging

**Backends:**
- Redis (recommended for production)
- Doctrine (database-backed)
- Memory (testing only)

### 5. Error Handling

**Features:**
- Retry policies (exponential backoff)
- Dead letter queue (DLQ)
- Error logging and tracing
- Fallback task execution
- Circuit breaker pattern

---

## ✅ Success Criteria

### Symfony Messenger Adapter
- [ ] Installable via Composer
- [ ] Tasks execute via Messenger async
- [ ] Workflows coordinate multi-step execution
- [ ] Agents integrate with Symfony services
- [ ] Stamps carry OSSA context (trace IDs, etc.)
- [ ] Retry policies work correctly
- [ ] DLQ handles failed messages
- [ ] State management persists across tasks

### Drupal ECA Integration
- [ ] ECA plugins recognize OSSA tasks
- [ ] Workflows trigger on OSSA events
- [ ] Message routing works via Drupal queues
- [ ] State management uses Drupal State API
- [ ] Integration tests pass

### API Normalizer Integration
- [ ] API Normalizer publishes events to Messenger
- [ ] Events follow OSSA messaging schema
- [ ] Routing rules work correctly
- [ ] Multi-agent workflows execute end-to-end

### Code Quality
- [ ] All PHPCS errors fixed
- [ ] PHPStan level 8 passes
- [ ] Unit tests cover 80%+ of code
- [ ] Integration tests cover key workflows
- [ ] Documentation complete

---

## 📊 Progress Tracking

### Week 3
- [ ] Set up Symfony bundle structure
- [ ] Implement OssaTaskHandler
- [ ] Implement message routing
- [ ] Create Drupal ECA plugins
- [ ] Write unit tests

### Week 4
- [ ] Implement state management
- [ ] Implement error handling
- [ ] API Normalizer integration
- [ ] Write integration tests
- [ ] Fix all PHPCS/PHPStan errors

---

## 🔗 Dependencies

### Upstream
- ✅ Phase 1: Specification (#133, #132)

### Downstream
- Phase 3: Production Use Cases (multi-agent workflows)
- Phase 4: Knowledge & Convergence (#96, Epic #9)

---

## 🏗️ Technical Architecture

### Symfony Messenger Flow

```
┌─────────────────────┐
│  OSSA Task Manifest │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  OssaTaskMessage    │
│  (Messenger)        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  OssaTaskHandler    │
│  (Message Handler)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Task Executor      │
│  (Runtime)          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Result / State     │
└─────────────────────┘
```

### Drupal ECA Flow

```
┌─────────────────────┐
│  OSSA Event         │
│  (ossa.task.execute)│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  ECA Event Plugin   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  ECA Condition      │
│  (task_name match)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  ECA Action         │
│  (execute task)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  OSSA Task Executor │
└─────────────────────┘
```

---

## 📚 Key Insights from Webinar

### Luca (Symfony Messenger)
> "Soft dependency on Symfony Messenger... Magic hooks: Messenger provides out-of-box features (retry, DLQ, async)"

**Takeaway**: Leverage Messenger's built-in reliability features rather than reimplementing.

### Randy (Maestro)
> "20+ years of workflow experience: This is proven, not theoretical"

**Takeaway**: Learn from proven patterns in business process automation.

---

## 🎯 Key Success Factors

1. **Leverage existing features**: Use Messenger's retry, DLQ, async capabilities
2. **Keep it simple**: Don't reinvent the wheel
3. **Test thoroughly**: Integration tests with real workflows
4. **Document well**: Clear examples for Symfony/Drupal developers
5. **Performance**: Ensure production-ready performance
6. **Security**: Validate all inputs, sanitize outputs

---

## 📌 Next Steps

1. **Week 3**: Set up Symfony bundle, implement core handlers
2. **Week 4**: Implement state management, error handling, integration tests
3. **Following Week**: API Normalizer integration, multi-agent workflows

---

## 🔗 Related Documentation

- [Master Roadmap](v0.3.x-to-v{{VERSION}}.md)
- [Phase 1: Specification](phase-1-specification.md)
- [Phase 3: Production Use Cases](phase-3-production-use-cases.md)
- [Dependency Graph](dependency-graph.md)

---

**Maintained by**: OSSA Community  
**Last Updated**: 2025-12-10
