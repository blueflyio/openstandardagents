# Vercel AI SDK Extension for OSSA v0.3.3

## Overview

The `extensions.vercel_ai` schema provides bidirectional mapping between Vercel AI SDK primitives and OSSA manifest structures. This extension enables seamless integration of OSSA agents with Next.js/React applications using the Vercel AI SDK.

**Vercel AI SDK Version**: 3.x+
**OSSA Version**: v0.3.3+

## Schema Definition

```yaml
extensions:
  vercel_ai:
    type: object
    description: "Vercel AI SDK extension for web AI applications"
    properties:
      provider:
        type: object
        description: "LLM provider configuration (maps to OSSA spec.llm)"
        properties:
          name:
            type: string
            enum: [openai, anthropic, google, mistral, groq, azure, amazon-bedrock, cohere, fireworks, custom]
            description: "Provider identifier"

          model:
            type: string
            description: "Model identifier (e.g., gpt-4o, claude-3-5-sonnet)"

          base_url:
            type: string
            format: uri
            description: "Custom API endpoint for OpenAI-compatible providers"

          api_key_env:
            type: string
            pattern: "^[A-Z][A-Z0-9_]*$"
            description: "Environment variable containing API key"

          headers:
            type: object
            additionalProperties:
              type: string
            description: "Custom headers for API requests"

      stream_protocol:
        type: string
        enum: [data, text, sse]
        default: data
        description: "Streaming protocol: data (AI SDK format), text (plain), sse (Server-Sent Events)"

      ui_components:
        type: object
        description: "React component bindings for generative UI"
        properties:
          enabled:
            type: boolean
            default: false
            description: "Enable generative UI with streamUI"

          components:
            type: array
            items:
              type: object
              required: [name, render]
              properties:
                name:
                  type: string
                  description: "Component identifier for tool calls"
                render:
                  type: string
                  description: "React component path (e.g., @/components/ui/Weather)"
                props_schema:
                  type: object
                  description: "JSON Schema for component props"
            description: "Component mappings for streamUI"

          loading_component:
            type: string
            description: "Component to show during generation"

          error_component:
            type: string
            description: "Component to show on errors"

      state_config:
        type: object
        description: "AI state management configuration"
        properties:
          ai_state:
            type: object
            properties:
              schema:
                type: object
                description: "Zod schema for AI state (maps to OSSA spec.state)"
              initial:
                type: object
                description: "Initial AI state values"
              persist:
                type: boolean
                default: false
                description: "Persist AI state across sessions"

          ui_state:
            type: object
            properties:
              schema:
                type: object
                description: "Zod schema for UI state"
              sync_with_ai_state:
                type: boolean
                default: true
                description: "Sync UI state from AI state changes"

          actions:
            type: array
            items:
              type: object
              required: [name, handler]
              properties:
                name:
                  type: string
                  description: "Server action name"
                handler:
                  type: string
                  description: "Server action handler path"
                input_schema:
                  type: object
                  description: "JSON Schema for action input"
            description: "Server Actions for state mutations"

      hooks:
        type: object
        description: "React hook bindings"
        properties:
          use_chat:
            type: object
            description: "useChat hook configuration"
            properties:
              enabled:
                type: boolean
                default: true
              api_endpoint:
                type: string
                default: "/api/chat"
              max_messages:
                type: integer
                description: "Maximum messages to keep in memory"
              initial_messages:
                type: array
                items:
                  type: object
                description: "Initial conversation messages"

          use_completion:
            type: object
            description: "useCompletion hook configuration"
            properties:
              enabled:
                type: boolean
                default: false
              api_endpoint:
                type: string
                default: "/api/completion"
              stream_mode:
                type: string
                enum: [stream, complete]
                default: stream

          use_assistant:
            type: object
            description: "useAssistant hook configuration (OpenAI Assistants API)"
            properties:
              enabled:
                type: boolean
                default: false
              assistant_id:
                type: string
                description: "OpenAI Assistant ID"
              thread_persistence:
                type: string
                enum: [session, database, none]
                default: session

      tool_calling:
        type: object
        description: "Tool calling configuration (maps to OSSA capabilities/tools)"
        properties:
          mode:
            type: string
            enum: [auto, required, none]
            default: auto
            description: "Tool calling mode"

          max_steps:
            type: integer
            minimum: 1
            maximum: 100
            default: 5
            description: "Maximum agentic loop steps"

          tools:
            type: array
            items:
              type: object
              required: [name, description]
              properties:
                name:
                  type: string
                  description: "Tool name"
                description:
                  type: string
                  description: "Tool description for LLM"
                parameters:
                  type: object
                  description: "Zod schema for tool parameters"
                execute:
                  type: string
                  description: "Handler function path"
                confirmation:
                  type: boolean
                  default: false
                  description: "Require human confirmation before execution"
            description: "Tool definitions"

          parallel_tool_calls:
            type: boolean
            default: true
            description: "Allow parallel tool execution"

      output_schema:
        type: object
        description: "Structured output configuration (maps to OSSA spec.output)"
        properties:
          enabled:
            type: boolean
            default: false
            description: "Enable structured output with generateObject/streamObject"

          schema:
            type: object
            description: "Zod schema for structured output"

          mode:
            type: string
            enum: [json, tool, auto]
            default: auto
            description: "Output generation mode"

          partial:
            type: boolean
            default: true
            description: "Allow partial objects during streaming"
```

