/**
 * OSSA LangChain Integration
 * 
 * Main entry point for OSSA LangChain integration
 */

export { OssaChainConverter } from './ossa-chain-converter.js';
export { default as LangChainAgentFactory } from './langchain-agent-factory.js';
export { default as OssaChainComposer } from './chain-composer.js';
export { default as LangChainCLI } from './langchain-cli.js';

// Re-export for convenience
export { OssaChainConverter as ChainConverter } from './ossa-chain-converter.js';
export { default as AgentFactory } from './langchain-agent-factory.js';
export { default as ChainComposer } from './chain-composer.js';

// Version info
export const VERSION = '0.1.8';
export const SUPPORTED_PATTERNS = [
  'sequential',
  'parallel', 
  'conditional',
  'map_reduce',
  'pipeline',
  'router'
];

export const SUPPORTED_PROVIDERS = [
  'openai',
  'anthropic'
];

export const SUPPORTED_CAPABILITIES = [
  'analyze_code',
  'generate_docs',
  'validate_syntax',
  'suggest_improvements',
  'text_processing',
  'data_analysis',
  'code_review',
  'planning'
];