/**
 * OSSA Prompts Types
 * Type definitions for spec.prompts - agent prompt configuration
 *
 * @module @openstandardagents/prompts
 * @version 0.3.2
 *
 * Defines system prompts, greetings, and example interactions
 * for consistent agent behavior and user experience.
 */

// ============================================================================
// Message Types
// ============================================================================

/**
 * Message role in conversation
 */
export type MessageRole = 'system' | 'user' | 'assistant';

/**
 * Content type for messages
 */
export type ContentType = 'text' | 'markdown' | 'code' | 'json';

/**
 * Single message in a conversation
 */
export interface Message {
  /** Role of the message sender */
  role: MessageRole;
  /** Message content */
  content: string;
  /** Content type (for formatting) */
  content_type?: ContentType;
  /** Optional name for the sender */
  name?: string;
}

// ============================================================================
// Example Types
// ============================================================================

/**
 * Example interaction for few-shot learning
 */
export interface PromptExample {
  /** Example identifier */
  id?: string;
  /** Short title/description */
  title?: string;
  /** User input in the example */
  user: string;
  /** Expected assistant response */
  assistant: string;
  /** Optional tags for categorization */
  tags?: string[];
  /** Context/setup for the example */
  context?: string;
  /** Whether this example should be used in prompts */
  enabled?: boolean;
  /** Priority (higher = more likely to be included) */
  priority?: number;
}

/**
 * Collection of examples by category
 */
export interface ExampleCollection {
  /** Category name */
  category: string;
  /** Description of this category */
  description?: string;
  /** Examples in this category */
  examples: PromptExample[];
  /** Maximum examples to include from this category */
  max_include?: number;
}

// ============================================================================
// Template Types
// ============================================================================

/**
 * Template variable definition
 */
export interface TemplateVariable {
  /** Variable name (used in template as {{name}}) */
  name: string;
  /** Variable description */
  description?: string;
  /** Default value */
  default?: string;
  /** Whether the variable is required */
  required?: boolean;
  /** Variable type for validation */
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
}

/**
 * Prompt template configuration
 */
export interface PromptTemplate {
  /** Template content (supports {{variable}} substitution) */
  content: string;
  /** Template variables */
  variables?: TemplateVariable[];
  /** Template format (text or markdown) */
  format?: 'text' | 'markdown';
}

// ============================================================================
// Greeting Types
// ============================================================================

/**
 * Greeting configuration for different contexts
 */
export interface GreetingConfig {
  /** Default greeting message */
  default: string;
  /** Greeting for new users */
  first_time?: string;
  /** Greeting for returning users */
  returning?: string;
  /** Context-specific greetings */
  contextual?: Record<string, string>;
  /** Whether to personalize with user name */
  personalize?: boolean;
  /** Include current time/date context */
  include_time_context?: boolean;
}

// ============================================================================
// System Prompt Types
// ============================================================================

/**
 * System prompt section
 */
export interface SystemPromptSection {
  /** Section identifier */
  id: string;
  /** Section title (optional, for documentation) */
  title?: string;
  /** Section content */
  content: string;
  /** Whether this section is required */
  required?: boolean;
  /** Conditions for including this section */
  conditions?: Record<string, unknown>;
  /** Priority for ordering (higher = earlier in prompt) */
  priority?: number;
}

/**
 * Complete system prompt configuration
 */
export interface SystemPromptConfig {
  /** Main system prompt content */
  content: string;
  /** Optional sections to append */
  sections?: SystemPromptSection[];
  /** Template variables available */
  variables?: TemplateVariable[];
  /** Whether to include agent metadata in prompt */
  include_metadata?: boolean;
  /** Whether to include current date/time */
  include_datetime?: boolean;
  /** Whether to include tool descriptions */
  include_tools?: boolean;
  /** Maximum length (for truncation) */
  max_length?: number;
}

// ============================================================================
// Complete Prompts Specification
// ============================================================================

/**
 * Complete agent prompts configuration
 * Used in spec.prompts within OSSA manifests
 */