## Bidirectional Mapping Tables

### Hook to OSSA Kind Mapping

| Vercel AI Hook | OSSA Kind | Description |
|----------------|-----------|-------------|
| `useChat` | `Agent` | Conversational AI with message history |
| `useCompletion` | `Task` | Single-turn text completion |
| `useAssistant` | `Agent` | OpenAI Assistants API integration |
| `streamUI` | `Agent` | Generative UI with component streaming |
| `useActions` | `Workflow` | Server Actions for state mutations |

### OSSA to Vercel AI Mapping

| OSSA Concept | Vercel AI Equivalent | Notes |
|--------------|---------------------|-------|
| `spec.llm.model` | `provider.model` | Direct mapping |
| `spec.llm.provider` | `provider.name` | Provider enum alignment |
| `spec.tools[]` | `tool_calling.tools[]` | Tool definitions |
| `spec.capabilities[]` | `tool_calling.tools[].name` | Abstract to concrete |
| `spec.state` | `state_config.ai_state` | State management |
| `spec.output` | `output_schema.schema` | Structured output |
| `spec.role` | System message | Prompt configuration |
| `spec.messaging` | `hooks.use_chat` | Conversation handling |
| `spec.autonomy.max_iterations` | `tool_calling.max_steps` | Loop control |

### Provider Mapping

| OSSA Provider | Vercel AI Provider | Import |
|---------------|-------------------|--------|
| `openai` | `openai` | `@ai-sdk/openai` |
| `anthropic` | `anthropic` | `@ai-sdk/anthropic` |
| `google` | `google` | `@ai-sdk/google` |
| `mistral` | `mistral` | `@ai-sdk/mistral` |
| `groq` | `groq` | `@ai-sdk/groq` |
| `azure-openai` | `azure` | `@ai-sdk/azure` |
| `aws-bedrock` | `amazon-bedrock` | `@ai-sdk/amazon-bedrock` |
| `cohere` | `cohere` | `@ai-sdk/cohere` |
| `fireworks` | `fireworks` | `@ai-sdk/fireworks` |

### Stream Protocol Mapping

| Vercel AI Protocol | OSSA SSE Event | Usage |
|-------------------|----------------|-------|
| `data` (default) | `message/delta` | AI SDK format with metadata |
| `text` | `message/text` | Plain text streaming |
| `sse` | Native SSE | Server-Sent Events |

## Example Manifests

### 1. Chat Agent with useChat

