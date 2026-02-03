/**
 * Security Validator
 * Checks OSSA manifests for security vulnerabilities and issues
 *
 * SOLID: Single Responsibility - Only handles security validation
 * DRY: Centralized security rules and patterns
 */

import type { OssaAgent } from '../../types/index.js';

/**
 * Security severity levels
 */
export type SecuritySeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * Security vulnerability
 */
export interface SecurityVulnerability {
  severity: SecuritySeverity;
  category: string;
  message: string;
  path: string;
  recommendation: string;
  cwe?: string; // Common Weakness Enumeration ID
}

/**
 * Security validation result
 */
export interface SecurityValidationResult {
  score: number; // 0-100
  vulnerabilities: SecurityVulnerability[];
  passed: boolean;
}

/**
 * Patterns that might indicate API keys or secrets
 */
const SECRET_PATTERNS = [
  /sk-[a-zA-Z0-9]{32,}/i, // OpenAI keys
  /sk-ant-[a-zA-Z0-9-]{32,}/i, // Anthropic keys
  /AIza[a-zA-Z0-9_-]{35}/i, // Google API keys
  /xoxb-[a-zA-Z0-9-]+/i, // Slack bot tokens
  /ghp_[a-zA-Z0-9]{36}/i, // GitHub personal access tokens
  /gho_[a-zA-Z0-9]{36}/i, // GitHub OAuth tokens
  /(?:^|[^a-zA-Z0-9])([a-f0-9]{32})(?:[^a-zA-Z0-9]|$)/i, // Generic 32-char hex
  /-----BEGIN (RSA |DSA |EC )?PRIVATE KEY-----/i, // Private keys
  /Bearer\s+[a-zA-Z0-9_-]+/i, // Bearer tokens
  /Basic\s+[a-zA-Z0-9+/=]+/i, // Basic auth
];

/**
 * Suspicious environment variable names
 */
const SUSPICIOUS_ENV_VARS = [
  'api_key',
  'apikey',
  'secret',
  'password',
  'token',
  'credentials',
  'private_key',
  'secret_key',
  'access_token',
  'refresh_token',
];

/**
 * Security Validator Service
 */
export class SecurityValidator {
  /**
   * Validate security of an agent manifest
   */
  validate(manifest: OssaAgent): SecurityValidationResult {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Check for exposed secrets
    vulnerabilities.push(...this.checkForSecrets(manifest));

    // Check for insecure configurations
    vulnerabilities.push(...this.checkInsecureConfig(manifest));

    // Check for missing security controls
    vulnerabilities.push(...this.checkMissingControls(manifest));

    // Check for overly permissive settings
    vulnerabilities.push(...this.checkPermissions(manifest));

    // Check for insecure dependencies
    vulnerabilities.push(...this.checkDependencies(manifest));

    // Calculate security score
    const score = this.calculateScore(vulnerabilities);

    return {
      score,
      vulnerabilities,
      passed: score >= 70 && !vulnerabilities.some((v) => v.severity === 'critical'),
    };
  }

  /**
   * Check for exposed secrets in manifest
   */
  private checkForSecrets(manifest: OssaAgent): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    const manifestStr = JSON.stringify(manifest);

