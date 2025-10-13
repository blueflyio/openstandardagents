# OSSA Appendices & Reference Materials

## Appendix A: Glossary and Taxonomies

### Core Terminology

#### Agent Types
- **Worker Agent**: Task-executing agents that perform specific operations (API calls, computations, transformations)
- **Governor Agent**: Orchestration agents managing DAGs, scheduling, and resource allocation
- **Critic Agent**: Quality assurance agents performing validation, compliance checking, and result verification
- **Judge Agent**: Arbitration agents handling conflict resolution and decision making between alternatives
- **Observer Agent**: Monitoring agents collecting metrics, analyzing performance, and detecting anomalies

#### Architecture Terms
- **OSSA**: Open Standards Scalable Agents - the specification and reference implementation
- **UADP**: Universal Agent Discovery Protocol - standardized capability-based agent discovery
- **MCP**: Model Context Protocol - specification for LLM tool integration
- **DAG**: Directed Acyclic Graph - workflow execution model
- **CQRS**: Command Query Responsibility Segregation - architectural pattern for state management
- **Event Sourcing**: Data persistence pattern storing state changes as events

#### Operational Terms
- **Agent Workspace**: Global orchestration environment (.agent-workspace/)
- **Agent Registry**: Centralized catalog of available agents and their capabilities
- **Capability Declaration**: Formal specification of what an agent can do
- **Conformance Tier**: Agent compliance level (Core, Governed, Advanced)
- **Task Queue**: Priority-based task scheduling and distribution system
- **Workflow Orchestration**: Automated execution of multi-step agent processes

#### Compliance Terms
- **ISO 42001**: International standard for AI management systems
- **NIST AI RMF**: National Institute of Standards and Technology AI Risk Management Framework
- **FedRAMP**: Federal Risk and Authorization Management Program
- **EU AI Act**: European Union legislation regulating AI systems
- **Zero Trust**: Security model requiring verification for every system access

### Agent Capability Taxonomy

```yaml
# Standard capability categories
capabilities:
  data_processing:
    - text-processing
    - data-transformation
    - file-manipulation
    - format-conversion
    - validation
    
  communication:
    - api-integration
    - message-handling
    - protocol-translation
    - webhook-management
    - notification-dispatch
    
  analysis:
    - sentiment-analysis
    - pattern-recognition
    - statistical-analysis
    - performance-monitoring
    - anomaly-detection
    
  content_management:
    - content-creation
    - content-modification
    - metadata-management
    - version-control
    - publishing
    
  orchestration:
    - workflow-management
    - task-scheduling
    - resource-allocation
    - state-management
    - error-handling
    
  security:
    - authentication
    - authorization
    - encryption
    - audit-logging
    - compliance-checking
    
  integration:
    - database-operations
    - cloud-services
    - third-party-apis
    - legacy-systems
    - protocol-bridges
```

## Appendix B: OpenAPI Style Guide and Examples

### OpenAPI 3.1 Best Practices

#### Standard Headers
```yaml
openapi: 3.1.0
info:
  title: OSSA Agent API
  version: 0.1.9-alpha.1
  description: |
    Standard API specification for OSSA-compliant agents.
    
    This API follows OSSA standards for agent interoperability,
    providing standardized endpoints for discovery, execution,
    and monitoring.
  license:
    name: Apache 2.0
    url: https://www.apache.org/licenses/LICENSE-2.0
  contact:
    name: OSSA Support
    email: support@ossa.io
    url: https://ossa.io/support
  x-ossa:
    version: 0.1.9-alpha.1
    conformance_tier: core
    protocols: [mcp, ossa, rest]
    capabilities:
      - text-processing
      - api-integration
```

#### Server Configuration
```yaml
servers:
  - url: http://localhost:{port}/api/v1
    description: Local development server
    variables:
      port:
        default: '3000'
        description: Agent service port
        enum: ['3000', '3001', '3002', '3003']
  - url: https://agents.{environment}.ossa.io/api/v1
    description: OSSA managed environment
    variables:
      environment:
        default: 'staging'
        enum: ['staging', 'production']
```

