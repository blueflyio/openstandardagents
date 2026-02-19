/**
 * OSSA SDK - Single entry for programmatic use in other projects.
 *
 * Exposes agent card generation and types. For validation use
 * @bluefly/openstandardagents/validation (ValidationService).
 * For mesh use @bluefly/openstandardagents/mesh.
 *
 * @example
 * ```ts
 * import { AgentCardGenerator } from '@bluefly/openstandardagents/sdk';
 * import type { AgentCard, OssaAgent } from '@bluefly/openstandardagents/sdk';
 *
 * const gen = new AgentCardGenerator();
 * const cardResult = gen.generate(manifest, { namespace: 'myteam' });
 * if (cardResult.success && cardResult.card) console.log(cardResult.card.uri);
 * ```
 */

export { AgentCardGenerator } from './services/agent-card-generator.js';
export type {
  AgentCardGeneratorOptions,
  AgentCardResult,
} from './services/agent-card-generator.js';

export type { OssaAgent, SchemaVersion } from './types/index.js';

export type {
  AgentCard,
  AgentCardState,
  TokenEfficiencySummary,
  AgentCardSeparation,
} from './mesh/types.js';
