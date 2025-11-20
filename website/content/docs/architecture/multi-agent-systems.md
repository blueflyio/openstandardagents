# Multi-Agent Systems Architecture

How multiple OSSA agents discover, communicate, and coordinate with each other.

---

## Overview

OSSA enables **multi-agent systems** where specialized agents collaborate to solve complex problems. Just as microservices communicate via REST APIs, OSSA agents communicate via standardized manifests and messaging protocols.

---

## Multi-Agent System Topology

```mermaid
graph TB
    subgraph "Agent Registry"
        Registry[OSSA Agent Registry<br/>Discovery Service]
        Manifests[(Agent Manifests<br/>customer.ossa.yaml<br/>sales.ossa.yaml<br/>support.ossa.yaml)]
    end

    subgraph "Orchestrator Layer"
        Coordinator[Agent Coordinator]
        Router[Message Router]
        Queue[Message Queue<br/>RabbitMQ | Redis]
    end

    subgraph "Agent Layer"
        CustomerAgent[Customer Agent<br/>Handles inquiries]
        SalesAgent[Sales Agent<br/>Processes orders]
        SupportAgent[Support Agent<br/>Resolves issues]
        AnalyticsAgent[Analytics Agent<br/>Generates reports]
    end

    subgraph "Shared Resources"
        Memory[(Shared Memory<br/>PostgreSQL)]
        Vector[(Vector Store<br/>Pinecone)]
        Cache[(Cache<br/>Redis)]
    end

    Registry --> Coordinator
    Manifests --> Registry

    Coordinator --> Router
    Router --> Queue

    Queue --> CustomerAgent
    Queue --> SalesAgent
    Queue --> SupportAgent
    Queue --> AnalyticsAgent

    CustomerAgent --> Memory
    SalesAgent --> Memory
    SupportAgent --> Memory
    AnalyticsAgent --> Memory

    CustomerAgent --> Vector
    SalesAgent --> Vector

    CustomerAgent --> Cache
    SalesAgent --> Cache
    SupportAgent --> Cache

    CustomerAgent -.->|Delegate| SalesAgent
    CustomerAgent -.->|Escalate| SupportAgent
    SalesAgent -.->|Report| AnalyticsAgent

    style Registry fill:#4A90E2,stroke:#333,stroke-width:2px,color:#fff
    style Manifests fill:#4A90E2,stroke:#333,stroke-width:2px,color:#fff
```

---

## Agent Discovery Flow

```mermaid
sequenceDiagram
    autonumber
    participant CustomerAgent as Customer Agent
    participant Registry as Agent Registry
    participant SalesAgent as Sales Agent

    CustomerAgent->>Registry: Query: "Find agent for 'process_order'"
    Note over Registry: Search manifests<br/>by capability

    Registry->>Registry: Load sales.ossa.yaml
    Note over Registry: apiVersion: ossa/v0.2.x<br/>capabilities:<br/>  - process_order

    Registry-->>CustomerAgent: Return Agent Info
    Note over Registry: {<br/>  name: "sales-agent",<br/>  endpoint: "/api/sales",<br/>  manifest: {...}<br/>}

    CustomerAgent->>SalesAgent: Delegate Task
    Note over CustomerAgent,SalesAgent: {<br/>  task: "process_order",<br/>  data: {...}<br/>}

    SalesAgent-->>CustomerAgent: Task Result
```

**Key Concepts:**
- **Agent Registry**: Central discovery service for OSSA agents
- **Capability Matching**: Find agents by what they can do
- **Manifest-Driven**: Agent capabilities defined in OSSA manifests

---

## Agent-to-Agent Communication

### Pattern 1: Direct Delegation

