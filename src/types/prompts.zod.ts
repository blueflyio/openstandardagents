/**
 * OSSA Prompts Zod Schemas
 * Validation schemas for spec.prompts
 *
 * @module @openstandardagents/prompts
 * @version 0.3.2
 */

import { z } from 'zod';

// ============================================================================
// Message Schemas
// ============================================================================

export const MessageRoleSchema = z.enum(['system', 'user', 'assistant']);

export const ContentTypeSchema = z.enum(['text', 'markdown', 'code', 'json']);

export const MessageSchema = z.object({
  role: MessageRoleSchema,
  content: z.string(),
  content_type: ContentTypeSchema.optional(),
  name: z.string().optional(),
});

// ============================================================================
// Example Schemas
// ============================================================================

export const PromptExampleSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  user: z.string(),
  assistant: z.string(),
  tags: z.array(z.string()).optional(),
  context: z.string().optional(),
  enabled: z.boolean().optional(),
  priority: z.number().optional(),
});

export const ExampleCollectionSchema = z.object({
  category: z.string(),
  description: z.string().optional(),
  examples: z.array(PromptExampleSchema),
  max_include: z.number().int().positive().optional(),
});

// ============================================================================
// Template Schemas
// ============================================================================

export const TemplateVariableTypeSchema = z.enum([
  'string',
  'number',
  'boolean',
  'array',
  'object',
]);

export const TemplateVariableSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  default: z.string().optional(),
  required: z.boolean().optional(),
  type: TemplateVariableTypeSchema.optional(),
});

export const TemplateFormatSchema = z.enum(['text', 'markdown']);

export const PromptTemplateSchema = z.object({
  content: z.string(),
  variables: z.array(TemplateVariableSchema).optional(),
  format: TemplateFormatSchema.optional(),
});

// ============================================================================
// Greeting Schemas
// ============================================================================

export const GreetingConfigSchema = z.object({
  default: z.string(),
  first_time: z.string().optional(),
  returning: z.string().optional(),
  contextual: z.record(z.string(), z.string()).optional(),
  personalize: z.boolean().optional(),
  include_time_context: z.boolean().optional(),
});

// ============================================================================
// System Prompt Schemas
// ============================================================================

export const SystemPromptSectionSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  content: z.string(),
  required: z.boolean().optional(),
  conditions: z.record(z.string(), z.unknown()).optional(),
  priority: z.number().optional(),
});

export const SystemPromptConfigSchema = z.object({
  content: z.string(),
  sections: z.array(SystemPromptSectionSchema).optional(),
  variables: z.array(TemplateVariableSchema).optional(),
  include_metadata: z.boolean().optional(),
  include_datetime: z.boolean().optional(),
  include_tools: z.boolean().optional(),
  max_length: z.number().int().positive().optional(),
});

// ============================================================================
// Complete Prompts Schema
// ============================================================================

export const PromptsSpecSchema = z.object({
  system: z.union([z.string(), SystemPromptConfigSchema]),
  greeting: z.union([z.string(), GreetingConfigSchema]).optional(),
  examples: z
    .union([z.array(PromptExampleSchema), z.array(ExampleCollectionSchema)])
    .optional(),
  error_messages: z.record(z.string(), z.string()).optional(),
  confirmations: z.record(z.string(), z.string()).optional(),
  help: z.string().optional(),
  farewell: z.string().optional(),
  thinking: z.string().optional(),
  rate_limit: z.string().optional(),
  capability_unavailable: z.string().optional(),
  templates: z.record(z.string(), PromptTemplateSchema).optional(),
  locale: z.string().optional(),
  fallback_locale: z.string().optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type MessageRole = z.infer<typeof MessageRoleSchema>;
export type ContentType = z.infer<typeof ContentTypeSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type PromptExample = z.infer<typeof PromptExampleSchema>;
export type ExampleCollection = z.infer<typeof ExampleCollectionSchema>;
export type TemplateVariableType = z.infer<typeof TemplateVariableTypeSchema>;
export type TemplateVariable = z.infer<typeof TemplateVariableSchema>;
export type TemplateFormat = z.infer<typeof TemplateFormatSchema>;
export type PromptTemplate = z.infer<typeof PromptTemplateSchema>;
export type GreetingConfig = z.infer<typeof GreetingConfigSchema>;
export type SystemPromptSection = z.infer<typeof SystemPromptSectionSchema>;
export type SystemPromptConfig = z.infer<typeof SystemPromptConfigSchema>;
export type PromptsSpec = z.infer<typeof PromptsSpecSchema>;
