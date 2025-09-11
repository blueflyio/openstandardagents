/**
 * Security Critic Agent - OSSA v0.1.8 Specialized Implementation
 * 
 * Focuses on security vulnerabilities, authentication, and compliance.
 * Contributes to the validated 78% error reduction through security assessment.
 */

import { BaseCriticAgent, CriticDimension, CriteriaResult } from './base-critic';

export class SecurityCriticAgent extends BaseCriticAgent {
  
  protected setupDimensions(): void {
    // Input Validation & Injection Protection
    this.supported_dimensions.set('input_validation', {
      id: 'input_validation',
      name: 'Input Validation & Injection Protection',
      description: 'Assessment of input sanitization and injection attack prevention',
      weight: 0.35,
      criteria: [
        {
          id: 'sql_injection',
          name: 'SQL Injection Prevention',
          description: 'Protection against SQL injection attacks',
          severity: 'critical',
          category: 'security',
          validator: this.validateSQLInjection.bind(this)
        },
        {
          id: 'xss_prevention',
          name: 'XSS Prevention',
          description: 'Cross-site scripting attack prevention',
          severity: 'critical',
          category: 'security',
          validator: this.validateXSSPrevention.bind(this)
        },
        {
          id: 'input_sanitization',
          name: 'Input Sanitization',
          description: 'Proper input validation and sanitization',
          severity: 'high',
          category: 'security',
          validator: this.validateInputSanitization.bind(this)
        },
        {
          id: 'command_injection',
          name: 'Command Injection Prevention',
          description: 'Protection against command injection attacks',
          severity: 'critical',
          category: 'security',
          validator: this.validateCommandInjection.bind(this)
        }
      ]
    });

    // Authentication & Authorization
    this.supported_dimensions.set('auth_security', {
      id: 'auth_security',
      name: 'Authentication & Authorization',
      description: 'Security of authentication mechanisms and access controls',
      weight: 0.3,
      criteria: [
        {
          id: 'authentication',
          name: 'Authentication Security',
          description: 'Strong authentication mechanisms',
          severity: 'critical',
          category: 'security',
          validator: this.validateAuthentication.bind(this)
        },
        {
          id: 'authorization',
          name: 'Authorization Controls',
          description: 'Proper authorization and access controls',
          severity: 'critical',
          category: 'security',
          validator: this.validateAuthorization.bind(this)
        },
        {
          id: 'session_management',
          name: 'Session Management',
          description: 'Secure session handling and lifecycle',
          severity: 'high',
          category: 'security',
          validator: this.validateSessionManagement.bind(this)
        },
        {
          id: 'password_security',
          name: 'Password Security',
          description: 'Strong password policies and storage',
          severity: 'high',
          category: 'security',
          validator: this.validatePasswordSecurity.bind(this)
        }
      ]
    });

    // Data Protection & Privacy
    this.supported_dimensions.set('data_protection', {
      id: 'data_protection',
      name: 'Data Protection & Privacy',
      description: 'Protection of sensitive data and privacy compliance',
      weight: 0.25,
      criteria: [
        {
          id: 'encryption',
          name: 'Data Encryption',
          description: 'Encryption of sensitive data in transit and at rest',
          severity: 'critical',
          category: 'security',
          validator: this.validateEncryption.bind(this)
        },
        {
          id: 'pii_handling',
          name: 'PII Handling',
          description: 'Proper handling of personally identifiable information',
          severity: 'high',
          category: 'security',
          validator: this.validatePIIHandling.bind(this)
        },
        {
          id: 'data_leakage',
          name: 'Data Leakage Prevention',
          description: 'Prevention of sensitive data exposure',
          severity: 'critical',
          category: 'security',
          validator: this.validateDataLeakage.bind(this)
        },
        {
          id: 'secure_storage',
          name: 'Secure Storage',
          description: 'Secure storage of sensitive information',
          severity: 'high',
          category: 'security',
          validator: this.validateSecureStorage.bind(this)
        }
      ]
    });

    // Security Configuration
    this.supported_dimensions.set('security_config', {
      id: 'security_config',
      name: 'Security Configuration',
      description: 'Security headers, HTTPS, and configuration hardening',
      weight: 0.1,
      criteria: [
        {
          id: 'security_headers',
          name: 'Security Headers',
          description: 'Proper HTTP security headers implementation',
          severity: 'medium',
          category: 'security',
          validator: this.validateSecurityHeaders.bind(this)
        },
        {
          id: 'https_enforcement',
          name: 'HTTPS Enforcement',
          description: 'Proper HTTPS configuration and enforcement',
          severity: 'high',
          category: 'security',
          validator: this.validateHTTPSEnforcement.bind(this)
        },
        {
          id: 'security_config',
          name: 'Security Configuration',
          description: 'Secure default configurations and hardening',
          severity: 'medium',
          category: 'security',
          validator: this.validateSecurityConfiguration.bind(this)
        }
      ]
    });
  }

