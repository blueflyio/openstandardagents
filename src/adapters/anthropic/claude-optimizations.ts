/**
 * Claude-Specific Optimizations
 *
 * Enhance Anthropic adapter exports with Claude-specific features
 */

import type { OssaAgent } from '../../types/index.js';

/**
 * Claude optimization config
 */
export interface ClaudeOptimizations {
  promptCaching?: {
    enabled: boolean;
    strategy: 'aggressive' | 'balanced' | 'conservative';
  };
  streaming?: {
    enabled: boolean;
    bufferSize?: number;
  };
  vision?: {
    enabled: boolean;
    maxImageSize?: number;
  };
  tools?: {
    enabled: boolean;
    parallel: boolean;
  };
  costOptimization?: {
    modelSelection: 'auto' | 'sonnet' | 'opus' | 'haiku';
    batchRequests: boolean;
  };
}

/**
 * Generate Claude-specific optimizations based on manifest
 */
export function generateClaudeOptimizations(
  manifest: OssaAgent
): ClaudeOptimizations {
  const capabilities = manifest.metadata?.agentArchitecture?.capabilities || [];
  const executionModel = manifest.metadata?.agentArchitecture?.runtime?.executionModel;

  const optimizations: ClaudeOptimizations = {};

  // Prompt caching (always beneficial for agents)
  optimizations.promptCaching = {
    enabled: true,
    strategy: executionModel === 'batch' ? 'aggressive' : 'balanced',
  };

  // Streaming
  if (capabilities.includes('streaming') || executionModel === 'streaming') {
    optimizations.streaming = {
      enabled: true,
      bufferSize: 1024,
    };
  }

  // Vision
  if (capabilities.includes('vision')) {
    optimizations.vision = {
      enabled: true,
      maxImageSize: 5 * 1024 * 1024, // 5MB
    };
  }

  // Tools
  if (capabilities.includes('tools')) {
    optimizations.tools = {
      enabled: true,
      parallel: true, // Claude 3.5+ supports parallel tool calls
    };
  }

  // Cost optimization
  const agentKind = manifest.metadata?.agentKind;
  optimizations.costOptimization = {
    modelSelection: agentKind === 'worker' ? 'haiku' : 'auto',
    batchRequests: executionModel === 'batch',
  };

  return optimizations;
}

/**
 * Generate Claude client configuration code
 */
