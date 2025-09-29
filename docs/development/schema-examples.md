# OSSA v0.1.9-alpha.1 OpenAPI Schemas

## 1. Agent OpenAPI Schema

```yaml
openapi: 3.1.0
info:
  title: OSSA Agent API
  version: 0.1.9-alpha.1
  description: Standard API specification for OSSA-compliant agents
  license:
    name: Apache 2.0
    url: https://www.apache.org/licenses/LICENSE-2.0
  x-ossa:
    version: 0.1.9-alpha.1
    conformance_tier: core
    protocols: [mcp, ossa, rest]

servers:
  - url: http://localhost:{port}/api/v1
    description: Local agent instance
    variables:
      port:
        default: '3000'
        description: Agent port (3000-3999)

paths:
  /agent/health:
    get:
      operationId: getHealth
      summary: Agent health check
      tags: [System]
      responses:
        '200':
          description: Agent is healthy
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthStatus'

  /agent/info:
    get:
      operationId: getAgentInfo
      summary: Get agent information
      tags: [System]
      responses:
        '200':
          description: Agent information
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AgentInfo'

  /agent/capabilities:
    get:
      operationId: getCapabilities
      summary: Get agent capabilities
      tags: [Discovery]
      responses:
        '200':
          description: Agent capabilities
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Capabilities'

  /agent/execute:
    post:
      operationId: executeTask
      summary: Execute agent task
      tags: [Execution]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TaskRequest'
      responses:
        '202':
          description: Task accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TaskResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '503':
          $ref: '#/components/responses/ServiceUnavailable'

  /agent/status/{taskId}:
    get:
      operationId: getTaskStatus
      summary: Get task execution status
      tags: [Execution]
      parameters:
        - name: taskId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Task status
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TaskStatus'

  /agent/discover:
    get:
      operationId: discoverPeers
      summary: Discover peer agents (UADP)
      tags: [Discovery]
      parameters:
        - name: capability
          in: query
          schema:
            type: string
        - name: scope
          in: query
          schema:
            type: string
            enum: [workspace, project, repository]
      responses:
        '200':
          description: Discovered agents
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DiscoveryResponse'

  /agent/register:
    post:
      operationId: registerAgent
      summary: Register with workspace
      tags: [Discovery]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RegistrationRequest'
      responses:
        '201':
          description: Registration successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RegistrationResponse'

  /agent/behaviors:
    get:
      operationId: getBehaviors
      summary: Get agent behaviors
      tags: [Configuration]
      responses:
        '200':
          description: Agent behaviors
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Behavior'

  /agent/handlers:
    get:
      operationId: getHandlers
      summary: Get event handlers
      tags: [Configuration]
      responses:
        '200':
          description: Event handlers
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Handler'

  /agent/training:
    post:
      operationId: submitTrainingData
      summary: Submit training examples
      tags: [Training]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TrainingData'
      responses:
        '201':
          description: Training data accepted

  /agent/metrics:
    get:
      operationId: getMetrics
      summary: Get agent metrics
      tags: [Monitoring]
      responses:
        '200':
          description: Agent metrics
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Metrics'

components:
  schemas:
    AgentInfo:
      type: object
      required: [id, name, version, type, conformance_tier]
      properties:
        id:
          type: string
          pattern: '^[a-z0-9-]+$'
        name:
          type: string
        version:
          type: string
          pattern: '^\d+\.\d+\.\d+(-[a-z0-9-]+)?$'
        type:
          type: string
          enum: [worker, governor, critic, judge, observer]
        conformance_tier:
          type: string
          enum: [core, governed, advanced]
        description:
          type: string
        author:
          type: string
        license:
          type: string
        created:
          type: string
          format: date-time
        updated:
          type: string
          format: date-time

    HealthStatus:
      type: object
      required: [status, timestamp]
      properties:
        status:
          type: string
          enum: [healthy, degraded, unhealthy]
        timestamp:
          type: string
          format: date-time
        uptime:
          type: integer
          description: Uptime in seconds
        version:
          type: string
        ossa_version:
          type: string
        memory_usage:
          type: object
          properties:
            used:
              type: integer
            total:
              type: integer
        active_tasks:
          type: integer

    Capabilities:
      type: object
      required: [primary, protocols]
      properties:
        primary:
          type: array
          items:
            type: string
        secondary:
          type: array
          items:
            type: string
        protocols:
          type: array
          items:
            type: object
            properties:
              name:
                type: string
              version:
                type: string
              features:
                type: array
                items:
                  type: string

    TaskRequest:
      type: object
      required: [type, payload]
      properties:
        id:
          type: string
          format: uuid
        type:
          type: string
        payload:
          type: object
        context:
          type: object
        priority:
          type: integer
          minimum: 1
          maximum: 10
        timeout:
          type: integer
          description: Timeout in milliseconds

    TaskResponse:
      type: object
      required: [task_id, status]
      properties:
        task_id:
          type: string
          format: uuid
        status:
          type: string
          enum: [accepted, rejected, queued]
        estimated_completion:
          type: integer
        queue_position:
          type: integer

    TaskStatus:
      type: object
      required: [task_id, status]
      properties:
        task_id:
          type: string
          format: uuid
        status:
          type: string
          enum: [pending, running, completed, failed, cancelled]
        progress:
          type: integer
          minimum: 0
          maximum: 100
        result:
          type: object
        error:
          type: object
        started_at:
          type: string
          format: date-time
        completed_at:
          type: string
          format: date-time

    DiscoveryResponse:
      type: object
      properties:
        agents:
          type: array
          items:
            type: object
            properties:
              id:
                type: string
              name:
                type: string
              capabilities:
                type: array
                items:
                  type: string
              endpoint:
                type: string
                format: uri
              health:
                type: string
                enum: [healthy, degraded, unknown]

    RegistrationRequest:
      type: object
      required: [agent_id, endpoint, capabilities]
      properties:
        agent_id:
          type: string
        endpoint:
          type: string
          format: uri
        capabilities:
          type: array
          items:
            type: string
        protocols:
          type: array
          items:
            type: string

    RegistrationResponse:
      type: object
      properties:
        registered:
          type: boolean
        workspace_id:
          type: string
        registry_version:
          type: string
        assigned_role:
          type: string

    Behavior:
      type: object
      properties:
        name:
          type: string
        triggers:
          type: array
          items:
            type: object
        actions:
          type: array
          items:
            type: string
        error_handling:
          type: object

    Handler:
      type: object
      properties:
        event:
          type: string
        action:
          type: string
        conditions:
          type: array
          items:
            type: object

    TrainingData:
      type: object
      properties:
        examples:
          type: array
          items:
            type: object
            properties:
              input:
                type: object
              output:
                type: object
              success:
                type: boolean

    Metrics:
      type: object
      properties:
        tasks_executed:
          type: integer
        success_rate:
          type: number
        average_latency:
          type: integer
        error_count:
          type: integer

  responses:
    BadRequest:
      description: Bad request
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: string
              code:
                type: integer

    ServiceUnavailable:
      description: Service unavailable
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: string
              retry_after:
                type: integer
```