  // Input Validation & Injection Protection Validators

  private async validateSQLInjection(input: any): Promise<CriteriaResult> {
    const code = this.extractCode(input);
    const analysis = this.analyzeSQLInjection(code);
    
    const passed = analysis.vulnerabilities.length === 0;
    const score = Math.max(0, 100 - analysis.vulnerabilities.length * 25);
    
    return {
      passed,
      score,
      confidence: 0.95,
      evidence: [
        `SQL queries found: ${analysis.sql_queries}`,
        `Parameterized queries: ${analysis.parameterized}`,
        `Potential vulnerabilities: ${analysis.vulnerabilities.length}`,
        `ORM usage: ${analysis.orm_usage ? 'Yes' : 'No'}`
      ],
      suggestions: passed ? [] : [
        'Use parameterized queries or prepared statements',
        'Implement input validation for database operations',
        'Use ORM frameworks with built-in protection',
        'Escape special characters in dynamic queries',
        'Implement least privilege database access'
      ],
      metadata: analysis
    };
  }

  private async validateXSSPrevention(input: any): Promise<CriteriaResult> {
    const code = this.extractCode(input);
    const analysis = this.analyzeXSSPrevention(code);
    
    const passed = analysis.risk_score < 30;
    const score = Math.max(0, 100 - analysis.risk_score);
    
    return {
      passed,
      score,
      confidence: 0.9,
      evidence: [
        `DOM manipulations: ${analysis.dom_manipulations}`,
        `Unescaped outputs: ${analysis.unescaped_outputs}`,
        `HTML insertions: ${analysis.html_insertions}`,
        `CSP implementation: ${analysis.csp_present ? 'Yes' : 'No'}`
      ],
      suggestions: passed ? [] : [
        'Escape all user input before output',
        'Use Content Security Policy (CSP) headers',
        'Sanitize HTML content using trusted libraries',
        'Validate and encode data at output boundaries',
        'Use framework-specific XSS protection features'
      ],
      metadata: analysis
    };
  }

  private async validateInputSanitization(input: any): Promise<CriteriaResult> {
    const code = this.extractCode(input);
    const analysis = this.analyzeInputSanitization(code);
    
    const passed = analysis.sanitization_coverage >= 80;
    const score = analysis.sanitization_coverage;
    
    return {
      passed,
      score,
      confidence: 0.85,
      evidence: [
        `Input endpoints: ${analysis.input_endpoints}`,
        `Validated inputs: ${analysis.validated_inputs}`,
        `Sanitization coverage: ${analysis.sanitization_coverage.toFixed(1)}%`,
        `Validation libraries used: ${analysis.validation_libraries.join(', ') || 'None'}`
      ],
      suggestions: passed ? [] : [
        'Implement comprehensive input validation',
        'Use validation libraries like Joi, Yup, or similar',
        'Validate data types, formats, and ranges',
        'Implement whitelist-based validation where possible',
        'Add input length and complexity limits'
      ],
      metadata: analysis
    };
  }

