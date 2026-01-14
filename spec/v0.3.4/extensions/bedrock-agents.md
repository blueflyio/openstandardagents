# Amazon Bedrock Agents Extension for OSSA v0.3.4

**Version:** 0.3.4
**Status:** Stable
**Last Updated:** 2025-12-31

## Overview

The Amazon Bedrock Agents extension enables bidirectional mapping between OSSA manifests and AWS Bedrock Agents. This extension supports:

- **Agent Runtime**: Bedrock Agents managed agent service
- **Action Groups**: Lambda-backed functions mapped to OSSA capabilities
- **Knowledge Bases**: RAG integration via Bedrock Knowledge Bases
- **Guardrails**: Safety configuration via Bedrock Guardrails
- **Foundation Models**: Claude, Titan, and other Bedrock-hosted models
- **Session Management**: Stateful conversations with session attributes
- **Tracing**: Observability via AWS X-Ray and CloudWatch

## Extension Schema

```yaml
extensions:
  bedrock:
    type: object
    description: "Amazon Bedrock Agents extension for OSSA manifests"
    required:
      - foundation_model
    properties:
      agent_id:
        type: string
        pattern: "^[A-Z0-9]{10}$"
        description: "Bedrock Agent ID (10-character alphanumeric)"
        examples:
          - "ABCD123456"

      agent_alias_id:
        type: string
        pattern: "^[A-Z0-9]{10}$"
        description: "Agent alias ID for versioned deployments"
        examples:
          - "TSTALIASID"

      agent_version:
        type: string
        description: "Agent version (DRAFT or numeric)"
        default: "DRAFT"
        examples:
          - "DRAFT"
          - "1"
          - "2"

      foundation_model:
        type: object
        required:
          - model_id
        properties:
          model_id:
            type: string
            description: "Bedrock foundation model identifier"
            enum:
              - anthropic.claude-3-5-sonnet-20241022-v2:0
              - anthropic.claude-sonnet-4-20250514-v1:0
              - anthropic.claude-opus-4-20250514-v1:0
              - anthropic.claude-3-haiku-20240307-v1:0
              - anthropic.claude-instant-v1
              - amazon.titan-text-express-v1
              - amazon.titan-text-premier-v1:0
              - meta.llama3-1-70b-instruct-v1:0
              - meta.llama3-1-405b-instruct-v1:0
              - cohere.command-r-plus-v1:0
              - mistral.mistral-large-2407-v1:0
            examples:
              - "anthropic.claude-sonnet-4-20250514-v1:0"

          inference_profile_arn:
            type: string
            pattern: "^arn:aws:bedrock:[a-z0-9-]+:[0-9]+:inference-profile/.*$"
            description: "Cross-region inference profile ARN for high availability"

          inference_config:
            type: object
            properties:
              max_tokens:
                type: integer
                minimum: 1
                maximum: 8192
                default: 4096
              temperature:
                type: number
                minimum: 0
                maximum: 1
                default: 0.7
              top_p:
                type: number
                minimum: 0
                maximum: 1
                default: 0.9
              stop_sequences:
                type: array
                items:
                  type: string
                maxItems: 4

      action_groups:
        type: array
        description: "Action groups mapping to OSSA capabilities"
        items:
          type: object
          required:
            - name
            - executor
          properties:
            name:
              type: string
              pattern: "^[a-zA-Z][a-zA-Z0-9_-]{0,99}$"
              description: "Action group name"

            description:
              type: string
              maxLength: 200
              description: "Action group description"

            executor:
              type: object
              description: "Lambda or return-control executor"
              properties:
                type:
                  type: string
                  enum:
                    - lambda
                    - return_control
                    - custom_control
                  default: lambda

                lambda_arn:
                  type: string
                  pattern: "^arn:aws:lambda:[a-z0-9-]+:[0-9]+:function:.*$"
                  description: "Lambda function ARN"

                custom_control:
                  type: string
                  enum:
                    - RETURN_CONTROL
                  description: "Return control to invoking application"

            api_schema:
              type: object
              description: "OpenAPI schema configuration"
              properties:
                source:
                  type: string
                  enum:
                    - s3
                    - inline
                  default: inline

                s3_uri:
                  type: string
                  pattern: "^s3://[a-z0-9][a-z0-9.-]*[a-z0-9]/.*$"
                  description: "S3 URI for OpenAPI spec"

                inline:
                  type: object
                  description: "Inline OpenAPI specification"
                  additionalProperties: true

            function_schema:
              type: object
              description: "Function-based schema (alternative to OpenAPI)"
              properties:
                functions:
                  type: array
                  items:
                    type: object
                    required:
                      - name
                    properties:
                      name:
                        type: string
                      description:
                        type: string
                      parameters:
                        type: object
                        additionalProperties: true
                      require_confirmation:
                        type: string
                        enum:
                          - ENABLED
                          - DISABLED
                        default: DISABLED

            parent_action_group_signature:
              type: string
              enum:
                - AMAZON.UserInput
                - AMAZON.CodeInterpreter
              description: "Built-in action group signature"

            skip_resource_in_use_check:
              type: boolean
              default: false

      knowledge_base_ids:
        type: array
        description: "Bedrock Knowledge Base associations"
        items:
          type: object
          required:
            - knowledge_base_id
          properties:
            knowledge_base_id:
              type: string
              pattern: "^[A-Z0-9]{10}$"
              description: "Knowledge Base ID"

            description:
              type: string
              maxLength: 200
              description: "Description of knowledge base purpose"

            retrieval_config:
              type: object
              properties:
                vector_search:
                  type: object
                  properties:
                    number_of_results:
                      type: integer
                      minimum: 1
                      maximum: 100
                      default: 5

                    override_search_type:
                      type: string
                      enum:
                        - HYBRID
                        - SEMANTIC
                      default: SEMANTIC

                    filter:
                      type: object
                      description: "Metadata filter configuration"
                      additionalProperties: true

      guardrail_config:
        type: object
        description: "Bedrock Guardrails configuration"
        properties:
          guardrail_id:
            type: string
            pattern: "^[a-z0-9]{12}$"
            description: "Guardrail identifier"

          guardrail_version:
            type: string
            description: "Guardrail version (DRAFT or numeric)"
            default: "DRAFT"

          trace:
            type: string
            enum:
              - enabled
              - disabled
            default: enabled
            description: "Enable guardrail trace in responses"

          content_policy:
            type: object
            description: "Content filtering thresholds"
            properties:
              filters:
                type: array
                items:
                  type: object
                  properties:
                    type:
                      type: string
                      enum:
                        - SEXUAL
                        - VIOLENCE
                        - HATE
                        - INSULTS
                        - MISCONDUCT
                        - PROMPT_ATTACK
                    input_strength:
                      type: string
                      enum: [NONE, LOW, MEDIUM, HIGH]
                    output_strength:
                      type: string
                      enum: [NONE, LOW, MEDIUM, HIGH]

          topic_policy:
            type: object
            description: "Denied topics configuration"
            properties:
              topics:
                type: array
                items:
                  type: object
                  properties:
                    name:
                      type: string
                    definition:
                      type: string
                    examples:
                      type: array
                      items:
                        type: string
                    type:
                      type: string
                      enum: [DENY]

          word_policy:
            type: object
            description: "Word and phrase filtering"
            properties:
              words:
                type: array
                items:
                  type: string
              managed_word_lists:
                type: array
                items:
                  type: string
                  enum: [PROFANITY]

          sensitive_info_policy:
            type: object
            description: "PII and regex-based filtering"
            properties:
              pii_entities:
                type: array
                items:
                  type: object
                  properties:
                    type:
                      type: string
                      enum:
                        - ADDRESS
                        - AGE
                        - AWS_ACCESS_KEY
                        - AWS_SECRET_KEY
                        - CA_HEALTH_NUMBER
                        - CA_SOCIAL_INSURANCE_NUMBER
                        - CREDIT_DEBIT_CARD_CVV
                        - CREDIT_DEBIT_CARD_EXPIRY
                        - CREDIT_DEBIT_CARD_NUMBER
                        - DRIVER_ID
                        - EMAIL
                        - INTERNATIONAL_BANK_ACCOUNT_NUMBER
                        - IP_ADDRESS
                        - LICENSE_PLATE
                        - MAC_ADDRESS
                        - NAME
                        - PASSWORD
                        - PHONE
                        - PIN
                        - SWIFT_CODE
                        - UK_NATIONAL_HEALTH_SERVICE_NUMBER
                        - UK_NATIONAL_INSURANCE_NUMBER
                        - UK_UNIQUE_TAXPAYER_REFERENCE_NUMBER
                        - URL
                        - USERNAME
                        - US_BANK_ACCOUNT_NUMBER
                        - US_BANK_ROUTING_NUMBER
                        - US_INDIVIDUAL_TAX_IDENTIFICATION_NUMBER
                        - US_PASSPORT_NUMBER
                        - US_SOCIAL_SECURITY_NUMBER
                        - VEHICLE_IDENTIFICATION_NUMBER
                    action:
                      type: string
                      enum: [BLOCK, ANONYMIZE]

              regex_patterns:
                type: array
                items:
                  type: object
                  properties:
                    name:
                      type: string
                    pattern:
                      type: string
                    action:
                      type: string
                      enum: [BLOCK, ANONYMIZE]

          contextual_grounding:
            type: object
            description: "Hallucination detection thresholds"
            properties:
              grounding_threshold:
                type: number
                minimum: 0
                maximum: 1
                default: 0.7
              relevance_threshold:
                type: number
                minimum: 0
                maximum: 1
                default: 0.7

      session_config:
        type: object
        description: "Session management configuration"
        properties:
          idle_session_ttl_seconds:
            type: integer
            minimum: 60
            maximum: 3600
            default: 600
            description: "Session timeout in seconds"

          session_attributes:
            type: object
            description: "Default session attributes"
            additionalProperties:
              type: string

          prompt_session_attributes:
            type: object
            description: "Prompt-level session attributes"
            additionalProperties:
              type: string

          memory_config:
            type: object
            description: "Memory configuration for multi-turn conversations"
            properties:
              enabled_memory_types:
                type: array
                items:
                  type: string
                  enum:
                    - SESSION_SUMMARY
              storage_days:
                type: integer
                minimum: 1
                maximum: 30
                default: 30

      orchestration:
        type: object
        description: "Agent orchestration configuration"
        properties:
          instruction:
            type: string
            maxLength: 4000
            description: "Agent instruction prompt"

          prompt_override:
            type: object
            description: "Custom prompt templates"
            properties:
              pre_processing:
                type: object
                properties:
                  template:
                    type: string
                  inference_config:
                    type: object
              orchestration:
                type: object
                properties:
                  template:
                    type: string
                  inference_config:
                    type: object
              knowledge_base_response_generation:
                type: object
                properties:
                  template:
                    type: string
                  inference_config:
                    type: object
              post_processing:
                type: object
                properties:
                  template:
                    type: string
                  inference_config:
                    type: object

      observability:
        type: object
        description: "Tracing and monitoring configuration"
        properties:
          trace_enabled:
            type: boolean
            default: true
            description: "Enable agent trace in responses"

          cloudwatch:
            type: object
            properties:
              log_group_arn:
                type: string
                pattern: "^arn:aws:logs:[a-z0-9-]+:[0-9]+:log-group:.*$"
              log_level:
                type: string
                enum:
                  - NONE
                  - ERROR
                  - WARN
                  - INFO
                  - DEBUG
                default: INFO

          xray:
            type: object
            properties:
              enabled:
                type: boolean
                default: true
              sampling_rate:
                type: number
                minimum: 0
                maximum: 1
                default: 0.05

      iam:
        type: object
        description: "IAM configuration for agent execution"
        properties:
          agent_resource_role_arn:
            type: string
            pattern: "^arn:aws:iam::[0-9]+:role/.*$"
            description: "IAM role ARN for agent execution"

          customer_encryption_key_arn:
            type: string
            pattern: "^arn:aws:kms:[a-z0-9-]+:[0-9]+:key/.*$"
            description: "KMS key ARN for encryption at rest"
```

