/**
 * Utility functions for Code Reviewer Agent
 */

import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { AgentConfig, ValidationError, ProcessingError } from './types';

/**
 * Load configuration from multiple sources
 */
export function loadConfig(): AgentConfig {
  const defaultConfig: AgentConfig = {
    name: 'code-reviewer',
    version: '1.0.0',
    port: 3000,
    capabilities: [
      'code_analysis',
      'security_scanning',
      'quality_assessment',
      'compliance_checking'
    ],
    security: {
      require_authentication: true,
      require_authorization: true,
      max_file_size: 10 * 1024 * 1024, // 10MB
      allowed_file_types: ['.ts', '.js', '.py', '.java', '.go', '.rs', '.cpp', '.cs', '.php', '.rb'],
      scan_timeout: 30000
    },
    quality: {
      complexity_threshold: 10,
      maintainability_threshold: 70,
      coverage_threshold: 80,
      duplication_threshold: 5
    },
    cors: {
      origin: '*',
      credentials: false
    },
    rateLimit: {
      requests_per_minute: 1000,
      burst_size: 10
    },
    observability: {
      metrics_enabled: true,
      tracing_enabled: true,
      logging_level: 'info'
    }
  };

  // Override with environment variables
  const envConfig = loadEnvironmentConfig();

  // Override with config file if exists
  const fileConfig = loadFileConfig();

  return {
    ...defaultConfig,
    ...fileConfig,
    ...envConfig
  };
}

/**
 * Load configuration from environment variables
 */
function loadEnvironmentConfig(): Partial<AgentConfig> {
  const config: Partial<AgentConfig> = {};

  if (process.env.AGENT_PORT) {
    config.port = parseInt(process.env.AGENT_PORT, 10);
  }

  if (process.env.AGENT_NAME) {
    config.name = process.env.AGENT_NAME;
  }

  if (process.env.AGENT_VERSION) {
    config.version = process.env.AGENT_VERSION;
  }

  // Security configuration
  if (process.env.REQUIRE_AUTH !== undefined) {
    config.security = {
      ...config.security,
      require_authentication: process.env.REQUIRE_AUTH === 'true'
    };
  }

  if (process.env.MAX_FILE_SIZE) {
    config.security = {
      ...config.security,
      max_file_size: parseInt(process.env.MAX_FILE_SIZE, 10)
    };
  }

  // CORS configuration
  if (process.env.CORS_ORIGIN) {
    config.cors = {
      ...config.cors,
      origin: process.env.CORS_ORIGIN
    };
  }

  // Rate limiting
  if (process.env.RATE_LIMIT_RPM) {
    config.rateLimit = {
      ...config.rateLimit,
      requests_per_minute: parseInt(process.env.RATE_LIMIT_RPM, 10)
    };
  }

  // Logging level
  if (process.env.LOG_LEVEL) {
    config.observability = {
      ...config.observability,
      logging_level: process.env.LOG_LEVEL as any
    };
  }

  return config;
}

/**
 * Load configuration from file
 */
function loadFileConfig(): Partial<AgentConfig> {
  const configPaths = [
    path.join(process.cwd(), 'config', 'default.json'),
    path.join(process.cwd(), 'config', `${process.env.NODE_ENV || 'development'}.json`),
    path.join(__dirname, '..', 'config', 'default.json')
  ];

  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(configContent);
      } catch (error) {
        console.warn(`Failed to load config from ${configPath}:`, error);
      }
    }
  }

  return {};
}

/**
 * Input validation middleware factory
 */
