# Symfony Messenger Architecture

Visual architecture diagrams for the OSSA Messenger integration.

## High-Level Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                              │
│                                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │   API    │  │   Cron   │  │  Events  │  │  Manual  │         │
│  │Endpoints │  │   Jobs   │  │ Handlers │  │  Trigger │         │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘         │
│       │             │             │             │                 │
│       └─────────────┴─────────────┴─────────────┘                 │
└───────────────────────────┬───────────────────────────────────────┘
                            │
                            │ dispatch(message)
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│                       MIDDLEWARE STACK                             │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  1. ValidationMiddleware                                 │     │
│  │     - Validate message structure                         │     │
│  │     - Check required fields                              │     │
│  │     - Enforce constraints                                │     │
│  └────────────────────────┬─────────────────────────────────┘     │
│                           ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  2. LoggingMiddleware                                    │     │
│  │     - Log message received                               │     │
│  │     - Track processing time                              │     │
│  │     - Log success/failure                                │     │
│  └────────────────────────┬─────────────────────────────────┘     │
│                           ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  3. AuthenticationMiddleware                             │     │
│  │     - Verify user ID                                     │     │
│  │     - Check authentication                               │     │
│  │     - Validate permissions                               │     │
│  └────────────────────────┬─────────────────────────────────┘     │
│                           ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  4. RateLimitMiddleware                                  │     │
│  │     - Check rate limits                                  │     │
│  │     - Increment usage                                    │     │
│  │     - Enforce throttling                                 │     │
│  └────────────────────────┬─────────────────────────────────┘     │
└───────────────────────────┼───────────────────────────────────────┘
                            │
                            │ route(message)
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│                      TRANSPORT LAYER                               │
│                                                                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐    │
│  │   Doctrine       │  │   RabbitMQ       │  │   Redis     │    │
│  │   (Database)     │  │   (AMQP)         │  │  (Streams)  │    │
│  │                  │  │                  │  │             │    │
│  │  ┌────────────┐  │  │  ┌────────────┐  │  │ ┌─────────┐ │    │
│  │  │ Messages   │  │  │  │   Queue    │  │  │ │ Stream  │ │    │
│  │  │   Table    │  │  │  │   Storage  │  │  │ │ Storage │ │    │
│  │  └────────────┘  │  │  └────────────┘  │  │ └─────────┘ │    │
│  └──────────────────┘  └──────────────────┘  └─────────────┘    │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              Failed Message Transport                     │    │
│  │              (Dead Letter Queue)                          │    │
│  └──────────────────────────────────────────────────────────┘    │
└───────────────────────────┬───────────────────────────────────────┘
                            │
                            │ consume()
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│                        WORKER LAYER                                │
│                                                                    │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐     │
│  │   Worker 1     │  │   Worker 2     │  │   Worker N     │     │
│  │                │  │                │  │                │     │
│  │  Consuming:    │  │  Consuming:    │  │  Consuming:    │     │
│  │  agent_async   │  │  agent_async   │  │  agent_batch   │     │
│  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘     │
│          │                   │                   │               │
│          └───────────────────┴───────────────────┘               │
└───────────────────────────┬───────────────────────────────────────┘
                            │
                            │ handle(message)
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│                       HANDLER LAYER                                │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │        AgentExecutionHandler                              │    │
│  │                                                           │    │
│  │  1. Load agent manifest                                   │    │
│  │  2. Execute agent with input                              │    │
│  │  3. Track execution time                                  │    │
│  │  4. Store result                                          │    │
│  │  5. Dispatch events                                       │    │
│  │  6. Send callbacks (optional)                             │    │
│  └───────────────────────┬───────────────────────────────────┘    │
│                          │                                        │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │        AgentBatchHandler                                  │    │
│  │                                                           │    │
│  │  1. Parse batch configuration                             │    │
│  │  2. Execute agents (parallel/sequential)                  │    │
│  │  3. Track individual results                              │    │
│  │  4. Aggregate batch results                               │    │
│  │  5. Store batch result                                    │    │
│  │  6. Dispatch batch events                                 │    │
│  └───────────────────────┬───────────────────────────────────┘    │
└───────────────────────────┼───────────────────────────────────────┘
                            │
                            │ execute()
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│                    OSSA RUNTIME LAYER                              │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                   Agent Runtime                           │    │
│  │                                                           │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │    │
│  │  │   Load     │→ │  Validate  │→ │  Execute   │         │    │
│  │  │  Manifest  │  │   Agent    │  │   Agent    │         │    │
│  │  └────────────┘  └────────────┘  └────────────┘         │    │
│  │                                                           │    │
│  │  ┌────────────────────────────────────────────┐          │    │
│  │  │         OSSA Agent Execution               │          │    │
│  │  │  - LLM calls                               │          │    │
│  │  │  - Tool execution                          │          │    │
│  │  │  - State management                        │          │    │
│  │  │  - Output generation                       │          │    │
│  │  └────────────────────────────────────────────┘          │    │
│  └───────────────────────┬───────────────────────────────────┘    │
└───────────────────────────┼───────────────────────────────────────┘
                            │
                            │ store()
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│                  STORAGE & MONITORING LAYER                        │
│                                                                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐    │
│  │  Result Storage  │  │ Metrics Collector│  │Queue Monitor│    │
│  │                  │  │                  │  │             │    │
│  │  - Execution     │  │  - Total count   │  │  - Depth    │    │
│  │    results       │  │  - Success rate  │  │  - Health   │    │
│  │  - Error details │  │  - Avg time      │  │  - Alerts   │    │
│  │  - Metadata      │  │  - Throughput    │  │  - Status   │    │
│  └──────────────────┘  └──────────────────┘  └─────────────┘    │
└───────────────────────────┬───────────────────────────────────────┘
                            │
                            │ notify()
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│                   NOTIFICATION LAYER (Optional)                    │
│                                                                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐    │
│  │  HTTP Callback   │  │   WebSocket      │  │  Email      │    │
│  │  (Webhook)       │  │   Push           │  │  Notification│    │
│  └──────────────────┘  └──────────────────┘  └─────────────┘    │
└───────────────────────────────────────────────────────────────────┘
```

## Message Flow

### Single Agent Execution

```
Client
  │
  │ 1. Create AgentExecutionMessage
  │
  ▼