#### Response Schema Standards
```yaml
components:
  schemas:
    SuccessResponse:
      type: object
      required: [success, data, meta]
      properties:
        success:
          type: boolean
          const: true
        data:
          type: object
          description: Response payload
        meta:
          type: object
          properties:
            timestamp:
              type: string
              format: date-time
            request_id:
              type: string
              format: uuid
            version:
              type: string
              example: "0.1.9-alpha.1"
              
    ErrorResponse:
      type: object
      required: [success, error, meta]
      properties:
        success:
          type: boolean
          const: false
        error:
          type: object
          required: [code, message]
          properties:
            code:
              type: string
              enum: [
                "VALIDATION_ERROR",
                "AUTHENTICATION_ERROR", 
                "AUTHORIZATION_ERROR",
                "NOT_FOUND_ERROR",
                "INTERNAL_ERROR",
                "SERVICE_UNAVAILABLE"
              ]
            message:
              type: string
              description: Human-readable error message
            details:
              type: object
              description: Additional error context
        meta:
          $ref: '#/components/schemas/ResponseMeta'
```

#### Endpoint Naming Conventions
```yaml
paths:
  # Resource-based naming
  /agents:
    get:
      operationId: listAgents
      summary: List all agents
      
  /agents/{agentId}:
    get:
      operationId: getAgent
      summary: Get agent by ID
    put:
      operationId: updateAgent
      summary: Update agent
    delete:
      operationId: deleteAgent
      summary: Delete agent
      
  # Action-based naming for operations
  /agents/{agentId}/actions/execute:
    post:
      operationId: executeAgentTask
      summary: Execute task on agent
      
  /agents/{agentId}/actions/validate:
    post:
      operationId: validateAgent
      summary: Validate agent configuration
```

#### Parameter Standards
```yaml
components:
  parameters:
    AgentIdParam:
      name: agentId
      in: path
      required: true
      description: Unique agent identifier
      schema:
        type: string
        pattern: '^[a-z0-9-]+$'
        minLength: 3
        maxLength: 50
      example: "text-processor-v1"
      
    PageParam:
      name: page
      in: query
      description: Page number for pagination
      schema:
        type: integer
        minimum: 1
        default: 1
      example: 1
      
    LimitParam:
      name: limit
      in: query
      description: Number of items per page
      schema:
        type: integer
        minimum: 1
        maximum: 100
        default: 20
      example: 20
```

### Complete Agent API Example

```yaml
openapi: 3.1.0
info:
  title: Text Processing Agent API
  version: 1.0.0
  description: OSSA-compliant text processing agent
  x-ossa:
    conformance_tier: core
    capabilities: [text-processing, sentiment-analysis]

paths:
  /agent/info:
    get:
      operationId: getAgentInfo
      summary: Get agent information
      responses:
        '200':
          description: Agent information
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/SuccessResponse'
                  - type: object
                    properties:
                      data:
                        $ref: '#/components/schemas/AgentInfo'

  /agent/execute:
    post:
      operationId: executeTask
      summary: Execute text processing task
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [text, operation]
              properties:
                text:
                  type: string
                  maxLength: 10000
                  example: "This is sample text for processing."
                operation:
                  type: string
                  enum: [tokenize, sentiment, summarize]
                  example: "sentiment"
                options:
                  type: object
                  properties:
                    language:
                      type: string
                      default: "en"
                    confidence_threshold:
                      type: number
                      minimum: 0
                      maximum: 1
                      default: 0.8
      responses:
        '200':
          description: Task executed successfully
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/SuccessResponse'
                  - type: object
                    properties:
                      data:
                        type: object
                        properties:
                          result:
                            oneOf:
                              - type: array
                                items:
                                  type: string
                                description: Tokens (for tokenize operation)
                              - type: object
                                properties:
                                  sentiment:
                                    type: string
                                    enum: [positive, negative, neutral]
                                  confidence:
                                    type: number
                                description: Sentiment analysis result
                              - type: string
                                description: Summary text
                          processing_time_ms:
                            type: integer
                          confidence:
                            type: number
        '400':
          description: Invalid request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

components:
  schemas:
    AgentInfo:
      type: object
      required: [id, name, version, type, capabilities, status]
      properties:
        id:
          type: string
          example: "text-processor-v1"
        name:
          type: string
          example: "Advanced Text Processor"
        version:
          type: string
          pattern: '^\d+\.\d+\.\d+'
          example: "1.0.0"
        type:
          type: string
          enum: [worker, governor, critic, judge, observer]
          example: "worker"
        capabilities:
          type: array
          items:
            type: string
          example: ["text-processing", "sentiment-analysis"]
        status:
          type: string
          enum: [active, idle, busy, error]
          example: "active"
```