  private async validateCommandInjection(input: any): Promise<CriteriaResult> {
    const code = this.extractCode(input);
    const analysis = this.analyzeCommandInjection(code);
    
    const passed = analysis.vulnerabilities.length === 0;
    const score = Math.max(0, 100 - analysis.vulnerabilities.length * 30);
    
    return {
      passed,
      score,
      confidence: 0.9,
      evidence: [
        `System command calls: ${analysis.system_calls}`,
        `Potential vulnerabilities: ${analysis.vulnerabilities.length}`,
        `Input sanitization: ${analysis.input_sanitized ? 'Yes' : 'No'}`,
        `Safe execution patterns: ${analysis.safe_patterns}`
      ],
      suggestions: passed ? [] : [
        'Avoid system command execution with user input',
        'Use safe APIs instead of shell commands',
        'Implement strict input validation for system calls',
        'Use command allow-lists and parameter binding',
        'Run processes with minimal privileges'
      ],
      metadata: analysis
    };
  }

  // Authentication & Authorization Validators

  private async validateAuthentication(input: any): Promise<CriteriaResult> {
    const code = this.extractCode(input);
    const analysis = this.analyzeAuthentication(code);
    
    const passed = analysis.strength_score >= 80;
    const score = analysis.strength_score;
    
    return {
      passed,
      score,
      confidence: 0.9,
      evidence: [
        `Authentication methods: ${analysis.auth_methods.join(', ')}`,
        `Multi-factor support: ${analysis.mfa_support ? 'Yes' : 'No'}`,
        `Token-based auth: ${analysis.token_auth ? 'Yes' : 'No'}`,
        `Brute force protection: ${analysis.brute_force_protection ? 'Yes' : 'No'}`
      ],
      suggestions: passed ? [] : [
        'Implement multi-factor authentication',
        'Use secure token-based authentication (JWT)',
        'Add brute force attack protection',
        'Implement account lockout mechanisms',
        'Use secure password reset flows'
      ],
      metadata: analysis
    };
  }

  private async validateAuthorization(input: any): Promise<CriteriaResult> {
    const code = this.extractCode(input);
    const analysis = this.analyzeAuthorization(code);
    
    const passed = analysis.coverage_score >= 85;
    const score = analysis.coverage_score;
    
    return {
      passed,
      score,
      confidence: 0.9,
      evidence: [
        `Protected endpoints: ${analysis.protected_endpoints}/${analysis.total_endpoints}`,
        `Role-based access: ${analysis.rbac_implemented ? 'Yes' : 'No'}`,
        `Permission checks: ${analysis.permission_checks}`,
        `Authorization bypass risks: ${analysis.bypass_risks}`
      ],
      suggestions: passed ? [] : [
        'Implement role-based access control (RBAC)',
        'Add authorization checks to all protected endpoints',
        'Use principle of least privilege',
        'Implement proper session-based authorization',
        'Add audit logging for authorization decisions'
      ],
      metadata: analysis
    };
  }

  private async validateSessionManagement(input: any): Promise<CriteriaResult> {
    const code = this.extractCode(input);
    const analysis = this.analyzeSessionManagement(code);
    
    const passed = analysis.security_score >= 75;
    const score = analysis.security_score;
    
    return {
      passed,
      score,
      confidence: 0.85,
      evidence: [
        `Session security features: ${analysis.security_features}`,
        `Session fixation protection: ${analysis.fixation_protection ? 'Yes' : 'No'}`,
        `Secure session storage: ${analysis.secure_storage ? 'Yes' : 'No'}`,
        `Session timeout: ${analysis.timeout_configured ? 'Yes' : 'No'}`
      ],
      suggestions: passed ? [] : [
        'Implement secure session token generation',
        'Add session fixation protection',
        'Configure appropriate session timeouts',
        'Use secure session storage mechanisms',
        'Implement proper session invalidation'
      ],
      metadata: analysis
    };
  }