┌────────────────────┐
│  Message Bus       │
│  (Middleware)      │
└─────────┬──────────┘
          │
          │ 2. Validate, Log, Auth, RateLimit
          │
          ▼
┌────────────────────┐
│  Transport         │
│  (Queue Storage)   │
└─────────┬──────────┘
          │
          │ 3. Store in queue
          │
          ▼
┌────────────────────┐
│  Worker            │
│  (Consumer)        │
└─────────┬──────────┘
          │
          │ 4. Consume message
          │
          ▼
┌────────────────────┐
│  Handler           │
│  (AgentExecution)  │
└─────────┬──────────┘
          │
          │ 5. Load & execute agent
          │
          ▼
┌────────────────────┐
│  OSSA Runtime      │
└─────────┬──────────┘
          │
          │ 6. Return result
          │
          ▼
┌────────────────────┐
│  Result Storage    │
└─────────┬──────────┘
          │
          │ 7. Notify client (optional)
          │
          ▼
Client
```

### Batch Execution (Parallel)

```
Client
  │
  │ 1. Create AgentBatchMessage
  │    (mode: parallel, maxParallel: 5)
  │
  ▼
Message Bus → Transport → Worker → AgentBatchHandler
                                         │
                                         │ 2. Parse batch
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
              ┌─────────┐          ┌─────────┐          ┌─────────┐
              │ Agent 1 │          │ Agent 2 │          │ Agent 3 │
              │ Execute │          │ Execute │          │ Execute │
              └────┬────┘          └────┬────┘          └────┬────┘
                   │                    │                    │
                   │ 3. Concurrent execution (max 5 parallel)
                   │                    │                    │
                   └────────────────────┴────────────────────┘
                                        │
                                        │ 4. Aggregate results
                                        │
                                        ▼
                                 ┌─────────────┐
                                 │  Batch      │
                                 │  Result     │
                                 └──────┬──────┘
                                        │
                                        │ 5. Store & notify
                                        │
                                        ▼
                                    Client
```

### Error Handling Flow

```
Message Execution
  │
  │ Attempt 1
  │
  ▼
┌────────────┐
│ Try Execute│
└─────┬──────┘
      │
      │ Error!
      ▼
┌────────────────────┐
│ FailedMessage      │
│ Subscriber         │
└─────┬──────────────┘
      │
      │ Check retry count
      │
      ├─ < max_retries ─────────┐
      │                          │
      │ Retry with backoff       │
      │                          │
      │ Attempt 2 (1s delay)     │
      │         ▼                │
      │    ┌────────────┐        │
      │    │ Try Execute│        │
      │    └─────┬──────┘        │
      │          │               │
      │    Still failing?        │
      │          │               │
      │ Attempt 3 (2s delay)     │
      │         ▼                │
      │    ┌────────────┐        │
      │    │ Try Execute│        │
      │    └─────┬──────┘        │
      │          │               │
      │    Still failing?        │
      │          │               │
      │ Attempt 4 (4s delay)     │
      │         ▼                │
      │    ┌────────────┐        │
      │    │ Try Execute│        │
      │    └─────┬──────┘        │
      │          │               │
      └──────────┴───────────────┘
                 │
                 │ max_retries exceeded
                 │
                 ▼
        ┌────────────────┐
        │ Dead Letter    │
        │ Queue          │
        └────────┬───────┘
                 │
                 │ Manual intervention
                 │
                 ▼
        ┌────────────────┐
        │ drush          │
        │ messenger:     │
        │ failed:retry   │
        └────────────────┘
