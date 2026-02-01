# Phase 1: Specification (Weeks 1-2)

**Status:** In Progress  
**Timeline:** Weeks 1-2  
**Version Target:** v0.3.0

---

## 🎯 Goal

Define the contract for tasks, workflows, and messaging before implementation begins.

**Principle**: "Clear Specification" - Define what agents can do before building how they do it.

---

## 📋 Issues

| Issue | Title | Status | Priority |
|-------|-------|--------|----------|
| [#397](https://gitlab.com/blueflyio/openstandardagents/-/merge_requests/397) | Task/Workflow Basics | ✅ Completed | P0 |
| [#133](https://gitlab.com/blueflyio/openstandardagents/-/issues/133) | Enhanced Task/Workflow Schema | 🔄 In Progress | P0 |
| [#132](https://gitlab.com/blueflyio/openstandardagents/-/issues/132) | Messaging Extension | 🔄 In Progress | P0 |

---

## 📦 Deliverables

### 1. Task Schema Enhancement (`spec/v0.3.0/task-schema.md`)

**Enhancements from v0.3.0:**
- Task dependencies (what tasks must run before this one)
- Conditional execution (if/then/else)
- Retry policies (exponential backoff, max attempts)
- Timeout handling
- Error handling (catch, fallback)
- Parallel execution markers
- Loop support (for-each, while)

**Example:**
```yaml
apiVersion: ossa/v0.3.0
kind: Task
metadata:
  name: process-data
spec:
  description: Process data with error handling
  
  # NEW: Dependencies
  dependencies:
    - task: fetch-data
      required: true
    - task: validate-data
      required: true
  
  # NEW: Conditional execution
  condition: |
    input.status == 'pending' && input.priority > 5
  
  # NEW: Retry policy
  retry:
    max_attempts: 3
    backoff:
      strategy: exponential
      initial_delay_ms: 1000
      max_delay_ms: 30000
  
  # NEW: Timeout
  timeout_seconds: 300
  
  # NEW: Error handling
  on_error:
    strategy: fallback
    fallback_task: handle-error
```

### 2. Workflow Schema Enhancement (`spec/v0.3.0/workflow-schema.md`)

**Enhancements from v0.3.0:**
- Task ordering (sequential vs parallel)
- Branching logic (if/then/else)
- Decision points (true/false branches)
- Loop constructs (for-each, while, until)
- Error handling (on-failure, retry, fallback)
- State management (variables, context)
- Messaging integration (publish/subscribe between tasks)
- Readability (should be "readable like a book")

**Example:**
```yaml
apiVersion: ossa/v0.3.0
kind: Workflow
metadata:
  name: complex-workflow
spec:
  description: Workflow with branching, looping, parallel execution
  
  # NEW: State/variables
  state:
    variables:
      retry_count: { type: integer, default: 0 }
      errors: { type: array, default: [] }
  
  # NEW: Task execution with control flow
  tasks:
    # Sequential execution
    - name: step-1
      task: fetch-data
    
    # Conditional branching
    - name: decision-point
      type: decision
      condition: output.step-1.status == 'success'
      on_true:
        - name: step-2a
          task: process-success
      on_false:
        - name: step-2b
          task: handle-error
    
    # Parallel execution
    - name: parallel-tasks
      type: parallel
      tasks:
        - name: task-a
          task: analyze-data
        - name: task-b
          task: validate-data
      wait_all: true
    
    # Loop execution
    - name: process-items
      type: for-each
      items: output.step-1.items
      task: process-item
      max_iterations: 100
```

### 3. Messaging Extension (`spec/v0.3.0/messaging.md`)

**New capabilities:**
- Channel declarations (what agents publish)
- Subscriptions (what agents listen to)
- Commands (RPC-style operations)
- Message routing (rules, filters, transforms)
- Reliability guarantees (delivery, retry, DLQ, ordering)

**Example:**
```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: security-scanner
spec:
  messaging:
    publishes:
      - channel: security.vulnerabilities
        schema:
          type: object
          properties:
            vulnerability_id: { type: string }
            severity: { enum: [low, medium, high, critical] }
            cve_id: { type: string }
    
    subscribes:
      - channel: dependency.updates
        handler: process_update
    
    commands:
      - name: scan_package
        input_schema:
          type: object
          properties:
            package: { type: string }
```

### 4. Working Examples (10+ examples)

**Required examples:**
1. Sequential workflow (3 tasks in order)
2. Parallel workflow (tasks run concurrently)
3. Conditional workflow (if/then/else branching)
4. Loop workflow (for-each iteration)
5. Error handling workflow (retry, fallback)
6. Multi-agent messaging (publish/subscribe)
7. Command execution (RPC between agents)
8. Complex workflow (all patterns combined)
9. Maestro-style workflow (business process automation)
10. Drupal ECA-style workflow (event-driven)

### 5. JSON Schema Updates

**Files to update:**
- `spec/v0.3.0/ossa-0.3.4.schema.json`
- Add `Task` enhancements
- Add `Workflow` enhancements
- Add `MessagingExtension` definitions

---

## ✅ Success Criteria

### Task/Workflow Schema
- [ ] All patterns from Maestro templates expressible
- [ ] All patterns from Drupal ECA expressible
- [ ] All patterns from Langflow expressible
- [ ] Schema is "readable like a book"
- [ ] Supports branching (if/then/else)
- [ ] Supports looping (for-each, while)
- [ ] Supports parallel execution
- [ ] Supports error handling (retry, fallback)

### Messaging Extension
- [ ] Channel naming conventions defined
- [ ] Message envelope format specified
- [ ] Routing rules syntax documented
- [ ] Reliability patterns defined
- [ ] Framework adapters documented (LangChain, CrewAI, Langflow, GitLab, KAgent)

### Examples
- [ ] 10+ working examples created
- [ ] All examples validate against schema
- [ ] Examples cover all patterns
- [ ] Examples are well-documented

### Backward Compatibility
- [ ] Zero breaking changes to v0.3.0
- [ ] All v0.3.0 manifests still valid
- [ ] Migration guide created (if needed)

---

## 📊 Progress Tracking

### Week 1
- [ ] Review MR #397 (Task/Workflow basics)
- [ ] Define Task schema enhancements
- [ ] Define Workflow schema enhancements
- [ ] Create 5 working examples
- [ ] Update JSON Schema (partial)

### Week 2
- [ ] Define Messaging extension
- [ ] Create 5 more working examples
- [ ] Complete JSON Schema updates
- [ ] Validate all examples
- [ ] Create migration guide

---

## 🔗 Dependencies

### Upstream
- ✅ MR #397: Task/Workflow Basics (completed)

### Downstream
- Phase 2: Runtime Implementation (#126, API Normalizer)
- Phase 3: Production Use Cases (multi-agent workflows)
- Phase 4: Knowledge & Convergence (#96, Epic #9)

---

## 📚 Key Insights from Meeting

### Randy (Maestro Expert)
> "When you boil it down, it's just a linked list... a generic task structure or schema really has to take into account not only the linearity of a lot of processes, but especially when you do decision-making, are you following a true branch or false branch?"

**Takeaway**: Schema must support non-linear workflows with branching and looping.

### Luca (Symfony Messenger)
> "Magic hooks... Messenger provides out-of-box features (retry, DLQ, async)"

**Takeaway**: Runtime provides reliability features; spec defines the contract.

### Speaker 2 (Messaging Insight)
> "I see this as maybe the glue that glues all of this stuff together... if we can write to these queues and vice versa, we're listening to these queues as well from agents and we can respond to them. That's really powerful."

**Takeaway**: Messaging is the connector between agents, tasks, workflows, and runtimes.

---

## 🎯 Key Success Factors

1. **Declarative, not prescriptive**: Spec defines contracts, not implementations
2. **Framework-agnostic**: Works with any runtime (Symfony, Drupal, Langflow, etc.)
3. **Backward compatible**: v0.3.0 agents work without changes
4. **Composable**: Simple patterns combine into complex workflows
5. **Observable**: Built-in support for tracing and metrics
6. **Secure**: Policy-driven governance from the start

---

## 📌 Next Steps

1. **This Week**: Review and approve #133, #132; Start specification work
2. **Next Week**: Complete #133, #132; Create all working examples
3. **Following Week**: Validate with framework teams (Symfony, Drupal, Langflow)

---

## 🔗 Related Documentation

- [Master Roadmap](v0.3.x-to-v{{VERSION}}.md)
- [Phase 2: Runtime Implementation](phase-2-runtime-implementation.md)
- [Dependency Graph](dependency-graph.md)
- [Success Metrics](success-metrics.md)

---

**Maintained by**: OSSA Community  
**Last Updated**: 2025-12-10