## Bidirectional Mapping Tables

### Agent Kind Mapping

| OSSA Field | Bedrock Agent Field | Direction | Notes |
|------------|---------------------|-----------|-------|
| `metadata.name` | `agentName` | Bidirectional | DNS-1123 format in OSSA |
| `metadata.description` | `description` | Bidirectional | Max 200 chars in Bedrock |
| `metadata.version` | `agentVersion` | OSSA -> Bedrock | Semver in OSSA, numeric in Bedrock |
| `spec.role` | `instruction` | Bidirectional | System prompt |
| `spec.llm.model` | `foundationModel` | Bidirectional | Model ID mapping required |
| `spec.llm.temperature` | `inferenceConfiguration.temperature` | Bidirectional | 0-1 range |
| `spec.llm.max_tokens` | `inferenceConfiguration.maximumLength` | Bidirectional | |
| `spec.tools` | `actionGroups` | Bidirectional | See Action Groups mapping |
| `spec.safety` | `guardrailConfiguration` | Bidirectional | See Guardrails mapping |
| `spec.state` | `memoryConfiguration` | Bidirectional | Session memory |

### Action Groups to Capabilities Mapping

| OSSA Capability | Bedrock Action Group | Mapping Strategy |
|-----------------|---------------------|------------------|
| `spec.tools[].name` | `actionGroupName` | Direct mapping |
| `spec.tools[].description` | `description` | Direct mapping |
| `spec.tools[].parameters` | `functionSchema.functions[].parameters` | JSON Schema conversion |
| `spec.tools[].openapi_ref` | `apiSchema.s3.s3Uri` | S3 reference |
| `spec.tools[].handler` | `actionGroupExecutor.lambda` | Lambda ARN binding |
| `AMAZON.UserInput` | Parent action group | Built-in user input handler |
| `AMAZON.CodeInterpreter` | Parent action group | Built-in code execution |