```

## Transport Comparison

### Doctrine (Database)

```
┌─────────────────────────────────────┐
│      messenger_messages table        │
│                                      │
│  ┌────┬──────┬─────────┬──────────┐│
│  │ id │ body │ headers │ queue    ││
│  ├────┼──────┼─────────┼──────────┤│
│  │ 1  │ {...}│ {...}   │ agents   ││
│  │ 2  │ {...}│ {...}   │ agents   ││
│  │ 3  │ {...}│ {...}   │ batch    ││
│  └────┴──────┴─────────┴──────────┘│
└─────────────────────────────────────┘

Pros:
+ Simple setup (no extra dependencies)
+ Built into Drupal/Symfony
+ Transaction support
+ Easy debugging (SQL queries)

Cons:
- Slower than dedicated queues
- Database lock contention
- Not ideal for high throughput
```

### RabbitMQ

```
┌─────────────────────────────────────┐
│         RabbitMQ Server             │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Exchange: agents           │   │
│  │  Type: direct              │   │
│  └───────┬─────────────────────┘   │
│          │                         │
│  ┌───────▼─────────────────────┐   │
│  │  Queue: ossa_agents         │   │
│  │  Messages: [1, 2, 3, ...]   │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘

Pros:
+ Very fast
+ Reliable (ACK/NACK)
+ Production-ready
+ Built-in monitoring
+ Multiple consumers

Cons:
- Requires RabbitMQ server
- More complex setup
- Need to manage server
```

### Redis

```
┌─────────────────────────────────────┐
│         Redis Server                 │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Stream: ossa_agents        │   │
│  │  ┌─────┬─────┬─────┬─────┐  │   │
│  │  │ 1-0 │ 2-0 │ 3-0 │ ... │  │   │
│  │  └─────┴─────┴─────┴─────┘  │   │
│  │                             │   │
│  │  Consumer Group: consumers  │   │
│  │  Consumers: [c1, c2, c3]    │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘

Pros:
+ Very fast
+ Simple setup
+ Low latency
+ Built-in Redis Streams

Cons:
- No guaranteed delivery
- Memory-based (data loss risk)
- Need Redis server
```

## Monitoring Dashboard Layout

```
┌──────────────────────────────────────────────────────────────┐
│                    OSSA Messenger Dashboard                   │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐│
│  │  Queue Depth    │  │  Success Rate   │  │  Avg Time    ││
│  │                 │  │                 │  │              ││
│  │      152        │  │     98.5%       │  │    450ms     ││
│  │  ▲ +12 (5min)   │  │  ▼ -0.3%       │  │  ▲ +20ms     ││
│  └─────────────────┘  └─────────────────┘  └──────────────┘│
│                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐│
│  │  Throughput     │  │  Failed Count   │  │  Workers     ││
│  │                 │  │                 │  │              ││
│  │   45 msg/min    │  │       23        │  │      5       ││
│  │  ◆ Normal       │  │  ⚠ High        │  │  ✓ Healthy   ││
│  └─────────────────┘  └─────────────────┘  └──────────────┘│
│                                                               │
├──────────────────────────────────────────────────────────────┤
│                      Queue Health                             │
│                                                               │
│  agent_async:  ████████████████████░  95% ✓                 │
│  agent_batch:  ███████████████████░░  90% ✓                 │
│  failed:       ██████░░░░░░░░░░░░░░  30% ⚠                  │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│                    Recent Activity                            │
│                                                               │
│  AgentExecutionMessage    ✓ Success   450ms   2m ago         │
│  AgentBatchMessage        ✓ Success   1.2s    3m ago         │
│  AgentExecutionMessage    ✗ Failed    380ms   5m ago         │
│  AgentExecutionMessage    ✓ Success   520ms   6m ago         │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## CLI Command Structure

```
drush messenger
├── consume [transport]
│   ├── --limit=N
│   ├── --time-limit=N
│   ├── --memory-limit=N
│   └── --sleep=N
│
├── failed
│   ├── list
│   │   ├── --limit=N
│   │   └── --offset=N
│   ├── show <message-id>
│   ├── retry [message-id]
│   └── remove [message-id]
│
└── stats [transport]
    ├── --format=table|json
    └── --period=hour|day|week
```

## Security Layers

```
Request
  │
  │ 1. Authentication
  │    - Verify user ID
  │    - Check session
  │
  ▼
┌────────────────────┐
│ Authentication     │
│ Middleware         │
└─────────┬──────────┘
          │
          │ 2. Authorization
          │    - Check permissions
          │    - Validate access
          │
          ▼
┌────────────────────┐
│ Permission         │
│ Check              │
└─────────┬──────────┘
          │
          │ 3. Rate Limiting
          │    - Check user limits
          │    - Enforce throttle
          │
          ▼
┌────────────────────┐
│ Rate Limit         │
│ Middleware         │
└─────────┬──────────┘
          │
          │ 4. Validation
          │    - Validate input
          │    - Sanitize data
          │
          ▼
┌────────────────────┐
│ Validation         │
│ Middleware         │
└─────────┬──────────┘
          │
          │ 5. Execute
          │
          ▼
Agent Execution
```
