/**
 * Enhanced OAAS Validator with OSSA v0.1.2 Compatibility
 * Bridges existing OSSA standards with new @bluefly/oaas validation
 */

import { OAASValidator, ValidationResult } from './OAASValidator.js';
import { promises as fs } from 'fs';
import { glob } from 'glob';
import * as yaml from 'js-yaml';
import * as path from 'path';

export interface EnhancedValidationConfig {
  strict?: boolean;
  allowWarnings?: boolean;
  customRules?: string[];
  migrateFromOSSA?: boolean;
  outputFormat?: 'json' | 'yaml' | 'console';
  reportPath?: string;
}

export interface MigrationResult {
  success: boolean;
  originalFormat: 'ossa-v0.1.2' | 'oaas-v0.1.1' | 'unknown';
  migratedSpec?: any;
  migrationWarnings: string[];
  compatibilityScore: number;
}

export interface EnhancedValidationResult extends ValidationResult {
  migration?: MigrationResult;
  ossaCompatibility?: {
    compatible: boolean;
    version: string;
    migrationRequired: boolean;
  };
  tddaiIntegration?: {
    supported: boolean;
    commands: string[];
    setupInstructions: string[];
  };
}

export class EnhancedOAASValidator extends OAASValidator {
  private blueflyOAAS: any;
  
  constructor(private enhancedConfig: EnhancedValidationConfig = {}) {
    super(enhancedConfig);
    this.initializeBlueflyOAAS();
  }

  private async initializeBlueflyOAAS() {
    try {
      // Initialize @bluefly/oaas when available
      const oaasModule = await import('@bluefly/oaas');
      if (oaasModule && (oaasModule as any).BlueflyOAAS) {
        this.blueflyOAAS = new (oaasModule as any).BlueflyOAAS({
          strict: this.enhancedConfig.strict,
          enableMigration: this.enhancedConfig.migrateFromOSSA
        });
      }
    } catch (error) {
      console.warn('⚠️  @bluefly/oaas not available, using fallback validation');
      this.blueflyOAAS = null;
    }
  }

  /**
   * Enhanced validation with OSSA migration support
   */
  async validateEnhanced(agentSpec: any, filePath?: string): Promise<EnhancedValidationResult> {
    const baseResult = await this.validate(agentSpec);
    
    // Detect format and migrate if needed
    const migrationResult = await this.detectAndMigrate(agentSpec);
    
    // Check OSSA compatibility
    const ossaCompatibility = this.checkOSSACompatibility(agentSpec);
    
    // Check TDDAI integration support
    const tddaiIntegration = await this.checkTDDAIIntegration(agentSpec, filePath);
    
    // Use @bluefly/oaas if available for enhanced validation
    let enhancedResult = baseResult;
    if (this.blueflyOAAS) {
      try {
        const blueflyResult = await this.blueflyOAAS.validate(
          migrationResult.migratedSpec || agentSpec
        );
        enhancedResult = this.mergeValidationResults(baseResult, blueflyResult);
      } catch (error) {
        console.warn('Bluefly OAAS validation failed, using base validation');
      }
    }

    return {
      ...enhancedResult,
      migration: migrationResult,
      ossaCompatibility,
      tddaiIntegration
    };
  }

  /**
   * Detect agent format and migrate to OAAS if needed
   */
  private async detectAndMigrate(agentSpec: any): Promise<MigrationResult> {
    const migrationWarnings: string[] = [];
    let originalFormat: MigrationResult['originalFormat'] = 'unknown';
    let compatibilityScore = 0;
    let migratedSpec = agentSpec;

    // Detect OSSA v0.1.2 format
    if (agentSpec.apiVersion === 'open-standards-scalable-agents/v0.1.2') {
      originalFormat = 'ossa-v0.1.2';
      compatibilityScore = 80;
      
      if (this.enhancedConfig.migrateFromOSSA) {
        migratedSpec = this.migrateOSSAToOAAS(agentSpec);
        migrationWarnings.push('Migrated from OSSA v0.1.2 to OAAS format');
        compatibilityScore = 95;
      } else {
        migrationWarnings.push('OSSA v0.1.2 format detected - migration recommended');
      }
    }
    // Detect new OpenAPI AI Agents Standard format (v0.1.1)
    else if (agentSpec.apiVersion === 'openapi-ai-agents/v0.1.1') {
      originalFormat = 'oaas-v0.1.1';
      compatibilityScore = 100;
      migrationWarnings.push('OpenAPI AI Agents Standard v0.1.1 format detected');
    }
    // Detect other OAAS formats
    else if (agentSpec.apiVersion?.includes('oaas') || agentSpec.oaas_version) {
      originalFormat = 'oaas-v0.1.1';
      compatibilityScore = 100;
    }

    return {
      success: true,
      originalFormat,
      migratedSpec: originalFormat === 'ossa-v0.1.2' ? migratedSpec : undefined,
      migrationWarnings,
      compatibilityScore
    };
  }

