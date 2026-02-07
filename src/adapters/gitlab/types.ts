/**
 * GitLab Adapter Types
 */

export interface GitLabJobConfig {
  image?: string;
  stage?: string;
  script: string[];
  variables?: Record<string, string>;
  artifacts?: {
    paths?: string[];
    expire_in?: string;
  };
  rules?: Array<{
    if?: string;
    when?: string;
  }>;
}

export interface GitLabPipelineConfig {
  stages: string[];
  jobs: Record<string, GitLabJobConfig>;
}

/**
 * GitLab Duo Flow Registry v1 Types
 */

export type FlowEnvironment = 'ambient' | 'chat' | 'chat-partial';

export type ComponentType = 'AgentComponent' | 'DeterministicStepComponent' | 'OneOffComponent';

export interface FlowInput {
  from: string;
  as?: string;
  literal?: boolean;
}

export interface AgentComponent {
  name: string;
  type: 'AgentComponent';
  prompt_id: string;
  prompt_version?: string | null;
  inputs?: FlowInput[];
  toolset?: string[];
  ui_log_events?: string[];
  ui_role_as?: 'agent' | 'tool';
}

export interface DeterministicStepComponent {
  name: string;
  type: 'DeterministicStepComponent';
  tool_name: string;
  toolset?: string[];
  inputs?: FlowInput[];
  ui_log_events?: string[];
  ui_role_as?: 'agent' | 'tool';
}

export interface OneOffComponent {
  name: string;
  type: 'OneOffComponent';
  prompt_id: string;
  prompt_version?: string | null;
  toolset: string[];
  inputs?: FlowInput[];
  max_correction_attempts?: number;
  ui_log_events?: string[];
}

export type FlowComponent = AgentComponent | DeterministicStepComponent | OneOffComponent;

export interface RouterCondition {
  input: string;
  routes: Record<string, string>;
}

export interface FlowRouter {
  from: string;
  to?: string;
  condition?: RouterCondition;
}

export interface PromptModelParams {
  model_class_provider: 'anthropic' | 'openai' | 'vertexai';
  model: string;
  max_tokens?: number;
  temperature?: number;
}

export interface PromptTemplate {
  system: string;
  user: string;
  placeholder?: 'history';
}

export interface PromptParams {
  timeout?: number;
  stop?: string[];
  vertex_location?: string;
}

export interface FlowPrompt {
  prompt_id: string;
  name: string;
  model: {
    params: PromptModelParams;
  };
  unit_primitives: unknown[];
  prompt_template: PromptTemplate;
  params: PromptParams;
}

export interface FlowConfig {
  entry_point: string;
}

export interface GitLabDuoFlow {
  version: 'v1';
  environment: FlowEnvironment;
  name?: string;
  description?: string;
  product_group?: string;
  components: FlowComponent[];
  routers: FlowRouter[];
  prompts?: FlowPrompt[];
  flow: FlowConfig;
}

/**
 * GitLab Duo External Agent Types
 */

export interface ExternalAgentConfig {
  image: string;
  commands: string[];
  variables: string[];
  injectGatewayToken?: boolean;
}