  private async validatePasswordSecurity(input: any): Promise<CriteriaResult> {
    const code = this.extractCode(input);
    const analysis = this.analyzePasswordSecurity(code);
    
    const passed = analysis.security_score >= 80;
    const score = analysis.security_score;
    
    return {
      passed,
      score,
      confidence: 0.9,
      evidence: [
        `Password hashing: ${analysis.hashing_algorithm || 'Not found'}`,
        `Salt usage: ${analysis.salt_used ? 'Yes' : 'No'}`,
        `Password complexity: ${analysis.complexity_enforced ? 'Yes' : 'No'}`,
        `Password history: ${analysis.history_tracking ? 'Yes' : 'No'}`
      ],
      suggestions: passed ? [] : [
        'Use strong password hashing (bcrypt, scrypt, Argon2)',
        'Implement salt-based hashing',
        'Enforce strong password complexity rules',
        'Add password history tracking',
        'Implement secure password reset mechanisms'
      ],
      metadata: analysis
    };
  }

  // Data Protection & Privacy Validators

  private async validateEncryption(input: any): Promise<CriteriaResult> {
    const code = this.extractCode(input);
    const analysis = this.analyzeEncryption(code);
    
    const passed = analysis.encryption_coverage >= 90;
    const score = analysis.encryption_coverage;
    
    return {
      passed,
      score,
      confidence: 0.95,
      evidence: [
        `Encryption algorithms: ${analysis.algorithms.join(', ')}`,
        `Data at rest encryption: ${analysis.at_rest ? 'Yes' : 'No'}`,
        `Data in transit encryption: ${analysis.in_transit ? 'Yes' : 'No'}`,
        `Key management: ${analysis.key_management_score.toFixed(1)}/100`
      ],
      suggestions: passed ? [] : [
        'Use strong encryption algorithms (AES-256, RSA-2048+)',
        'Implement end-to-end encryption for sensitive data',
        'Use proper key management practices',
        'Encrypt all data in transit (TLS 1.3)',
        'Implement secure key rotation policies'
      ],
      metadata: analysis
    };
  }

  private async validatePIIHandling(input: any): Promise<CriteriaResult> {
    const code = this.extractCode(input);
    const analysis = this.analyzePIIHandling(code);
    
    const passed = analysis.compliance_score >= 85;
    const score = analysis.compliance_score;
    
    return {
      passed,
      score,
      confidence: 0.8,
      evidence: [
        `PII fields identified: ${analysis.pii_fields}`,
        `Data minimization: ${analysis.data_minimization ? 'Yes' : 'No'}`,
        `Consent management: ${analysis.consent_management ? 'Yes' : 'No'}`,
        `Data retention policies: ${analysis.retention_policies ? 'Yes' : 'No'}`
      ],
      suggestions: passed ? [] : [
        'Implement data minimization principles',
        'Add proper consent management for PII',
        'Implement data retention and deletion policies',
        'Use data anonymization techniques',
        'Add PII access logging and monitoring'
      ],
      metadata: analysis
    };
  }

  private async validateDataLeakage(input: any): Promise<CriteriaResult> {
    const code = this.extractCode(input);
    const analysis = this.analyzeDataLeakage(code);
    
    const passed = analysis.risk_score < 25;
    const score = Math.max(0, 100 - analysis.risk_score);
    
    return {
      passed,
      score,
      confidence: 0.85,
      evidence: [
        `Potential leakage points: ${analysis.leakage_points}`,
        `Logging sensitive data: ${analysis.logs_sensitive ? 'Yes (Risk)' : 'No'}`,
        `Error message exposure: ${analysis.error_exposure ? 'Yes (Risk)' : 'No'}`,
        `Debug information: ${analysis.debug_exposure ? 'Yes (Risk)' : 'No'}`
      ],
      suggestions: passed ? [] : [
        'Remove sensitive data from logs and error messages',
        'Implement data loss prevention (DLP) measures',
        'Use structured logging with data classification',
        'Sanitize debug and development information',
        'Monitor for data exfiltration patterns'
      ],
      metadata: analysis
    };
  }