### Knowledge Bases to Resources Mapping

| OSSA Resource | Bedrock Knowledge Base | Notes |
|---------------|----------------------|-------|
| `spec.resources[].type: rag` | `knowledgeBaseId` | Knowledge Base association |
| `spec.resources[].uri` | S3 data source | Via KB configuration |
| `spec.resources[].query.top_k` | `retrievalConfiguration.vectorSearchConfiguration.numberOfResults` | |
| `spec.resources[].query.filter` | `retrievalConfiguration.vectorSearchConfiguration.filter` | Metadata filtering |

### Guardrails to Safety Mapping

| OSSA Safety | Bedrock Guardrail | Notes |
|-------------|-------------------|-------|
| `spec.safety.content_filters` | `contentPolicyConfig.filtersConfig` | Content moderation |
| `spec.safety.prohibited_topics` | `topicPolicyConfig.topicsConfig` | Denied topics |
| `spec.safety.blocked_terms` | `wordPolicyConfig.wordsConfig` | Word blocking |
| `spec.safety.pii_handling` | `sensitiveInformationPolicyConfig` | PII detection |
| `spec.constraints.require_grounding` | `contextualGroundingPolicyConfig` | Hallucination check |

### Session State Mapping

| OSSA State | Bedrock Session | Notes |
|------------|-----------------|-------|
| `spec.state.persistence` | `memoryConfiguration` | Memory type config |
| `spec.state.ttl_seconds` | `idleSessionTTLInSeconds` | Session timeout |
| `runtime.session_id` | `sessionId` | Unique session identifier |
| `runtime.context` | `sessionState.sessionAttributes` | Key-value state |
| `runtime.prompt_context` | `sessionState.promptSessionAttributes` | Per-prompt context |

