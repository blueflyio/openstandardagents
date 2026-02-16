/**
 * Message Format Conversion
 * Convert between OSSA and Anthropic SDK message formats
 */

import type {
  MessageParam,
  TextBlock,
  ToolUseBlock,
} from '@anthropic-ai/sdk/resources/messages';

/**
 * OSSA message format
 */
export interface OssaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | OssaMessageContent[];
  metadata?: Record<string, unknown>;
}

/**
 * OSSA message content types
 */
export type OssaMessageContent =
  | { type: 'text'; text: string }
  | { type: 'image'; source: string; mediaType?: string }
  | {
      type: 'tool_use';
      id: string;
      name: string;
      input: Record<string, unknown>;
    }
  | {
      type: 'tool_result';
      tool_use_id: string;
      content: string;
      is_error?: boolean;
    };

/**
 * Anthropic content block types
 */
export type AnthropicContentBlock = TextBlock | ToolUseBlock;

/**
 * Convert OSSA messages to Anthropic SDK format
 */
export function convertToAnthropicMessages(messages: OssaMessage[]): {
  system?: string;
  messages: MessageParam[];
} {
  // Extract system message
  let system: string | undefined;
  const conversationMessages: OssaMessage[] = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      const text =
        typeof msg.content === 'string'
          ? msg.content
          : msg.content
              .filter((b) => b.type === 'text')
              .map((b) => (b as { text: string }).text)
              .join('\n');
      system = system ? `${system}\n\n${text}` : text;
    } else {
      conversationMessages.push(msg);
    }
  }

  // Convert messages to SDK format
  const anthropicMessages: MessageParam[] = conversationMessages.map((msg) => ({
    role: msg.role as 'user' | 'assistant',
    content:
      typeof msg.content === 'string'
        ? msg.content
        : msg.content.map((block) => {
            if (block.type === 'text') {
              return { type: 'text' as const, text: block.text };
            }
            if (block.type === 'image') {
              const [mediaType, data] = block.source.split(',');
              return {
                type: 'image' as const,
                source: {
                  type: 'base64' as const,
                  media_type: (block.mediaType ||
                    mediaType.split(':')[1].split(';')[0]) as
                    | 'image/jpeg'
                    | 'image/png'
                    | 'image/gif'
                    | 'image/webp',
                  data: data || block.source,
                },
              };
            }
            if (block.type === 'tool_use') {
              return {
                type: 'tool_use' as const,
                id: block.id,
                name: block.name,
                input: block.input,
              };
            }
            // tool_result
            return {
              type: 'tool_result' as const,
              tool_use_id: block.tool_use_id,
              content: block.content,
              is_error: block.is_error,
            };
          }),
  }));

  return { system, messages: anthropicMessages };
}

/**
 * Convert Anthropic SDK message to OSSA format
 */
export function convertFromAnthropicMessage(
  anthropicMessage: MessageParam
): OssaMessage {
  if (typeof anthropicMessage.content === 'string') {
    return {
      role: anthropicMessage.role,
      content: anthropicMessage.content,
    };
  }

  // Convert content blocks
  const content: OssaMessageContent[] = [];

  for (const block of anthropicMessage.content) {
    if (block.type === 'text') {
      content.push({ type: 'text', text: block.text });
    } else if (block.type === 'image') {
      content.push({
        type: 'image',
        source:
          block.source.type === 'base64'
            ? `data:${block.source.media_type};base64,${block.source.data}`
            : '',
        mediaType:
          block.source.type === 'base64' ? block.source.media_type : undefined,
      });
    } else if (block.type === 'tool_use') {
      content.push({
        type: 'tool_use',
        id: block.id,
        name: block.name,
        input: block.input as Record<string, unknown>,
      });
    } else if (block.type === 'tool_result') {
      content.push({
        type: 'tool_result',
        tool_use_id: block.tool_use_id,
        content:
          typeof block.content === 'string'
            ? block.content
            : JSON.stringify(block.content),
        is_error: block.is_error,
      });
    }
    // Ignore other block types (thinking, document, server_tool_use, etc.)
  }

  return { role: anthropicMessage.role, content };
}

/**
 * Create a text message
 */
