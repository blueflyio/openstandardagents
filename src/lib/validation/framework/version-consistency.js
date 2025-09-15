#!/usr/bin/env node

/**
 * Version Consistency Enforcement for OSSA v0.1.8
 * Ensures consistent versioning across all OSSA files and specifications
 * Addresses critical version inconsistency issues identified in roadmap
 * 
 * @version 0.1.8
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, extname, basename } from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { glob } from 'glob';

export class VersionConsistencyEnforcer {
  constructor(options = {}) {
    this.config = {
      targetVersion: '0.1.8',
      apiVersionFormat: 'open-standards-scalable-agents/v{version}',
      strictMode: true,
      autoFix: false,
      backupFiles: true,
      ...options
    };
    
    this.versionPatterns = {
      ossaAgent: /^open-standards-scalable-agents\/v(\d+\.\d+\.\d+)$/,
      packageJson: /"version":\s*"(\d+\.\d+\.\d+)"/,
      yamlVersion: /version:\s*['"']?(\d+\.\d+\.\d+)['"']?/,
      markdownVersion: /v(\d+\.\d+\.\d+)/g,
      apiVersion: /apiVersion:\s*['"']?open-standards-scalable-agents\/v(\d+\.\d+\.\d+)['"']?/
    };
    
    this.fileTypes = {
      agent: ['.yml', '.yaml'],
      package: ['package.json'],
      markdown: ['.md'],
      schema: ['.json'],
      javascript: ['.js', '.mjs', '.ts'],
      config: ['.json', '.yml', '.yaml']
    };
    
    this.results = {
      scanned: 0,
      inconsistent: 0,
      fixed: 0,
      errors: [],
      warnings: [],
      files: []
    };
  }

  /**
   * Scan directory for version inconsistencies
   */
  async scanDirectory(rootPath, options = {}) {
    const config = { ...this.config, ...options };
    this.results = { scanned: 0, inconsistent: 0, fixed: 0, errors: [], warnings: [], files: [] };
    
    console.log(`🔍 Scanning directory: ${rootPath}`);
    console.log(`📌 Target version: ${config.targetVersion}`);
    console.log(`🎯 API version format: ${config.apiVersionFormat.replace('{version}', config.targetVersion)}\n`);
    
    try {
      // Find all relevant files
      const files = await this.findRelevantFiles(rootPath);
      
      for (const filePath of files) {
        await this.scanFile(filePath, config);
      }
      
      return this.generateReport();
    } catch (error) {
      this.results.errors.push({
        file: rootPath,
        error: error.message,
        type: 'scan_error'
      });
      throw error;
    }
  }

  /**
   * Find all files that might contain version information
   */
  async findRelevantFiles(rootPath) {
    const files = [];
    
    // OSSA agent files
    const agentFiles = await glob('**/.agents/**/agent.{yml,yaml}', { cwd: rootPath });
    files.push(...agentFiles.map(f => join(rootPath, f)));
    
    // Package.json files
    const packageFiles = await glob('**/package.json', { 
      cwd: rootPath,
      ignore: ['**/node_modules/**', '**/.git/**']
    });
    files.push(...packageFiles.map(f => join(rootPath, f)));
    
    // Workspace files
    const workspaceFiles = await glob('**/.agents-workspace/**/*.{yml,yaml}', { cwd: rootPath });
    files.push(...workspaceFiles.map(f => join(rootPath, f)));
    
    // Schema files
    const schemaFiles = await glob('**/schemas/**/*.json', { cwd: rootPath });
    files.push(...schemaFiles.map(f => join(rootPath, f)));
    
    // Documentation files
    const docFiles = await glob('**/*.md', { 
      cwd: rootPath,
      ignore: ['**/node_modules/**', '**/.git/**']
    });
    files.push(...docFiles.map(f => join(rootPath, f)));
    
    // Configuration files in root
    const configFiles = ['README.md', 'ROADMAP.md', 'CHANGELOG.md', 'package.json'];
    for (const config of configFiles) {
      const configPath = join(rootPath, config);
      if (existsSync(configPath)) {
        files.push(configPath);
      }
    }
    
    // CLI and library files
    const codeFiles = await glob('**/{lib,bin,src,cli}/**/*.{js,mjs,ts}', { 
      cwd: rootPath,
      ignore: ['**/node_modules/**']
    });
    files.push(...codeFiles.map(f => join(rootPath, f)));
    
    return [...new Set(files)]; // Remove duplicates
  }

  /**
   * Scan individual file for version inconsistencies
   */
  async scanFile(filePath, config) {
    this.results.scanned++;
    
    try {
      if (!existsSync(filePath)) {
        this.results.warnings.push({
          file: filePath,
          message: 'File not found',
          type: 'file_not_found'
        });
        return;
      }
      
      const content = readFileSync(filePath, 'utf8');
      const fileType = this.determineFileType(filePath);
      const versions = this.extractVersions(content, fileType, filePath);
      
      const inconsistencies = this.checkVersionConsistency(versions, config.targetVersion);
      
      if (inconsistencies.length > 0) {
        this.results.inconsistent++;
        
        const fileResult = {
          file: filePath,
          type: fileType,
          versions: versions,
          inconsistencies: inconsistencies,
          fixed: false
        };
        
        // Auto-fix if enabled
        if (config.autoFix) {
          const fixResult = await this.fixVersions(filePath, content, inconsistencies, config);
          fileResult.fixed = fixResult.success;
          if (fixResult.success) {
            this.results.fixed++;
          } else {
            this.results.errors.push({
              file: filePath,
              error: fixResult.error,
              type: 'fix_error'
            });
          }
        }
        
        this.results.files.push(fileResult);
        
        console.log(`❌ ${filePath}:`);
        for (const issue of inconsistencies) {
          console.log(`   ${issue.type}: found "${issue.found}", expected "${issue.expected}"`);
        }
        if (fileResult.fixed) {
          console.log(`   ✅ Fixed automatically`);
        }
        console.log();
      } else {
        console.log(`✅ ${filePath}: consistent`);
      }
      
    } catch (error) {
      this.results.errors.push({
        file: filePath,
        error: error.message,
        type: 'scan_error'
      });
      console.log(`⚠️  Error scanning ${filePath}: ${error.message}`);
    }
  }

  /**
   * Determine file type based on extension and content
   */
  determineFileType(filePath) {
    const ext = extname(filePath);
    const base = basename(filePath);
    
    if (base === 'package.json') return 'package';
    if (this.fileTypes.agent.includes(ext)) return 'agent';
    if (this.fileTypes.markdown.includes(ext)) return 'markdown';
    if (this.fileTypes.schema.includes(ext)) return 'schema';
    if (this.fileTypes.javascript.includes(ext)) return 'javascript';
    if (this.fileTypes.config.includes(ext)) return 'config';
    
    return 'unknown';
  }

  /**
   * Extract versions from file content based on type
   */
  extractVersions(content, fileType, filePath) {
    const versions = [];
    
    switch (fileType) {
      case 'agent':
      case 'config':
        versions.push(...this.extractYamlVersions(content));
        break;
        
      case 'package':
        versions.push(...this.extractPackageVersions(content));
        break;
        
      case 'markdown':
        versions.push(...this.extractMarkdownVersions(content));
        break;
        
      case 'schema':
        versions.push(...this.extractSchemaVersions(content));
        break;
        
      case 'javascript':
        versions.push(...this.extractJavaScriptVersions(content));
        break;
    }
    
    return versions;
  }

  /**
   * Extract versions from YAML content
   */
  extractYamlVersions(content) {
    const versions = [];
    
    try {
      const data = parseYaml(content);
      
      // API Version
      if (data.apiVersion) {
        const match = data.apiVersion.match(this.versionPatterns.ossaAgent);
        if (match) {
          versions.push({
            type: 'apiVersion',
            found: match[1],
            location: 'apiVersion field',
            pattern: this.versionPatterns.ossaAgent
          });
        }
      }
      
      // Metadata version
      if (data.metadata?.version) {
        versions.push({
          type: 'metadata_version',
          found: data.metadata.version,
          location: 'metadata.version field',
          pattern: /^\d+\.\d+\.\d+$/
        });
      }
      
      // Spec version
      if (data.spec?.version) {
        versions.push({
          type: 'spec_version',
          found: data.spec.version,
          location: 'spec.version field',
          pattern: /^\d+\.\d+\.\d+$/
        });
      }
      
      // Agent version
      if (data.spec?.agent?.version) {
        versions.push({
          type: 'agent_version',
          found: data.spec.agent.version,
          location: 'spec.agent.version field',
          pattern: /^\d+\.\d+\.\d+$/
        });
      }
      
    } catch (error) {
      // Fall back to regex parsing if YAML parsing fails
      const apiVersionMatch = content.match(this.versionPatterns.apiVersion);
      if (apiVersionMatch) {
        versions.push({
          type: 'apiVersion',
          found: apiVersionMatch[1],
          location: 'apiVersion field (regex)',
          pattern: this.versionPatterns.apiVersion
        });
      }
      
      const versionMatches = content.match(this.versionPatterns.yamlVersion);
      if (versionMatches) {
        versions.push({
          type: 'yaml_version',
          found: versionMatches[1],
          location: 'version field (regex)',
          pattern: this.versionPatterns.yamlVersion
        });
      }
    }
    
    return versions;
  }

  /**
   * Extract versions from package.json
   */
  extractPackageVersions(content) {
    const versions = [];
    
    try {
      const pkg = JSON.parse(content);
      
      if (pkg.version) {
        versions.push({
          type: 'package_version',
          found: pkg.version,
          location: 'version field',
          pattern: /^\d+\.\d+\.\d+/
        });
      }
      
      // Check dependencies for OSSA packages
      const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies };
      for (const [name, version] of Object.entries(deps)) {
        if (name.includes('ossa') || name.includes('open-standards-scalable-agents')) {
          versions.push({
            type: 'dependency_version',
            found: version.replace(/[\^~>=<]/, ''),
            location: `${name} dependency`,
            pattern: /^\d+\.\d+\.\d+/
          });
        }
      }
      
    } catch (error) {
      // Fall back to regex
      const match = content.match(this.versionPatterns.packageJson);
      if (match) {
        versions.push({
          type: 'package_version',
          found: match[1],
          location: 'version field (regex)',
          pattern: this.versionPatterns.packageJson
        });
      }
    }
    
    return versions;
  }

  /**
   * Extract versions from markdown content
   */
  extractMarkdownVersions(content) {
    const versions = [];
    const matches = [...content.matchAll(this.versionPatterns.markdownVersion)];
    
    for (const match of matches) {
      versions.push({
        type: 'markdown_version',
        found: match[1],
        location: `line containing "${match[0]}"`,
        pattern: this.versionPatterns.markdownVersion
      });
    }
    
    // Look for OSSA-specific version patterns
    const ossaMatches = [...content.matchAll(/OSSA\s+v(\d+\.\d+\.\d+)/gi)];
    for (const match of ossaMatches) {
      versions.push({
        type: 'ossa_version',
        found: match[1],
        location: `OSSA reference: "${match[0]}"`,
        pattern: /OSSA\s+v(\d+\.\d+\.\d+)/
      });
    }
    
    return versions;
  }

  /**
   * Extract versions from JSON schema files
   */
  extractSchemaVersions(content) {
    const versions = [];
    
    try {
      const schema = JSON.parse(content);
      
      if (schema.$id && schema.$id.includes('v')) {
        const match = schema.$id.match(/v(\d+\.\d+\.\d+)/);
        if (match) {
          versions.push({
            type: 'schema_id_version',
            found: match[1],
            location: '$id field',
            pattern: /v(\d+\.\d+\.\d+)/
          });
        }
      }
      
      if (schema.version) {
        versions.push({
          type: 'schema_version',
          found: schema.version,
          location: 'version field',
          pattern: /^\d+\.\d+\.\d+$/
        });
      }
      
    } catch (error) {
      // Ignore JSON parsing errors for schema files
    }
    
    return versions;
  }

  /**
   * Extract versions from JavaScript/TypeScript files
   */
  extractJavaScriptVersions(content) {
    const versions = [];
    
    // Look for version strings in comments
    const commentVersions = [...content.matchAll(/(?:\/\*\*?|\/\/)\s*.*?v(\d+\.\d+\.\d+)/gi)];
    for (const match of commentVersions) {
      versions.push({
        type: 'comment_version',
        found: match[1],
        location: `comment: "${match[0].trim()}"`,
        pattern: /v(\d+\.\d+\.\d+)/
      });
    }
    
    // Look for version in string literals
    const stringVersions = [...content.matchAll(/['"`](\d+\.\d+\.\d+)['"`]/g)];
    for (const match of stringVersions) {
      versions.push({
        type: 'string_version',
        found: match[1],
        location: `string literal: "${match[0]}"`,
        pattern: /['"`](\d+\.\d+\.\d+)['"`]/
      });
    }
    
    return versions;
  }

  /**
   * Check version consistency against target version
   */
  checkVersionConsistency(versions, targetVersion) {
    const inconsistencies = [];
    
    for (const version of versions) {
      if (version.found !== targetVersion) {
        inconsistencies.push({
          type: version.type,
          found: version.found,
          expected: targetVersion,
          location: version.location,
          pattern: version.pattern
        });
      }
    }
    
    return inconsistencies;
  }

  /**
   * Fix version inconsistencies in file
   */
  async fixVersions(filePath, content, inconsistencies, config) {
    try {
      let fixedContent = content;
      
      // Create backup if enabled
      if (config.backupFiles) {
        const backupPath = `${filePath}.backup.${Date.now()}`;
        writeFileSync(backupPath, content);
      }
      
      for (const issue of inconsistencies) {
        switch (issue.type) {
          case 'apiVersion':
            fixedContent = fixedContent.replace(
              new RegExp(`apiVersion:\\s*['"']?open-standards-scalable-agents/v${issue.found}['"']?`),
              `apiVersion: open-standards-scalable-agents/v${issue.expected}`
            );
            break;
            
          case 'package_version':
            fixedContent = fixedContent.replace(
              new RegExp(`"version":\\s*"${issue.found}"`),
              `"version": "${issue.expected}"`
            );
            break;
            
          case 'metadata_version':
          case 'spec_version':
          case 'agent_version':
          case 'yaml_version':
            fixedContent = fixedContent.replace(
              new RegExp(`version:\\s*['"']?${issue.found}['"']?`),
              `version: "${issue.expected}"`
            );
            break;
            
          case 'markdown_version':
          case 'ossa_version':
            fixedContent = fixedContent.replace(
              new RegExp(`v${issue.found}`, 'g'),
              `v${issue.expected}`
            );
            break;
            
          case 'comment_version':
            fixedContent = fixedContent.replace(
              new RegExp(`v${issue.found}`, 'g'),
              `v${issue.expected}`
            );
            break;
            
          case 'string_version':
            fixedContent = fixedContent.replace(
              new RegExp(`['"\`]${issue.found}['"\`]`, 'g'),
              `"${issue.expected}"`
            );
            break;
        }
      }
      
      // Write fixed content
      writeFileSync(filePath, fixedContent);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate comprehensive consistency report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      target_version: this.config.targetVersion,
      summary: {
        files_scanned: this.results.scanned,
        inconsistent_files: this.results.inconsistent,
        files_fixed: this.results.fixed,
        errors: this.results.errors.length,
        warnings: this.results.warnings.length
      },
      consistency_score: this.calculateConsistencyScore(),
      inconsistencies_by_type: this.analyzeInconsistencyTypes(),
      most_common_issues: this.findCommonIssues(),
      recommendations: this.generateRecommendations(),
      files: this.results.files,
      errors: this.results.errors,
      warnings: this.results.warnings
    };
    
    return report;
  }

  /**
   * Calculate consistency score (0-100)
   */
  calculateConsistencyScore() {
    if (this.results.scanned === 0) return 100;
    
    const consistentFiles = this.results.scanned - this.results.inconsistent;
    return Math.round((consistentFiles / this.results.scanned) * 100);
  }

  /**
   * Analyze inconsistency types
   */
  analyzeInconsistencyTypes() {
    const types = {};
    
    for (const file of this.results.files) {
      for (const issue of file.inconsistencies) {
        types[issue.type] = (types[issue.type] || 0) + 1;
      }
    }
    
    return types;
  }

  /**
   * Find most common version inconsistency issues
   */
  findCommonIssues() {
    const issues = {};
    
    for (const file of this.results.files) {
      for (const issue of file.inconsistencies) {
        const key = `${issue.type}: ${issue.found} -> ${issue.expected}`;
        issues[key] = (issues[key] || 0) + 1;
      }
    }
    
    return Object.entries(issues)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([issue, count]) => ({ issue, count }));
  }

  /**
   * Generate consistency improvement recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.inconsistent > 0) {
      recommendations.push({
        priority: 'high',
        category: 'consistency',
        message: `${this.results.inconsistent} files have version inconsistencies`,
        action: 'Run with --auto-fix to automatically correct versions'
      });
    }
    
    const apiVersionIssues = this.results.files.filter(f => 
      f.inconsistencies.some(i => i.type === 'apiVersion')
    );
    if (apiVersionIssues.length > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'api_version',
        message: 'API version inconsistencies found in OSSA specifications',
        action: 'Update apiVersion fields to use the current OSSA version'
      });
    }
    
    const packageIssues = this.results.files.filter(f => 
      f.inconsistencies.some(i => i.type === 'package_version')
    );
    if (packageIssues.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'package',
        message: 'Package.json version inconsistencies found',
        action: 'Update package.json version fields to match OSSA version'
      });
    }
    
    if (this.results.errors.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'errors',
        message: `${this.results.errors.length} errors occurred during scanning`,
        action: 'Review error messages and fix file access or parsing issues'
      });
    }
    
    return recommendations;
  }

  /**
   * Print formatted consistency report
   */
  printReport(report) {
    console.log('\n📊 Version Consistency Report');
    console.log('=' .repeat(50));
    console.log(`Target Version: ${report.target_version}`);
    console.log(`Consistency Score: ${report.consistency_score}%`);
    console.log(`Files Scanned: ${report.summary.files_scanned}`);
    console.log(`Inconsistent Files: ${report.summary.inconsistent_files}`);
    console.log(`Files Fixed: ${report.summary.files_fixed}`);
    console.log(`Errors: ${report.summary.errors}`);
    console.log(`Warnings: ${report.summary.warnings}\n`);
    
    if (Object.keys(report.inconsistencies_by_type).length > 0) {
      console.log('📈 Inconsistencies by Type:');
      for (const [type, count] of Object.entries(report.inconsistencies_by_type)) {
        console.log(`  ${type}: ${count}`);
      }
      console.log();
    }
    
    if (report.most_common_issues.length > 0) {
      console.log('🔍 Most Common Issues:');
      for (const { issue, count } of report.most_common_issues) {
        console.log(`  ${issue} (${count} files)`);
      }
      console.log();
    }
    
    if (report.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      for (const rec of report.recommendations) {
        console.log(`  [${rec.priority.toUpperCase()}] ${rec.message}`);
        console.log(`    Action: ${rec.action}`);
      }
      console.log();
    }
  }
}

// CLI interface
if (import.meta.url === `file://${new URL(import.meta.url).pathname}`) {
  const enforcer = new VersionConsistencyEnforcer();
  
  const command = process.argv[2];
  const args = process.argv.slice(3);
  
  // Parse options
  const options = {};
  let pathIndex = 0;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const [key, value] = args[i].substring(2).split('=');
      switch (key) {
        case 'version':
          options.targetVersion = value || args[++i];
          break;
        case 'auto-fix':
          options.autoFix = true;
          break;
        case 'no-backup':
          options.backupFiles = false;
          break;
        case 'strict':
          options.strictMode = true;
          break;
      }
    } else if (pathIndex === 0) {
      pathIndex = i;
    }
  }
  
  const targetPath = args[pathIndex] || '.';
  
  switch (command) {
    case 'scan':
      enforcer.scanDirectory(targetPath, options)
        .then(report => {
          enforcer.printReport(report);
          process.exit(report.summary.inconsistent_files === 0 ? 0 : 1);
        })
        .catch(err => {
          console.error('Scan failed:', err.message);
          process.exit(1);
        });
      break;
      
    case 'fix':
      enforcer.scanDirectory(targetPath, { ...options, autoFix: true })
        .then(report => {
          enforcer.printReport(report);
          console.log(`✅ Fixed ${report.summary.files_fixed} files`);
          process.exit(0);
        })
        .catch(err => {
          console.error('Fix failed:', err.message);
          process.exit(1);
        });
      break;
      
    case 'report':
      enforcer.scanDirectory(targetPath, options)
        .then(report => {
          const reportPath = args[pathIndex + 1] || 'version-consistency-report.json';
          writeFileSync(reportPath, JSON.stringify(report, null, 2));
          console.log(`📋 Report saved to: ${reportPath}`);
        })
        .catch(err => {
          console.error('Report generation failed:', err.message);
          process.exit(1);
        });
      break;
      
    default:
      console.log(`
Version Consistency Enforcement for OSSA v0.1.8

Commands:
  scan [path]                       Scan for version inconsistencies
  fix [path]                        Fix version inconsistencies automatically  
  report [path] [output]            Generate detailed consistency report

Options:
  --version=X.X.X                   Target version (default: 0.1.8)
  --auto-fix                        Automatically fix inconsistencies
  --no-backup                       Don't create backup files when fixing
  --strict                          Strict mode validation

Examples:
  node version-consistency.js scan .
  node version-consistency.js fix . --version=0.1.8
  node version-consistency.js scan . --auto-fix
  node version-consistency.js report . consistency-report.json

Features:
- Scans all OSSA-related files for version inconsistencies
- Supports YAML, JSON, Markdown, JavaScript, and package files
- Automatic fixing with backup file creation
- Comprehensive reporting with recommendations
- Addresses critical version consistency issues from roadmap
      `);
      break;
  }
}

export default VersionConsistencyEnforcer;