## 2. Workspace OpenAPI Schema

```yaml
openapi: 3.1.0
info:
  title: OSSA Workspace API
  version: 0.1.9-alpha.1
  description: Workspace orchestration and management API for OSSA ecosystem
  license:
    name: Apache 2.0
    url: https://www.apache.org/licenses/LICENSE-2.0
  x-ossa:
    version: 0.1.9-alpha.1
    conformance_tier: governed
    role: orchestrator

servers:
  - url: http://localhost:8000/api/v1
    description: Workspace orchestrator

paths:
  /workspace/info:
    get:
      operationId: getWorkspaceInfo
      summary: Get workspace information
      tags: [Workspace]
      responses:
        '200':
          description: Workspace information
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/WorkspaceInfo'

  /workspace/registry:
    get:
      operationId: getRegistry
      summary: Get agent registry
      tags: [Registry]
      parameters:
        - name: scope
          in: query
          schema:
            type: string
            enum: [all, workspace, project, repository]
      responses:
        '200':
          description: Agent registry
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Registry'

  /workspace/agents:
    get:
      operationId: listAgents
      summary: List all agents
      tags: [Registry]
      parameters:
        - name: type
          in: query
          schema:
            type: string
            enum: [worker, governor, critic, judge, observer]
        - name: status
          in: query
          schema:
            type: string
            enum: [active, idle, unhealthy]
        - name: capability
          in: query
          schema:
            type: string
      responses:
        '200':
          description: Agent list
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/AgentSummary'

  /workspace/agents/register:
    post:
      operationId: registerAgent
      summary: Register new agent
      tags: [Registry]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AgentRegistration'
      responses:
        '201':
          description: Agent registered
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RegistrationResult'

  /workspace/orchestrate:
    post:
      operationId: orchestrateWorkflow
      summary: Execute workflow orchestration
      tags: [Orchestration]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/WorkflowRequest'
      responses:
        '202':
          description: Workflow accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/WorkflowResponse'

  /workspace/workflows:
    get:
      operationId: listWorkflows
      summary: List workflows
      tags: [Orchestration]
      parameters:
        - name: status
          in: query
          schema:
            type: string
            enum: [active, completed, failed]
      responses:
        '200':
          description: Workflow list
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/WorkflowSummary'

  /workspace/workflows/{workflowId}:
    get:
      operationId: getWorkflow
      summary: Get workflow details
      tags: [Orchestration]
      parameters:
        - name: workflowId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Workflow details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/WorkflowDetails'

  /workspace/compliance:
    get:
      operationId: getCompliance
      summary: Get compliance status
      tags: [Compliance]
      responses:
        '200':
          description: Compliance status
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ComplianceStatus'

  /workspace/compliance/audit:
    post:
      operationId: runAudit
      summary: Run compliance audit
      tags: [Compliance]
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                scope:
                  type: string
                  enum: [full, agents, workflows, security]
      responses:
        '202':
          description: Audit started
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuditResponse'

  /workspace/metrics:
    get:
      operationId: getMetrics
      summary: Get workspace metrics
      tags: [Monitoring]
      parameters:
        - name: period
          in: query
          schema:
            type: string
            enum: [1h, 6h, 24h, 7d, 30d]
      responses:
        '200':
          description: Workspace metrics
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/WorkspaceMetrics'

  /workspace/health:
    get:
      operationId: getWorkspaceHealth
      summary: Workspace health check
      tags: [Monitoring]
      responses:
        '200':
          description: Workspace health
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/WorkspaceHealth'

  /workspace/memory:
    get:
      operationId: getMemory
      summary: Get workspace memory state
      tags: [State]
      responses:
        '200':
          description: Memory state
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/MemoryState'

  /workspace/memory/checkpoint:
    post:
      operationId: createCheckpoint
      summary: Create memory checkpoint
      tags: [State]
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                description:
                  type: string
      responses:
        '201':
          description: Checkpoint created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Checkpoint'

components:
  schemas:
    WorkspaceInfo:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        version:
          type: string
        ossa_version:
          type: string
        created:
          type: string
          format: date-time
        environment:
          type: string
          enum: [development, staging, production]
        tier:
          type: string
          enum: [core, governed, advanced, enterprise]

    Registry:
      type: object
      properties:
        version:
          type: string
        total_agents:
          type: integer
        by_scope:
          type: object
          properties:
            workspace:
              type: integer
            project:
              type: integer
            repository:
              type: integer
        by_type:
          type: object
          properties:
            worker:
              type: integer
            governor:
              type: integer
            critic:
              type: integer
            judge:
              type: integer
            observer:
              type: integer

    AgentSummary:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        type:
          type: string
        status:
          type: string
        capabilities:
          type: array
          items:
            type: string
        endpoint:
          type: string
          format: uri
        health:
          type: object
          properties:
            status:
              type: string
            last_check:
              type: string
              format: date-time

    AgentRegistration:
      type: object
      required: [agent_id, manifest, endpoint]
      properties:
        agent_id:
          type: string
        manifest:
          type: object
        endpoint:
          type: string
          format: uri
        scope:
          type: string
          enum: [workspace, project, repository]

    RegistrationResult:
      type: object
      properties:
        registered:
          type: boolean
        agent_id:
          type: string
        registry_id:
          type: string
        assigned_scope:
          type: string

    WorkflowRequest:
      type: object
      required: [name, dag]
      properties:
        name:
          type: string
        description:
          type: string
        dag:
          type: object
          properties:
            nodes:
              type: array
              items:
                type: object
                properties:
                  id:
                    type: string
                  type:
                    type: string
                  agent:
                    type: string
                  task:
                    type: object
                  dependencies:
                    type: array
                    items:
                      type: string
        context:
          type: object
        priority:
          type: integer

    WorkflowResponse:
      type: object
      properties:
        workflow_id:
          type: string
          format: uuid
        status:
          type: string
          enum: [accepted, rejected, queued]
        estimated_duration:
          type: integer

    WorkflowSummary:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        status:
          type: string
        started_at:
          type: string
          format: date-time
        completed_at:
          type: string
          format: date-time
        progress:
          type: integer

    WorkflowDetails:
      allOf:
        - $ref: '#/components/schemas/WorkflowSummary'
        - type: object
          properties:
            dag:
              type: object
            execution_log:
              type: array
              items:
                type: object
            metrics:
              type: object

    ComplianceStatus:
      type: object
      properties:
        conformance_level:
          type: string
          enum: [core, governed, advanced]
        last_audit:
          type: string
          format: date-time
        violations:
          type: array
          items:
            type: object
            properties:
              severity:
                type: string
              rule:
                type: string
              agent:
                type: string
              timestamp:
                type: string
                format: date-time
        frameworks:
          type: array
          items:
            type: object
            properties:
              name:
                type: string
              status:
                type: string
              score:
                type: number

    AuditResponse:
      type: object
      properties:
        audit_id:
          type: string
          format: uuid
        status:
          type: string
        estimated_completion:
          type: string
          format: date-time

    WorkspaceMetrics:
      type: object
      properties:
        period:
          type: string
        agents:
          type: object
          properties:
            total:
              type: integer
            active:
              type: integer
            idle:
              type: integer
        workflows:
          type: object
          properties:
            executed:
              type: integer
            succeeded:
              type: integer
            failed:
              type: integer
            average_duration:
              type: integer
        tasks:
          type: object
          properties:
            completed:
              type: integer
            failed:
              type: integer
            average_latency:
              type: integer
        performance:
          type: object
          properties:
            cpu_usage:
              type: number
            memory_usage:
              type: number
            network_io:
              type: object

    WorkspaceHealth:
      type: object
      properties:
        status:
          type: string
          enum: [healthy, degraded, critical]
        components:
          type: object
          properties:
            orchestrator:
              type: string
            registry:
              type: string
            compliance:
              type: string
            monitoring:
              type: string
        issues:
          type: array
          items:
            type: object
            properties:
              component:
                type: string
              severity:
                type: string
              message:
                type: string

    MemoryState:
      type: object
      properties:
        version:
          type: string
        workspace:
          type: object
        agents:
          type: object
        orchestration:
          type: object
        state:
          type: object
        compliance:
          type: object

    Checkpoint:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        timestamp:
          type: string
          format: date-time
        size:
          type: integer
        hash:
          type: string

  securitySchemes:
    ApiKey:
      type: apiKey
      in: header
      name: X-API-Key
    
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - ApiKey: []
  - BearerAuth: []
```

These OpenAPI schemas define the complete API surface for both individual agents and the workspace orchestrator, providing standardized endpoints for discovery, registration, orchestration, compliance, and monitoring in the OSSA ecosystem.