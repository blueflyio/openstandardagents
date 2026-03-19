/**
 * Docker Adapter
 * Generates production-grade Docker deployment packages from OSSA agents
 */

export {
  DockerfileGenerator,
  DockerComposeGenerator,
  DockerScriptsGenerator,
  DockerConfigGenerator,
} from './generators.js';
export { DockerExporter } from './docker-exporter.js';
export type { DockerConfig, DockerExportOptions } from './types.js';

// OpenClaw integration — delegates Docker stack generation to @better-openclaw/core
export { ossaToOpenclawStack, getOpenclawCatalog } from './openclaw-bridge.js';
export type { OpenclawBridgeOptions, OpenclawStackResult } from './openclaw-bridge.js';
