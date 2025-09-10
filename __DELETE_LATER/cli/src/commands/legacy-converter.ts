#!/usr/bin/env tsx

/**
 * OSSA Legacy Format Converter v0.1.8
 * Backward Compatibility and Format Conversion Utilities
 * 
 * Converts legacy agent configurations, custom formats, and proprietary
 * schemas to OSSA v0.1.8 compliant specifications
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { glob } from 'glob';
import ora from 'ora';
import inquirer from 'inquirer';

interface ConversionOptions {
  sourceFormat?: 'auto' | 'json' | 'yaml' | 'toml' | 'properties' | 'custom';
  targetFormat?: 'yaml' | 'json';
  strict?: boolean;
  preserveComments?: boolean;
  verbose?: boolean;
  dryRun?: boolean;
  backup?: boolean;
}

interface LegacyAgent {
  [key: string]: any;
}

interface ConversionResult {
  source: string;
  target?: string;
  status: 'success' | 'error' | 'warning';
  message?: string;
  format?: string;
  issues?: string[];
}

interface FormatDetectionResult {
  format: string;
  confidence: number;
  version?: string;
  schema?: string;
}

class LegacyFormatConverter {
  private results: ConversionResult[] = [];
  private options: ConversionOptions;

  constructor(options: ConversionOptions = {}) {
    this.options = {
      sourceFormat: 'auto',
      targetFormat: 'yaml',
      strict: false,
      preserveComments: true,
      backup: true,
      ...options
    };
  }

  /**
   * Convert legacy agent configuration
   */
  async convertAgent(sourcePath: string, outputPath?: string): Promise<ConversionResult> {
    const spinner = ora(`Converting ${path.basename(sourcePath)}...`).start();

    try {
      // Detect source format
      const detection = await this.detectFormat(sourcePath);
      spinner.text = `Converting ${path.basename(sourcePath)} (${detection.format})...`;

      // Read and parse source
      const sourceContent = await fs.readFile(sourcePath, 'utf8');
      const legacyAgent = await this.parseSource(sourceContent, detection.format);

      // Convert to OSSA v0.1.8 format
      const ossaAgent = this.transformToOSSA(legacyAgent, detection);

      // Validate conversion
      const issues = this.validateConversion(ossaAgent);

      // Generate output path
      const targetPath = outputPath || this.generateOutputPath(sourcePath);

      // Create backup if enabled
      if (this.options.backup && !this.options.dryRun) {
        await this.createBackup(sourcePath);
      }

      // Write converted agent
      if (!this.options.dryRun) {
        await this.writeOSSAAgent(ossaAgent, targetPath);
      }

      const result: ConversionResult = {
        source: sourcePath,
        target: targetPath,
        status: issues.length > 0 ? 'warning' : 'success',
        format: detection.format,
        issues
      };

      spinner.succeed(`Converted ${path.basename(sourcePath)} (${detection.format})`);

      if (issues.length > 0 && this.options.verbose) {
        console.log(chalk.yellow(`  Issues: ${issues.length}`));
        issues.slice(0, 3).forEach(issue => {
          console.log(chalk.dim(`    - ${issue}`));
        });
      }

      this.results.push(result);
      return result;

    } catch (error) {
      spinner.fail(`Failed to convert ${path.basename(sourcePath)}`);
      
      const result: ConversionResult = {
        source: sourcePath,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };

      this.results.push(result);
      return result;
    }
  }

  /**
   * Detect legacy format and version
   */
  private async detectFormat(filePath: string): Promise<FormatDetectionResult> {
    const content = await fs.readFile(filePath, 'utf8');
    const ext = path.extname(filePath).toLowerCase();

    // File extension-based detection
    if (ext === '.json') {
      return this.detectJSONFormat(content);
    } else if (ext === '.yml' || ext === '.yaml') {
      return this.detectYAMLFormat(content);
    } else if (ext === '.toml') {
      return { format: 'toml', confidence: 0.9 };
    } else if (ext === '.properties') {
      return { format: 'properties', confidence: 0.9 };
    }

    // Content-based detection
    try {
      JSON.parse(content);
      return this.detectJSONFormat(content);
    } catch {
      try {
        yaml.load(content);
        return this.detectYAMLFormat(content);
      } catch {
        return { format: 'unknown', confidence: 0.0 };
      }
    }
  }

  /**
   * Detect JSON format specifics
   */
  private detectJSONFormat(content: string): FormatDetectionResult {
    try {
      const data = JSON.parse(content);

      // Check for known formats
      if (data.apiVersion) {
        if (data.apiVersion.includes('open-standards-scalable-agents')) {
          return { 
            format: 'ossa-legacy', 
            confidence: 0.95,
            version: data.apiVersion.split('/').pop() || 'unknown'
          };
        }
      }

      if (data.ossa) {
        return { 
          format: 'ossa', 
          confidence: 0.95,
          version: data.ossa
        };
      }

      if (data.openapi || data.swagger) {
        return { format: 'openapi', confidence: 0.9 };
      }

      if (data.agent || data.agents) {
        return { format: 'custom-agent', confidence: 0.7 };
      }

      return { format: 'json', confidence: 0.6 };

    } catch {
      return { format: 'json-invalid', confidence: 0.0 };
    }
  }

  /**
   * Detect YAML format specifics
   */
  private detectYAMLFormat(content: string): FormatDetectionResult {
    try {
      const data = yaml.load(content) as any;

      // Check for known formats
      if (data?.apiVersion) {
        if (data.apiVersion.includes('open-standards-scalable-agents')) {
          return { 
            format: 'ossa-legacy', 
            confidence: 0.95,
            version: data.apiVersion.split('/').pop() || 'unknown'
          };
        }
      }

      if (data?.ossa) {
        return { 
          format: 'ossa', 
          confidence: 0.95,
          version: data.ossa
        };
      }

      if (data?.openapi || data?.swagger) {
        return { format: 'openapi', confidence: 0.9 };
      }

      if (data?.agent || data?.agents) {
        return { format: 'custom-agent', confidence: 0.7 };
      }

      return { format: 'yaml', confidence: 0.6 };

    } catch {
      return { format: 'yaml-invalid', confidence: 0.0 };
    }
  }

  /**
   * Parse source content based on detected format
   */
  private async parseSource(content: string, format: string): Promise<LegacyAgent> {
    switch (format) {
      case 'json':
      case 'ossa':
      case 'ossa-legacy':
      case 'openapi':
      case 'custom-agent':
        return JSON.parse(content);

      case 'yaml':
        return yaml.load(content) as LegacyAgent;

      case 'toml':
        // Simple TOML parsing for basic key=value format
        return this.parseTOML(content);

      case 'properties':
        return this.parseProperties(content);

      default:
        // Try JSON first, then YAML
        try {
          return JSON.parse(content);
        } catch {
          return yaml.load(content) as LegacyAgent;
        }
    }
  }

  /**
   * Simple TOML parser for basic configurations
   */
  private parseTOML(content: string): LegacyAgent {
    const result: LegacyAgent = {};
    const lines = content.split('\n');
    let currentSection = '';

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (!trimmed || trimmed.startsWith('#')) continue;

      // Section headers
      if (trimmed.match(/^\[(.+)\]$/)) {
        currentSection = trimmed.slice(1, -1);
        if (currentSection.includes('.')) {
          // Nested sections not fully supported
          continue;
        }
        if (!result[currentSection]) {
          result[currentSection] = {};
        }
        continue;
      }

      // Key-value pairs
      const kvMatch = trimmed.match(/^([^=]+)=(.*)$/);
      if (kvMatch) {
        const key = kvMatch[1].trim();
        let value: any = kvMatch[2].trim();

        // Remove quotes
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }

        // Type conversion
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (!isNaN(Number(value))) value = Number(value);

        if (currentSection) {
          result[currentSection][key] = value;
        } else {
          result[key] = value;
        }
      }
    }

    return result;
  }

  /**
   * Parse Java-style properties files
   */
  private parseProperties(content: string): LegacyAgent {
    const result: LegacyAgent = {};
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) {
        continue;
      }

      const separatorIndex = Math.max(
        trimmed.indexOf('='),
        trimmed.indexOf(':')
      );

      if (separatorIndex > 0) {
        const key = trimmed.substring(0, separatorIndex).trim();
        let value: any = trimmed.substring(separatorIndex + 1).trim();

        // Handle nested properties (dot notation)
        const keyParts = key.split('.');
        let current = result;

        for (let i = 0; i < keyParts.length - 1; i++) {
          if (!current[keyParts[i]]) {
            current[keyParts[i]] = {};
          }
          current = current[keyParts[i]];
        }

        // Type conversion
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (!isNaN(Number(value))) value = Number(value);

        current[keyParts[keyParts.length - 1]] = value;
      }
    }

    return result;
  }

  /**
   * Transform legacy agent to OSSA v0.1.8 format
   */
  private transformToOSSA(legacy: LegacyAgent, detection: FormatDetectionResult): any {
    const ossa = {
      ossa: '0.1.8',
      metadata: this.transformMetadata(legacy, detection),
      spec: this.transformSpec(legacy, detection)
    };

    // Add conversion annotations
    ossa.metadata.annotations = {
      ...ossa.metadata.annotations,
      'ossa.io/converted-from': detection.format,
      'ossa.io/conversion-date': new Date().toISOString().split('T')[0],
      'ossa.io/conversion-tool': 'ossa-legacy-converter-v0.1.8'
    };

    if (detection.version) {
      ossa.metadata.annotations['ossa.io/source-version'] = detection.version;
    }

    return ossa;
  }

  /**
   * Transform metadata section
   */
  private transformMetadata(legacy: LegacyAgent, detection: FormatDetectionResult): any {
    const metadata: any = {
      name: this.extractName(legacy),
      version: this.extractVersion(legacy) || '1.0.0',
      description: this.extractDescription(legacy),
      labels: {
        tier: 'core',
        domain: 'general',
        'conversion.source': detection.format
      },
      annotations: {}
    };

    // Extract labels from various legacy formats
    if (legacy.labels) {
      Object.assign(metadata.labels, legacy.labels);
    }

    if (legacy.metadata?.labels) {
      Object.assign(metadata.labels, legacy.metadata.labels);
    }

    // Extract annotations
    if (legacy.annotations) {
      Object.assign(metadata.annotations, legacy.annotations);
    }

    if (legacy.metadata?.annotations) {
      Object.assign(metadata.annotations, legacy.metadata.annotations);
    }

    return metadata;
  }

  /**
   * Transform spec section
   */
  private transformSpec(legacy: LegacyAgent, detection: FormatDetectionResult): any {
    const spec: any = {
      agent: {
        name: this.extractName(legacy),
        description: this.extractDescription(legacy),
        expertise: this.extractExpertise(legacy)
      },
      capabilities: this.extractCapabilities(legacy),
      api: {
        version: '3.1.0',
        enabled: true,
        endpoints: []
      },
      discovery: {
        uadp: {
          enabled: true,
          tags: this.extractTags(legacy)
        }
      }
    };

    // Extract frameworks
    if (legacy.frameworks || legacy.spec?.frameworks) {
      spec.frameworks = legacy.frameworks || legacy.spec.frameworks;
    }

    // Extract security configuration
    if (legacy.security || legacy.spec?.security) {
      spec.security = legacy.security || legacy.spec.security;
    }

    // Extract monitoring configuration
    if (legacy.monitoring || legacy.spec?.monitoring) {
      spec.monitoring = legacy.monitoring || legacy.spec.monitoring;
    }

    return spec;
  }

  /**
   * Extract agent name from legacy format
   */
  private extractName(legacy: LegacyAgent): string {
    return legacy.name || 
           legacy.metadata?.name ||
           legacy.agent?.name ||
           legacy.title ||
           'converted-agent';
  }

  /**
   * Extract version from legacy format
   */
  private extractVersion(legacy: LegacyAgent): string | undefined {
    return legacy.version ||
           legacy.metadata?.version ||
           legacy.agent?.version ||
           legacy.info?.version;
  }

  /**
   * Extract description from legacy format
   */
  private extractDescription(legacy: LegacyAgent): string | undefined {
    return legacy.description ||
           legacy.metadata?.description ||
           legacy.agent?.description ||
           legacy.info?.description ||
           legacy.summary;
  }

  /**
   * Extract expertise from legacy format
   */
  private extractExpertise(legacy: LegacyAgent): string[] {
    const expertise = legacy.expertise ||
                     legacy.agent?.expertise ||
                     legacy.specialization ||
                     legacy.domains;

    if (Array.isArray(expertise)) {
      return expertise;
    }

    if (typeof expertise === 'string') {
      return [expertise];
    }

    return ['general'];
  }

  /**
   * Extract capabilities from legacy format
   */
  private extractCapabilities(legacy: LegacyAgent): string[] {
    let capabilities = legacy.capabilities ||
                      legacy.spec?.capabilities ||
                      legacy.agent?.capabilities ||
                      legacy.skills ||
                      legacy.functions;

    if (!capabilities) {
      return ['execute'];
    }

    if (Array.isArray(capabilities)) {
      return capabilities;
    }

    if (typeof capabilities === 'object') {
      return Object.keys(capabilities);
    }

    if (typeof capabilities === 'string') {
      return [capabilities];
    }

    return ['execute'];
  }

  /**
   * Extract tags for UADP discovery
   */
  private extractTags(legacy: LegacyAgent): string[] {
    const tags = legacy.tags ||
                legacy.metadata?.labels ||
                legacy.keywords ||
                legacy.categories;

    if (Array.isArray(tags)) {
      return tags;
    }

    if (typeof tags === 'object') {
      return Object.values(tags).filter(v => typeof v === 'string') as string[];
    }

    return ['agent', 'converted'];
  }

  /**
   * Validate conversion results
   */
  private validateConversion(ossaAgent: any): string[] {
    const issues: string[] = [];

    // Required field validation
    if (!ossaAgent.metadata?.name) {
      issues.push('Missing required metadata.name');
    }

    if (!ossaAgent.metadata?.version) {
      issues.push('Missing required metadata.version');
    }

    if (!ossaAgent.spec?.capabilities || ossaAgent.spec.capabilities.length === 0) {
      issues.push('No capabilities defined');
    }

    // OSSA compliance checks
    if (ossaAgent.ossa !== '0.1.8') {
      issues.push('Invalid OSSA version identifier');
    }

    // API configuration validation
    if (!ossaAgent.spec?.api?.enabled) {
      issues.push('API-first approach not enabled');
    }

    return issues;
  }

  /**
   * Generate output path based on source path
   */
  private generateOutputPath(sourcePath: string): string {
    const dir = path.dirname(sourcePath);
    const name = path.basename(sourcePath, path.extname(sourcePath));
    const ext = this.options.targetFormat === 'json' ? 'json' : 'yml';
    
    return path.join(dir, `${name}-ossa-v0.1.8.${ext}`);
  }

  /**
   * Write OSSA agent to file
   */
  private async writeOSSAAgent(ossaAgent: any, outputPath: string): Promise<void> {
    await fs.ensureDir(path.dirname(outputPath));

    const content = this.options.targetFormat === 'json'
      ? JSON.stringify(ossaAgent, null, 2)
      : yaml.dump(ossaAgent, { 
          indent: 2, 
          lineWidth: -1,
          noRefs: true,
          sortKeys: false
        });

    await fs.writeFile(outputPath, content, 'utf8');
  }

  /**
   * Create backup of original file
   */
  private async createBackup(sourcePath: string): Promise<void> {
    const backupPath = `${sourcePath}.backup.${Date.now()}`;
    await fs.copy(sourcePath, backupPath);
  }

  /**
   * Generate conversion summary
   */
  generateSummary(): void {
    const total = this.results.length;
    const successful = this.results.filter(r => r.status === 'success').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    const errors = this.results.filter(r => r.status === 'error').length;

    console.log('\n' + chalk.blue('═'.repeat(60)));
    console.log(chalk.blue.bold('🔄 Legacy Format Conversion Summary'));
    console.log(chalk.blue('═'.repeat(60)));

    console.log(chalk.cyan('\n📊 Results:'));
    console.log(`   Total files processed: ${total}`);
    console.log(chalk.green(`   ✅ Successfully converted: ${successful}`));
    console.log(chalk.yellow(`   ⚠️  Converted with warnings: ${warnings}`));
    console.log(chalk.red(`   ❌ Failed conversions: ${errors}`));

    // Format breakdown
    const formats = new Map<string, number>();
    this.results.forEach(r => {
      if (r.format) {
        formats.set(r.format, (formats.get(r.format) || 0) + 1);
      }
    });

    if (formats.size > 0) {
      console.log(chalk.cyan('\n📋 Source Formats:'));
      formats.forEach((count, format) => {
        console.log(`   ${format}: ${count} files`);
      });
    }

    console.log(chalk.blue('\n═'.repeat(60)));
  }
}