## Appendix C: CI/CD References and Reusable Templates

### GitLab CI Components Library

#### Agent Validation Component
```yaml
# .gitlab/ci/components/agent-validator/template.yml
spec:
  inputs:
    agent_path:
      description: Path to agent directory
      default: "./agents"
    conformance_tier:
      description: Required conformance tier
      default: "core"
    strict_mode:
      description: Enable strict validation
      type: boolean
      default: false

---

validate_agent:
  stage: validate
  image: node:20-alpine
  script:
    - npm install -g @bluefly/open-standards-scalable-agents
    - ossa agent validate $[[ inputs.agent_path ]] --tier=$[[ inputs.conformance_tier ]]
    - |
      if [ "$[[ inputs.strict_mode ]]" = "true" ]; then
        ossa agent validate $[[ inputs.agent_path ]] --strict
      fi
  artifacts:
    reports:
      junit: validation-results.xml
    paths:
      - validation-report.json
    expire_in: 1 week
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
```

#### MCP Testing Component
```yaml
# .gitlab/ci/components/mcp-tester/template.yml
spec:
  inputs:
    mcp_server_path:
      description: Path to MCP server implementation
      default: "./src/mcp/server"
    test_timeout:
      description: Test timeout in seconds
      default: "300"
    compliance_level:
      description: MCP compliance level to test
      default: "full"

---

test_mcp_compliance:
  stage: test
  image: node:20-alpine
  services:
    - name: redis:7-alpine
      alias: redis
  variables:
    REDIS_URL: redis://redis:6379
  before_script:
    - npm ci
    - npm run build
  script:
    - npm run test:mcp --timeout=$[[ inputs.test_timeout ]]
    - ossa mcp test $[[ inputs.mcp_server_path ]] --level=$[[ inputs.compliance_level ]]
  artifacts:
    reports:
      junit: mcp-test-results.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/mcp-coverage.xml
    paths:
      - mcp-compliance-report.json
    expire_in: 1 week
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
```

#### Security Scanner Component
```yaml
# .gitlab/ci/components/security-scanner/template.yml
spec:
  inputs:
    scan_level:
      description: Security scan level
      default: "standard"
    ignore_file:
      description: Path to security ignore file
      default: ".security-ignore"
    fail_on_high:
      description: Fail pipeline on high severity issues
      type: boolean
      default: true

---

security_scan:
  stage: security
  image: 
    name: aquasec/trivy:latest
    entrypoint: [""]
  script:
    - trivy fs --format json --output security-report.json .
    - trivy fs --severity HIGH,CRITICAL --exit-code 1 .
  artifacts:
    reports:
      container_scanning: security-report.json
    paths:
      - security-report.json
    expire_in: 1 week
  allow_failure: 
    exit_codes: 
      - 1
  rules:
    - if: $[[ inputs.fail_on_high ]] == "false"
      allow_failure: true
    - when: always
```