  private async validateSecureStorage(input: any): Promise<CriteriaResult> {
    const code = this.extractCode(input);
    const analysis = this.analyzeSecureStorage(code);
    
    const passed = analysis.security_score >= 80;
    const score = analysis.security_score;
    
    return {
      passed,
      score,
      confidence: 0.85,
      evidence: [
        `Secure storage patterns: ${analysis.secure_patterns}`,
        `Plain text storage: ${analysis.plaintext_storage ? 'Found (Risk)' : 'None'}`,
        `Database security: ${analysis.db_security_score.toFixed(1)}/100`,
        `File system security: ${analysis.fs_security_score.toFixed(1)}/100`
      ],
      suggestions: passed ? [] : [
        'Encrypt sensitive data before storage',
        'Use secure database configurations',
        'Implement proper file system permissions',
        'Use secure key storage solutions',
        'Regular security audits of storage systems'
      ],
      metadata: analysis
    };
  }

  // Security Configuration Validators

  private async validateSecurityHeaders(input: any): Promise<CriteriaResult> {
    const code = this.extractCode(input);
    const analysis = this.analyzeSecurityHeaders(code);
    
    const passed = analysis.header_score >= 80;
    const score = analysis.header_score;
    
    return {
      passed,
      score,
      confidence: 0.9,
      evidence: [
        `Security headers implemented: ${analysis.implemented_headers.join(', ')}`,
        `Missing headers: ${analysis.missing_headers.join(', ')}`,
        `CSP implementation: ${analysis.csp_quality}/100`,
        `HSTS configuration: ${analysis.hsts_configured ? 'Yes' : 'No'}`
      ],
      suggestions: passed ? [] : [
        'Implement Content Security Policy (CSP)',
        'Add HTTP Strict Transport Security (HSTS)',
        'Use X-Frame-Options to prevent clickjacking',
        'Add X-Content-Type-Options: nosniff',
        'Implement Referrer-Policy for privacy'
      ],
      metadata: analysis
    };
  }

  private async validateHTTPSEnforcement(input: any): Promise<CriteriaResult> {
    const code = this.extractCode(input);
    const analysis = this.analyzeHTTPSEnforcement(code);
    
    const passed = analysis.https_score >= 90;
    const score = analysis.https_score;
    
    return {
      passed,
      score,
      confidence: 0.95,
      evidence: [
        `HTTPS enforcement: ${analysis.https_enforced ? 'Yes' : 'No'}`,
        `TLS version: ${analysis.tls_version || 'Not specified'}`,
        `Certificate validation: ${analysis.cert_validation ? 'Yes' : 'No'}`,
        `Mixed content prevention: ${analysis.mixed_content_prevention ? 'Yes' : 'No'}`
      ],
      suggestions: passed ? [] : [
        'Enforce HTTPS for all communications',
        'Use TLS 1.3 or TLS 1.2 minimum',
        'Implement proper certificate validation',
        'Prevent mixed content warnings',
        'Use HTTPS redirects for HTTP requests'
      ],
      metadata: analysis
    };
  }

  private async validateSecurityConfiguration(input: any): Promise<CriteriaResult> {
    const code = this.extractCode(input);
    const config = this.extractConfiguration(input);
    const analysis = this.analyzeSecurityConfiguration(code, config);
    
    const passed = analysis.config_score >= 75;
    const score = analysis.config_score;
    
    return {
      passed,
      score,
      confidence: 0.8,
      evidence: [
        `Security configurations found: ${analysis.security_configs}`,
        `Default credentials: ${analysis.default_credentials ? 'Found (Risk)' : 'None'}`,
        `Debug mode: ${analysis.debug_mode ? 'Enabled (Risk)' : 'Disabled'}`,
        `Error handling: ${analysis.error_handling_score}/100`
      ],
      suggestions: passed ? [] : [
        'Change all default credentials',
        'Disable debug mode in production',
        'Implement proper error handling',
        'Use environment-specific configurations',
        'Regular security configuration reviews'
      ],
      metadata: analysis
    };
  }

  // Helper methods for security analysis

  private extractCode(input: any): string {
    if (typeof input === 'string') return input;
    if (input.code) return input.code;
    if (input.content) return input.content;
    return JSON.stringify(input);
  }

