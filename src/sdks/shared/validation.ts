/**
 * Shared Validation Utilities
 *
 * SOLID: Single Responsibility - Validation logic
 * Zod: Runtime validation schemas
 * DRY: Reusable validation across SDKs
 */

import { z } from 'zod';

export const ApiVersionSchema = z.string().regex(/^ossa\/v\d+\.\d+\.\d+$/);
export const VersionSchema = z.string().regex(/^\d+\.\d+\.\d+(-.*)?$/);
export const NameSchema = z.string().min(1).max(100).regex(/^[a-z0-9-]+$/);

export const MetadataSchema = z.object({
  name: NameSchema,
  version: VersionSchema,
  description: z.string().optional(),
  labels: z.record(z.string()).optional(),
});

export const LLMProviderSchema = z.enum([
  'anthropic',
  'openai',
  'google',
  'azure',
  'bedrock',
  'ollama',
  'groq',
  'mistral',
  'custom',
]);

export const LLMConfigSchema = z.object({
  provider: LLMProviderSchema,
  model: z.string(),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().positive().optional(),
  api_key: z.string().optional(),
  base_url: z.string().url().optional(),
});

export type ApiVersion = z.infer<typeof ApiVersionSchema>;
export type Version = z.infer<typeof VersionSchema>;
export type Metadata = z.infer<typeof MetadataSchema>;
export type LLMProvider = z.infer<typeof LLMProviderSchema>;
export type LLMConfig = z.infer<typeof LLMConfigSchema>;