### Observability Mapping

| OSSA Observability | Bedrock Trace | Notes |
|--------------------|---------------|-------|
| `spec.observability.tracing.enabled` | `enableTrace` | Enable trace output |
| `spec.observability.tracing.provider: xray` | X-Ray integration | Automatic with Bedrock |
| `spec.observability.logging.level` | CloudWatch log level | Via agent logging config |
| Trace output | `trace.orchestrationTrace` | Reasoning trace |
| Trace output | `trace.preProcessingTrace` | Input preprocessing |
| Trace output | `trace.postProcessingTrace` | Output postprocessing |
| Trace output | `trace.failureTrace` | Error details |
| Trace output | `trace.guardrailTrace` | Guardrail invocations |

## Example Manifests

### Basic Bedrock Agent

```yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: customer-support-agent
  version: 1.0.0
  description: Customer support agent with product knowledge

spec:
  role: |
    You are a helpful customer support agent for Acme Corp.
    Answer questions about products, orders, and returns.
    Be polite and professional at all times.

  llm:
    provider: bedrock
    model: anthropic.claude-sonnet-4-20250514-v1:0
    temperature: 0.7
    max_tokens: 4096

  tools:
    - name: search_orders
      description: Search customer orders by order ID or email
      parameters:
        type: object
        properties:
          order_id:
            type: string
          email:
            type: string
        required: []

    - name: create_return
      description: Create a return request for an order
      parameters:
        type: object
        properties:
          order_id:
            type: string
          reason:
            type: string
            enum: [damaged, wrong_item, not_needed, other]
        required: [order_id, reason]

  safety:
    content_filters:
      - type: HATE
        input_strength: HIGH
        output_strength: HIGH
      - type: INSULTS
        input_strength: MEDIUM
        output_strength: HIGH

  state:
    persistence: session
    ttl_seconds: 600

  observability:
    tracing:
      enabled: true
      provider: xray
    logging:
      level: info

extensions:
  bedrock:
    foundation_model:
      model_id: anthropic.claude-sonnet-4-20250514-v1:0
      inference_config:
        max_tokens: 4096
        temperature: 0.7
        top_p: 0.9

    action_groups:
      - name: OrderManagement
        description: Manage customer orders and returns
        executor:
          type: lambda
          lambda_arn: arn:aws:lambda:us-east-1:123456789012:function:order-management

        function_schema:
          functions:
            - name: search_orders
              description: Search customer orders
              parameters:
                type: object
                properties:
                  order_id:
                    type: string
                    description: Order ID to search
                  email:
                    type: string
                    description: Customer email
              require_confirmation: DISABLED

            - name: create_return
              description: Create return request
              parameters:
                type: object
                properties:
                  order_id:
                    type: string
                  reason:
                    type: string
                required:
                  - order_id
                  - reason
              require_confirmation: ENABLED

    knowledge_base_ids:
      - knowledge_base_id: KBABCD1234
        description: Product catalog and FAQ
        retrieval_config:
          vector_search:
            number_of_results: 5
            override_search_type: HYBRID

    guardrail_config:
      guardrail_id: abc123def456
      guardrail_version: "1"
      trace: enabled
      content_policy:
        filters:
          - type: HATE
            input_strength: HIGH
            output_strength: HIGH
          - type: INSULTS
            input_strength: MEDIUM
            output_strength: HIGH

    session_config:
      idle_session_ttl_seconds: 600
      memory_config:
        enabled_memory_types:
          - SESSION_SUMMARY
        storage_days: 7

    observability:
      trace_enabled: true
      cloudwatch:
        log_group_arn: arn:aws:logs:us-east-1:123456789012:log-group:/aws/bedrock/agents/customer-support
        log_level: INFO
      xray:
        enabled: true
        sampling_rate: 0.1

    iam:
      agent_resource_role_arn: arn:aws:iam::123456789012:role/BedrockAgentRole
```