### Complete Pipeline Template
```yaml
# .gitlab/ci/templates/ossa-agent-pipeline.yml
variables:
  NODE_VERSION: "20"
  OSSA_VERSION: "0.1.9-alpha.1"
  AGENT_PATH: "./agents"

stages:
  - validate
  - test
  - build
  - security
  - deploy
  - monitor

include:
  - component: gitlab.com/ossa/ci-components/agent-validator@v1.0.0
    inputs:
      agent_path: $AGENT_PATH
      conformance_tier: "core"
      strict_mode: true
  - component: gitlab.com/ossa/ci-components/mcp-tester@v1.0.0
    inputs:
      compliance_level: "full"
  - component: gitlab.com/ossa/ci-components/security-scanner@v1.0.0
    inputs:
      fail_on_high: true

lint_and_typecheck:
  stage: validate
  image: node:${NODE_VERSION}
  before_script:
    - npm ci
  script:
    - npm run lint
    - npm run typecheck
    - npm run format:check
  artifacts:
    reports:
      codequality: codequality-report.json
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

unit_tests:
  stage: test
  image: node:${NODE_VERSION}
  services:
    - redis:7-alpine
    - postgres:15-alpine
  variables:
    POSTGRES_PASSWORD: testpassword
    DATABASE_URL: postgresql://postgres:testpassword@postgres:5432/testdb
    REDIS_URL: redis://redis:6379
  before_script:
    - npm ci
  script:
    - npm run test:unit
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      junit: test-results.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
    expire_in: 1 week

integration_tests:
  stage: test
  image: node:${NODE_VERSION}
  services:
    - name: docker:dind
      alias: docker
  variables:
    DOCKER_HOST: tcp://dind-0:2375
    DOCKER_TLS_CERTDIR: "/certs"
  before_script:
    - npm ci
    - docker info
  script:
    - npm run test:integration
  artifacts:
    reports:
      junit: integration-test-results.xml
    expire_in: 1 week
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

build_agent:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker tag $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA $CI_REGISTRY_IMAGE:latest
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - docker push $CI_REGISTRY_IMAGE:latest
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

deploy_staging:
  stage: deploy
  image: alpine/helm:latest
  environment:
    name: staging
    url: https://agents-staging.ossa.io
  before_script:
    - helm repo add ossa https://charts.ossa.io
    - helm repo update
  script:
    - |
      helm upgrade --install $CI_PROJECT_NAME-staging ossa/agent \
        --namespace $CI_PROJECT_NAME-staging \
        --create-namespace \
        --set image.repository=$CI_REGISTRY_IMAGE \
        --set image.tag=$CI_COMMIT_SHA \
        --set environment=staging \
        --set ingress.hosts[0].host=agents-staging.ossa.io \
        --timeout 10m \
        --wait
  rules:
    - if: $CI_COMMIT_BRANCH == "develop"

deploy_production:
  stage: deploy
  image: alpine/helm:latest
  environment:
    name: production
    url: https://agents.ossa.io
  before_script:
    - helm repo add ossa https://charts.ossa.io
    - helm repo update
  script:
    - |
      helm upgrade --install $CI_PROJECT_NAME ossa/agent \
        --namespace $CI_PROJECT_NAME \
        --create-namespace \
        --set image.repository=$CI_REGISTRY_IMAGE \
        --set image.tag=$CI_COMMIT_SHA \
        --set environment=production \
        --set ingress.hosts[0].host=agents.ossa.io \
        --timeout 15m \
        --wait
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
      when: manual

monitor_deployment:
  stage: monitor
  image: curlimages/curl:latest
  script:
    - sleep 60  # Wait for deployment to stabilize
    - curl -f $ENVIRONMENT_URL/health/live || exit 1
    - curl -f $ENVIRONMENT_URL/health/ready || exit 1
    - echo "Deployment monitoring complete"
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
    - if: $CI_COMMIT_BRANCH == "develop"
```

## Appendix D: Migration Guides and Data Flows

### Migration from Legacy Agent Systems

#### Assessment Checklist
```yaml
legacy_system_assessment:
  architecture:
    - current_agent_framework: "LangChain|CrewAI|Custom|Other"
    - communication_protocol: "REST|GraphQL|gRPC|Custom"
    - state_management: "Database|File|Memory|Custom"
    - orchestration: "Manual|Workflow Engine|Custom"
    
  integration_points:
    - external_apis: []
    - databases: []
    - message_queues: []
    - authentication_systems: []
    
  compliance_requirements:
    - security_standards: []
    - data_protection: "GDPR|CCPA|HIPAA|None"
    - audit_requirements: "Yes|No"
    - retention_policies: "Yes|No"
    
  migration_priorities:
    - business_critical_agents: []
    - integration_complexity: "High|Medium|Low"
    - downtime_tolerance: "Zero|Minimal|Flexible"
    - timeline_constraints: "Weeks|Months|Flexible"
```

#### Migration Strategy Template
```yaml
migration_plan:
  phase_1_preparation:
    duration: "2-4 weeks"
    tasks:
      - audit_existing_agents
      - map_dependencies
      - define_ossa_architecture
      - setup_development_environment
      - create_agent_templates
    
  phase_2_pilot_migration:
    duration: "2-3 weeks"
    tasks:
      - select_pilot_agents
      - implement_ossa_wrappers
      - setup_parallel_testing
      - validate_functionality
      - measure_performance
    
  phase_3_gradual_rollout:
    duration: "4-8 weeks"
    tasks:
      - migrate_agents_by_priority
      - implement_traffic_splitting
      - monitor_system_health
      - rollback_procedures_ready
      - stakeholder_communication
    
  phase_4_optimization:
    duration: "2-4 weeks"
    tasks:
      - optimize_performance
      - consolidate_redundant_agents
      - implement_advanced_features
      - finalize_documentation
      - team_training
```