export interface PromptsSpec {
  /** System prompt configuration */
  system: string | SystemPromptConfig;
  /** Greeting configuration */
  greeting?: string | GreetingConfig;
  /** Few-shot examples */
  examples?: PromptExample[] | ExampleCollection[];
  /** Error message templates */
  error_messages?: Record<string, string>;
  /** Confirmation message templates */
  confirmations?: Record<string, string>;
  /** Help/usage instructions */
  help?: string;
  /** Farewell message */
  farewell?: string;
  /** Thinking/processing message */
  thinking?: string;
  /** Rate limit message */
  rate_limit?: string;
  /** Capability not available message */
  capability_unavailable?: string;
  /** Custom templates for specific scenarios */
  templates?: Record<string, PromptTemplate>;
  /** Language/locale for messages */
  locale?: string;
  /** Fallback locale */
  fallback_locale?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if system prompt is a config object
 */
export function isSystemPromptConfig(
  system: string | SystemPromptConfig
): system is SystemPromptConfig {
  return typeof system === 'object' && system !== null && 'content' in system;
}

/**
 * Check if greeting is a config object
 */
export function isGreetingConfig(
  greeting: string | GreetingConfig
): greeting is GreetingConfig {
  return typeof greeting === 'object' && greeting !== null && 'default' in greeting;
}

/**
 * Check if examples array contains ExampleCollections
 */
export function isExampleCollectionArray(
  examples: PromptExample[] | ExampleCollection[]
): examples is ExampleCollection[] {
  return (
    examples.length > 0 &&
    typeof examples[0] === 'object' &&
    'category' in examples[0] &&
    'examples' in examples[0]
  );
}

/**
 * Normalize system prompt to config
 */
export function normalizeSystemPrompt(system: string | SystemPromptConfig): SystemPromptConfig {
  if (isSystemPromptConfig(system)) {
    return system;
  }
  return { content: system };
}

/**
 * Normalize greeting to config
 */
export function normalizeGreeting(greeting: string | GreetingConfig): GreetingConfig {
  if (isGreetingConfig(greeting)) {
    return greeting;
  }
  return { default: greeting };
}

/**
 * Flatten example collections to examples array
 */
export function flattenExamples(
  examples: PromptExample[] | ExampleCollection[]
): PromptExample[] {
  if (!isExampleCollectionArray(examples)) {
    return examples;
  }

  const flattened: PromptExample[] = [];
  for (const collection of examples) {
    const toInclude = collection.max_include
      ? collection.examples.slice(0, collection.max_include)
      : collection.examples;

    for (const example of toInclude) {
      flattened.push({
        ...example,
        tags: [...(example.tags || []), collection.category],
      });
    }
  }
  return flattened;
}

/**
 * Render a template with variables
 */
export function renderTemplate(
  template: string | PromptTemplate,
  variables: Record<string, unknown>
): string {
  const content = typeof template === 'string' ? template : template.content;

  return content.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    if (varName in variables) {
      const value = variables[varName];
      return String(value);
    }
    // Check for default in template definition
    if (typeof template === 'object' && template.variables) {
      const varDef = template.variables.find((v) => v.name === varName);
      if (varDef?.default !== undefined) {
        return varDef.default;
      }
    }
    return match; // Leave unreplaced if no value or default
  });
}

/**
 * Create a default prompts configuration
 */
export function createDefaultPrompts(agentName: string, role: string): PromptsSpec {
  return {
    system: `You are ${agentName}, an AI assistant.

${role}

Please help users with their requests while being helpful, accurate, and safe.`,
    greeting: `Hello! I'm ${agentName}. How can I help you today?`,
    examples: [],
    error_messages: {
      general: "I apologize, but I encountered an error. Please try again.",
      rate_limit: "I'm receiving too many requests. Please wait a moment.",
      capability_unavailable: "I'm sorry, but I can't help with that request.",
    },
    farewell: "Goodbye! Feel free to return if you need any help.",
    thinking: "Let me think about that...",
  };
}

/**
 * Build complete system prompt from config
 */
export function buildSystemPrompt(
  config: SystemPromptConfig,
  context?: {
    agentName?: string;
    agentVersion?: string;
    datetime?: Date;
    tools?: string[];
    customVariables?: Record<string, unknown>;
  }
): string {
  const parts: string[] = [];

  // Add main content
  let content = config.content;

  // Add metadata if requested
  if (config.include_metadata && context) {
    const metadata = [
      context.agentName && `Agent: ${context.agentName}`,
      context.agentVersion && `Version: ${context.agentVersion}`,
    ]
      .filter(Boolean)
      .join('\n');
    if (metadata) {
      content = `${metadata}\n\n${content}`;
    }
  }

  // Add datetime if requested
  if (config.include_datetime) {
    const dt = context?.datetime || new Date();
    content = `Current date: ${dt.toISOString()}\n\n${content}`;
  }

  parts.push(content);

  // Add sections sorted by priority
  if (config.sections) {
    const sortedSections = [...config.sections].sort(
      (a, b) => (b.priority || 0) - (a.priority || 0)
    );

    for (const section of sortedSections) {
      parts.push(section.content);
    }
  }

  // Add tools if requested
  if (config.include_tools && context?.tools?.length) {
    const toolList = context.tools.map((t) => `- ${t}`).join('\n');
    parts.push(`\nAvailable tools:\n${toolList}`);
  }

  let result = parts.join('\n\n');

  // Apply variable substitution
  if (context?.customVariables) {
    result = renderTemplate(result, context.customVariables);
  }

  // Truncate if needed
  if (config.max_length && result.length > config.max_length) {
    result = result.substring(0, config.max_length - 3) + '...';
  }

  return result;
}
