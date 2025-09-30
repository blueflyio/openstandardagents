/**
 * Clean Architecture Types and Specifications for OSSA v0.1.9
 * Defines the core architectural patterns, constraints, and validation rules
 */

// Core Architecture Layers
export enum ArchitectureLayer {
  ENTITIES = 'entities',
  USE_CASES = 'use_cases',
  INTERFACE_ADAPTERS = 'interface_adapters',
  FRAMEWORKS_DRIVERS = 'frameworks_drivers'
}

export interface ArchitecturePattern {
  id: string;
  name: string;
  version: string;
  type: PatternType;
  layers: LayerDefinition[];
  dependencies: DependencyRule[];
  constraints: ArchitectureConstraint[];
  metadata: ArchitectureMetadata;
}

export enum PatternType {
  CLEAN_ARCHITECTURE = 'clean_architecture',
  HEXAGONAL = 'hexagonal',
  ONION = 'onion',
  LAYERED = 'layered',
  MICROSERVICES = 'microservices',
  EVENT_DRIVEN = 'event_driven',
  CQRS = 'cqrs',
  DOMAIN_DRIVEN = 'domain_driven'
}

export interface LayerDefinition {
  name: string;
  layer: ArchitectureLayer;
  description: string;
  responsibilities: string[];
  allowedDependencies: string[];
  prohibitedDependencies: string[];
  patterns: string[];
  artifacts: ArtifactType[];
}

export enum ArtifactType {
  ENTITY = 'entity',
  USE_CASE = 'use_case',
  REPOSITORY = 'repository',
  CONTROLLER = 'controller',
  PRESENTER = 'presenter',
  GATEWAY = 'gateway',
  SERVICE = 'service',
  FACTORY = 'factory',
  ADAPTER = 'adapter',
  POLICY = 'policy'
}

export interface DependencyRule {
  id: string;
  from: string;
  to: string;
  type: DependencyType;
  direction: DependencyDirection;
  strength: DependencyStrength;
  constraints?: string[];
}

export enum DependencyType {
  IMPORT = 'import',
  COMPOSITION = 'composition',
  INHERITANCE = 'inheritance',
  AGGREGATION = 'aggregation',
  ASSOCIATION = 'association',
  DEPENDENCY_INJECTION = 'dependency_injection'
}

export enum DependencyDirection {
  INWARD = 'inward',
  OUTWARD = 'outward',
  BIDIRECTIONAL = 'bidirectional',
  PROHIBITED = 'prohibited'
}

export enum DependencyStrength {
  MANDATORY = 'mandatory',
  OPTIONAL = 'optional',
  CONDITIONAL = 'conditional',
  FORBIDDEN = 'forbidden'
}

export interface ArchitectureConstraint {
  id: string;
  name: string;
  type: ConstraintType;
  scope: ConstraintScope;
  rule: string;
  severity: ConstraintSeverity;
  autoFix?: boolean;
  message: string;
}

export enum ConstraintType {
  DEPENDENCY_DIRECTION = 'dependency_direction',
  LAYER_ISOLATION = 'layer_isolation',
  NAMING_CONVENTION = 'naming_convention',
  FILE_STRUCTURE = 'file_structure',
  MODULE_SIZE = 'module_size',
  CYCLIC_DEPENDENCY = 'cyclic_dependency',
  ABSTRACTION_LEVEL = 'abstraction_level',
  COUPLING = 'coupling',
  COHESION = 'cohesion'
}

export enum ConstraintScope {
  GLOBAL = 'global',
  LAYER = 'layer',
  MODULE = 'module',
  CLASS = 'class',
  METHOD = 'method',
  PACKAGE = 'package'
}

export enum ConstraintSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  SUGGESTION = 'suggestion'
}

export interface ArchitectureMetadata {
  author: string;
  description: string;
  version: string;
  tags: string[];
  documentation?: string;
  examples?: string[];
  created: Date;
  updated: Date;
  compliance: ComplianceStandard[];
}

export interface ComplianceStandard {
  name: string;
  version: string;
  requirements: string[];
  certification?: string;
}

// Compliance and Validation Types
export interface ComplianceCheck {
  id: string;
  name: string;
  description: string;
  type: ComplianceType;
  standard: string;
  rules: ValidationRule[];
  severity: ConstraintSeverity;
  autoRemediable: boolean;
}

export enum ComplianceType {
  ARCHITECTURE = 'architecture',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  MAINTAINABILITY = 'maintainability',
  TESTABILITY = 'testability',
  ACCESSIBILITY = 'accessibility'
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  expression: string;
  parameters?: Record<string, any>;
  tags: string[];
}