#### Data Migration Scripts
```typescript
// Legacy to OSSA agent configuration migration
interface LegacyAgentConfig {
  name: string;
  type: string;
  endpoints: string[];
  capabilities: string[];
  metadata: Record<string, any>;
}

interface OSSAAgentManifest {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    version: string;
  };
  spec: {
    type: AgentType;
    conformance_tier: ConformanceTier;
    capabilities: Capability[];
    protocols: Protocol[];
  };
}

class AgentMigrator {
  async migrateLegacyAgent(
    legacyConfig: LegacyAgentConfig
  ): Promise<OSSAAgentManifest> {
    const agentType = this.mapAgentType(legacyConfig.type);
    const capabilities = this.mapCapabilities(legacyConfig.capabilities);
    
    return {
      apiVersion: 'ossa.io/v0.1.9',
      kind: 'Agent',
      metadata: {
        name: this.sanitizeName(legacyConfig.name),
        version: '1.0.0'
      },
      spec: {
        type: agentType,
        conformance_tier: this.determineConformanceTier(legacyConfig),
        capabilities,
        protocols: this.inferProtocols(legacyConfig.endpoints)
      }
    };
  }
  
  private mapAgentType(legacyType: string): AgentType {
    const mapping: Record<string, AgentType> = {
      'processor': AgentType.WORKER,
      'coordinator': AgentType.GOVERNOR,
      'validator': AgentType.CRITIC,
      'decision_maker': AgentType.JUDGE,
      'monitor': AgentType.OBSERVER
    };
    
    return mapping[legacyType] || AgentType.WORKER;
  }
  
  private mapCapabilities(legacyCapabilities: string[]): Capability[] {
    return legacyCapabilities.map(cap => ({
      name: cap.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      version: '1.0.0',
      inputs: [],
      outputs: []
    }));
  }
}
```

### Data Flow Diagrams

#### Agent Registration Flow
```mermaid
sequenceDiagram
    participant Agent as New Agent
    participant Registry as Agent Registry
    participant Workspace as Workspace Orchestrator
    participant Validator as Agent Validator
    
    Agent->>Registry: Register Request
    Registry->>Validator: Validate Manifest
    Validator->>Registry: Validation Result
    
    alt Validation Success
        Registry->>Workspace: Agent Available
        Workspace->>Registry: Capability Index Update
        Registry->>Agent: Registration Success
    else Validation Failure
        Registry->>Agent: Registration Rejected
    end
```

#### Task Execution Flow
```mermaid
flowchart TD
    A[Task Request] --> B[Task Validator]
    B --> C{Valid Task?}
    C -->|No| D[Return Error]
    C -->|Yes| E[Task Scheduler]
    E --> F[Find Capable Agent]
    F --> G{Agent Available?}
    G -->|No| H[Queue Task]
    G -->|Yes| I[Execute Task]
    I --> J[Monitor Execution]
    J --> K{Task Complete?}
    K -->|No| L{Timeout?}
    L -->|No| J
    L -->|Yes| M[Handle Timeout]
    K -->|Yes| N[Return Result]
    H --> O[Wait for Agent]
    O --> I
```

## Appendix E: Troubleshooting Guide

### Common Issues and Solutions

#### Agent Registration Problems

**Issue**: Agent registration fails with validation errors
```bash
# Symptoms
ERROR: Agent validation failed
ERROR: Missing required field 'conformance_tier'
ERROR: Invalid capability definition
```

**Solution**:
```bash
# 1. Validate manifest syntax
ossa agent validate ./agents/my-agent --verbose

# 2. Check manifest schema
cat ./agents/my-agent/agent.yml | ossa schema validate --type agent

# 3. Fix common issues
# Missing required fields
# Invalid capability names (must be kebab-case)
# Incorrect API version format
# Missing protocol declarations
```

**Issue**: Agent appears registered but not discoverable
```bash
# Symptoms
ossa agent list  # Shows agent
ossa agent discover text-processing  # Doesn't find agent
```

**Solution**:
```bash
# 1. Check capability declarations
ossa agent info my-agent | grep capabilities

# 2. Rebuild capability index
ossa registry rebuild

# 3. Check agent health
ossa agent test my-agent

# 4. Verify workspace configuration
ossa workspace validate
```

#### Task Execution Failures

**Issue**: Tasks timeout or fail to execute
```bash
# Symptoms
ERROR: Task execution timeout after 30000ms
ERROR: No capable agent found for task
ERROR: Agent unreachable
```

