/**
 * OSSA Agent Type System
 * Defines the hierarchy and capabilities of different agent types
 */

/**
 * Base agent capabilities that all agents share
 */
export interface BaseCapabilities {
  id: string;
  name: string;
  version: string;
  description: string;
  status: 'active' | 'inactive' | 'error' | 'initializing';
  healthCheck: () => Promise<boolean>;
  getMetrics: () => Promise<AgentMetrics>;
  shutdown?: () => Promise<void>;
}

/**
 * Agent performance metrics
 */
export interface AgentMetrics {
  requestsProcessed: number;
  averageResponseTime: number;
  errorRate: number;
  lastActive: Date;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
}

/**
 * Agent Type Hierarchy
 */
export enum AgentType {
  // Execution Agents
  TASK = 'task',
  WORKFLOW = 'workflow',
  ORCHESTRATOR = 'orchestrator',
  
  // Analysis Agents
  RESEARCH = 'research',
  ANALYZER = 'analyzer',
  MONITOR = 'monitor',
  
  // Transformation Agents
  TRANSCRIBER = 'transcriber',
  TRANSLATOR = 'translator',
  GENERATOR = 'generator',
  
  // Communication Agents
  ROUTER = 'router',
  MESSENGER = 'messenger',
  NOTIFIER = 'notifier',
  
  // Specialized Agents
  SECURITY = 'security',
  VALIDATOR = 'validator',
  OPTIMIZER = 'optimizer',
  
  // AI/ML Agents
  CLASSIFIER = 'classifier',
  PREDICTOR = 'predictor',
  TRAINER = 'trainer'
}

/**
 * Task Execution Agent
 */
export interface TaskAgent extends BaseCapabilities {
  type: AgentType.TASK;
  capabilities: {
    executeTask: (task: TaskDefinition) => Promise<TaskResult>;
    scheduleTask: (task: TaskDefinition, schedule: Schedule) => Promise<string>;
    cancelTask: (taskId: string) => Promise<void>;
    getTaskStatus: (taskId: string) => Promise<TaskStatus>;
  };
}

/**
 * Research Agent
 */
export interface ResearchAgent extends BaseCapabilities {
  type: AgentType.RESEARCH;
  capabilities: {
    search: (query: string, sources?: DataSource[]) => Promise<SearchResult[]>;
    analyze: (data: any) => Promise<AnalysisResult>;
    summarize: (content: string, options?: SummaryOptions) => Promise<string>;
    factCheck: (claim: string) => Promise<FactCheckResult>;
  };
}

/**
 * Audio Transcription Agent
 */
export interface TranscriberAgent extends BaseCapabilities {
  type: AgentType.TRANSCRIBER;
  capabilities: {
    transcribe: (audio: AudioInput) => Promise<TranscriptionResult>;
    detectLanguage: (audio: AudioInput) => Promise<string>;
    diarizeSpeakers: (audio: AudioInput) => Promise<Speaker[]>;
    generateSubtitles: (audio: AudioInput, format: SubtitleFormat) => Promise<string>;
  };
}

/**
 * Router Agent for message distribution
 */
export interface RouterAgent extends BaseCapabilities {
  type: AgentType.ROUTER;
  capabilities: {
    route: (message: Message) => Promise<RoutingDecision>;
    loadBalance: (agents: string[]) => Promise<string>;
    failover: (primaryAgent: string) => Promise<string>;
    broadcast: (message: Message, agents: string[]) => Promise<void>;
  };
}

/**
 * Security Agent
 */
export interface SecurityAgent extends BaseCapabilities {
  type: AgentType.SECURITY;
  capabilities: {
    authenticate: (credentials: Credentials) => Promise<AuthResult>;
    authorize: (user: string, resource: string, action: string) => Promise<boolean>;
    audit: (event: SecurityEvent) => Promise<void>;
    detectThreat: (activity: Activity) => Promise<ThreatLevel>;
    encrypt: (data: any) => Promise<EncryptedData>;
    decrypt: (data: EncryptedData) => Promise<any>;
  };
}

/**
 * Workflow Orchestration Agent
 */
export interface WorkflowAgent extends BaseCapabilities {
  type: AgentType.WORKFLOW;
  capabilities: {
    createWorkflow: (definition: WorkflowDefinition) => Promise<string>;
    executeWorkflow: (workflowId: string, input: any) => Promise<WorkflowResult>;
    pauseWorkflow: (workflowId: string) => Promise<void>;
    resumeWorkflow: (workflowId: string) => Promise<void>;
    getWorkflowStatus: (workflowId: string) => Promise<WorkflowStatus>;
  };
}