### RAG-Enabled Research Agent

```yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: research-assistant
  version: 1.0.0
  description: Research assistant with access to document knowledge base

spec:
  role: |
    You are a research assistant that helps users find and synthesize
    information from internal documents and research papers.
    Always cite sources when providing information.

  llm:
    provider: bedrock
    model: anthropic.claude-opus-4-20250514-v1:0
    temperature: 0.3
    max_tokens: 8192

  resources:
    - name: research_documents
      type: rag
      description: Internal research documents and papers
      query:
        top_k: 10
        threshold: 0.7

  constraints:
    require_grounding: true
    max_iterations: 5
    timeout_seconds: 120

extensions:
  bedrock:
    foundation_model:
      model_id: anthropic.claude-opus-4-20250514-v1:0
      inference_profile_arn: arn:aws:bedrock:us-east-1:123456789012:inference-profile/research-profile
      inference_config:
        max_tokens: 8192
        temperature: 0.3

    knowledge_base_ids:
      - knowledge_base_id: KBRESEARCH1
        description: Research papers and internal documents
        retrieval_config:
          vector_search:
            number_of_results: 10
            override_search_type: HYBRID
            filter:
              andAll:
                - equals:
                    key: status
                    value: published

    guardrail_config:
      guardrail_id: research12345
      contextual_grounding:
        grounding_threshold: 0.7
        relevance_threshold: 0.8

    action_groups:
      - name: UserInput
        parent_action_group_signature: AMAZON.UserInput

    orchestration:
      instruction: |
        You are a research assistant. When answering questions:
        1. Search the knowledge base for relevant documents
        2. Synthesize information from multiple sources
        3. Always cite the source documents
        4. If information is not found, clearly state that
```

### Code Generation Agent with Interpreter

```yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: code-assistant
  version: 1.0.0
  description: Code generation and execution agent

spec:
  role: |
    You are a coding assistant that can write, explain, and execute code.
    Support Python, JavaScript, and SQL queries.

  llm:
    provider: bedrock
    model: anthropic.claude-sonnet-4-20250514-v1:0
    temperature: 0.2
    max_tokens: 4096

  tools:
    - name: execute_code
      type: code_interpreter
      description: Execute Python code in a sandboxed environment

extensions:
  bedrock:
    foundation_model:
      model_id: anthropic.claude-sonnet-4-20250514-v1:0
      inference_config:
        temperature: 0.2
        max_tokens: 4096

    action_groups:
      - name: CodeInterpreter
        parent_action_group_signature: AMAZON.CodeInterpreter

      - name: DatabaseQueries
        description: Execute SQL queries on approved databases
        executor:
          type: lambda
          lambda_arn: arn:aws:lambda:us-east-1:123456789012:function:sql-executor

        api_schema:
          source: s3
          s3_uri: s3://my-bucket/openapi/database-api.yaml

    guardrail_config:
      guardrail_id: code123guard
      sensitive_info_policy:
        pii_entities:
          - type: AWS_ACCESS_KEY
            action: BLOCK
          - type: AWS_SECRET_KEY
            action: BLOCK
          - type: PASSWORD
            action: BLOCK
        regex_patterns:
          - name: API_KEY_PATTERN
            pattern: "(?i)api[_-]?key['\"]?\\s*[:=]\\s*['\"]?[a-zA-Z0-9]{20,}"
            action: BLOCK
```