**Solution**:
```bash
# 1. Check agent availability
ossa agent list --status active

# 2. Test agent connectivity
curl http://localhost:3001/agent/health

# 3. Check task requirements
ossa task validate my-task.json

# 4. Adjust timeout settings
export OSSA_TASK_TIMEOUT=60000
```

#### Performance Issues

**Issue**: High memory usage or memory leaks
```bash
# Symptoms
WARNING: Memory usage > 80%
ERROR: Out of memory
Agent response times degrading
```

**Solution**:
```bash
# 1. Monitor memory usage
ossa workspace metrics --memory

# 2. Check for memory leaks
node --inspect=0.0.0.0:9229 ./node_modules/.bin/ossa workspace start

# 3. Adjust memory limits
export OSSA_MEMORY_LIMIT=2048
ossa workspace restart

# 4. Enable garbage collection
node --max-old-space-size=2048 --gc-interval=100
```

### Diagnostic Commands

```bash
#!/bin/bash
# OSSA Diagnostic Script

echo "=== OSSA System Diagnostics ==="

# Basic system info
echo "--- System Information ---"
node --version
npm --version
ossa --version

# Workspace status
echo "--- Workspace Status ---"
ossa workspace status
ossa workspace validate

# Agent registry
echo "--- Agent Registry ---"
ossa agent list
ossa registry stats

# Network connectivity
echo "--- Network Tests ---"
curl -s http://localhost:8080/health || echo "Workspace unreachable"
curl -s http://localhost:3001/agent/health || echo "Agent unreachable"

# Resource usage
echo "--- Resource Usage ---"
ps aux | grep ossa
df -h | grep -E "(Used|%)"
free -h

# Recent logs
echo "--- Recent Logs ---"
tail -20 ./logs/ossa.log 2>/dev/null || echo "No logs found"

echo "=== Diagnostics Complete ==="
```

### Debug Configuration

```typescript
// Debug logging configuration
const debugConfig = {
  level: process.env.LOG_LEVEL || 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      level: 'debug'
    }),
    new winston.transports.File({
      filename: 'debug.log',
      level: 'debug',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
};

// Enable detailed tracing
process.env.NODE_ENV = 'development';
process.env.DEBUG = 'ossa:*';
process.env.OSSA_TRACE_REQUESTS = 'true';
process.env.OSSA_VERBOSE_ERRORS = 'true';
```

## Appendix F: References and External Links

### Standards and Specifications
- [Model Context Protocol Specification](https://modelcontextprotocol.io/docs)
- [OpenAPI 3.1 Specification](https://spec.openapis.org/oas/v3.1.0)
- [ISO 42001 AI Management Systems](https://www.iso.org/standard/81230.html)
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- [JSON Schema Specification](https://json-schema.org/)
- [Semantic Versioning](https://semver.org/)

### Framework Integration Guides
- [LangChain Integration Patterns](https://python.langchain.com/docs/integrations)
- [CrewAI Multi-Agent Systems](https://docs.crewai.com/)
- [Kubernetes Operator Development](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/)
- [Helm Chart Best Practices](https://helm.sh/docs/chart_best_practices/)
- [GitLab CI/CD Components](https://docs.gitlab.com/ee/ci/components/)

### Security and Compliance Resources
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [FedRAMP Authorization Process](https://www.fedramp.gov/)
- [EU AI Act Implementation Guide](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai)
- [Zero Trust Architecture (NIST SP 800-207)](https://www.nist.gov/publications/zero-trust-architecture)

### Development Tools and Libraries
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Prometheus Monitoring](https://prometheus.io/docs/)
- [Grafana Dashboards](https://grafana.com/docs/)

### Community and Support
- **OSSA GitHub Repository**: https://github.com/ossa/ossa
- **GitLab Issues**: https://gitlab.com/ossa/ossa/-/issues
- **Documentation**: https://docs.ossa.io
- **Community Forum**: https://community.ossa.io
- **Stack Overflow Tag**: `ossa-agents`

### Professional Services
- **Technical Support**: support@ossa.io
- **Enterprise Consulting**: enterprise@ossa.io
- **Training and Certification**: training@ossa.io
- **Partner Program**: partners@ossa.io

This comprehensive appendix provides all the reference materials, guides, and resources needed for successful OSSA implementation and ongoing maintenance.