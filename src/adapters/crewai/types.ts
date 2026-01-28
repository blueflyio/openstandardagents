/**
 * CrewAI Adapter Types
 */

export interface CrewAIAgentConfig {
  role: string;
  goal: string;
  backstory: string;
  llm?: {
    provider: string;
    model: string;
    temperature?: number;
  };
  tools?: string[];
  allow_delegation?: boolean;
  verbose?: boolean;
}

export interface CrewAITaskConfig {
  description: string;
  agent: string; // Agent role
  expected_output?: string;
  tools?: string[];
}

export interface CrewAICrewConfig {
  agents: CrewAIAgentConfig[];
  tasks: CrewAITaskConfig[];
  process?: 'sequential' | 'hierarchical';
  verbose?: boolean;
}