A conversational agent mapped to the `useChat` hook:

```yaml
apiVersion: ossa/v0.3.3
kind: Agent
metadata:
  name: customer-support-agent
  version: 1.0.0
  description: Customer support chatbot with conversation history

spec:
  role: |
    You are a helpful customer support agent for ACME Corp.
    Help users with product questions, order status, and returns.
    Be friendly, professional, and concise.

  llm:
    provider: anthropic
    model: claude-3-5-sonnet
    temperature: 0.7
    max_tokens: 1024

  tools:
    - name: lookup_order
      description: Look up order status by order ID
      parameters:
        type: object
        properties:
          order_id:
            type: string
            pattern: "^ORD-[0-9]{6}$"
        required: [order_id]

    - name: initiate_return
      description: Start a return process for an order
      parameters:
        type: object
        properties:
          order_id:
            type: string
          reason:
            type: string
            enum: [defective, wrong_item, no_longer_needed, other]
        required: [order_id, reason]

  state:
    type: session
    schema:
      type: object
      properties:
        customer_id:
          type: string
        order_history:
          type: array
          items:
            type: string

extensions:
  vercel_ai:
    provider:
      name: anthropic
      model: claude-3-5-sonnet-20241022
      api_key_env: ANTHROPIC_API_KEY

    stream_protocol: data

    hooks:
      use_chat:
        enabled: true
        api_endpoint: /api/support/chat
        max_messages: 50
        initial_messages:
          - role: assistant
            content: "Hello! I'm your ACME support assistant. How can I help you today?"

    tool_calling:
      mode: auto
      max_steps: 10
      tools:
        - name: lookup_order
          description: Look up order status by order ID
          parameters:
            order_id:
              type: string
              pattern: "^ORD-[0-9]{6}$"
          execute: "@/lib/actions/orders#lookupOrder"
          confirmation: false

        - name: initiate_return
          description: Start a return process for an order
          parameters:
            order_id:
              type: string
            reason:
              type: string
              enum: [defective, wrong_item, no_longer_needed, other]
          execute: "@/lib/actions/returns#initiateReturn"
          confirmation: true

    state_config:
      ai_state:
        schema:
          customer_id: z.string().optional()
          messages: z.array(CoreMessage)
          order_context: z.object().optional()
        persist: true
      ui_state:
        sync_with_ai_state: true
```

### 2. Text Completion Task with useCompletion

A single-turn completion task:

```yaml
apiVersion: ossa/v0.3.3
kind: Task
metadata:
  name: email-generator
  version: 1.0.0
  description: Generate professional email drafts

spec:
  execution:
    type: deterministic
    runtime: node
    entrypoint: "@/lib/tasks/email-generator"
    timeout_seconds: 30

  input:
    type: object
    properties:
      subject:
        type: string
        maxLength: 200
      tone:
        type: string
        enum: [formal, friendly, urgent, apologetic]
      key_points:
        type: array
        items:
          type: string
        maxItems: 5
      recipient_name:
        type: string
    required: [subject, tone, key_points]

  output:
    type: object
    properties:
      email_draft:
        type: string
      word_count:
        type: integer
      estimated_read_time:
        type: string

extensions:
  vercel_ai:
    provider:
      name: openai
      model: gpt-4o
      api_key_env: OPENAI_API_KEY

    stream_protocol: text

    hooks:
      use_completion:
        enabled: true
        api_endpoint: /api/generate/email
        stream_mode: stream

    output_schema:
      enabled: true
      mode: json
      partial: true
      schema:
        email_draft:
          type: string
        word_count:
          type: integer
        estimated_read_time:
          type: string
```

### 3. Generative UI Agent with streamUI

An agent that generates React components:

```yaml
apiVersion: ossa/v0.3.3
kind: Agent
metadata:
  name: data-dashboard-agent
  version: 1.0.0
  description: AI agent that generates interactive data visualizations

spec:
  role: |
    You are a data visualization assistant. When users ask about data,
    use the appropriate tools to fetch data and render visualizations.
    Always explain what the visualization shows.

  llm:
    provider: openai
    model: gpt-4o
    temperature: 0.3

  tools:
    - name: get_sales_data
      description: Fetch sales data for visualization
      parameters:
        type: object
        properties:
          date_range:
            type: object
            properties:
              start:
                type: string
                format: date
              end:
                type: string
                format: date
          group_by:
            type: string
            enum: [day, week, month, quarter]

    - name: get_user_metrics
      description: Fetch user engagement metrics
      parameters:
        type: object
        properties:
          metric:
            type: string
            enum: [active_users, signups, churn, retention]
          period:
            type: string
            enum: [7d, 30d, 90d, 1y]

extensions:
  vercel_ai:
    provider:
      name: openai
      model: gpt-4o
      api_key_env: OPENAI_API_KEY

    stream_protocol: data

    ui_components:
      enabled: true
      components:
        - name: sales_chart
          render: "@/components/charts/SalesChart"
          props_schema:
            type: object
            properties:
              data:
                type: array
                items:
                  type: object
              chart_type:
                type: string
                enum: [line, bar, area]
              title:
                type: string

        - name: metrics_card
          render: "@/components/ui/MetricsCard"
          props_schema:
            type: object
            properties:
              metric_name:
                type: string
              value:
                type: number
              change:
                type: number
              trend:
                type: string
                enum: [up, down, stable]

        - name: data_table
          render: "@/components/tables/DataTable"
          props_schema:
            type: object
            properties:
              columns:
                type: array
                items:
                  type: string
              rows:
                type: array
                items:
                  type: object

      loading_component: "@/components/ui/ChartSkeleton"
      error_component: "@/components/ui/ChartError"

    tool_calling:
      mode: auto
      max_steps: 3
      tools:
        - name: get_sales_data
          description: Fetch sales data for visualization
          execute: "@/lib/data/sales#getSalesData"
        - name: get_user_metrics
          description: Fetch user engagement metrics
          execute: "@/lib/data/users#getUserMetrics"

    state_config:
      ai_state:
        schema:
          selected_date_range: z.object()
          cached_queries: z.array(z.object())
```

### 4. OpenAI Assistant with useAssistant

Integration with OpenAI Assistants API:

```yaml
apiVersion: ossa/v0.3.3
kind: Agent
metadata:
  name: code-review-assistant
  version: 1.0.0
  description: Code review assistant using OpenAI Assistants

spec:
  role: |
    You are an expert code reviewer. Analyze code for:
    - Code quality and best practices
    - Potential bugs and security issues
    - Performance optimizations
    - Documentation improvements

  llm:
    provider: openai
    model: gpt-4o

  tools:
    - name: code_interpreter
      description: Run and analyze code snippets
    - name: file_search
      description: Search uploaded code files

extensions:
  vercel_ai:
    provider:
      name: openai
      model: gpt-4o
      api_key_env: OPENAI_API_KEY

    hooks:
      use_assistant:
        enabled: true
        assistant_id: asst_abc123xyz
        thread_persistence: database

    tool_calling:
      mode: auto
      tools:
        - name: code_interpreter
          description: Execute Python code for analysis
        - name: file_search
          description: Search through uploaded codebase
```

### 5. Multi-Step Workflow with Server Actions

A workflow using AI-powered server actions:

```yaml
apiVersion: ossa/v0.3.3
kind: Workflow
metadata:
  name: content-pipeline
  version: 1.0.0
  description: Content creation pipeline with AI review

spec:
  steps:
    - id: generate
      task_ref: content-generator
      input:
        topic: "${{ inputs.topic }}"
        style: "${{ inputs.style }}"

    - id: review
      agent_ref: content-reviewer
      input:
        content: "${{ steps.generate.output.draft }}"
        criteria:
          - accuracy
          - tone
          - seo

    - id: optimize
      task_ref: seo-optimizer
      input:
        content: "${{ steps.review.output.reviewed_content }}"
        keywords: "${{ inputs.keywords }}"
      depends_on: [review]

  output:
    final_content: "${{ steps.optimize.output.optimized }}"
    review_notes: "${{ steps.review.output.notes }}"

extensions:
  vercel_ai:
    provider:
      name: anthropic
      model: claude-3-5-sonnet

    state_config:
      ai_state:
        schema:
          current_step: z.enum(['generate', 'review', 'optimize', 'complete'])
          content_versions: z.array(z.object())
          review_feedback: z.array(z.string())
        initial:
          current_step: generate
          content_versions: []
          review_feedback: []

      actions:
        - name: generateContent
          handler: "@/app/actions/content#generateContent"
          input_schema:
            topic: { type: string }
            style: { type: string, enum: [formal, casual, technical] }

        - name: reviewContent
          handler: "@/app/actions/content#reviewContent"
          input_schema:
            content: { type: string }
            criteria: { type: array, items: { type: string } }

        - name: optimizeContent
          handler: "@/app/actions/content#optimizeContent"
          input_schema:
            content: { type: string }
            keywords: { type: array, items: { type: string } }
```

## Implementation Guide

### Route Handler Setup (App Router)

```typescript
// app/api/chat/route.ts
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { loadOSSAAgent } from '@/lib/ossa/loader';

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Load OSSA manifest
  const agent = await loadOSSAAgent('customer-support-agent');

  // Map OSSA config to Vercel AI SDK
  const result = streamText({
    model: anthropic(agent.extensions.vercel_ai.provider.model),
    system: agent.spec.role,
    messages,
    tools: mapOSSAToolsToVercelAI(agent.spec.tools),
    maxSteps: agent.extensions.vercel_ai.tool_calling.max_steps,
  });

  return result.toDataStreamResponse();
}
```

### React Component Integration

```tsx
// components/ChatInterface.tsx
'use client';

import { useChat } from 'ai/react';
import { OSSAAgentConfig } from '@/lib/ossa/types';

interface ChatInterfaceProps {
  agentConfig: OSSAAgentConfig;
}

export function ChatInterface({ agentConfig }: ChatInterfaceProps) {
  const hookConfig = agentConfig.extensions.vercel_ai.hooks.use_chat;

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: hookConfig.api_endpoint,
    initialMessages: hookConfig.initial_messages,
    maxSteps: agentConfig.extensions.vercel_ai.tool_calling.max_steps,
  });

  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} />
      <ChatInput
        value={input}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
```

### Generative UI with streamUI

```tsx
// app/actions.tsx
'use server';

import { streamUI } from 'ai/rsc';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { loadOSSAAgent } from '@/lib/ossa/loader';
import { SalesChart, MetricsCard, DataTable } from '@/components/ui';

export async function streamDashboard(prompt: string) {
  const agent = await loadOSSAAgent('data-dashboard-agent');
  const uiConfig = agent.extensions.vercel_ai.ui_components;

  return streamUI({
    model: openai(agent.extensions.vercel_ai.provider.model),
    system: agent.spec.role,
    prompt,
    text: ({ content }) => <p>{content}</p>,
    tools: {
      sales_chart: {
        description: 'Display a sales chart',
        parameters: z.object({
          data: z.array(z.object({ date: z.string(), value: z.number() })),
          chart_type: z.enum(['line', 'bar', 'area']),
          title: z.string(),
        }),
        generate: async function* ({ data, chart_type, title }) {
          yield <LoadingSpinner />;
          return <SalesChart data={data} type={chart_type} title={title} />;
        },
      },
      metrics_card: {
        description: 'Display a metrics card',
        parameters: z.object({
          metric_name: z.string(),
          value: z.number(),
          change: z.number(),
          trend: z.enum(['up', 'down', 'stable']),
        }),
        generate: async ({ metric_name, value, change, trend }) => (
          <MetricsCard name={metric_name} value={value} change={change} trend={trend} />
        ),
      },
    },
  });
}
```