/**
 * Supporting type definitions
 */
export interface TaskDefinition {
  id?: string;
  name: string;
  type: string;
  payload: any;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  timeout?: number;
  retries?: number;
}

export interface TaskResult {
  taskId: string;
  status: 'success' | 'failure' | 'partial';
  result?: any;
  error?: Error;
  executionTime: number;
}

export interface TaskStatus {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

export interface Schedule {
  type: 'once' | 'recurring' | 'cron';
  startTime?: Date;
  interval?: number;
  cronExpression?: string;
}

export interface DataSource {
  type: 'web' | 'database' | 'file' | 'api';
  location: string;
  credentials?: any;
}

export interface SearchResult {
  source: string;
  relevance: number;
  content: string;
  metadata?: any;
}

export interface AnalysisResult {
  summary: string;
  insights: string[];
  recommendations?: string[];
  confidence: number;
}

export interface SummaryOptions {
  maxLength?: number;
  style?: 'bullet' | 'paragraph' | 'abstract';
  language?: string;
}

export interface FactCheckResult {
  claim: string;
  verdict: 'true' | 'false' | 'partially-true' | 'unverifiable';
  evidence: string[];
  confidence: number;
}

export interface AudioInput {
  format: 'wav' | 'mp3' | 'ogg' | 'flac' | 'raw';
  data: Buffer | string; // Buffer or file path
  sampleRate?: number;
  channels?: number;
}

export interface TranscriptionResult {
  text: string;
  language: string;
  confidence: number;
  timestamps?: TimestampedWord[];
  alternatives?: string[];
}

export interface TimestampedWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface Speaker {
  id: string;
  segments: SpeakerSegment[];
}

export interface SpeakerSegment {
  speakerId: string;
  start: number;
  end: number;
  text: string;
}

export type SubtitleFormat = 'srt' | 'vtt' | 'ass' | 'json';

export interface Message {
  id: string;
  from: string;
  to?: string;
  type: string;
  payload: any;
  timestamp: Date;
  priority?: number;
}

export interface RoutingDecision {
  targetAgent: string;
  reason: string;
  alternativeAgents?: string[];
}

export interface Credentials {
  type: 'jwt' | 'apikey' | 'oauth' | 'basic';
  value: string;
}

export interface AuthResult {
  authenticated: boolean;
  user?: string;
  roles?: string[];
  token?: string;
  expiresAt?: Date;
}

export interface SecurityEvent {
  type: string;
  user?: string;
  resource?: string;
  action: string;
  result: 'success' | 'failure';
  timestamp: Date;
  metadata?: any;
}

export interface Activity {
  user: string;
  actions: string[];
  timestamp: Date;
  source: string;
}

export type ThreatLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

export interface EncryptedData {
  algorithm: string;
  data: string;
  iv?: string;
  tag?: string;
}

export interface WorkflowDefinition {
  name: string;
  steps: WorkflowStep[];
  triggers?: WorkflowTrigger[];
  timeout?: number;
}

export interface WorkflowStep {
  id: string;
  agent: string;
  action: string;
  input?: any;
  dependsOn?: string[];
  condition?: string;
}

export interface WorkflowTrigger {
  type: 'manual' | 'schedule' | 'event' | 'webhook';
  config: any;
}

export interface WorkflowResult {
  workflowId: string;
  status: 'success' | 'failure' | 'partial';
  steps: StepResult[];
  executionTime: number;
}

export interface StepResult {
  stepId: string;
  status: 'success' | 'failure' | 'skipped';
  result?: any;
  error?: string;
  executionTime: number;
}

export interface WorkflowStatus {
  id: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  currentStep?: string;
  progress?: number;
  startTime?: Date;
  endTime?: Date;
}

/**
 * Agent Registry Entry
 */
export interface AgentRegistration {
  agent: BaseCapabilities;
  type: AgentType;
  endpoint?: string;
  capabilities: string[];
  requirements?: {
    cpu?: number;
    memory?: number;
    gpu?: boolean;
  };
  metadata?: any;
}

/**
 * Agent Factory for creating different agent types
 */
export interface AgentFactory {
  createAgent<T extends BaseCapabilities>(type: AgentType, config: any): Promise<T>;
  registerAgentType(type: AgentType, implementation: any): void;
  getAvailableTypes(): AgentType[];
  getAgentsByType(type: AgentType): Promise<BaseCapabilities[]>;
}