export function createTextMessage(
  role: 'user' | 'assistant',
  text: string
): OssaMessage {
  return {
    role,
    content: text,
  };
}

/**
 * Create a system message
 */
export function createSystemMessage(text: string): OssaMessage {
  return {
    role: 'system',
    content: text,
  };
}

/**
 * Create a tool use message
 */
export function createToolUseMessage(
  id: string,
  name: string,
  input: Record<string, unknown>
): OssaMessage {
  return {
    role: 'assistant',
    content: [
      {
        type: 'tool_use',
        id,
        name,
        input,
      },
    ],
  };
}

/**
 * Create a tool result message
 */
export function createToolResultMessage(
  toolUseId: string,
  content: string,
  isError = false
): OssaMessage {
  return {
    role: 'user',
    content: [
      {
        type: 'tool_result',
        tool_use_id: toolUseId,
        content,
        is_error: isError,
      },
    ],
  };
}

/**
 * Extract text content from a message
 */
export function extractText(message: OssaMessage): string {
  if (typeof message.content === 'string') {
    return message.content;
  }

  return message.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as { text: string }).text)
    .join('\n');
}

/**
 * Check if message contains tool use
 */
export function hasToolUse(message: OssaMessage): boolean {
  if (typeof message.content === 'string') {
    return false;
  }

  return message.content.some((block) => block.type === 'tool_use');
}

/**
 * Extract tool uses from a message
 */
export function extractToolUses(
  message: OssaMessage
): Array<{ id: string; name: string; input: Record<string, unknown> }> {
  if (typeof message.content === 'string') {
    return [];
  }

  return message.content
    .filter((block) => block.type === 'tool_use')
    .map((block) => {
      const toolUse = block as {
        id: string;
        name: string;
        input: Record<string, unknown>;
      };
      return {
        id: toolUse.id,
        name: toolUse.name,
        input: toolUse.input,
      };
    });
}

/**
 * Validate message format
 */
export function validateMessage(message: OssaMessage): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate role
  if (!['user', 'assistant', 'system'].includes(message.role)) {
    errors.push(`Invalid role: ${message.role}`);
  }

  // Validate content
  if (typeof message.content === 'string') {
    if (message.content.length === 0) {
      errors.push('Message content cannot be empty');
    }
  } else if (Array.isArray(message.content)) {
    if (message.content.length === 0) {
      errors.push('Message content array cannot be empty');
    }

    for (const block of message.content) {
      if (!block.type) {
        errors.push('Content block missing type');
      }

      if (block.type === 'text' && !(block as { text?: string }).text) {
        errors.push('Text block missing text field');
      }

      if (block.type === 'tool_use') {
        const toolUse = block as {
          id?: string;
          name?: string;
          input?: unknown;
        };
        if (!toolUse.id) errors.push('Tool use block missing id');
        if (!toolUse.name) errors.push('Tool use block missing name');
        if (!toolUse.input) errors.push('Tool use block missing input');
      }

      if (block.type === 'tool_result') {
        const toolResult = block as { tool_use_id?: string; content?: string };
        if (!toolResult.tool_use_id)
          errors.push('Tool result block missing tool_use_id');
        if (!toolResult.content)
          errors.push('Tool result block missing content');
      }
    }
  } else {
    errors.push('Message content must be string or array');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Merge consecutive messages with the same role
 */
export function mergeMessages(messages: OssaMessage[]): OssaMessage[] {
  if (messages.length === 0) return [];

  const merged: OssaMessage[] = [];
  let current = messages[0];

  for (let i = 1; i < messages.length; i++) {
    const next = messages[i];

    if (current.role === next.role && current.role !== 'system') {
      // Merge content
      const currentBlocks =
        typeof current.content === 'string'
          ? [{ type: 'text' as const, text: current.content }]
          : current.content;
      const nextBlocks =
        typeof next.content === 'string'
          ? [{ type: 'text' as const, text: next.content }]
          : next.content;

      current = {
        ...current,
        content: [...currentBlocks, ...nextBlocks],
      };
    } else {
      merged.push(current);
      current = next;
    }
  }

  merged.push(current);
  return merged;
}