export function validateInput(schemaType: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      switch (schemaType) {
        case 'ReviewRequest':
          validateReviewRequest(req.body);
          break;
        case 'SecurityScanRequest':
          validateSecurityScanRequest(req.body);
          break;
        case 'QualityCheckRequest':
          validateQualityCheckRequest(req.body);
          break;
        case 'BatchReviewRequest':
          validateBatchReviewRequest(req.body);
          break;
        default:
          throw new ValidationError(`Unknown schema type: ${schemaType}`);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Validate review request
 */
function validateReviewRequest(body: any): void {
  if (!body) {
    throw new ValidationError('Request body is required');
  }

  if (!body.code || typeof body.code !== 'string') {
    throw new ValidationError('Code is required and must be a string', 'code');
  }

  if (!body.language || typeof body.language !== 'string') {
    throw new ValidationError('Language is required and must be a string', 'language');
  }

  if (body.code.length === 0) {
    throw new ValidationError('Code cannot be empty', 'code');
  }

  if (body.code.length > 10 * 1024 * 1024) { // 10MB
    throw new ValidationError('Code exceeds maximum size limit', 'code');
  }

  const supportedLanguages = [
    'typescript', 'javascript', 'python', 'java', 'go',
    'rust', 'cpp', 'csharp', 'php', 'ruby'
  ];

  if (!supportedLanguages.includes(body.language.toLowerCase())) {
    throw new ValidationError(
      `Unsupported language: ${body.language}. Supported: ${supportedLanguages.join(', ')}`,
      'language'
    );
  }

  // Validate optional fields
  if (body.context && typeof body.context !== 'object') {
    throw new ValidationError('Context must be an object', 'context');
  }

  if (body.options && typeof body.options !== 'object') {
    throw new ValidationError('Options must be an object', 'options');
  }

  if (body.options?.severity && !['low', 'medium', 'high'].includes(body.options.severity)) {
    throw new ValidationError('Severity must be low, medium, or high', 'options.severity');
  }
}

/**
 * Validate security scan request
 */
function validateSecurityScanRequest(body: any): void {
  validateReviewRequest(body); // Reuse basic validation

  if (body.dependencies && !Array.isArray(body.dependencies)) {
    throw new ValidationError('Dependencies must be an array', 'dependencies');
  }

  if (body.dependencies) {
    for (const dep of body.dependencies) {
      if (!dep.name || !dep.version) {
        throw new ValidationError('Each dependency must have name and version', 'dependencies');
      }
    }
  }
}

/**
 * Validate quality check request
 */
function validateQualityCheckRequest(body: any): void {
  validateReviewRequest(body); // Reuse basic validation

  if (body.metrics && !Array.isArray(body.metrics)) {
    throw new ValidationError('Metrics must be an array', 'metrics');
  }

  if (body.thresholds && typeof body.thresholds !== 'object') {
    throw new ValidationError('Thresholds must be an object', 'thresholds');
  }

  if (body.thresholds) {
    const validThresholds = ['complexity', 'maintainability', 'coverage', 'duplication'];
    for (const [key, value] of Object.entries(body.thresholds)) {
      if (!validThresholds.includes(key)) {
        throw new ValidationError(`Invalid threshold: ${key}`, 'thresholds');
      }
      if (typeof value !== 'number' || value < 0 || value > 100) {
        throw new ValidationError(`Threshold ${key} must be a number between 0 and 100`, 'thresholds');
      }
    }
  }
}

/**
 * Validate batch review request
 */
function validateBatchReviewRequest(body: any): void {
  if (!body.files || !Array.isArray(body.files)) {
    throw new ValidationError('Files array is required', 'files');
  }

  if (body.files.length === 0) {
    throw new ValidationError('At least one file is required', 'files');
  }

  if (body.files.length > 100) {
    throw new ValidationError('Maximum 100 files per batch', 'files');
  }

  for (let i = 0; i < body.files.length; i++) {
    const file = body.files[i];
    if (!file.filePath || !file.content || !file.language) {
      throw new ValidationError(
        `File at index ${i} must have filePath, content, and language`,
        `files[${i}]`
      );
    }
  }

  if (body.options && typeof body.options !== 'object') {
    throw new ValidationError('Options must be an object', 'options');
  }

  if (body.parallel !== undefined && typeof body.parallel !== 'boolean') {
    throw new ValidationError('Parallel must be a boolean', 'parallel');
  }
}

/**
 * Error handling middleware
 */
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = (req as any).requestId || 'unknown';
  const timestamp = new Date().toISOString();

  // Log the error
  console.error(JSON.stringify({
    timestamp,
    level: 'error',
    message: 'Request error',
    requestId,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error
  }));

  if (error instanceof ValidationError) {
    res.status(error.statusCode).json({
      error: error.code,
      message: error.message,
      field: error.field,
      requestId,
      timestamp
    });
  } else if (error instanceof ProcessingError) {
    res.status(error.statusCode).json({
      error: error.code,
      message: error.message,
      requestId,
      timestamp
    });
  } else {
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      requestId,
      timestamp
    });
  }
}

/**
 * Sanitize input to prevent code injection
 */
