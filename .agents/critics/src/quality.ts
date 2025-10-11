/**
 * Code quality analysis for Code Reviewer Agent
 */

import { QualityConfig, QualityCheckResponse, QualityMetrics, QualityViolation, QualitySuggestion } from './types';

export class QualityAnalyzer {
  constructor(private config: QualityConfig) {}

  async analyzeCode(code: string, language: string): Promise<QualityCheckResponse> {
    const metrics = this.calculateMetrics(code, language);
    const violations = this.checkViolations(metrics);
    const suggestions = this.generateSuggestions(metrics, violations, language);

    return {
      passed: violations.length === 0,
      metrics,
      violations,
      suggestions
    };
  }

  private calculateMetrics(code: string, language: string): QualityMetrics {
    return {
      complexity: this.calculateComplexityMetrics(code),
      maintainability: this.calculateMaintainabilityMetrics(code, language),
      performance: this.calculatePerformanceMetrics(code, language),
      security: {
        vulnerabilities: [],
        securityScore: 100,
        cweViolations: [],
        sensitiveDataExposure: 0
      },
      style: this.calculateStyleMetrics(code, language)
    };
  }

  private calculateComplexityMetrics(code: string): any {
    const lines = code.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);

    return {
      cyclomaticComplexity: this.calculateCyclomaticComplexity(code),
      cognitiveComplexity: this.calculateCognitiveComplexity(code),
      halsteadComplexity: this.calculateHalsteadComplexity(code),
      nesting_depth: this.calculateMaxNestingDepth(code),
      class_coupling: this.calculateClassCoupling(code)
    };
  }

  private calculateCyclomaticComplexity(code: string): number {
    // Count decision points
    const decisionPoints = [
      /\bif\b/g,
      /\belse\s+if\b/g,
      /\bwhile\b/g,
      /\bfor\b/g,
      /\bswitch\b/g,
      /\bcase\b/g,
      /\bcatch\b/g,
      /\b\?\s*:/g, // Ternary operator
      /\b&&\b/g,
      /\b\|\|\b/g
    ];

    let complexity = 1; // Base complexity

    decisionPoints.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });

    return complexity;
  }

  private calculateCognitiveComplexity(code: string): number {
    let complexity = 0;
    let nestingLevel = 0;

    const lines = code.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Increase nesting for control structures
      if (/\b(if|while|for|switch|try)\b/.test(trimmedLine)) {
        complexity += nestingLevel + 1;
        if (trimmedLine.endsWith('{') || trimmedLine.includes('{')) {
          nestingLevel++;
        }
      }

      // Decrease nesting for closing braces
      if (trimmedLine.startsWith('}')) {
        nestingLevel = Math.max(0, nestingLevel - 1);
      }

      // Additional complexity for logical operators
      const logicalOperators = (trimmedLine.match(/\b(&&|\|\|)\b/g) || []).length;
      complexity += logicalOperators;

      // Complexity for recursion
      if (/\brecursive\b/.test(trimmedLine) || trimmedLine.includes('function')) {
        const functionName = this.extractFunctionName(trimmedLine);
        if (functionName && code.includes(functionName + '(')) {
          complexity += 1;
        }
      }
    }

    return complexity;
  }

  private calculateHalsteadComplexity(code: string): number {
    // Simplified Halstead complexity calculation
    const operators = code.match(/[+\-*/%=<>!&|^~?:;,(){}[\]]/g) || [];
    const operands = code.match(/\b\w+\b/g) || [];

    const uniqueOperators = new Set(operators).size;
    const uniqueOperands = new Set(operands).size;

    const vocabulary = uniqueOperators + uniqueOperands;
    const length = operators.length + operands.length;

    if (vocabulary === 0) return 0;

    return length * Math.log2(vocabulary);
  }

  private calculateMaxNestingDepth(code: string): number {
    let maxDepth = 0;
    let currentDepth = 0;

    for (const char of code) {
      if (char === '{') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === '}') {
        currentDepth = Math.max(0, currentDepth - 1);
      }
    }

    return maxDepth;
  }

  private calculateClassCoupling(code: string): number {
    // Count imports and dependencies
    const importPatterns = [
      /import\s+.*\s+from\s+['"][^'"]+['"];?/g, // ES6 imports
      /const\s+\w+\s+=\s+require\s*\(/g, // CommonJS requires
      /using\s+\w+/g, // C# using
      /include\s+<[^>]+>/g, // C++ includes
      /#include\s+"[^"]+"/g // C includes
    ];

    let coupling = 0;
    importPatterns.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) {
        coupling += matches.length;
      }
    });

    return coupling;
  }

  private calculateMaintainabilityMetrics(code: string, language: string): any {
    const lines = code.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    const commentLines = lines.filter(line => this.isCommentLine(line, language));

    return {
      maintainabilityIndex: this.calculateMaintainabilityIndex(code),
      codeSmells: this.detectCodeSmells(code, language),
      technicalDebt: this.calculateTechnicalDebt(code),
      duplications: this.detectDuplicatedCode(code),
      testCoverage: 0 // Would need test files to calculate
    };
  }

  private calculateMaintainabilityIndex(code: string): number {
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(code);
    const linesOfCode = code.split('\n').filter(line => line.trim().length > 0).length;
    const halsteadVolume = this.calculateHalsteadComplexity(code);

    // Simplified maintainability index calculation
    let maintainabilityIndex = 171 - 5.2 * Math.log(halsteadVolume) -
      0.23 * cyclomaticComplexity - 16.2 * Math.log(linesOfCode);

    return Math.max(0, Math.min(100, maintainabilityIndex));
  }

  private detectCodeSmells(code: string, language: string): number {
    let smells = 0;

    // Long method smell
    const methods = this.extractMethods(code, language);
    methods.forEach(method => {
      if (method.split('\n').length > 50) {
        smells++;
      }
    });

    // Large class smell
    if (code.split('\n').length > 1000) {
      smells++;
    }

    // Duplicate code smell
    smells += this.detectDuplicatedCode(code);

    // Dead code smell
    smells += this.detectDeadCode(code);

    // Magic numbers
    const magicNumbers = code.match(/\b\d{2,}\b/g) || [];
    smells += Math.floor(magicNumbers.length / 5); // Every 5 magic numbers is a smell

    return smells;
  }

  private calculateTechnicalDebt(code: string): string {
    const complexity = this.calculateCyclomaticComplexity(code);
    const linesOfCode = code.split('\n').filter(line => line.trim().length > 0).length;

    // Estimate in hours (simplified)
    const debtHours = (complexity * 0.5) + (linesOfCode * 0.01);

    if (debtHours < 1) return `${Math.round(debtHours * 60)} minutes`;
    if (debtHours < 8) return `${Math.round(debtHours)} hours`;
    return `${Math.round(debtHours / 8)} days`;
  }

  private detectDuplicatedCode(code: string): number {
    const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const duplicates = new Set<string>();

    for (let i = 0; i < lines.length - 2; i++) {
      for (let j = i + 3; j < lines.length; j++) {
        if (lines[i] === lines[j] && lines[i + 1] === lines[j + 1] && lines[i + 2] === lines[j + 2]) {
          duplicates.add(lines[i] + lines[i + 1] + lines[i + 2]);
        }
      }
    }

    return duplicates.size;
  }

  private detectDeadCode(code: string): number {
    let deadCodeCount = 0;

    // Detect unreachable code after return statements
    const lines = code.split('\n');
    for (let i = 0; i < lines.length - 1; i++) {
      if (/\breturn\b/.test(lines[i]) && !/^\s*}/.test(lines[i + 1])) {
        if (lines[i + 1].trim().length > 0 && !lines[i + 1].includes('}')) {
          deadCodeCount++;
        }
      }
    }

    // Detect unused variables (simplified)
    const variableDeclarations = code.match(/\b(let|const|var)\s+(\w+)/g) || [];
    variableDeclarations.forEach(declaration => {
      const variable = declaration.split(/\s+/)[1];
      const usageCount = (code.match(new RegExp(`\\b${variable}\\b`, 'g')) || []).length;
      if (usageCount === 1) { // Only the declaration
        deadCodeCount++;
      }
    });

    return deadCodeCount;
  }

  private calculatePerformanceMetrics(code: string, language: string): any {
    return {
      potentialMemoryLeaks: this.detectMemoryLeaks(code, language),
      inefficientAlgorithms: this.detectInefficientAlgorithms(code),
      databaseQueries: this.countDatabaseQueries(code),
      asyncPatterns: this.analyzeAsyncPatterns(code, language)
    };
  }

  private detectMemoryLeaks(code: string, language: string): number {
    let leaks = 0;

    if (language === 'javascript' || language === 'typescript') {
      // Global variables
      const globalVars = code.match(/var\s+\w+\s*=/g) || [];
      leaks += globalVars.length;

      // Missing cleanup in event listeners
      const eventListeners = code.match(/addEventListener/g) || [];
      const removeEventListeners = code.match(/removeEventListener/g) || [];
      leaks += Math.max(0, eventListeners.length - removeEventListeners.length);

      // Unclosed intervals/timeouts
      const intervals = code.match(/setInterval/g) || [];
      const clearIntervals = code.match(/clearInterval/g) || [];
      leaks += Math.max(0, intervals.length - clearIntervals.length);
    }

    return leaks;
  }

  private detectInefficientAlgorithms(code: string): number {
    let inefficiencies = 0;

    // Nested loops (potential O(n²) or worse)
    const nestedLoops = code.match(/for\s*\([^)]*\)\s*{[^}]*for\s*\(/g) || [];
    inefficiencies += nestedLoops.length;

    // Linear search in loops
    const linearSearches = code.match(/for\s*\([^)]*\)\s*{[^}]*indexOf\(/g) || [];
    inefficiencies += linearSearches.length;

    // Inefficient string concatenation in loops
    const stringConcatInLoops = code.match(/for\s*\([^)]*\)\s*{[^}]*\+=/g) || [];
    inefficiencies += stringConcatInLoops.length;

    return inefficiencies;
  }

  private countDatabaseQueries(code: string): number {
    const queryPatterns = [
      /\.query\(/g,
      /\.find\(/g,
      /\.findOne\(/g,
      /\.save\(/g,
      /\.update\(/g,
      /\.delete\(/g,
      /SELECT\s+/gi,
      /INSERT\s+INTO/gi,
      /UPDATE\s+/gi,
      /DELETE\s+FROM/gi
    ];

    let queryCount = 0;
    queryPatterns.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) {
        queryCount += matches.length;
      }
    });

    return queryCount;
  }

  private analyzeAsyncPatterns(code: string, language: string): number {
    let asyncIssues = 0;

    if (language === 'javascript' || language === 'typescript') {
      // Missing await keywords
      const asyncFunctions = code.match(/async\s+function/g) || [];
      const awaitKeywords = code.match(/await\s+/g) || [];

      // Flag if async functions don't use await
      if (asyncFunctions.length > 0 && awaitKeywords.length === 0) {
        asyncIssues++;
      }

      // Unhandled promise rejections
      const promises = code.match(/\.then\(/g) || [];
      const catches = code.match(/\.catch\(/g) || [];
      asyncIssues += Math.max(0, promises.length - catches.length);

      // Callback hell detection
      const callbackNesting = this.detectCallbackNesting(code);
      if (callbackNesting > 3) {
        asyncIssues++;
      }
    }

    return asyncIssues;
  }

  private detectCallbackNesting(code: string): number {
    let maxNesting = 0;
    let currentNesting = 0;

    const lines = code.split('\n');
    for (const line of lines) {
      if (line.includes('function(') || line.includes('=>')) {
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      }
      if (line.includes('});')) {
        currentNesting = Math.max(0, currentNesting - 1);
      }
    }

    return maxNesting;
  }

  private calculateStyleMetrics(code: string, language: string): any {
    return {
      styleViolations: this.countStyleViolations(code, language),
      formattingIssues: this.countFormattingIssues(code),
      namingConventions: this.checkNamingConventions(code, language),
      documentation: this.analyzeDocumentation(code, language)
    };
  }

  private countStyleViolations(code: string, language: string): number {
    let violations = 0;

    // Long lines
    const lines = code.split('\n');
    violations += lines.filter(line => line.length > 120).length;

    // Missing semicolons (for JavaScript/TypeScript)
    if (language === 'javascript' || language === 'typescript') {
      const statements = code.match(/[^;}]\n/g) || [];
      violations += statements.length;
    }

    // Inconsistent indentation
    const indentationIssues = this.detectIndentationIssues(lines);
    violations += indentationIssues;

    return violations;
  }

  private countFormattingIssues(code: string): number {
    let issues = 0;

    // Missing spaces around operators
    const operatorIssues = code.match(/\w[+\-*/%=<>!]=?\w/g) || [];
    issues += operatorIssues.length;

    // Missing spaces after commas
    const commaIssues = code.match(/,\w/g) || [];
    issues += commaIssues.length;

    // Inconsistent brace style
    const braceIssues = this.detectBraceStyleIssues(code);
    issues += braceIssues;

    return issues;
  }

  private checkNamingConventions(code: string, language: string): number {
    let violations = 0;

    if (language === 'javascript' || language === 'typescript') {
      // camelCase for variables and functions
      const variables = code.match(/\b(let|const|var)\s+([a-z][a-zA-Z0-9]*)/g) || [];
      const functions = code.match(/function\s+([a-z][a-zA-Z0-9]*)/g) || [];

      // Check for snake_case or PascalCase violations
      variables.concat(functions).forEach(item => {
        if (/_/.test(item) || /^[A-Z]/.test(item.split(/\s+/)[1])) {
          violations++;
        }
      });

      // PascalCase for classes
      const classes = code.match(/class\s+([A-Z][a-zA-Z0-9]*)/g) || [];
      classes.forEach(item => {
        const className = item.split(/\s+/)[1];
        if (!/^[A-Z]/.test(className)) {
          violations++;
        }
      });
    }

    return violations;
  }

  private analyzeDocumentation(code: string, language: string): any {
    const lines = code.split('\n');
    const commentLines = lines.filter(line => this.isCommentLine(line, language));
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);

    const commentRatio = nonEmptyLines.length > 0 ? commentLines.length / nonEmptyLines.length : 0;

    return {
      commentRatio: Math.round(commentRatio * 100),
      missingDocumentation: this.countMissingDocumentation(code, language),
      outdatedComments: this.detectOutdatedComments(code)
    };
  }

  private countMissingDocumentation(code: string, language: string): number {
    let missing = 0;

    // Functions without documentation
    const functions = this.extractMethods(code, language);
    functions.forEach(func => {
      const funcLines = func.split('\n');
      const firstLine = funcLines[0];
      const prevLineIndex = code.split('\n').indexOf(firstLine) - 1;

      if (prevLineIndex >= 0) {
        const prevLine = code.split('\n')[prevLineIndex];
        if (!this.isCommentLine(prevLine, language)) {
          missing++;
        }
      } else {
        missing++;
      }
    });

    // Classes without documentation
    const classes = code.match(/class\s+\w+/g) || [];
    missing += classes.length; // Simplified - assume all classes need docs

    return missing;
  }

  private detectOutdatedComments(code: string): number {
    // Simplified detection of potentially outdated comments
    const todoComments = code.match(/\/\*.*TODO.*\*\/|\/\/.*TODO/gi) || [];
    const fixmeComments = code.match(/\/\*.*FIXME.*\*\/|\/\/.*FIXME/gi) || [];
    const hackComments = code.match(/\/\*.*HACK.*\*\/|\/\/.*HACK/gi) || [];

    return todoComments.length + fixmeComments.length + hackComments.length;
  }

  private checkViolations(metrics: QualityMetrics): QualityViolation[] {
    const violations: QualityViolation[] = [];

    // Complexity violations
    if (metrics.complexity.cyclomaticComplexity > this.config.complexity_threshold) {
      violations.push({
        metric: 'cyclomatic_complexity',
        threshold: this.config.complexity_threshold,
        actual: metrics.complexity.cyclomaticComplexity,
        severity: 'warning',
        message: `Cyclomatic complexity (${metrics.complexity.cyclomaticComplexity}) exceeds threshold (${this.config.complexity_threshold})`
      });
    }

    // Maintainability violations
    if (metrics.maintainability.maintainabilityIndex < this.config.maintainability_threshold) {
      violations.push({
        metric: 'maintainability_index',
        threshold: this.config.maintainability_threshold,
        actual: metrics.maintainability.maintainabilityIndex,
        severity: 'warning',
        message: `Maintainability index (${metrics.maintainability.maintainabilityIndex}) below threshold (${this.config.maintainability_threshold})`
      });
    }

    // Duplication violations
    if (metrics.maintainability.duplications > this.config.duplication_threshold) {
      violations.push({
        metric: 'code_duplication',
        threshold: this.config.duplication_threshold,
        actual: metrics.maintainability.duplications,
        severity: 'error',
        message: `Code duplication (${metrics.maintainability.duplications}) exceeds threshold (${this.config.duplication_threshold})`
      });
    }

    return violations;
  }

  private generateSuggestions(
    metrics: QualityMetrics,
    violations: QualityViolation[],
    language: string
  ): QualitySuggestion[] {
    const suggestions: QualitySuggestion[] = [];

    // Complexity suggestions
    if (metrics.complexity.cyclomaticComplexity > 10) {
      suggestions.push({
        category: 'complexity',
        title: 'Reduce Cyclomatic Complexity',
        description: 'Break down complex methods into smaller, more focused functions',
        impact: 'high',
        effort: 'medium'
      });
    }

    // Performance suggestions
    if (metrics.performance.inefficientAlgorithms > 0) {
      suggestions.push({
        category: 'performance',
        title: 'Optimize Algorithm Efficiency',
        description: 'Review nested loops and consider more efficient data structures',
        impact: 'high',
        effort: 'medium'
      });
    }

    // Maintainability suggestions
    if (metrics.maintainability.codeSmells > 5) {
      suggestions.push({
        category: 'maintainability',
        title: 'Address Code Smells',
        description: 'Refactor methods that are too long or classes that are too large',
        impact: 'medium',
        effort: 'high'
      });
    }

    // Documentation suggestions
    if (metrics.style.documentation.commentRatio < 10) {
      suggestions.push({
        category: 'documentation',
        title: 'Improve Code Documentation',
        description: 'Add comments and documentation for complex logic and public APIs',
        impact: 'medium',
        effort: 'low'
      });
    }

    return suggestions;
  }

  // Helper methods
  private isCommentLine(line: string, language: string): boolean {
    const trimmedLine = line.trim();

    switch (language) {
      case 'javascript':
      case 'typescript':
      case 'java':
      case 'go':
      case 'rust':
      case 'cpp':
      case 'csharp':
        return trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine.startsWith('*');

      case 'python':
      case 'ruby':
        return trimmedLine.startsWith('#');

      case 'php':
        return trimmedLine.startsWith('//') || trimmedLine.startsWith('#') || trimmedLine.startsWith('/*');

      default:
        return trimmedLine.startsWith('//') || trimmedLine.startsWith('#');
    }
  }

  private extractMethods(code: string, language: string): string[] {
    const methods: string[] = [];

    switch (language) {
      case 'javascript':
      case 'typescript':
        const jsFunctions = code.match(/function\s+\w+[^{]*{[^}]*}/g) || [];
        const arrowFunctions = code.match(/\w+\s*=\s*\([^)]*\)\s*=>\s*{[^}]*}/g) || [];
        methods.push(...jsFunctions, ...arrowFunctions);
        break;

      case 'python':
        const pyFunctions = code.match(/def\s+\w+[^:]*:[^def]*/g) || [];
        methods.push(...pyFunctions);
        break;

      case 'java':
      case 'csharp':
        const javaMethods = code.match(/(public|private|protected)?\s*(static)?\s*\w+\s+\w+\s*\([^)]*\)\s*{[^}]*}/g) || [];
        methods.push(...javaMethods);
        break;

      default:
        // Generic function extraction
        const genericFunctions = code.match(/\w+\s*\([^)]*\)\s*{[^}]*}/g) || [];
        methods.push(...genericFunctions);
    }

    return methods;
  }

  private extractFunctionName(line: string): string | null {
    const functionMatch = line.match(/function\s+(\w+)/) || line.match(/(\w+)\s*\(/);
    return functionMatch ? functionMatch[1] : null;
  }

  private detectIndentationIssues(lines: string[]): number {
    let issues = 0;
    let expectedIndent = 0;

    for (const line of lines) {
      if (line.trim().length === 0) continue;

      const currentIndent = line.length - line.trimStart().length;

      // Check for inconsistent indentation
      if (line.includes('{')) {
        expectedIndent += 2; // Assuming 2-space indentation
      }
      if (line.includes('}')) {
        expectedIndent = Math.max(0, expectedIndent - 2);
      }

      if (Math.abs(currentIndent - expectedIndent) > 2) {
        issues++;
      }
    }

    return issues;
  }

  private detectBraceStyleIssues(code: string): number {
    let issues = 0;

    // Check for inconsistent brace placement
    const openBraceOnNewLine = code.match(/\n\s*{/g) || [];
    const openBraceOnSameLine = code.match(/[^\n]\s*{/g) || [];

    // If both styles are used, it's inconsistent
    if (openBraceOnNewLine.length > 0 && openBraceOnSameLine.length > 0) {
      issues += Math.min(openBraceOnNewLine.length, openBraceOnSameLine.length);
    }

    return issues;
  }
}