### AI State Management

```tsx
// lib/ai/state.tsx
import { createAI, getMutableAIState, getAIState } from 'ai/rsc';
import { z } from 'zod';

// Define state schema from OSSA manifest
const AIStateSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system', 'tool']),
    content: z.string(),
  })),
  context: z.object({
    customer_id: z.string().optional(),
    session_start: z.string().datetime(),
  }),
});

type AIState = z.infer<typeof AIStateSchema>;

// Server action to submit message
async function submitMessage(content: string) {
  'use server';

  const aiState = getMutableAIState<AIState>();

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      { role: 'user', content },
    ],
  });

  // Process with AI...
}

// Create AI context
export const AI = createAI<AIState, UIState>({
  actions: { submitMessage },
  initialAIState: {
    messages: [],
    context: {
      session_start: new Date().toISOString(),
    },
  },
});
```

## Zod Schema Validation

```typescript
// lib/ossa/validation/vercel-ai.ts
import { z } from 'zod';

export const VercelAIProviderSchema = z.object({
  name: z.enum([
    'openai', 'anthropic', 'google', 'mistral',
    'groq', 'azure', 'amazon-bedrock', 'cohere',
    'fireworks', 'custom'
  ]),
  model: z.string(),
  base_url: z.string().url().optional(),
  api_key_env: z.string().regex(/^[A-Z][A-Z0-9_]*$/).optional(),
  headers: z.record(z.string()).optional(),
});

export const VercelAIUIComponentSchema = z.object({
  name: z.string(),
  render: z.string(),
  props_schema: z.record(z.any()).optional(),
});

export const VercelAIStateConfigSchema = z.object({
  ai_state: z.object({
    schema: z.record(z.any()).optional(),
    initial: z.record(z.any()).optional(),
    persist: z.boolean().default(false),
  }).optional(),
  ui_state: z.object({
    schema: z.record(z.any()).optional(),
    sync_with_ai_state: z.boolean().default(true),
  }).optional(),
  actions: z.array(z.object({
    name: z.string(),
    handler: z.string(),
    input_schema: z.record(z.any()).optional(),
  })).optional(),
});

export const VercelAIExtensionSchema = z.object({
  provider: VercelAIProviderSchema,
  stream_protocol: z.enum(['data', 'text', 'sse']).default('data'),
  ui_components: z.object({
    enabled: z.boolean().default(false),
    components: z.array(VercelAIUIComponentSchema).optional(),
    loading_component: z.string().optional(),
    error_component: z.string().optional(),
  }).optional(),
  state_config: VercelAIStateConfigSchema.optional(),
  hooks: z.object({
    use_chat: z.object({
      enabled: z.boolean().default(true),
      api_endpoint: z.string().default('/api/chat'),
      max_messages: z.number().optional(),
      initial_messages: z.array(z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
      })).optional(),
    }).optional(),
    use_completion: z.object({
      enabled: z.boolean().default(false),
      api_endpoint: z.string().default('/api/completion'),
      stream_mode: z.enum(['stream', 'complete']).default('stream'),
    }).optional(),
    use_assistant: z.object({
      enabled: z.boolean().default(false),
      assistant_id: z.string().optional(),
      thread_persistence: z.enum(['session', 'database', 'none']).default('session'),
    }).optional(),
  }).optional(),
  tool_calling: z.object({
    mode: z.enum(['auto', 'required', 'none']).default('auto'),
    max_steps: z.number().min(1).max(100).default(5),
    tools: z.array(z.object({
      name: z.string(),
      description: z.string(),
      parameters: z.record(z.any()).optional(),
      execute: z.string().optional(),
      confirmation: z.boolean().default(false),
    })).optional(),
    parallel_tool_calls: z.boolean().default(true),
  }).optional(),
  output_schema: z.object({
    enabled: z.boolean().default(false),
    schema: z.record(z.any()).optional(),
    mode: z.enum(['json', 'tool', 'auto']).default('auto'),
    partial: z.boolean().default(true),
  }).optional(),
});

export type VercelAIExtension = z.infer<typeof VercelAIExtensionSchema>;
```