### Multi-Agent Supervisor with Return Control

```yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: workflow-supervisor
  version: 1.0.0
  description: Supervisor agent that orchestrates sub-agents

spec:
  type: supervisor
  role: |
    You are a workflow supervisor that coordinates multiple specialized agents.
    Delegate tasks to appropriate agents and synthesize their outputs.

  llm:
    provider: bedrock
    model: anthropic.claude-sonnet-4-20250514-v1:0

  access:
    tier: tier_3_write_elevated
    permissions:
      - execute_commands
      - modify_configs

  delegation:
    enabled: true
    allowed_tiers:
      - tier_1_read
      - tier_2_write_limited
    allowed_operations:
      - analyze
      - generate
      - validate

extensions:
  bedrock:
    foundation_model:
      model_id: anthropic.claude-sonnet-4-20250514-v1:0

    action_groups:
      - name: AgentOrchestration
        description: Delegate tasks to specialized agents
        executor:
          type: return_control
          custom_control: RETURN_CONTROL

        function_schema:
          functions:
            - name: invoke_analyzer
              description: Invoke the code analyzer agent
              parameters:
                type: object
                properties:
                  code_path:
                    type: string
                  analysis_type:
                    type: string
                    enum: [security, performance, quality]
                required: [code_path, analysis_type]

            - name: invoke_generator
              description: Invoke the code generator agent
              parameters:
                type: object
                properties:
                  specification:
                    type: string
                  language:
                    type: string
                required: [specification, language]

    session_config:
      idle_session_ttl_seconds: 1800
      memory_config:
        enabled_memory_types:
          - SESSION_SUMMARY
        storage_days: 30
```

## OpenAPI Integration

Bedrock Agents support OpenAPI 3.0 schemas for action group definitions. OSSA tools with OpenAPI references can be directly mapped:

### OSSA Tool with OpenAPI Reference

```yaml
spec:
  tools:
    - name: order_api
      description: Order management API
      openapi_ref: s3://my-bucket/openapi/orders-v1.yaml
```

### Equivalent Bedrock Action Group

```yaml
extensions:
  bedrock:
    action_groups:
      - name: OrderAPI
        description: Order management API
        executor:
          type: lambda
          lambda_arn: arn:aws:lambda:us-east-1:123456789012:function:order-api
        api_schema:
          source: s3
          s3_uri: s3://my-bucket/openapi/orders-v1.yaml
```

### Inline OpenAPI Schema

```yaml
extensions:
  bedrock:
    action_groups:
      - name: ProductSearch
        description: Search products
        executor:
          type: lambda
          lambda_arn: arn:aws:lambda:us-east-1:123456789012:function:product-search
        api_schema:
          source: inline
          inline:
            openapi: "3.0.0"
            info:
              title: Product Search API
              version: "1.0"
            paths:
              /search:
                post:
                  operationId: searchProducts
                  description: Search products by criteria
                  requestBody:
                    required: true
                    content:
                      application/json:
                        schema:
                          type: object
                          properties:
                            query:
                              type: string
                            category:
                              type: string
                            max_price:
                              type: number
                  responses:
                    "200":
                      description: Search results
                      content:
                        application/json:
                          schema:
                            type: array
                            items:
                              $ref: "#/components/schemas/Product"
            components:
              schemas:
                Product:
                  type: object
                  properties:
                    id:
                      type: string
                    name:
                      type: string
                    price:
                      type: number
```

## Zod Validation Schema

For TypeScript/JavaScript applications, use the following Zod schema for validation:

