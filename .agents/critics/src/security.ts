/**
 * Security scanning functionality for Code Reviewer Agent
 */

import { SecurityConfig, SecurityVulnerability, SecurityScanResponse } from './types';

export class SecurityScanner {
  constructor(private config: SecurityConfig) {}

  async scanCode(code: string, language: string): Promise<SecurityScanResponse> {
    const vulnerabilities: SecurityVulnerability[] = [];
    const recommendations: string[] = [];

    // Perform various security scans
    vulnerabilities.push(...this.scanForInjectionVulnerabilities(code, language));
    vulnerabilities.push(...this.scanForCryptographicIssues(code));
    vulnerabilities.push(...this.scanForAuthenticationIssues(code));
    vulnerabilities.push(...this.scanForSensitiveDataExposure(code));
    vulnerabilities.push(...this.scanForInsecureConfigurations(code, language));

    // Generate recommendations
    recommendations.push(...this.generateSecurityRecommendations(vulnerabilities, language));

    const securityScore = this.calculateSecurityScore(vulnerabilities);

    return {
      vulnerabilities,
      dependencyIssues: [], // Would be populated by dependency scanner
      securityScore,
      recommendations
    };
  }

  private scanForInjectionVulnerabilities(code: string, language: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];

    // SQL Injection patterns
    const sqlInjectionPatterns = [
      /\$\{[^}]*\+[^}]*\}/, // Template literal concatenation
      /["']\s*\+\s*\w+\s*\+\s*["']/, // String concatenation in queries
      /query\s*\(\s*["'][^"']*["']\s*\+/, // Direct query concatenation
      /sql\s*=\s*["'][^"']*["']\s*\+/ // SQL string building
    ];

    sqlInjectionPatterns.forEach((pattern, index) => {
      const matches = code.match(new RegExp(pattern.source, 'g'));
      if (matches) {
        matches.forEach(match => {
          const line = this.getLineNumber(code, match);
          vulnerabilities.push({
            id: `sql-injection-${index}-${Date.now()}`,
            cweId: 'CWE-89',
            severity: 'high',
            title: 'Potential SQL Injection',
            description: 'Code appears to construct SQL queries through string concatenation, which may lead to SQL injection vulnerabilities.',
            line,
            recommendation: 'Use parameterized queries or prepared statements instead of string concatenation.'
          });
        });
      }
    });

    // XSS patterns (for web languages)
    if (['javascript', 'typescript', 'php'].includes(language)) {
      const xssPatterns = [
        /innerHTML\s*=\s*\w+/, // Direct innerHTML assignment
        /document\.write\s*\(\s*\w+/, // Direct document.write with variables
        /\$\{[^}]*\}/ // Template literals (potential XSS)
      ];

      xssPatterns.forEach((pattern, index) => {
        const matches = code.match(new RegExp(pattern.source, 'g'));
        if (matches) {
          matches.forEach(match => {
            const line = this.getLineNumber(code, match);
            vulnerabilities.push({
              id: `xss-${index}-${Date.now()}`,
              cweId: 'CWE-79',
              severity: 'medium',
              title: 'Potential Cross-Site Scripting (XSS)',
              description: 'Code directly outputs user input to HTML without proper sanitization.',
              line,
              recommendation: 'Sanitize and validate all user input before outputting to HTML.'
            });
          });
        }
      });
    }

    // Command injection patterns
    const commandInjectionPatterns = [
      /exec\s*\(\s*\w+/, // Direct exec with variables
      /system\s*\(\s*\w+/, // Direct system calls
      /shell_exec\s*\(\s*\w+/, // PHP shell execution
      /Runtime\.getRuntime\(\)\.exec/ // Java runtime exec
    ];

    commandInjectionPatterns.forEach((pattern, index) => {
      const matches = code.match(new RegExp(pattern.source, 'g'));
      if (matches) {
        matches.forEach(match => {
          const line = this.getLineNumber(code, match);
          vulnerabilities.push({
            id: `command-injection-${index}-${Date.now()}`,
            cweId: 'CWE-78',
            severity: 'critical',
            title: 'Potential Command Injection',
            description: 'Code executes system commands with user-controlled input.',
            line,
            recommendation: 'Avoid executing system commands with user input. Use allow-lists and input validation.'
          });
        });
      }
    });

    return vulnerabilities;
  }

  private scanForCryptographicIssues(code: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Weak cryptographic algorithms
    const weakCryptoPatterns = [
      { pattern: /MD5\s*\(/, algorithm: 'MD5', severity: 'medium' as const },
      { pattern: /SHA1\s*\(/, algorithm: 'SHA1', severity: 'medium' as const },
      { pattern: /DES\s*\(/, algorithm: 'DES', severity: 'high' as const },
      { pattern: /RC4\s*\(/, algorithm: 'RC4', severity: 'high' as const }
    ];

    weakCryptoPatterns.forEach(({ pattern, algorithm, severity }) => {
      const matches = code.match(new RegExp(pattern.source, 'g'));
      if (matches) {
        matches.forEach(match => {
          const line = this.getLineNumber(code, match);
          vulnerabilities.push({
            id: `weak-crypto-${algorithm}-${Date.now()}`,
            cweId: 'CWE-327',
            severity,
            title: `Weak Cryptographic Algorithm: ${algorithm}`,
            description: `Code uses ${algorithm}, which is considered cryptographically weak.`,
            line,
            recommendation: `Replace ${algorithm} with stronger algorithms like SHA-256, SHA-3, or bcrypt for hashing.`
          });
        });
      }
    });

    // Hardcoded cryptographic keys
    const hardcodedKeyPatterns = [
      /private[_-]?key\s*[:=]\s*["'][^"']{20,}["']/i,
      /secret[_-]?key\s*[:=]\s*["'][^"']{10,}["']/i,
      /api[_-]?key\s*[:=]\s*["'][^"']{10,}["']/i
    ];

    hardcodedKeyPatterns.forEach((pattern, index) => {
      const matches = code.match(new RegExp(pattern.source, 'g'));
      if (matches) {
        matches.forEach(match => {
          const line = this.getLineNumber(code, match);
          vulnerabilities.push({
            id: `hardcoded-key-${index}-${Date.now()}`,
            cweId: 'CWE-798',
            severity: 'critical',
            title: 'Hardcoded Cryptographic Key',
            description: 'Cryptographic keys should not be hardcoded in source code.',
            line,
            recommendation: 'Store cryptographic keys in secure configuration files or environment variables.'
          });
        });
      }
    });

    return vulnerabilities;
  }

  private scanForAuthenticationIssues(code: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Weak password policies
    const weakPasswordPatterns = [
      /password\s*[:=]\s*["']\w{1,7}["']/i, // Very short passwords
      /password\s*[:=]\s*["']password["']/i, // Default passwords
      /password\s*[:=]\s*["']123456["']/i // Common weak passwords
    ];

    weakPasswordPatterns.forEach((pattern, index) => {
      const matches = code.match(new RegExp(pattern.source, 'g'));
      if (matches) {
        matches.forEach(match => {
          const line = this.getLineNumber(code, match);
          vulnerabilities.push({
            id: `weak-password-${index}-${Date.now()}`,
            cweId: 'CWE-521',
            severity: 'medium',
            title: 'Weak Password Policy',
            description: 'Code contains or enforces weak password requirements.',
            line,
            recommendation: 'Implement strong password policies with minimum length, complexity requirements, and avoid common passwords.'
          });
        });
      }
    });

    // Missing authentication checks
    const authBypassPatterns = [
      /if\s*\(\s*true\s*\)/, // Always true conditions
      /auth\s*=\s*true/, // Hardcoded auth bypass
      /admin\s*=\s*true/ // Hardcoded admin access
    ];

    authBypassPatterns.forEach((pattern, index) => {
      const matches = code.match(new RegExp(pattern.source, 'g'));
      if (matches) {
        matches.forEach(match => {
          const line = this.getLineNumber(code, match);
          vulnerabilities.push({
            id: `auth-bypass-${index}-${Date.now()}`,
            cweId: 'CWE-287',
            severity: 'high',
            title: 'Potential Authentication Bypass',
            description: 'Code may contain authentication bypass mechanisms.',
            line,
            recommendation: 'Implement proper authentication checks and avoid hardcoded access controls.'
          });
        });
      }
    });

    return vulnerabilities;
  }

  private scanForSensitiveDataExposure(code: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Sensitive data patterns
    const sensitivePatterns = [
      { pattern: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/, type: 'Credit Card' },
      { pattern: /\b\d{3}-?\d{2}-?\d{4}\b/, type: 'SSN' },
      { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, type: 'Email' },
      { pattern: /\+?1?[- ]?\(?[0-9]{3}\)?[- ]?[0-9]{3}[- ]?[0-9]{4}/, type: 'Phone Number' }
    ];

    sensitivePatterns.forEach(({ pattern, type }) => {
      const matches = code.match(new RegExp(pattern.source, 'g'));
      if (matches) {
        matches.forEach(match => {
          const line = this.getLineNumber(code, match);
          vulnerabilities.push({
            id: `sensitive-data-${type.toLowerCase().replace(' ', '-')}-${Date.now()}`,
            cweId: 'CWE-200',
            severity: 'medium',
            title: `Potential ${type} Exposure`,
            description: `Code may contain hardcoded ${type.toLowerCase()} information.`,
            line,
            recommendation: `Remove hardcoded ${type.toLowerCase()} data and implement proper data handling procedures.`
          });
        });
      }
    });

    // Debug information exposure
    const debugPatterns = [
      /console\.log\s*\(/,
      /print\s*\(/,
      /echo\s+/,
      /debug\s*[:=]\s*true/i
    ];

    debugPatterns.forEach((pattern, index) => {
      const matches = code.match(new RegExp(pattern.source, 'g'));
      if (matches && matches.length > 5) { // Only flag if many debug statements
        const line = this.getLineNumber(code, matches[0]);
        vulnerabilities.push({
          id: `debug-exposure-${index}-${Date.now()}`,
          cweId: 'CWE-489',
          severity: 'low',
          title: 'Debug Information Exposure',
          description: 'Code contains many debug statements that may expose sensitive information.',
          line,
          recommendation: 'Remove debug statements from production code or implement proper logging levels.'
        });
      }
    });

    return vulnerabilities;
  }

  private scanForInsecureConfigurations(code: string, language: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Insecure HTTP configurations
    const insecureHttpPatterns = [
      /http:\/\//, // HTTP instead of HTTPS
      /ssl\s*[:=]\s*false/i, // Disabled SSL
      /verify[_-]?ssl\s*[:=]\s*false/i // Disabled SSL verification
    ];

    insecureHttpPatterns.forEach((pattern, index) => {
      const matches = code.match(new RegExp(pattern.source, 'g'));
      if (matches) {
        matches.forEach(match => {
          const line = this.getLineNumber(code, match);
          vulnerabilities.push({
            id: `insecure-http-${index}-${Date.now()}`,
            cweId: 'CWE-319',
            severity: 'medium',
            title: 'Insecure HTTP Configuration',
            description: 'Code uses insecure HTTP configurations that may expose data in transit.',
            line,
            recommendation: 'Use HTTPS and enable SSL/TLS verification for all network communications.'
          });
        });
      }
    });

    // Insecure CORS configurations
    if (['javascript', 'typescript'].includes(language)) {
      const corsPatterns = [
        /Access-Control-Allow-Origin:\s*\*/, // Wildcard CORS
        /origin:\s*["']\*["']/ // Wildcard origin
      ];

      corsPatterns.forEach((pattern, index) => {
        const matches = code.match(new RegExp(pattern.source, 'g'));
        if (matches) {
          matches.forEach(match => {
            const line = this.getLineNumber(code, match);
            vulnerabilities.push({
              id: `insecure-cors-${index}-${Date.now()}`,
              cweId: 'CWE-346',
              severity: 'medium',
              title: 'Insecure CORS Configuration',
              description: 'Wildcard CORS configuration allows any origin to access resources.',
              line,
              recommendation: 'Specify allowed origins explicitly instead of using wildcards.'
            });
          });
        }
      });
    }

    return vulnerabilities;
  }

  private generateSecurityRecommendations(vulnerabilities: SecurityVulnerability[], language: string): string[] {
    const recommendations = new Set<string>();

    // General recommendations based on vulnerability types
    const vulnTypes = vulnerabilities.map(v => v.cweId);

    if (vulnTypes.includes('CWE-89')) {
      recommendations.add('Implement parameterized queries for all database operations');
      recommendations.add('Use ORM frameworks that provide built-in SQL injection protection');
    }

    if (vulnTypes.includes('CWE-79')) {
      recommendations.add('Implement proper input validation and output encoding');
      recommendations.add('Use Content Security Policy (CSP) headers');
    }

    if (vulnTypes.includes('CWE-78')) {
      recommendations.add('Avoid executing system commands with user input');
      recommendations.add('Implement input sanitization and use allow-lists');
    }

    if (vulnTypes.includes('CWE-327')) {
      recommendations.add('Upgrade to stronger cryptographic algorithms (SHA-256, SHA-3, bcrypt)');
    }

    if (vulnTypes.includes('CWE-798')) {
      recommendations.add('Use environment variables or secure configuration management');
      recommendations.add('Implement proper secret rotation policies');
    }

    // Language-specific recommendations
    if (language === 'javascript' || language === 'typescript') {
      recommendations.add('Use ESLint security plugins for automated vulnerability detection');
      recommendations.add('Regularly update npm dependencies to patch known vulnerabilities');
    }

    if (language === 'python') {
      recommendations.add('Use bandit for Python security linting');
      recommendations.add('Keep Python and pip packages updated');
    }

    if (language === 'java') {
      recommendations.add('Use OWASP dependency check for Java projects');
      recommendations.add('Enable Java security manager in production');
    }

    return Array.from(recommendations);
  }

  private calculateSecurityScore(vulnerabilities: SecurityVulnerability[]): number {
    if (vulnerabilities.length === 0) {
      return 100;
    }

    const severityWeights = {
      critical: 25,
      high: 15,
      medium: 8,
      low: 3
    };

    const totalDeduction = vulnerabilities.reduce((sum, vuln) => {
      return sum + (severityWeights[vuln.severity] || 0);
    }, 0);

    return Math.max(0, 100 - totalDeduction);
  }

  private getLineNumber(code: string, match: string): number {
    const index = code.indexOf(match);
    if (index === -1) return 1;

    const beforeMatch = code.substring(0, index);
    return beforeMatch.split('\n').length;
  }
}