export function sanitizeCode(code: string): string {
  // Remove potentially dangerous patterns
  let sanitized = code
    .replace(/eval\s*\(/gi, 'EVAL_REMOVED(')
    .replace(/Function\s*\(/gi, 'FUNCTION_REMOVED(')
    .replace(/setTimeout\s*\(/gi, 'SETTIMEOUT_REMOVED(')
    .replace(/setInterval\s*\(/gi, 'SETINTERVAL_REMOVED(');

  // Limit code size
  if (sanitized.length > 1024 * 1024) { // 1MB
    sanitized = sanitized.substring(0, 1024 * 1024) + '\n// ... truncated';
  }

  return sanitized;
}

/**
 * Detect programming language from code content
 */
export function detectLanguage(code: string, filename?: string): string {
  // Check file extension first
  if (filename) {
    const ext = path.extname(filename).toLowerCase();
    const extensionMap: Record<string, string> = {
      '.ts': 'typescript',
      '.js': 'javascript',
      '.py': 'python',
      '.java': 'java',
      '.go': 'go',
      '.rs': 'rust',
      '.cpp': 'cpp',
      '.cxx': 'cpp',
      '.cc': 'cpp',
      '.cs': 'csharp',
      '.php': 'php',
      '.rb': 'ruby'
    };

    if (extensionMap[ext]) {
      return extensionMap[ext];
    }
  }

  // Analyze code patterns
  const patterns = {
    typescript: [/interface\s+\w+/, /type\s+\w+\s*=/, /: \w+(\[\])?(\s*\|\s*\w+)*\s*[=;]/],
    javascript: [/var\s+\w+/, /function\s+\w+/, /console\.log/],
    python: [/def\s+\w+/, /import\s+\w+/, /print\s*\(/],
    java: [/public\s+class/, /public\s+static\s+void\s+main/, /System\.out\.println/],
    go: [/package\s+\w+/, /func\s+\w+/, /fmt\.Println/],
    rust: [/fn\s+\w+/, /let\s+mut/, /println!/],
    cpp: [/#include\s*</, /std::/, /cout\s*<</],
    csharp: [/using\s+System/, /public\s+class/, /Console\.WriteLine/],
    php: [/<\?php/, /echo\s+/, /\$\w+/],
    ruby: [/def\s+\w+/, /puts\s+/, /end\s*$/m]
  };

  for (const [language, langPatterns] of Object.entries(patterns)) {
    const matches = langPatterns.filter(pattern => pattern.test(code)).length;
    if (matches >= 2) {
      return language;
    }
  }

  return 'unknown';
}

/**
 * Calculate file hash for caching
 */
export function calculateHash(content: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }

  const seconds = Math.floor(milliseconds / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Create safe filename from arbitrary string
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 255);
}

/**
 * Check if code contains sensitive information
 */
export function containsSensitiveData(code: string): boolean {
  const sensitivePatterns = [
    /password\s*[:=]\s*["'][^"']+["']/i,
    /api[_-]?key\s*[:=]\s*["'][^"']+["']/i,
    /secret\s*[:=]\s*["'][^"']+["']/i,
    /token\s*[:=]\s*["'][^"']+["']/i,
    /private[_-]?key\s*[:=]/i,
    /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/, // Credit card
    /\b\d{3}-?\d{2}-?\d{4}\b/ // SSN
  ];

  return sensitivePatterns.some(pattern => pattern.test(code));
}

/**
 * Rate limiting utilities
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  isRateLimited(clientId: string, limit: number, windowMs: number = 60000): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!this.requests.has(clientId)) {
      this.requests.set(clientId, []);
    }

    const clientRequests = this.requests.get(clientId)!;

    // Remove old requests outside the window
    const validRequests = clientRequests.filter(timestamp => timestamp > windowStart);
    this.requests.set(clientId, validRequests);

    // Check if limit exceeded
    if (validRequests.length >= limit) {
      return true;
    }

    // Add current request
    validRequests.push(now);
    return false;
  }

  getRemainingRequests(clientId: string, limit: number, windowMs: number = 60000): number {
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!this.requests.has(clientId)) {
      return limit;
    }

    const clientRequests = this.requests.get(clientId)!;
    const validRequests = clientRequests.filter(timestamp => timestamp > windowStart);

    return Math.max(0, limit - validRequests.length);
  }

  cleanup(): void {
    const now = Date.now();
    const windowMs = 60000; // 1 minute

    for (const [clientId, requests] of this.requests.entries()) {
      const validRequests = requests.filter(timestamp => timestamp > now - windowMs);
      if (validRequests.length === 0) {
        this.requests.delete(clientId);
      } else {
        this.requests.set(clientId, validRequests);
      }
    }
  }
}