export function generateClaudeClientCode(
  manifest: OssaAgent,
  optimizations: ClaudeOptimizations
): string {
  const agentName = manifest.metadata?.name || 'agent';

  let code = '/**\n';
  code += ` * ${agentName} - Claude Client\n`;
  code += ' * Generated with Claude-specific optimizations\n';
  code += ' */\n\n';
  code += "import Anthropic from '@anthropic-ai/sdk';\n\n";

  // Client initialization
  code += 'const client = new Anthropic({\n';
  code += "  apiKey: process.env.ANTHROPIC_API_KEY || '',\n";
  code += '});\n\n';

  // Streaming setup
  if (optimizations.streaming?.enabled) {
    code += '// Streaming configuration\n';
    code += 'async function streamResponse(messages) {\n';
    code += '  const stream = await client.messages.stream({\n';
    code += "    model: 'claude-sonnet-4.5-20250929',\n";
    code += '    max_tokens: 4096,\n';
    code += '    messages,\n';
    code += '  });\n\n';
    code += '  for await (const chunk of stream) {\n';
    code += "    if (chunk.type === 'content_block_delta') {\n";
    code += '      process.stdout.write(chunk.delta.text);\n';
    code += '    }\n';
    code += '  }\n';
    code += '}\n\n';
  }

  // Prompt caching setup
  if (optimizations.promptCaching?.enabled) {
    code += '// Prompt caching (reduces costs by up to 90%)\n';
    code += 'async function createMessageWithCaching(messages, systemPrompt) {\n';
    code += '  return await client.messages.create({\n';
    code += "    model: 'claude-sonnet-4.5-20250929',\n";
    code += '    max_tokens: 4096,\n';
    code += '    system: [\n';
    code += '      {\n';
    code += '        type: "text",\n';
    code += '        text: systemPrompt,\n';
    code += '        cache_control: { type: "ephemeral" }, // Cache system prompt\n';
    code += '      },\n';
    code += '    ],\n';
    code += '    messages,\n';
    code += '  });\n';
    code += '}\n\n';
  }

  // Tool use setup
  if (optimizations.tools?.enabled) {
    code += '// Tool use (function calling)\n';
    code += 'async function executeWithTools(messages, tools) {\n';
    code += '  return await client.messages.create({\n';
    code += "    model: 'claude-sonnet-4.5-20250929',\n";
    code += '    max_tokens: 4096,\n';
    code += '    tools, // Pass tool definitions\n';
    code += '    messages,\n';
    code += '  });\n';
    code += '}\n\n';
  }

  // Vision setup
  if (optimizations.vision?.enabled) {
    code += '// Vision support (image analysis)\n';
    code += 'async function analyzeImage(imageUrl, prompt) {\n';
    code += '  return await client.messages.create({\n';
    code += "    model: 'claude-sonnet-4.5-20250929',\n";
    code += '    max_tokens: 4096,\n';
    code += '    messages: [\n';
    code += '      {\n';
    code += "        role: 'user',\n";
    code += '        content: [\n';
    code += '          { type: "image", source: { type: "url", url: imageUrl } },\n';
    code += '          { type: "text", text: prompt },\n';
    code += '        ],\n';
    code += '      },\n';
    code += '    ],\n';
    code += '  });\n';
    code += '}\n\n';
  }

  code += 'export { client';
  if (optimizations.streaming?.enabled) code += ', streamResponse';
  if (optimizations.promptCaching?.enabled) code += ', createMessageWithCaching';
  if (optimizations.tools?.enabled) code += ', executeWithTools';
  if (optimizations.vision?.enabled) code += ', analyzeImage';
  code += ' };\n';

  return code;
}

/**
 * Generate Claude best practices README section
 */
export function generateClaudeBestPractices(
  optimizations: ClaudeOptimizations
): string {
  let section = '## Claude Best Practices\n\n';

  if (optimizations.promptCaching?.enabled) {
    section += '### Prompt Caching\n\n';
    section += 'This agent is configured with **prompt caching** to reduce costs:\n\n';
    section += '- Cache system prompts with `cache_control: { type: "ephemeral" }`\n';
    section += '- Cached prompts cost **90% less** for repeated use\n';
    section += '- Cache persists for 5 minutes\n\n';
  }

  if (optimizations.streaming?.enabled) {
    section += '### Streaming Responses\n\n';
    section += 'Enable streaming for better UX:\n\n';
    section += '```typescript\n';
    section += 'const stream = await client.messages.stream({ ... });\n';
    section += 'for await (const chunk of stream) { ... }\n';
    section += '```\n\n';
  }

  if (optimizations.tools?.enabled) {
    section += '### Tool Use (Function Calling)\n\n';
    section += 'Claude supports parallel tool calls:\n\n';
    section += '```typescript\n';
    section += 'const tools = [\n';
    section += '  { name: "get_weather", description: "...", input_schema: {...} },\n';
    section += '];\n';
    section += 'const response = await client.messages.create({ tools, ... });\n';
    section += '```\n\n';
  }

  if (optimizations.vision?.enabled) {
    section += '### Vision Support\n\n';
    section += 'Analyze images with Claude:\n\n';
    section += '- Supports PNG, JPEG, WebP, GIF\n';
    section += '- Max image size: 5MB\n';
    section += '- Pass images as base64 or URL\n\n';
  }

  section += '### Cost Optimization\n\n';
  section += `- **Model**: ${optimizations.costOptimization?.modelSelection || 'auto'}\n`;
  section += `- **Batch requests**: ${optimizations.costOptimization?.batchRequests ? 'enabled' : 'disabled'}\n`;

  return section;
}