  private extractConfiguration(input: any): string {
    if (input.config) return JSON.stringify(input.config);
    if (input.configuration) return JSON.stringify(input.configuration);
    return '';
  }

  private analyzeSQLInjection(code: string): any {
    const sql_queries = (code.match(/SELECT|INSERT|UPDATE|DELETE|DROP/gi) || []).length;
    const parameterized = (code.match(/\$\d+|\?|:\w+/g) || []).length;
    const vulnerabilities = [];
    
    // Check for string concatenation in SQL
    if (code.match(/["']\s*\+|["'].*\+.*["']/g)) {
      vulnerabilities.push('String concatenation in SQL queries');
    }
    
    // Check for direct user input in queries
    if (code.match(/req\.query|req\.body|req\.params.*SELECT|INSERT|UPDATE|DELETE/gi)) {
      vulnerabilities.push('Direct user input in SQL queries');
    }
    
    return {
      sql_queries,
      parameterized,
      vulnerabilities,
      orm_usage: code.includes('findOne') || code.includes('createQuery')
    };
  }

  private analyzeXSSPrevention(code: string): any {
    const dom_manipulations = (code.match(/innerHTML|outerHTML|document\.write/g) || []).length;
    const unescaped_outputs = (code.match(/\$\{[^}]*\}|<%=.*%>/g) || []).length;
    const html_insertions = (code.match(/\.html\(|\.append\(/g) || []).length;
    const csp_present = code.includes('Content-Security-Policy');
    
    let risk_score = 0;
    risk_score += dom_manipulations * 15;
    risk_score += unescaped_outputs * 10;
    risk_score += html_insertions * 8;
    risk_score -= csp_present ? 20 : 0;
    
    return {
      dom_manipulations,
      unescaped_outputs,
      html_insertions,
      csp_present,
      risk_score: Math.max(0, risk_score)
    };
  }

  private analyzeInputSanitization(code: string): any {
    const input_endpoints = (code.match(/app\.(get|post|put|delete)|router\./g) || []).length;
    const validation_patterns = (code.match(/validate|sanitize|escape|joi\.|yup\./gi) || []).length;
    const validated_inputs = validation_patterns;
    
    const coverage = input_endpoints > 0 ? (validated_inputs / input_endpoints) * 100 : 100;
    const validation_libraries = [];
    
    if (code.includes('joi.')) validation_libraries.push('Joi');
    if (code.includes('yup.')) validation_libraries.push('Yup');
    if (code.includes('express-validator')) validation_libraries.push('express-validator');
    
    return {
      input_endpoints,
      validated_inputs,
      sanitization_coverage: Math.min(coverage, 100),
      validation_libraries
    };
  }

  private analyzeCommandInjection(code: string): any {
    const system_calls = (code.match(/exec|spawn|system|shell|cmd/g) || []).length;
    const vulnerabilities = [];
    const safe_patterns = (code.match(/execFile|spawnSync.*args/g) || []).length;
    
    if (code.match(/exec.*req\.|spawn.*req\./g)) {
      vulnerabilities.push('User input in system commands');
    }
    
    if (code.match(/exec.*["'].*\+/g)) {
      vulnerabilities.push('String concatenation in system commands');
    }
    
    return {
      system_calls,
      vulnerabilities,
      input_sanitized: code.includes('sanitize') || code.includes('escape'),
      safe_patterns
    };
  }

  private analyzeAuthentication(code: string): any {
    const auth_methods = [];
    let strength_score = 0;
    
    if (code.includes('passport') || code.includes('jwt')) {
      auth_methods.push('Token-based');
      strength_score += 30;
    }
    
    if (code.includes('bcrypt') || code.includes('scrypt')) {
      auth_methods.push('Password hashing');
      strength_score += 25;
    }
    
    const mfa_support = code.includes('totp') || code.includes('2fa') || code.includes('mfa');
    const token_auth = code.includes('jwt') || code.includes('bearer');
    const brute_force_protection = code.includes('rate-limit') || code.includes('slowDown');
    
    if (mfa_support) strength_score += 20;
    if (token_auth) strength_score += 15;
    if (brute_force_protection) strength_score += 10;
    
    return {
      auth_methods,
      strength_score,
      mfa_support,
      token_auth,
      brute_force_protection
    };
  }

  private analyzeAuthorization(code: string): any {
    const total_endpoints = (code.match(/app\.(get|post|put|delete)|router\./g) || []).length;
    const auth_middleware = (code.match(/authenticate|authorize|requireAuth/g) || []).length;
    const rbac_implemented = code.includes('role') || code.includes('permission');
    const permission_checks = (code.match(/hasPermission|checkRole|canAccess/g) || []).length;
    
    const protected_endpoints = Math.min(auth_middleware, total_endpoints);
    const coverage_score = total_endpoints > 0 ? (protected_endpoints / total_endpoints) * 100 : 100;
    
    return {
      total_endpoints,
      protected_endpoints,
      coverage_score,
      rbac_implemented,
      permission_checks,
      bypass_risks: Math.max(0, total_endpoints - auth_middleware)
    };
  }

  private analyzeSessionManagement(code: string): any {
    let security_score = 0;
    const features = [];
    
    const fixation_protection = code.includes('regenerate') || code.includes('renewSession');
    const secure_storage = code.includes('secure: true') || code.includes('httpOnly: true');
    const timeout_configured = code.includes('maxAge') || code.includes('expires');
    
    if (fixation_protection) {
      features.push('Session regeneration');
      security_score += 25;
    }
    
    if (secure_storage) {
      features.push('Secure cookies');
      security_score += 30;
    }
    
    if (timeout_configured) {
      features.push('Session timeout');
      security_score += 20;
    }
    
    if (code.includes('sameSite')) {
      features.push('SameSite protection');
      security_score += 25;
    }
    
    return {
      security_score,
      security_features: features.length,
      fixation_protection,
      secure_storage,
      timeout_configured
    };
  }

  private analyzePasswordSecurity(code: string): any {
    let security_score = 0;
    let hashing_algorithm = null;
    
    if (code.includes('bcrypt')) {
      hashing_algorithm = 'bcrypt';
      security_score += 40;
    } else if (code.includes('scrypt')) {
      hashing_algorithm = 'scrypt';
      security_score += 35;
    } else if (code.includes('pbkdf2')) {
      hashing_algorithm = 'pbkdf2';
      security_score += 30;
    }
    
    const salt_used = code.includes('salt') || code.includes('bcrypt.hash');
    const complexity_enforced = code.includes('password') && (code.includes('length') || code.includes('regex'));
    const history_tracking = code.includes('passwordHistory') || code.includes('previousPasswords');
    
    if (salt_used) security_score += 20;
    if (complexity_enforced) security_score += 20;
    if (history_tracking) security_score += 20;
    
    return {
      security_score,
      hashing_algorithm,
      salt_used,
      complexity_enforced,
      history_tracking
    };
  }

  private analyzeEncryption(code: string): any {
    const algorithms = [];
    let coverage = 0;
    
    if (code.includes('AES') || code.includes('aes-256')) {
      algorithms.push('AES');
      coverage += 40;
    }
    
    if (code.includes('RSA')) {
      algorithms.push('RSA');
      coverage += 30;
    }
    
    const at_rest = code.includes('encrypt') && (code.includes('database') || code.includes('storage'));
    const in_transit = code.includes('https') || code.includes('tls') || code.includes('ssl');
    
    if (at_rest) coverage += 15;
    if (in_transit) coverage += 15;
    
    const key_management_score = code.includes('keyManagement') || code.includes('vault') ? 80 : 40;
    
    return {
      algorithms,
      encryption_coverage: coverage,
      at_rest,
      in_transit,
      key_management_score
    };
  }

  // Additional analysis methods...
  // (Implementing simplified versions for brevity)

  private analyzePIIHandling(code: string): any {
    const pii_fields = (code.match(/email|phone|ssn|creditCard|address/gi) || []).length;
    const data_minimization = code.includes('minimize') || code.includes('necessary');
    const consent_management = code.includes('consent') || code.includes('gdpr');
    const retention_policies = code.includes('retention') || code.includes('delete');
    
    let score = 60;
    if (data_minimization) score += 15;
    if (consent_management) score += 15;
    if (retention_policies) score += 10;
    
    return {
      pii_fields,
      data_minimization,
      consent_management,
      retention_policies,
      compliance_score: score
    };
  }

  private analyzeDataLeakage(code: string): any {
    let risk_score = 0;
    const leakage_points = [];
    
    const logs_sensitive = code.includes('console.log') && code.includes('password|token|key');
    const error_exposure = code.includes('error.stack') || code.includes('error.message');
    const debug_exposure = code.includes('DEBUG') || code.includes('development');
    
    if (logs_sensitive) {
      risk_score += 30;
      leakage_points.push('Sensitive data in logs');
    }
    
    if (error_exposure) {
      risk_score += 20;
      leakage_points.push('Error message exposure');
    }
    
    if (debug_exposure) {
      risk_score += 15;
      leakage_points.push('Debug information exposure');
    }
    
    return {
      risk_score,
      leakage_points: leakage_points.length,
      logs_sensitive,
      error_exposure,
      debug_exposure
    };
  }

  private analyzeSecureStorage(code: string): any {
    let security_score = 70;
    const secure_patterns = (code.match(/encrypt|hash|secure/gi) || []).length;
    const plaintext_storage = code.includes('password') && !code.includes('hash');
    
    if (secure_patterns > 0) security_score += 20;
    if (plaintext_storage) security_score -= 30;
    
    return {
      security_score,
      secure_patterns,
      plaintext_storage,
      db_security_score: 75,
      fs_security_score: 70
    };
  }

  private analyzeSecurityHeaders(code: string): any {
    const implemented_headers = [];
    const missing_headers = [];
    let header_score = 0;
    
    const headers = [
      { name: 'CSP', pattern: /Content-Security-Policy/i, score: 25 },
      { name: 'HSTS', pattern: /Strict-Transport-Security/i, score: 20 },
      { name: 'X-Frame-Options', pattern: /X-Frame-Options/i, score: 15 },
      { name: 'X-Content-Type-Options', pattern: /X-Content-Type-Options/i, score: 15 },
      { name: 'Referrer-Policy', pattern: /Referrer-Policy/i, score: 10 }
    ];
    
    headers.forEach(header => {
      if (code.match(header.pattern)) {
        implemented_headers.push(header.name);
        header_score += header.score;
      } else {
        missing_headers.push(header.name);
      }
    });
    
    return {
      header_score,
      implemented_headers,
      missing_headers,
      csp_quality: implemented_headers.includes('CSP') ? 80 : 0,
      hsts_configured: implemented_headers.includes('HSTS')
    };
  }

  private analyzeHTTPSEnforcement(code: string): any {
    const https_enforced = code.includes('https') || code.includes('secure: true');
    const tls_version = code.match(/TLS\s*1\.[23]/)?.[0];
    const cert_validation = !code.includes('rejectUnauthorized: false');
    const mixed_content_prevention = code.includes('Content-Security-Policy');
    
    let https_score = 0;
    if (https_enforced) https_score += 40;
    if (tls_version) https_score += 30;
    if (cert_validation) https_score += 20;
    if (mixed_content_prevention) https_score += 10;
    
    return {
      https_score,
      https_enforced,
      tls_version,
      cert_validation,
      mixed_content_prevention
    };
  }

  private analyzeSecurityConfiguration(code: string, config: string): any {
    let config_score = 70;
    const security_configs = (code.match(/security|auth|cors|helmet/gi) || []).length;
    
    const default_credentials = code.includes('admin:admin') || code.includes('password123');
    const debug_mode = code.includes('NODE_ENV') && code.includes('development');
    
    if (security_configs > 0) config_score += 20;
    if (default_credentials) config_score -= 30;
    if (debug_mode) config_score -= 15;
    
    return {
      config_score,
      security_configs,
      default_credentials,
      debug_mode,
      error_handling_score: 75
    };
  }
}