export interface ArchitectureViolation {
  id: string;
  checkId: string;
  ruleId: string;
  severity: ConstraintSeverity;
  message: string;
  location: ViolationLocation;
  suggestion?: string;
  autoFix?: AutoFix;
  metadata: ViolationMetadata;
}

export interface ViolationLocation {
  file: string;
  line?: number;
  column?: number;
  startLine?: number;
  endLine?: number;
  function?: string;
  class?: string;
  module?: string;
}

export interface AutoFix {
  type: FixType;
  description: string;
  changes: CodeChange[];
  riskLevel: RiskLevel;
}

export enum FixType {
  REFACTOR = 'refactor',
  MOVE = 'move',
  RENAME = 'rename',
  EXTRACT = 'extract',
  INLINE = 'inline',
  REPLACE = 'replace',
  ADD = 'add',
  REMOVE = 'remove'
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface CodeChange {
  file: string;
  type: ChangeType;
  oldContent?: string;
  newContent: string;
  startLine?: number;
  endLine?: number;
}

export enum ChangeType {
  INSERT = 'insert',
  DELETE = 'delete',
  REPLACE = 'replace',
  MOVE = 'move'
}

export interface ViolationMetadata {
  detected: Date;
  detector: string;
  confidence: number;
  impact: ImpactLevel;
  effort: EffortLevel;
  category: string[];
}

export enum ImpactLevel {
  MINIMAL = 'minimal',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum EffortLevel {
  TRIVIAL = 'trivial',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

// Quality Metrics
export interface QualityMetrics {
  architecturalCompliance: number;
  maintainabilityIndex: number;
  technicalDebt: number;
  cyclomaticComplexity: number;
  couplingBetweenObjects: number;
  depthOfInheritance: number;
  linesOfCode: number;
  testCoverage: number;
  duplicateCode: number;
  violations: ViolationSummary;
}

export interface ViolationSummary {
  total: number;
  byType: Record<ConstraintType, number>;
  bySeverity: Record<ConstraintSeverity, number>;
  byLayer: Record<ArchitectureLayer, number>;
  trend: TrendData;
}

export interface TrendData {
  period: string;
  samples: TrendSample[];
}

export interface TrendSample {
  timestamp: Date;
  value: number;
  change?: number;
}

// Migration and Refactoring
export interface MigrationPlan {
  id: string;
  name: string;
  description: string;
  fromPattern: string;
  toPattern: string;
  phases: MigrationPhase[];
  risks: MigrationRisk[];
  timeline: Timeline;
  metadata: MigrationMetadata;
}

export interface MigrationPhase {
  id: string;
  name: string;
  description: string;
  order: number;
  tasks: MigrationTask[];
  dependencies: string[];
  rollbackPlan?: RollbackPlan;
}

export interface MigrationTask {
  id: string;
  name: string;
  description: string;
  type: TaskType;
  automation: AutomationLevel;
  estimatedEffort: number;
  risks: string[];
  validation: string[];
  artifacts: string[];
}

export enum TaskType {
  ANALYSIS = 'analysis',
  REFACTOR = 'refactor',
  TEST = 'test',
  DEPLOY = 'deploy',
  VALIDATE = 'validate',
  ROLLBACK = 'rollback'
}

export enum AutomationLevel {
  MANUAL = 'manual',
  SEMI_AUTOMATED = 'semi_automated',
  AUTOMATED = 'automated',
  FULLY_AUTOMATED = 'fully_automated'
}

export interface MigrationRisk {
  id: string;
  description: string;
  probability: number;
  impact: ImpactLevel;
  mitigation: string;
  contingency?: string;
}

export interface Timeline {
  start: Date;
  end: Date;
  milestones: Milestone[];
}

export interface Milestone {
  name: string;
  date: Date;
  deliverables: string[];
  criteria: string[];
}

export interface RollbackPlan {
  triggers: string[];
  steps: RollbackStep[];
  rpo: number; // Recovery Point Objective in minutes
  rto: number; // Recovery Time Objective in minutes
}

export interface RollbackStep {
  order: number;
  description: string;
  command?: string;
  validation: string;
}

export interface MigrationMetadata {
  author: string;
  version: string;
  created: Date;
  updated: Date;
  approvals: Approval[];
  status: MigrationStatus;
}

export interface Approval {
  role: string;
  approver: string;
  date: Date;
  comments?: string;
}

export enum MigrationStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  APPROVED = 'approved',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back'
}

// Configuration and Settings
export interface ArchitectureConfig {
  patterns: ArchitecturePattern[];
  checks: ComplianceCheck[];
  rules: GlobalRule[];
  enforcement: EnforcementConfig;
  reporting: ReportingConfig;
  integration: IntegrationConfig;
}

export interface GlobalRule {
  id: string;
  name: string;
  description: string;
  type: RuleType;
  scope: string[];
  enabled: boolean;
  configuration: Record<string, any>;
}

export enum RuleType {
  STRUCTURE = 'structure',
  NAMING = 'naming',
  DEPENDENCY = 'dependency',
  COMPLEXITY = 'complexity',
  DOCUMENTATION = 'documentation',
  TESTING = 'testing'
}

export interface EnforcementConfig {
  mode: EnforcementMode;
  failOnViolation: boolean;
  maxViolations: number;
  blockedSeverities: ConstraintSeverity[];
  exemptions: Exemption[];
}

export enum EnforcementMode {
  STRICT = 'strict',
  MODERATE = 'moderate',
  ADVISORY = 'advisory',
  DISABLED = 'disabled'
}

export interface Exemption {
  id: string;
  pattern: string;
  reason: string;
  expiry?: Date;
  approver: string;
}

export interface ReportingConfig {
  formats: ReportFormat[];
  destinations: ReportDestination[];
  schedule: ReportSchedule;
  retention: number; // days
}

export enum ReportFormat {
  JSON = 'json',
  HTML = 'html',
  PDF = 'pdf',
  MARKDOWN = 'markdown',
  JUNIT = 'junit',
  SONAR = 'sonar'
}

export interface ReportDestination {
  type: DestinationType;
  configuration: Record<string, any>;
}

export enum DestinationType {
  FILE = 'file',
  EMAIL = 'email',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
  DATABASE = 'database'
}

export interface ReportSchedule {
  frequency: ScheduleFrequency;
  time?: string;
  days?: number[];
  timezone?: string;
}

export enum ScheduleFrequency {
  REAL_TIME = 'real_time',
  ON_COMMIT = 'on_commit',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

export interface IntegrationConfig {
  cicd: CICDIntegration[];
  ides: IDEIntegration[];
  qualityGates: QualityGateConfig[];
}

export interface CICDIntegration {
  platform: CICDPlatform;
  configuration: Record<string, any>;
  triggers: TriggerEvent[];
  reports: ReportFormat[];
}

export enum CICDPlatform {
  GITLAB_CI = 'gitlab_ci',
  GITHUB_ACTIONS = 'github_actions',
  JENKINS = 'jenkins',
  AZURE_DEVOPS = 'azure_devops',
  CIRCLECI = 'circleci',
  TRAVIS_CI = 'travis_ci'
}

export enum TriggerEvent {
  COMMIT = 'commit',
  MERGE_REQUEST = 'merge_request',
  DEPLOY = 'deploy',
  SCHEDULE = 'schedule',
  MANUAL = 'manual'
}

export interface IDEIntegration {
  ide: IDEType;
  plugin: string;
  configuration: Record<string, any>;
  features: IDEFeature[];
}

export enum IDEType {
  VSCODE = 'vscode',
  INTELLIJ = 'intellij',
  ECLIPSE = 'eclipse',
  VIM = 'vim',
  EMACS = 'emacs'
}

export enum IDEFeature {
  REAL_TIME_VALIDATION = 'real_time_validation',
  AUTO_FIX = 'auto_fix',
  REFACTORING_SUGGESTIONS = 'refactoring_suggestions',
  ARCHITECTURE_VISUALIZATION = 'architecture_visualization',
  QUALITY_METRICS = 'quality_metrics'
}

export interface QualityGateConfig {
  id: string;
  name: string;
  conditions: QualityCondition[];
  actions: QualityAction[];
  enabled: boolean;
}

export interface QualityCondition {
  metric: string;
  operator: ComparisonOperator;
  threshold: number;
  severity: ConstraintSeverity;
}

export enum ComparisonOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  GREATER_THAN_OR_EQUAL = 'greater_than_or_equal',
  LESS_THAN = 'less_than',
  LESS_THAN_OR_EQUAL = 'less_than_or_equal',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains'
}

export interface QualityAction {
  type: ActionType;
  configuration: Record<string, any>;
}

export enum ActionType {
  BLOCK_MERGE = 'block_merge',
  SEND_NOTIFICATION = 'send_notification',
  CREATE_ISSUE = 'create_issue',
  TRIGGER_PIPELINE = 'trigger_pipeline',
  AUTO_REMEDIATE = 'auto_remediate'
}