```typescript
import { z } from 'zod';

export const BedrockFoundationModelSchema = z.object({
  model_id: z.enum([
    'anthropic.claude-3-5-sonnet-20241022-v2:0',
    'anthropic.claude-sonnet-4-20250514-v1:0',
    'anthropic.claude-opus-4-20250514-v1:0',
    'anthropic.claude-3-haiku-20240307-v1:0',
    'anthropic.claude-instant-v1',
    'amazon.titan-text-express-v1',
    'amazon.titan-text-premier-v1:0',
    'meta.llama3-1-70b-instruct-v1:0',
    'meta.llama3-1-405b-instruct-v1:0',
    'cohere.command-r-plus-v1:0',
    'mistral.mistral-large-2407-v1:0',
  ]),
  inference_profile_arn: z.string()
    .regex(/^arn:aws:bedrock:[a-z0-9-]+:[0-9]+:inference-profile\/.*$/)
    .optional(),
  inference_config: z.object({
    max_tokens: z.number().min(1).max(8192).default(4096),
    temperature: z.number().min(0).max(1).default(0.7),
    top_p: z.number().min(0).max(1).default(0.9),
    stop_sequences: z.array(z.string()).max(4).optional(),
  }).optional(),
});

export const BedrockActionGroupSchema = z.object({
  name: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,99}$/),
  description: z.string().max(200).optional(),
  executor: z.object({
    type: z.enum(['lambda', 'return_control', 'custom_control']).default('lambda'),
    lambda_arn: z.string()
      .regex(/^arn:aws:lambda:[a-z0-9-]+:[0-9]+:function:.*$/)
      .optional(),
    custom_control: z.enum(['RETURN_CONTROL']).optional(),
  }),
  api_schema: z.object({
    source: z.enum(['s3', 'inline']).default('inline'),
    s3_uri: z.string()
      .regex(/^s3:\/\/[a-z0-9][a-z0-9.-]*[a-z0-9]\/.*$/)
      .optional(),
    inline: z.record(z.unknown()).optional(),
  }).optional(),
  function_schema: z.object({
    functions: z.array(z.object({
      name: z.string(),
      description: z.string().optional(),
      parameters: z.record(z.unknown()).optional(),
      require_confirmation: z.enum(['ENABLED', 'DISABLED']).default('DISABLED'),
    })),
  }).optional(),
  parent_action_group_signature: z.enum([
    'AMAZON.UserInput',
    'AMAZON.CodeInterpreter',
  ]).optional(),
  skip_resource_in_use_check: z.boolean().default(false),
});

export const BedrockKnowledgeBaseSchema = z.object({
  knowledge_base_id: z.string().regex(/^[A-Z0-9]{10}$/),
  description: z.string().max(200).optional(),
  retrieval_config: z.object({
    vector_search: z.object({
      number_of_results: z.number().min(1).max(100).default(5),
      override_search_type: z.enum(['HYBRID', 'SEMANTIC']).default('SEMANTIC'),
      filter: z.record(z.unknown()).optional(),
    }).optional(),
  }).optional(),
});

export const BedrockGuardrailSchema = z.object({
  guardrail_id: z.string().regex(/^[a-z0-9]{12}$/),
  guardrail_version: z.string().default('DRAFT'),
  trace: z.enum(['enabled', 'disabled']).default('enabled'),
  content_policy: z.object({
    filters: z.array(z.object({
      type: z.enum(['SEXUAL', 'VIOLENCE', 'HATE', 'INSULTS', 'MISCONDUCT', 'PROMPT_ATTACK']),
      input_strength: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH']),
      output_strength: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH']),
    })),
  }).optional(),
  topic_policy: z.object({
    topics: z.array(z.object({
      name: z.string(),
      definition: z.string(),
      examples: z.array(z.string()).optional(),
      type: z.literal('DENY'),
    })),
  }).optional(),
  word_policy: z.object({
    words: z.array(z.string()).optional(),
    managed_word_lists: z.array(z.enum(['PROFANITY'])).optional(),
  }).optional(),
  sensitive_info_policy: z.object({
    pii_entities: z.array(z.object({
      type: z.string(),
      action: z.enum(['BLOCK', 'ANONYMIZE']),
    })).optional(),
    regex_patterns: z.array(z.object({
      name: z.string(),
      pattern: z.string(),
      action: z.enum(['BLOCK', 'ANONYMIZE']),
    })).optional(),
  }).optional(),
  contextual_grounding: z.object({
    grounding_threshold: z.number().min(0).max(1).default(0.7),
    relevance_threshold: z.number().min(0).max(1).default(0.7),
  }).optional(),
});

export const BedrockSessionConfigSchema = z.object({
  idle_session_ttl_seconds: z.number().min(60).max(3600).default(600),
  session_attributes: z.record(z.string()).optional(),
  prompt_session_attributes: z.record(z.string()).optional(),
  memory_config: z.object({
    enabled_memory_types: z.array(z.enum(['SESSION_SUMMARY'])),
    storage_days: z.number().min(1).max(30).default(30),
  }).optional(),
});

export const BedrockObservabilitySchema = z.object({
  trace_enabled: z.boolean().default(true),
  cloudwatch: z.object({
    log_group_arn: z.string()
      .regex(/^arn:aws:logs:[a-z0-9-]+:[0-9]+:log-group:.*$/)
      .optional(),
    log_level: z.enum(['NONE', 'ERROR', 'WARN', 'INFO', 'DEBUG']).default('INFO'),
  }).optional(),
  xray: z.object({
    enabled: z.boolean().default(true),
    sampling_rate: z.number().min(0).max(1).default(0.05),
  }).optional(),
});

export const BedrockAgentsExtensionSchema = z.object({
  agent_id: z.string().regex(/^[A-Z0-9]{10}$/).optional(),
  agent_alias_id: z.string().regex(/^[A-Z0-9]{10}$/).optional(),
  agent_version: z.string().default('DRAFT'),
  foundation_model: BedrockFoundationModelSchema,
  action_groups: z.array(BedrockActionGroupSchema).optional(),
  knowledge_base_ids: z.array(BedrockKnowledgeBaseSchema).optional(),
  guardrail_config: BedrockGuardrailSchema.optional(),
  session_config: BedrockSessionConfigSchema.optional(),
  orchestration: z.object({
    instruction: z.string().max(4000).optional(),
    prompt_override: z.record(z.object({
      template: z.string().optional(),
      inference_config: z.record(z.unknown()).optional(),
    })).optional(),
  }).optional(),
  observability: BedrockObservabilitySchema.optional(),
  iam: z.object({
    agent_resource_role_arn: z.string()
      .regex(/^arn:aws:iam::[0-9]+:role\/.*$/)
      .optional(),
    customer_encryption_key_arn: z.string()
      .regex(/^arn:aws:kms:[a-z0-9-]+:[0-9]+:key\/.*$/)
      .optional(),
  }).optional(),
});
```

