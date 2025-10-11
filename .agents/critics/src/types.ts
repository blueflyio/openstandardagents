/**
 * TypeScript type definitions for Code Reviewer Agent
 */

export interface AgentConfig {
  name: string;
  version: string;
  port: number;
  capabilities: string[];
  security: SecurityConfig;
  quality: QualityConfig;
  cors: CorsConfig;
  rateLimit: RateLimitConfig;
  observability: ObservabilityConfig;
}

export interface SecurityConfig {
  require_authentication: boolean;
  require_authorization: boolean;
  max_file_size: number;
  allowed_file_types: string[];
  scan_timeout: number;
}

export interface QualityConfig {
  complexity_threshold: number;
  maintainability_threshold: number;
  coverage_threshold: number;
  duplication_threshold: number;
}

export interface CorsConfig {
  origin: string | string[];
  credentials: boolean;
}

export interface RateLimitConfig {
  requests_per_minute: number;
  burst_size: number;
}

export interface ObservabilityConfig {
  metrics_enabled: boolean;
  tracing_enabled: boolean;
  logging_level: 'debug' | 'info' | 'warn' | 'error';
}

// Request/Response types
export interface ReviewRequest {
  code: string;
  language: string;
  context?: ReviewContext;
  options?: ReviewOptions;
}

export interface ReviewContext {
  projectId?: string;
  branch?: string;
  commitId?: string;
  pullRequestId?: string;
  filePath?: string;
}

export interface ReviewOptions {
  includeSecurityScan?: boolean;
  includeQualityCheck?: boolean;
  includeComplexityAnalysis?: boolean;
  severity?: 'low' | 'medium' | 'high';
}

export interface ReviewResponse {
  success: boolean;
  summary: ReviewSummary;
  issues: Issue[];
  metrics: QualityMetrics;
  recommendations: string[];
  requestId: string;
  duration: number;
}

export interface ReviewSummary {
  totalIssues: number;
  criticalIssues: number;
  warningIssues: number;
  infoIssues: number;
  overallScore: number;
  status: 'passed' | 'failed' | 'warning';
}

export interface Issue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  category: 'security' | 'quality' | 'performance' | 'maintainability' | 'style';
  line?: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  message: string;
  description?: string;
  rule: string;
  ruleId: string;
  fixable: boolean;
  suggestedFix?: string;
  examples?: CodeExample[];
}

export interface CodeExample {
  title: string;
  before: string;
  after: string;
  explanation: string;
}

export interface QualityMetrics {
  complexity: ComplexityMetrics;
  maintainability: MaintainabilityMetrics;
  performance: PerformanceMetrics;
  security: SecurityMetrics;
  style: StyleMetrics;
}

export interface ComplexityMetrics {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  halsteadComplexity: number;
  nesting_depth: number;
  class_coupling: number;
}

export interface MaintainabilityMetrics {
  maintainabilityIndex: number;
  codeSmells: number;
  technicalDebt: string;
  duplications: number;
  testCoverage: number;
}

export interface PerformanceMetrics {
  potentialMemoryLeaks: number;
  inefficientAlgorithms: number;
  databaseQueries: number;
  asyncPatterns: number;
}

export interface SecurityMetrics {
  vulnerabilities: SecurityVulnerability[];
  securityScore: number;
  cweViolations: string[];
  sensitiveDataExposure: number;
}

export interface SecurityVulnerability {
  id: string;
  cweId: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  line?: number;
  recommendation: string;
}

export interface StyleMetrics {
  styleViolations: number;
  formattingIssues: number;
  namingConventions: number;
  documentation: DocumentationMetrics;
}

export interface DocumentationMetrics {
  commentRatio: number;
  missingDocumentation: number;
  outdatedComments: number;
}

// Security scan specific types
export interface SecurityScanRequest {
  code: string;
  language: string;
  dependencies?: DependencyInfo[];
  environment?: string;
}

export interface DependencyInfo {
  name: string;
  version: string;
  type: 'production' | 'development';
}

export interface SecurityScanResponse {
  vulnerabilities: SecurityVulnerability[];
  dependencyIssues: DependencyIssue[];
  securityScore: number;
  recommendations: string[];
}

export interface DependencyIssue {
  package: string;
  currentVersion: string;
  vulnerableVersions: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  cveIds: string[];
  recommendation: string;
}

// Quality check specific types
export interface QualityCheckRequest {
  code: string;
  language: string;
  metrics?: string[];
  thresholds?: QualityThresholds;
}

export interface QualityThresholds {
  complexity?: number;
  maintainability?: number;
  coverage?: number;
  duplication?: number;
}

export interface QualityCheckResponse {
  passed: boolean;
  metrics: QualityMetrics;
  violations: QualityViolation[];
  suggestions: QualitySuggestion[];
}

export interface QualityViolation {
  metric: string;
  threshold: number;
  actual: number;
  severity: 'error' | 'warning';
  message: string;
}

export interface QualitySuggestion {
  category: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
}

// Batch operations
export interface BatchReviewRequest {
  files: FileReviewRequest[];
  options?: ReviewOptions;
  parallel?: boolean;
}

export interface FileReviewRequest {
  filePath: string;
  content: string;
  language: string;
}

export interface BatchReviewResponse {
  success: boolean;
  results: FileReviewResult[];
  summary: BatchSummary;
  duration: number;
}

export interface FileReviewResult {
  filePath: string;
  success: boolean;
  review?: ReviewResponse;
  error?: string;
}

export interface BatchSummary {
  totalFiles: number;
  successfulReviews: number;
  failedReviews: number;
  totalIssues: number;
  averageScore: number;
}

// Health and capabilities
export interface HealthResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  checks: HealthCheck[];
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  duration?: number;
}

export interface CapabilitiesResponse {
  agent: string;
  version: string;
  category: string;
  capabilities: string[];
  supportedLanguages: string[];
  endpoints: EndpointInfo[];
  integrations: string[];
}

export interface EndpointInfo {
  path: string;
  method: string;
  description: string;
  authentication_required: boolean;
}

// Metrics and observability
export interface RequestMetrics {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  userAgent?: string;
  ip?: string;
}

export interface AgentMetrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    average_duration: number;
  };
  reviews: {
    total: number;
    passed: number;
    failed: number;
    average_score: number;
  };
  security: {
    scans_performed: number;
    vulnerabilities_found: number;
    critical_vulnerabilities: number;
  };
  performance: {
    uptime: number;
    memory_usage: number;
    cpu_usage: number;
  };
}

// Error types
export interface AgentError {
  code: string;
  message: string;
  details?: any;
  requestId?: string;
  timestamp: string;
}

export class ValidationError extends Error {
  public readonly code = 'VALIDATION_ERROR';
  public readonly statusCode = 400;

  constructor(message: string, public readonly field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class SecurityError extends Error {
  public readonly code = 'SECURITY_ERROR';
  public readonly statusCode = 403;

  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

export class ProcessingError extends Error {
  public readonly code = 'PROCESSING_ERROR';
  public readonly statusCode = 500;

  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'ProcessingError';
  }
}

export class RateLimitError extends Error {
  public readonly code = 'RATE_LIMIT_ERROR';
  public readonly statusCode = 429;

  constructor(message: string, public readonly retryAfter: number) {
    super(message);
    this.name = 'RateLimitError';
  }
}