  /**
   * Migrate OSSA v0.1.2 spec to OAAS format
   */
  private migrateOSSAToOAAS(ossaSpec: any): any {
    const oaasSpec = {
      oaas_version: '0.1.1',
      apiVersion: ossaSpec.apiVersion.replace('open-standards-scalable-agents', 'oaas'),
      kind: ossaSpec.kind,
      metadata: {
        ...ossaSpec.metadata,
        annotations: {
          ...ossaSpec.metadata?.annotations,
          'oaas.bluefly.io/migrated-from': 'ossa-v0.1.2',
          'oaas.bluefly.io/migration-date': new Date().toISOString(),
          'oaas.bluefly.io/compatibility-score': '95'
        }
      },
      spec: {
        ...ossaSpec.spec,
        // Add OAAS-specific enhancements
        validation: {
          enabled: true,
          level: ossaSpec.metadata?.labels?.tier || 'core'
        },
        integration: {
          tddai: {
            supported: true,
            commands: ['validate', 'test', 'deploy']
          }
        }
      }
    };

    return oaasSpec;
  }

  /**
   * Check OSSA v0.1.2 compatibility
   */
  private checkOSSACompatibility(agentSpec: any): EnhancedValidationResult['ossaCompatibility'] {
    const isOSSA = agentSpec.apiVersion === 'open-standards-scalable-agents/v0.1.2';
    const isOAAS = agentSpec.apiVersion === 'openapi-ai-agents/v0.1.1' || 
                   agentSpec.oaas_version || 
                   agentSpec.apiVersion?.includes('oaas');
    
    return {
      compatible: isOSSA || isOAAS,
      version: isOSSA ? 'v0.1.2' : (isOAAS ? 'v0.1.1' : 'unknown'),
      migrationRequired: isOSSA && !isOAAS
    };
  }

  /**
   * Check TDDAI integration support
   */
  private async checkTDDAIIntegration(agentSpec: any, filePath?: string): Promise<EnhancedValidationResult['tddaiIntegration']> {
    const supportedCommands: string[] = [];
    const setupInstructions: string[] = [];

    // Check if agent is in .agents directory structure
    if (filePath?.includes('/.agents/')) {
      supportedCommands.push('tddai agents validate', 'tddai agents spawn', 'tddai agents orchestrate');
      setupInstructions.push('Agent is already in TDDAI workspace structure');
    } else {
      supportedCommands.push('tddai validate agent', 'tddai migrate ossa-to-oaas');
      setupInstructions.push('Move agent to .agents directory for full TDDAI integration');
    }

    // Check for TDDAI metadata
    if (agentSpec.metadata?.annotations?.['tddai.bluefly.io/enabled']) {
      supportedCommands.push('tddai golden deploy', 'tddai orchestrate');
    } else {
      setupInstructions.push('Add tddai.bluefly.io/enabled annotation for enhanced TDDAI features');
    }

    return {
      supported: supportedCommands.length > 0,
      commands: supportedCommands,
      setupInstructions
    };
  }

  /**
   * Merge validation results from different validators
   */
  private mergeValidationResults(baseResult: ValidationResult, blueflyResult: any): ValidationResult {
    return {
      valid: baseResult.valid && blueflyResult.valid,
      errors: [...baseResult.errors, ...(blueflyResult.errors || [])],
      warnings: [...baseResult.warnings, ...(blueflyResult.warnings || [])],
      score: Math.min(baseResult.score, blueflyResult.score || baseResult.score),
      compliance_level: this.selectHighestComplianceLevel(
        baseResult.compliance_level,
        blueflyResult.compliance_level
      )
    };
  }

  private selectHighestComplianceLevel(level1: string, level2: string): ValidationResult['compliance_level'] {
    const levels = ['none', 'basic', 'standard', 'advanced', 'enterprise'];
    const index1 = levels.indexOf(level1);
    const index2 = levels.indexOf(level2 || 'none');
    return levels[Math.max(index1, index2)] as ValidationResult['compliance_level'];
  }