    // Check for API key patterns
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(manifestStr)) {
        vulnerabilities.push({
          severity: 'critical',
          category: 'exposed_secret',
          message: 'Potential API key or secret found in manifest',
          path: 'manifest',
          recommendation:
            'Use environment variables or secret management system. Never commit secrets to manifests.',
          cwe: 'CWE-798',
        });
        break; // Only report once per manifest
      }
    }

    // Check for suspicious values in config
    this.checkObjectForSecrets(manifest, '', vulnerabilities);

    return vulnerabilities;
  }

  /**
   * Recursively check object for secrets
   */
  private checkObjectForSecrets(
    obj: unknown,
    path: string,
    vulnerabilities: SecurityVulnerability[]
  ): void {
    if (!obj || typeof obj !== 'object') {
      return;
    }

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      const lowerKey = key.toLowerCase();

      // Check if key name suggests it contains a secret
      if (SUSPICIOUS_ENV_VARS.some((pattern) => lowerKey.includes(pattern))) {
        if (typeof value === 'string' && value.trim() !== '' && value !== '${...}') {
          vulnerabilities.push({
            severity: 'high',
            category: 'potential_secret',
            message: `Field "${currentPath}" may contain sensitive data`,
            path: currentPath,
            recommendation: `Use environment variable references like "\${${key.toUpperCase()}}" instead of hardcoded values.`,
            cwe: 'CWE-798',
          });
        }
      }

      // Recurse into nested objects
      if (typeof value === 'object') {
        this.checkObjectForSecrets(value, currentPath, vulnerabilities);
      }
    }
  }

  /**
   * Check for insecure configurations
   */
  private checkInsecureConfig(manifest: OssaAgent): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Check for missing authentication
    const tools = manifest.spec?.tools || manifest.agent?.tools || [];
    for (let i = 0; i < tools.length; i++) {
      const tool = tools[i];
      if (tool.endpoint && !tool.auth) {
        vulnerabilities.push({
          severity: 'medium',
          category: 'missing_auth',
          message: `Tool "${tool.name || `tool[${i}]`}" has endpoint but no authentication configured`,
          path: `spec.tools[${i}]`,
          recommendation:
            'Configure authentication for external tool endpoints using auth.type (apiKey, oauth2, bearer).',
          cwe: 'CWE-306',
        });
      }
    }

    // Check for insecure endpoints (http instead of https)
    this.checkInsecureEndpoints(manifest, vulnerabilities);

    return vulnerabilities;
  }

  /**
   * Check for insecure HTTP endpoints
   */
  private checkInsecureEndpoints(
    manifest: OssaAgent,
    vulnerabilities: SecurityVulnerability[]
  ): void {
    const tools = manifest.spec?.tools || manifest.agent?.tools || [];

    for (let i = 0; i < tools.length; i++) {
      const tool = tools[i];
      if (tool.endpoint && typeof tool.endpoint === 'string') {
        if (tool.endpoint.startsWith('http://')) {
          vulnerabilities.push({
            severity: 'medium',
            category: 'insecure_endpoint',
            message: `Tool "${tool.name || `tool[${i}]`}" uses insecure HTTP endpoint`,
            path: `spec.tools[${i}].endpoint`,
            recommendation: 'Use HTTPS instead of HTTP for all external endpoints.',
            cwe: 'CWE-319',
          });
        }
      }
    }

    // Check observability endpoints
    const tracing = manifest.spec?.observability?.tracing;
    if (tracing?.endpoint && tracing.endpoint.startsWith('http://')) {
      vulnerabilities.push({
        severity: 'low',
        category: 'insecure_endpoint',
        message: 'Tracing endpoint uses insecure HTTP',
        path: 'spec.observability.tracing.endpoint',
        recommendation: 'Use HTTPS for tracing endpoints.',
        cwe: 'CWE-319',
      });
    }

    const metrics = manifest.spec?.observability?.metrics;
    if (metrics?.endpoint && metrics.endpoint.startsWith('http://')) {
      vulnerabilities.push({
        severity: 'low',
        category: 'insecure_endpoint',
        message: 'Metrics endpoint uses insecure HTTP',
        path: 'spec.observability.metrics.endpoint',
        recommendation: 'Use HTTPS for metrics endpoints.',
        cwe: 'CWE-319',
      });
    }
  }

  /**
   * Check for missing security controls
   */
  private checkMissingControls(manifest: OssaAgent): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Check for missing autonomy controls
    if (!manifest.spec?.autonomy) {
      vulnerabilities.push({
        severity: 'high',
        category: 'missing_controls',
        message: 'No autonomy configuration found',
        path: 'spec.autonomy',
        recommendation:
          'Define autonomy level and approval requirements to prevent unauthorized actions.',
        cwe: 'CWE-285',
      });
    } else {
      const autonomy = manifest.spec.autonomy;
      if (!autonomy.blocked_actions || autonomy.blocked_actions.length === 0) {
        vulnerabilities.push({
          severity: 'medium',
          category: 'missing_controls',
          message: 'No blocked actions defined in autonomy configuration',
          path: 'spec.autonomy.blocked_actions',
          recommendation:
            'Define blocked_actions to prevent dangerous operations (e.g., file deletion, system commands).',
          cwe: 'CWE-285',
        });
      }
    }

    // Check for missing constraints
    if (!manifest.spec?.constraints) {
      vulnerabilities.push({
        severity: 'medium',
        category: 'missing_controls',
        message: 'No constraints configured',
        path: 'spec.constraints',
        recommendation:
          'Add cost and performance constraints to prevent resource abuse.',
        cwe: 'CWE-770',
      });
    }

    // Check for missing observability
    if (!manifest.spec?.observability) {
      vulnerabilities.push({
        severity: 'low',
        category: 'missing_controls',
        message: 'No observability configured',
        path: 'spec.observability',
        recommendation:
          'Enable tracing, metrics, and logging for security monitoring and incident response.',
        cwe: 'CWE-778',
      });
    }

    return vulnerabilities;
  }

  /**
   * Check for overly permissive settings
   */
  private checkPermissions(manifest: OssaAgent): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];

    const autonomy = manifest.spec?.autonomy;
    if (autonomy) {
      // Check if autonomy level is too high
      if (autonomy.level === 'full' || autonomy.level === 'high') {
        if (!autonomy.approval_required) {
          vulnerabilities.push({
            severity: 'high',
            category: 'excessive_permissions',
            message: `Autonomy level "${autonomy.level}" without approval requirement`,
            path: 'spec.autonomy',
            recommendation:
              'Enable approval_required for high/full autonomy levels to prevent unauthorized actions.',
            cwe: 'CWE-732',
          });
        }
      }

      // Check for wildcard allowed actions
      if (autonomy.allowed_actions) {
        const hasWildcard = autonomy.allowed_actions.some(
          (action) => action === '*' || action.includes('*')
        );
        if (hasWildcard) {
          vulnerabilities.push({
            severity: 'medium',
            category: 'excessive_permissions',
            message: 'Wildcard in allowed_actions grants broad permissions',
            path: 'spec.autonomy.allowed_actions',
            recommendation:
              'Use specific action names instead of wildcards. Follow principle of least privilege.',
            cwe: 'CWE-732',
          });
        }
      }
    }

    return vulnerabilities;
  }

  /**
   * Check dependencies for security issues
   */
  private checkDependencies(manifest: OssaAgent): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];

    const dependencies = manifest.spec?.dependencies?.agents || [];

    for (let i = 0; i < dependencies.length; i++) {
      const dep = dependencies[i];

      // Check for missing version constraints
      if (!dep.version) {
        vulnerabilities.push({
          severity: 'low',
          category: 'dependency_risk',
          message: `Dependency "${dep.name}" has no version constraint`,
          path: `spec.dependencies.agents[${i}]`,
          recommendation:
            'Specify version constraints to ensure consistent and secure dependencies.',
          cwe: 'CWE-1104',
        });
      }
    }

    return vulnerabilities;
  }

  /**
   * Calculate security score based on vulnerabilities
   */
  private calculateScore(vulnerabilities: SecurityVulnerability[]): number {
    let score = 100;

    const severityPenalties: Record<SecuritySeverity, number> = {
      critical: 30,
      high: 20,
      medium: 10,
      low: 5,
      info: 1,
    };

    for (const vuln of vulnerabilities) {
      score -= severityPenalties[vuln.severity];
    }

    return Math.max(0, score);
  }

  /**
   * Get vulnerabilities by severity
   */
  getBySeverity(
    vulnerabilities: SecurityVulnerability[],
    severity: SecuritySeverity
  ): SecurityVulnerability[] {
    return vulnerabilities.filter((v) => v.severity === severity);
  }

  /**
   * Get vulnerabilities by category
   */
  getByCategory(
    vulnerabilities: SecurityVulnerability[],
    category: string
  ): SecurityVulnerability[] {
    return vulnerabilities.filter((v) => v.category === category);
  }
}
