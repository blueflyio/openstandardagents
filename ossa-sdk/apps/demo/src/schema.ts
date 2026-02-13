/** Minimal OSSA v0.4 schema for demo purposes */
export const DEMO_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://openstandardagents.org/schemas/v0.4/agent.schema.json',
  title: 'OSSA v0.4 Agent Manifest Schema',
  type: 'object' as const,
  required: ['apiVersion', 'kind', 'metadata'],
  properties: {
    apiVersion: { type: 'string' as const, pattern: '^ossa/v' },
    kind: { type: 'string' as const, enum: ['Agent', 'Task', 'Workflow', 'Flow'] },
    metadata: { $ref: '#/definitions/Metadata' },
    spec: {
      type: 'object' as const,
      properties: {
        description: { type: 'string' as const },
        role: { type: 'string' as const },
        llm: {
          type: 'object' as const,
          properties: {
            provider: { type: 'string' as const, enum: ['anthropic', 'openai', 'google', 'mistral'] },
            model: { type: 'string' as const },
            temperature: { type: 'number' as const, minimum: 0, maximum: 2, default: 0.7 },
            maxTokens: { type: 'integer' as const, minimum: 1, maximum: 200000 },
          },
          required: ['provider', 'model'],
        },
        tools: {
          type: 'array' as const,
          items: {
            type: 'object' as const,
            properties: {
              name: { type: 'string' as const },
              type: { type: 'string' as const, enum: ['mcp', 'builtin', 'api'] },
            },
            required: ['name', 'type'],
          },
        },
        safety: { type: 'object' as const },
        autonomy: {
          type: 'object' as const,
          properties: { level: { type: 'string' as const } },
        },
      },
    },
    extensions: { type: 'object' as const, additionalProperties: true },
  },
  definitions: {
    Metadata: {
      type: 'object' as const,
      required: ['name'],
      properties: {
        name: { type: 'string' as const, description: 'Agent name' },
        version: { type: 'string' as const, description: 'Semantic version' },
        namespace: { type: 'string' as const },
        labels: { type: 'object' as const, additionalProperties: { type: 'string' as const } },
        annotations: { type: 'object' as const, additionalProperties: { type: 'string' as const } },
      },
    },
  },
};