## OpenAPI Specification

```yaml
# openapi/vercel-ai-extension.yaml
openapi: 3.1.0
info:
  title: OSSA Vercel AI Extension API
  version: 0.3.3
  description: API endpoints for OSSA agents with Vercel AI SDK

paths:
  /api/chat:
    post:
      operationId: chat
      summary: Send a chat message
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ChatRequest'
      responses:
        '200':
          description: Streaming response
          content:
            text/event-stream:
              schema:
                type: string

  /api/completion:
    post:
      operationId: completion
      summary: Generate a completion
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CompletionRequest'
      responses:
        '200':
          description: Streaming or complete response
          content:
            text/plain:
              schema:
                type: string

  /api/generate-object:
    post:
      operationId: generateObject
      summary: Generate structured output
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/GenerateObjectRequest'
      responses:
        '200':
          description: Structured JSON response
          content:
            application/json:
              schema:
                type: object

components:
  schemas:
    ChatRequest:
      type: object
      required:
        - messages
      properties:
        messages:
          type: array
          items:
            $ref: '#/components/schemas/Message'
        agent_id:
          type: string
          description: OSSA agent identifier

    Message:
      type: object
      required:
        - role
        - content
      properties:
        id:
          type: string
        role:
          type: string
          enum: [user, assistant, system, tool]
        content:
          type: string
        tool_calls:
          type: array
          items:
            $ref: '#/components/schemas/ToolCall'

    ToolCall:
      type: object
      required:
        - id
        - name
      properties:
        id:
          type: string
        name:
          type: string
        arguments:
          type: object

    CompletionRequest:
      type: object
      required:
        - prompt
      properties:
        prompt:
          type: string
        task_id:
          type: string
          description: OSSA task identifier

    GenerateObjectRequest:
      type: object
      required:
        - prompt
        - schema
      properties:
        prompt:
          type: string
        schema:
          type: object
          description: JSON Schema for output
        agent_id:
          type: string
```

## SSE Protocol Mapping

### OSSA SSE Events to Vercel AI Data Protocol

| OSSA Event | Vercel AI Data Event | Format |
|------------|---------------------|--------|
| `message/start` | `0:` | Start stream marker |
| `message/delta` | `0:{"text":"..."}` | Text chunk |
| `tool/call` | `9:{"toolCallId":"..."}` | Tool invocation |
| `tool/result` | `a:{"result":"..."}` | Tool result |
| `message/complete` | `d:{"finishReason":"stop"}` | Completion |
| `error` | `3:{"error":"..."}` | Error event |

### Data Stream Response Format

```typescript
// Vercel AI SDK data stream format
interface DataStreamChunk {
  type: 'text' | 'tool-call' | 'tool-result' | 'finish' | 'error';
  data: unknown;
}

// OSSA SSE mapping
function mapOSSAToDataStream(ossaEvent: OSSAEvent): DataStreamChunk {
  switch (ossaEvent.type) {
    case 'message/delta':
      return { type: 'text', data: { text: ossaEvent.data.content } };
    case 'tool/call':
      return { type: 'tool-call', data: ossaEvent.data };
    case 'tool/result':
      return { type: 'tool-result', data: ossaEvent.data };
    case 'message/complete':
      return { type: 'finish', data: { finishReason: 'stop' } };
    case 'error':
      return { type: 'error', data: { error: ossaEvent.data.message } };
  }
}
```

## Related Resources

- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [OSSA v0.3.3 Specification](https://openstandardagents.org/spec/v0.3.3)
- [Next.js App Router](https://nextjs.org/docs/app)
- [React Server Components](https://react.dev/reference/react/use-server)
- [OpenAI Assistants API](https://platform.openai.com/docs/assistants)