## CRUD Operations

### Create Agent from OSSA Manifest

```typescript
import { BedrockAgentClient, CreateAgentCommand } from '@aws-sdk/client-bedrock-agent';
import { OSSAManifest, BedrockAgentsExtension } from './types';

async function createAgentFromOSSA(manifest: OSSAManifest): Promise<string> {
  const client = new BedrockAgentClient({ region: 'us-east-1' });
  const bedrock = manifest.extensions?.bedrock as BedrockAgentsExtension;

  const command = new CreateAgentCommand({
    agentName: manifest.metadata.name,
    description: manifest.metadata.description,
    instruction: manifest.spec.role || bedrock?.orchestration?.instruction,
    foundationModel: bedrock?.foundation_model?.model_id,
    agentResourceRoleArn: bedrock?.iam?.agent_resource_role_arn,
    idleSessionTTLInSeconds: bedrock?.session_config?.idle_session_ttl_seconds,
    customerEncryptionKeyArn: bedrock?.iam?.customer_encryption_key_arn,
    guardrailConfiguration: bedrock?.guardrail_config ? {
      guardrailIdentifier: bedrock.guardrail_config.guardrail_id,
      guardrailVersion: bedrock.guardrail_config.guardrail_version,
    } : undefined,
    memoryConfiguration: bedrock?.session_config?.memory_config ? {
      enabledMemoryTypes: bedrock.session_config.memory_config.enabled_memory_types,
      storageDays: bedrock.session_config.memory_config.storage_days,
    } : undefined,
  });

  const response = await client.send(command);
  return response.agent!.agentId!;
}
```

### Export Bedrock Agent to OSSA Manifest

```typescript
import { BedrockAgentClient, GetAgentCommand } from '@aws-sdk/client-bedrock-agent';

async function exportAgentToOSSA(agentId: string): Promise<OSSAManifest> {
  const client = new BedrockAgentClient({ region: 'us-east-1' });

  const { agent } = await client.send(new GetAgentCommand({ agentId }));

  return {
    apiVersion: 'ossa/v0.3.4',
    kind: 'Agent',
    metadata: {
      name: agent!.agentName!.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      version: `${agent!.agentVersion}.0.0`,
      description: agent!.description,
    },
    spec: {
      role: agent!.instruction,
      llm: {
        provider: 'bedrock',
        model: agent!.foundationModel,
      },
    },
    extensions: {
      bedrock: {
        agent_id: agent!.agentId,
        agent_version: agent!.agentVersion,
        foundation_model: {
          model_id: agent!.foundationModel!,
        },
        session_config: {
          idle_session_ttl_seconds: agent!.idleSessionTTLInSeconds,
        },
      },
    },
  };
}
```

## Related

- [Amazon Bedrock Agents Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html)
- [Bedrock Agents API Reference](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_agent_CreateAgent.html)
- [Bedrock Knowledge Bases](https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html)
- [Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
- [OSSA Manifest Schema](../ossa-0.3.4.schema.json)
- [MCP Extension](../../extensions/manifest-extensions.md)
