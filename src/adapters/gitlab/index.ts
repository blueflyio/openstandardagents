/**
 * GitLab Adapter
 * Converts OSSA agents to GitLab CI jobs and GitLab Duo Flows
 */

export { GitLabConverter } from './converter.js';
export { GitLabDuoFlowGenerator } from './flow-generator.js';
export { ExternalAgentGenerator } from './external-agent-generator.js';
export { GitLabDuoPackageGenerator } from './package-generator.js';
export { GitLabDuoTriggerGenerator } from './trigger-generator.js';
export { GitLabDuoRouterGenerator } from './router-generator.js';
export type {
  GitLabJobConfig,
  GitLabPipelineConfig,
  GitLabDuoFlow,
  FlowEnvironment,
  FlowComponent,
  AgentComponent,
  DeterministicStepComponent,
  OneOffComponent,
  FlowRouter,
  FlowPrompt,
  ExternalAgentConfig,
} from './types.js';
export type {
  PackageGenerationOptions,
  PackageGenerationResult,
} from './package-generator.js';
export type {
  TriggerType,
  TriggerConfig,
  TriggerManifest,
  MentionTrigger,
  AssignTrigger,
  AssignReviewerTrigger,
  ScheduleTrigger,
  PipelineTrigger,
  WebhookTrigger,
  FilePatternTrigger,
} from './trigger-generator.js';
export type {
  RouterCondition as ExtendedRouterCondition,
  ErrorRoute,
  ParallelRoute,
  RouterConfig,
} from './router-generator.js';
