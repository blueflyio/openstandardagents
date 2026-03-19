// @ts-nocheck
/**
 * Validator Registry Factory
 *
 * Single source of truth for all platform validators — add new validators here only.
 *
 * DRY: eliminates duplicate Map initialization across ValidationService implementations.
 * To add a new platform validator: import it here and add one entry to the Map.
 */

import type { OssaAgent, ValidationResult } from '../../types/index.js';
import { CursorValidator } from './cursor.validator.js';
import { OpenAIValidator } from './openai.validator.js';
import { CrewAIValidator } from './crewai.validator.js';
import { LangChainValidator } from './langchain.validator.js';
import { AnthropicValidator } from './anthropic.validator.js';
import { LangflowValidator } from './langflow.validator.js';
import { AutoGenValidator } from './autogen.validator.js';
import { VercelAIValidator } from './vercel-ai.validator.js';
import { LlamaIndexValidator } from './llamaindex.validator.js';
import { LangGraphValidator } from './langgraph.validator.js';
import { KagentValidator } from './kagent.validator.js';

/** Shared interface for all platform validators registered in the registry. */
export interface PlatformValidator {
  validate(manifest: OssaAgent): ValidationResult;
}

/**
 * Create the canonical map of platform validators.
 *
 * Keys match the extension names used in OSSA agent manifests
 * (i.e. the keys of `manifest.extensions`).
 */
export function createValidatorRegistry(): Map<string, PlatformValidator> {
  return new Map<string, PlatformValidator>([
    ['cursor', new CursorValidator()],
    ['openai_agents', new OpenAIValidator()],
    ['crewai', new CrewAIValidator()],
    ['langchain', new LangChainValidator()],
    ['anthropic', new AnthropicValidator()],
    ['langflow', new LangflowValidator()],
    ['autogen', new AutoGenValidator()],
    ['vercel_ai', new VercelAIValidator()],
    ['llamaindex', new LlamaIndexValidator()],
    ['langgraph', new LangGraphValidator()],
    ['kagent', new KagentValidator()],
  ]);
}