/**
 * Batch convert multiple legacy agents
 */
async function batchConvert(
  pattern: string,
  outputDir: string,
  options: ConversionOptions
): Promise<void> {
  const spinner = ora('Finding legacy agent files...').start();
  
  try {
    const files = await glob(pattern, {
      ignore: ['**/node_modules/**', '**/__DELETE_LATER/**', '**/*ossa-v0.1.8*']
    });

    spinner.succeed(`Found ${files.length} files to convert`);

    if (files.length === 0) {
      console.log(chalk.yellow('No files found matching pattern.'));
      return;
    }

    const converter = new LegacyFormatConverter(options);
    await fs.ensureDir(outputDir);

    for (const file of files) {
      const outputPath = path.join(outputDir, path.basename(file));
      await converter.convertAgent(file, outputPath);
    }

    converter.generateSummary();

  } catch (error) {
    spinner.fail('Batch conversion failed');
    throw error;
  }
}

/**
 * Create legacy converter commands
 */
export function createLegacyConverterCommands(): Command {
  const legacyConverter = new Command('legacy-convert')
    .description('Convert legacy agent formats to OSSA v0.1.8');

  // Convert single file
  legacyConverter
    .command('file <sourcePath>')
    .description('Convert single legacy agent file')
    .option('-o, --output <path>', 'Output file path')
    .option('-f, --format <format>', 'Source format (auto|json|yaml|toml|properties)', 'auto')
    .option('-t, --target <format>', 'Target format (yaml|json)', 'yaml')
    .option('--no-backup', 'Skip backup creation')
    .option('--strict', 'Strict validation mode')
    .option('-d, --dry-run', 'Preview conversion without writing files')
    .option('-v, --verbose', 'Verbose output')
    .action(async (sourcePath, options) => {
      console.log(chalk.blue.bold('🔄 Legacy Format Converter'));
      console.log(chalk.gray(`Converting ${sourcePath} to OSSA v0.1.8\n`));

      try {
        const converter = new LegacyFormatConverter({
          sourceFormat: options.format,
          targetFormat: options.target,
          strict: options.strict,
          backup: options.backup,
          dryRun: options.dryRun,
          verbose: options.verbose
        });

        const result = await converter.convertAgent(sourcePath, options.output);
        
        if (result.status === 'success') {
          console.log(chalk.green('\n✅ Conversion completed successfully'));
          if (result.target) {
            console.log(chalk.cyan(`📄 Output: ${result.target}`));
          }
        } else if (result.status === 'warning') {
          console.log(chalk.yellow('\n⚠️ Conversion completed with warnings'));
          result.issues?.forEach(issue => {
            console.log(chalk.yellow(`  - ${issue}`));
          });
        } else {
          console.log(chalk.red('\n❌ Conversion failed'));
          console.log(chalk.red(`Error: ${result.message}`));
        }
        
      } catch (error) {
        console.error(chalk.red('Conversion failed:'), error);
        process.exit(1);
      }
    });

  // Batch conversion
  legacyConverter
    .command('batch [pattern]')
    .description('Convert multiple legacy agent files')
    .option('-o, --output-dir <dir>', 'Output directory', './converted-agents')
    .option('-f, --format <format>', 'Source format (auto|json|yaml|toml|properties)', 'auto')
    .option('-t, --target <format>', 'Target format (yaml|json)', 'yaml')
    .option('--no-backup', 'Skip backup creation')
    .option('--strict', 'Strict validation mode')
    .option('-d, --dry-run', 'Preview conversion without writing files')
    .option('-v, --verbose', 'Verbose output')
    .action(async (pattern = '**/*.{json,yml,yaml,toml,properties}', options) => {
      console.log(chalk.blue.bold('🔄 Batch Legacy Conversion'));
      console.log(chalk.gray(`Pattern: ${pattern}\n`));

      try {
        await batchConvert(pattern, options.outputDir, {
          sourceFormat: options.format,
          targetFormat: options.target,
          strict: options.strict,
          backup: options.backup,
          dryRun: options.dryRun,
          verbose: options.verbose
        });
        
      } catch (error) {
        console.error(chalk.red('Batch conversion failed:'), error);
        process.exit(1);
      }
    });

  return legacyConverter;
}

export { LegacyFormatConverter, ConversionOptions, ConversionResult };