```mermaid
sequenceDiagram
    participant User
    participant AgentA as Customer Agent
    participant AgentB as Sales Agent
    participant LLM as LLM Provider

    User->>AgentA: "I want to buy 5 widgets"
    AgentA->>LLM: Process Intent
    LLM-->>AgentA: Intent: purchase_order

    Note over AgentA: Check capabilities<br/>in manifest

    AgentA->>AgentA: Load sales.ossa.yaml
    Note over AgentA: Found: Sales Agent<br/>handles orders

    AgentA->>AgentB: Delegate Task
    Note over AgentA,AgentB: {<br/>  action: "create_order",<br/>  items: ["widget"],<br/>  quantity: 5<br/>}

    AgentB->>LLM: Process Order
    LLM->>AgentB: Generate Confirmation

    AgentB-->>AgentA: Order Created
    Note over AgentB: {<br/>  orderId: "12345",<br/>  total: "$50.00"<br/>}

    AgentA->>User: "Order #12345 created for $50"
```

**OSSA Manifest Example (Customer Agent):**
```yaml
apiVersion: ossa/v0.2.x
kind: Agent
metadata:
  name: customer-agent
spec:
  role: You are a customer service agent
  capabilities:
    - handle_inquiries
    - delegate_to_sales
  delegationRules:
    - intent: purchase_order
      targetAgent: sales-agent
      method: direct
```

---

### Pattern 2: Event-Driven Coordination

```mermaid
sequenceDiagram
    participant AgentA as Order Agent
    participant Queue as Message Queue
    participant AgentB as Inventory Agent
    participant AgentC as Notification Agent

    AgentA->>Queue: Publish Event
    Note over Queue: Event: order_created<br/>{orderId: 12345}

    Queue->>AgentB: Consume Event
    Queue->>AgentC: Consume Event

    par Process in Parallel
        AgentB->>AgentB: Update Inventory
        Note over AgentB: Reduce stock by qty
        AgentB->>Queue: Publish: inventory_updated
    and
        AgentC->>AgentC: Send Email
        Note over AgentC: Email customer
        AgentC->>Queue: Publish: notification_sent
    end

    Queue->>AgentA: Events: inventory_updated, notification_sent
    AgentA->>AgentA: Mark Order Complete
```

**OSSA Manifest Example (Order Agent):**
```yaml
apiVersion: ossa/v0.2.x
kind: Agent
metadata:
  name: order-agent
spec:
  role: You process customer orders
  events:
    publishes:
      - name: order_created
        schema:
          type: object
          properties:
            orderId: { type: string }
            items: { type: array }
    subscribes:
      - name: inventory_updated
        handler: update_order_status
      - name: notification_sent
        handler: mark_notified
```

---

### Pattern 3: Hierarchical Coordination

```mermaid
graph TB
    Supervisor[Supervisor Agent<br/>Orchestrates workflow]

    Supervisor --> Worker1[Research Agent<br/>Gathers data]
    Supervisor --> Worker2[Analysis Agent<br/>Processes data]
    Supervisor --> Worker3[Report Agent<br/>Generates output]

    Worker1 --> Supervisor
    Worker2 --> Supervisor
    Worker3 --> Supervisor

    Supervisor --> Result[Final Result<br/>to User]

    style Supervisor fill:#E74C3C,stroke:#333,stroke-width:2px,color:#fff
    style Worker1 fill:#3498DB,stroke:#333,stroke-width:1px,color:#fff
    style Worker2 fill:#3498DB,stroke:#333,stroke-width:1px,color:#fff
    style Worker3 fill:#3498DB,stroke:#333,stroke-width:1px,color:#fff
```

**Workflow:**
1. Supervisor receives complex task
2. Breaks task into subtasks
3. Assigns subtasks to worker agents
4. Collects results
5. Synthesizes final response

**OSSA Manifest Example (Supervisor):**
```yaml
apiVersion: ossa/v0.2.x
kind: Agent
metadata:
  name: supervisor-agent
spec:
  role: You coordinate research workflows
  workerAgents:
    - name: research-agent
      capabilities: [gather_data, web_search]
    - name: analysis-agent
      capabilities: [analyze_data, statistics]
    - name: report-agent
      capabilities: [generate_report, format_output]
  workflow:
    - step: research
      agent: research-agent
      output: raw_data
    - step: analyze
      agent: analysis-agent
      input: raw_data
      output: insights
    - step: report
      agent: report-agent
      input: insights
      output: final_report
```