  /**
   * Validate workspace with multiple agents
   */
  async validateWorkspace(workspacePath: string): Promise<{
    summary: any;
    agents: EnhancedValidationResult[];
    recommendations: string[];
  }> {
    console.log(`🔍 Scanning workspace: ${workspacePath}`);
    
    // Find all agent files
    const agentFiles = await glob('**/*agent*.{yml,yaml}', {
      cwd: workspacePath,
      ignore: ['node_modules/**', '**/node_modules/**', 'dist/**']
    });

    console.log(`📁 Found ${agentFiles.length} agent files`);

    const results: EnhancedValidationResult[] = [];
    
    for (const file of agentFiles) {
      const fullPath = path.join(workspacePath, file);
      try {
        const content = await fs.readFile(fullPath, 'utf8');
        const agentSpec = yaml.load(content);
        const result = await this.validateEnhanced(agentSpec, fullPath);
        
        results.push({
          ...result,
          metadata: { file: fullPath } as any
        } as EnhancedValidationResult);
        
        console.log(`${result.valid ? '✅' : '❌'} ${file}`);
      } catch (error) {
        console.log(`❌ Failed to validate ${file}: ${(error as Error).message}`);
      }
    }

    const summary = this.generateWorkspaceSummary(results);
    const recommendations = this.generateRecommendations(results);

    return { summary, agents: results, recommendations };
  }

  /**
   * Generate workspace validation summary
   */
  private generateWorkspaceSummary(results: EnhancedValidationResult[]) {
    const total = results.length;
    const valid = results.filter(r => r.valid).length;
    const ossaAgents = results.filter(r => r.ossaCompatibility?.version === 'v0.1.2').length;
    const oaasAgents = results.filter(r => r.ossaCompatibility?.version === 'v0.1.1').length;
    const tddaiReady = results.filter(r => r.tddaiIntegration?.supported).length;

    return {
      total_agents: total,
      valid_agents: valid,
      validation_rate: `${((valid / total) * 100).toFixed(1)}%`,
      format_breakdown: {
        ossa_v0_1_2: ossaAgents,
        oaas_v0_1_1: oaasAgents,
        unknown: total - ossaAgents - oaasAgents
      },
      tddai_ready: tddaiReady,
      migration_needed: ossaAgents,
      average_score: results.reduce((sum, r) => sum + r.score, 0) / total
    };
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(results: EnhancedValidationResult[]): string[] {
    const recommendations: string[] = [];
    
    const ossaCount = results.filter(r => r.ossaCompatibility?.migrationRequired).length;
    if (ossaCount > 0) {
      recommendations.push(`Migrate ${ossaCount} OSSA v0.1.2 agents to OAAS format`);
      recommendations.push('Run: tddai migrate ossa-to-oaas --workspace=.');
    }

    const invalidCount = results.filter(r => !r.valid).length;
    if (invalidCount > 0) {
      recommendations.push(`Fix validation errors in ${invalidCount} agents`);
      recommendations.push('Run: tddai validate workspace --fix-errors');
    }

    const nonTddaiCount = results.filter(r => !r.tddaiIntegration?.supported).length;
    if (nonTddaiCount > 0) {
      recommendations.push(`Enable TDDAI integration for ${nonTddaiCount} agents`);
      recommendations.push('Run: tddai agents setup --workspace=.');
    }

    return recommendations;
  }

  /**
   * Export validation report
   */
  async exportReport(results: any, format: 'json' | 'yaml' | 'console' = 'json', outputPath?: string) {
    let output: string;

    switch (format) {
      case 'yaml':
        output = yaml.dump(results, { indent: 2 });
        break;
      case 'console':
        output = this.formatConsoleReport(results);
        break;
      default:
        output = JSON.stringify(results, null, 2);
    }

    if (outputPath) {
      await fs.writeFile(outputPath, output, 'utf8');
      console.log(`📄 Report exported to: ${outputPath}`);
    } else {
      console.log(output);
    }
  }

  public formatConsoleReport(results: any): string {
    const { summary, agents, recommendations } = results;
    
    return `
🏆 ENHANCED OAAS VALIDATION REPORT
${'='.repeat(50)}

📊 Summary:
   Total Agents: ${summary.total_agents}
   Valid Agents: ${summary.valid_agents}
   Validation Rate: ${summary.validation_rate}
   TDDAI Ready: ${summary.tddai_ready}

📋 Format Breakdown:
   OSSA v0.1.2: ${summary.format_breakdown.ossa_v0_1_2}
   OAAS v0.1.1: ${summary.format_breakdown.oaas_v0_1_1}
   Unknown: ${summary.format_breakdown.unknown}

🎯 Recommendations:
${recommendations.map(r => `   • ${r}`).join('\n')}

${'='.repeat(50)}
    `.trim();
  }
}

// CLI integration for TDDAI commands
export async function validateWorkspaceCommand(workspacePath: string, options: any = {}) {
  const validator = new EnhancedOAASValidator({
    strict: options.strict,
    migrateFromOSSA: options.migrate,
    outputFormat: options.format || 'console',
    reportPath: options.output
  });

  const results = await validator.validateWorkspace(workspacePath);
  
  if (options.output || options.format !== 'console') {
    await validator.exportReport(results, options.format, options.output);
  } else {
    console.log(validator.formatConsoleReport(results));
  }

  return results;
}

export { EnhancedOAASValidator as default };