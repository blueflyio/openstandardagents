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