---

## Agent Capability Discovery

### Capability-Based Routing

```mermaid
graph LR
    Task[User Task:<br/>Analyze sales data] --> Router[Agent Router]

    Router --> Registry[Query Registry<br/>capability=analytics]

    Registry --> Check1{Check Agent 1<br/>customer-agent}
    Registry --> Check2{Check Agent 2<br/>analytics-agent}
    Registry --> Check3{Check Agent 3<br/>support-agent}

    Check1 -->|No match| X1[Skip]
    Check2 -->|Match!| Select[Select Analytics Agent]
    Check3 -->|No match| X2[Skip]

    Select --> Execute[Execute Task]

    style Registry fill:#4A90E2,stroke:#333,stroke-width:2px,color:#fff
    style Select fill:#2ECC71,stroke:#333,stroke-width:2px,color:#fff
```

**How it works:**
1. Task comes in with required capability (e.g., "analytics")
2. Router queries agent registry
3. Registry scans all OSSA manifests
4. Returns agents with matching capabilities
5. Router selects best agent (by priority, load, etc.)

**OSSA Manifest with Capabilities:**
```yaml
apiVersion: ossa/v0.2.x
kind: Agent
metadata:
  name: analytics-agent
  version: 1.0.0
spec:
  role: You analyze business data
  capabilities:
    - name: analyze_sales_data
      description: Analyze sales trends and metrics
      priority: high
    - name: generate_charts
      description: Create data visualizations
      priority: medium
    - name: forecast_revenue
      description: Predict future revenue
      priority: high
```

---

## Multi-Agent Communication Protocols

### Protocol 1: RESTful Agent Communication

```yaml
# Agent A sends HTTP request to Agent B
POST /api/agents/sales-agent/tasks
Content-Type: application/json
X-OSSA-Agent: customer-agent
X-OSSA-Version: v0.2.2

{
  "task": "create_order",
  "parameters": {
    "customerId": "C123",
    "items": [{"sku": "W001", "quantity": 5}]
  },
  "context": {
    "conversationId": "conv-456",
    "userId": "user-789"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "result": {
    "orderId": "12345",
    "total": 50.00
  },
  "metadata": {
    "agent": "sales-agent",
    "executionTime": 1230
  }
}
```

---

### Protocol 2: Message Queue (Async)

```yaml
# Agent publishes to queue
Message:
  exchange: ossa.agents
  routingKey: order.created
  body:
    event: order_created
    agent: order-agent
    data:
      orderId: "12345"
      customerId: "C123"
    timestamp: "2024-01-15T10:30:00Z"
```

**Consumer (Inventory Agent):**
```yaml
# Subscribes to order.created events
Subscription:
  queue: inventory-updates
  binding:
    exchange: ossa.agents
    routingKey: order.created
  handler: update_inventory
```

---

### Protocol 3: Shared Memory

```python
# Agent A writes to shared memory
shared_memory.set(
    key="task:order-12345",
    value={
        "status": "processing",
        "assignedTo": "inventory-agent",
        "createdBy": "order-agent",
        "data": {...}
    },
    ttl=3600  # 1 hour
)

# Agent B reads from shared memory
task = shared_memory.get("task:order-12345")
# Process task...
shared_memory.update("task:order-12345", {"status": "completed"})
```

---

## Agent Coordination Patterns

### Pattern 1: Pipeline (Sequential)

```mermaid
graph LR
    A[Agent A<br/>Extract Data] --> B[Agent B<br/>Transform Data]
    B --> C[Agent C<br/>Load Data]
    C --> D[Result]

    style A fill:#3498DB,stroke:#333,stroke-width:1px,color:#fff
    style B fill:#3498DB,stroke:#333,stroke-width:1px,color:#fff
    style C fill:#3498DB,stroke:#333,stroke-width:1px,color:#fff
```

**Use case:** ETL workflows, document processing pipelines

---

### Pattern 2: Scatter-Gather (Parallel)

