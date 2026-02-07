/**
 * GitLab Adapter
 * Converts OSSA agents to GitLab CI jobs and GitLab Duo Flows
 */

export { GitLabConverter } from './converter.js';
export { GitLabDuoFlowGenerator } from './flow-generator.js';
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