```mermaid
graph TB
    Coordinator[Coordinator Agent]

    Coordinator -->|Scatter| A1[Agent 1]
    Coordinator -->|Scatter| A2[Agent 2]
    Coordinator -->|Scatter| A3[Agent 3]

    A1 -->|Gather| Result[Combined Result]
    A2 -->|Gather| Result
    A3 -->|Gather| Result

    style Coordinator fill:#E74C3C,stroke:#333,stroke-width:2px,color:#fff
```

**Use case:** Research tasks, competitive analysis, multi-source data gathering

---

### Pattern 3: Request-Reply (Synchronous)

```mermaid
sequenceDiagram
    participant A as Agent A
    participant B as Agent B

    A->>B: Request (sync)
    Note over B: Process request
    B-->>A: Reply
    Note over A: Continue with result
```

**Use case:** API calls, database queries, simple delegations

---

### Pattern 4: Publish-Subscribe (Async)

```mermaid
graph TB
    Publisher[Publisher Agent]

    Publisher -->|Publish| Topic[Event Topic<br/>order.created]

    Topic --> Sub1[Subscriber 1<br/>Inventory]
    Topic --> Sub2[Subscriber 2<br/>Analytics]
    Topic --> Sub3[Subscriber 3<br/>Notifications]

    style Publisher fill:#E74C3C,stroke:#333,stroke-width:2px,color:#fff
```

**Use case:** Event-driven systems, real-time updates, loose coupling

---

## Multi-Agent System Example

### E-Commerce Platform with 5 Agents

```mermaid
graph TB
    User[User] --> Frontend[Frontend Agent<br/>Handles UI interactions]

    Frontend --> Customer[Customer Agent<br/>Manages accounts]
    Frontend --> Product[Product Agent<br/>Searches catalog]
    Frontend --> Order[Order Agent<br/>Processes orders]

    Order --> Inventory[Inventory Agent<br/>Manages stock]
    Order --> Payment[Payment Agent<br/>Processes payments]

    Customer --> Analytics[Analytics Agent<br/>Tracks behavior]
    Product --> Analytics
    Order --> Analytics

    subgraph "OSSA Manifests"
        M1[frontend.ossa.yaml]
        M2[customer.ossa.yaml]
        M3[product.ossa.yaml]
        M4[order.ossa.yaml]
        M5[inventory.ossa.yaml]
        M6[payment.ossa.yaml]
        M7[analytics.ossa.yaml]
    end

    Frontend -.-> M1
    Customer -.-> M2
    Product -.-> M3
    Order -.-> M4
    Inventory -.-> M5
    Payment -.-> M6
    Analytics -.-> M7

    style M1 fill:#4A90E2,stroke:#333,stroke-width:1px,color:#fff
    style M2 fill:#4A90E2,stroke:#333,stroke-width:1px,color:#fff
    style M3 fill:#4A90E2,stroke:#333,stroke-width:1px,color:#fff
    style M4 fill:#4A90E2,stroke:#333,stroke-width:1px,color:#fff
    style M5 fill:#4A90E2,stroke:#333,stroke-width:1px,color:#fff
    style M6 fill:#4A90E2,stroke:#333,stroke-width:1px,color:#fff
    style M7 fill:#4A90E2,stroke:#333,stroke-width:1px,color:#fff
```

**Flow:**
1. User interacts with Frontend Agent
2. Frontend Agent delegates to specialized agents (Customer, Product, Order)
3. Order Agent coordinates with Inventory and Payment agents
4. Analytics Agent passively observes all interactions

**Benefits:**
- ✅ Each agent has a single responsibility
- ✅ Agents can be developed/deployed independently
- ✅ Easy to add new agents (e.g., Shipping Agent)
- ✅ Scales horizontally (run multiple instances)

---

## Agent Registry Implementation

### Registry Schema

```yaml
# Agent Registry Entry
agents:
  - id: customer-agent-001
    name: customer-agent
    version: 1.0.0
    manifest: s3://manifests/customer.ossa.yaml
    endpoint: https://api.example.com/agents/customer
    capabilities:
      - handle_inquiries
      - manage_accounts
    status: active
    healthCheck: https://api.example.com/agents/customer/health
    metadata:
      team: customer-experience
      environment: production

  - id: sales-agent-001
    name: sales-agent
    version: 2.1.0
    manifest: s3://manifests/sales.ossa.yaml
    endpoint: https://api.example.com/agents/sales
    capabilities:
      - process_orders
      - generate_quotes
    status: active
    healthCheck: https://api.example.com/agents/sales/health
    metadata:
      team: sales-ops
      environment: production
```

**Registry API:**
```bash
# Discover agents by capability
GET /registry/agents?capability=process_orders

# Get agent manifest
GET /registry/agents/sales-agent-001/manifest

# Register new agent
POST /registry/agents
Body: { name, version, manifest, endpoint, capabilities }

# Update agent status
PATCH /registry/agents/sales-agent-001
Body: { status: "maintenance" }
```

---

## Security in Multi-Agent Systems

### Agent Authentication

```yaml
# OSSA Manifest with Auth
apiVersion: ossa/v0.2.x
kind: Agent
metadata:
  name: secure-agent
spec:
  security:
    authentication:
      type: jwt
      issuer: https://auth.example.com
      audience: ossa-agents
    authorization:
      allowedAgents:
        - customer-agent
        - sales-agent
      deniedAgents:
        - untrusted-agent
    encryption:
      inTransit: tls1.3
      atRest: aes256
```

### Message Signing

```python
# Agent A signs message to Agent B
message = {
    "task": "create_order",
    "data": {...}
}

signature = sign_message(message, private_key)

request = {
    "message": message,
    "signature": signature,
    "agent": "customer-agent",
    "timestamp": "2024-01-15T10:30:00Z"
}

# Agent B verifies signature
if verify_signature(request, public_key):
    process_message(request["message"])
else:
    raise AuthenticationError("Invalid signature")
```

---

## Monitoring Multi-Agent Systems

### Observability Dashboard

```mermaid
graph TB
    subgraph "Agents"
        A1[Customer Agent]
        A2[Sales Agent]
        A3[Support Agent]
    end

    subgraph "Observability Layer"
        Metrics[Metrics Collector<br/>Prometheus]
        Logs[Log Aggregator<br/>Loki]
        Traces[Trace Collector<br/>Jaeger]
    end

    subgraph "Visualization"
        Grafana[Grafana Dashboard]
    end

    A1 --> Metrics
    A2 --> Metrics
    A3 --> Metrics

    A1 --> Logs
    A2 --> Logs
    A3 --> Logs

    A1 --> Traces
    A2 --> Traces
    A3 --> Traces

    Metrics --> Grafana
    Logs --> Grafana
    Traces --> Grafana
```

**Key Metrics:**
- Agent response times
- Inter-agent communication latency
- Task delegation counts
- Error rates per agent
- Resource utilization

---

## Key Takeaways

### What OSSA Enables
- ✅ **Agent Discovery**: Find agents by capability
- ✅ **Standard Communication**: Common protocols via manifests
- ✅ **Loose Coupling**: Agents don't need to know implementation details
- ✅ **Scalability**: Add/remove agents without system changes
- ✅ **Portability**: Move agents between environments

### Best Practices
1. **Single Responsibility**: Each agent handles one domain
2. **Capability-Driven**: Define clear capabilities in manifests
3. **Event-Driven**: Use async messaging for loose coupling
4. **Health Checks**: Monitor agent availability
5. **Versioning**: Version manifests for backward compatibility

---

## Related Documentation

- [Execution Flow](execution-flow) - How individual agents process requests
- [Stack Integration](stack-integration) - Where multi-agent systems fit
- [Ecosystem Overview](/docs/ecosystem/overview) - Real-world patterns
- [Specification](/docs/specification) - OSSA spec details

---

**Next Steps**: Explore [Ecosystem Overview](/docs/ecosystem/overview) for real-world multi-agent examples
