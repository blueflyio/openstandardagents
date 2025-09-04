#!/usr/bin/env node

/**
 * Comprehensive Validation Framework Demo for OSSA v0.1.8
 * Demonstrates Zod validation, JSON Schema validation, and version consistency enforcement
 * Shows integration with existing OpenAPI validation ecosystem
 * 
 * @version 0.1.8
 */

import ZodValidator from '../../lib/validation/framework/zod-validator.js';
import JSONSchemaValidator from '../../lib/validation/framework/json-schema-validator.js';
import VersionConsistencyEnforcer from '../../lib/validation/framework/version-consistency.js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ComprehensiveValidationDemo {
  constructor() {
    // Initialize all validation frameworks
    this.zodValidator = new ZodValidator({
      strict: true,
      includeErrorDetails: true
    });
    
    this.jsonSchemaValidator = new JSONSchemaValidator({
      strict: true,
      allErrors: true,
      verbose: true
    });
    
    this.versionEnforcer = new VersionConsistencyEnforcer({
      targetVersion: '0.1.8',
      strictMode: true
    });
    
    this.testFiles = [
      '../../examples/.agents/01-agent-basic/agent.yml',
      '../../examples/.agents/02-agent-integration/agent.yml', 
      '../../examples/.agents/03-agent-production/agent.yml',
      '../../examples/.agents/04-agent-enterprise/agent.yml'
    ];
  }

  /**
   * Run comprehensive validation demonstration
   */
  async runDemo() {
    console.log('🔬 OSSA v0.1.8 Comprehensive Validation Framework Demo');
    console.log('=' .repeat(60));
    console.log('Demonstrating:');
    console.log('- Zod Schema Validation (VoltAgent pattern)');
    console.log('- JSON Schema Validation with OpenAPI ecosystem');
    console.log('- Version Consistency Enforcement');
    console.log('- Integrated validation workflow\n');

    try {
      // 1. Zod Validation Demo
      await this.demonstrateZodValidation();
      
      // 2. JSON Schema Validation Demo
      await this.demonstrateJSONSchemaValidation();
      
      // 3. Version Consistency Demo
      await this.demonstrateVersionConsistency();
      
      // 4. Integrated Validation Workflow
      await this.demonstrateIntegratedWorkflow();
      
      // 5. Performance and Best Practices
      await this.demonstratePerformanceOptimizations();
      
      console.log('\n✨ Comprehensive validation demo completed successfully!');
      console.log('\nKey Features Demonstrated:');
      console.log('- Type-safe validation with detailed error reporting');
      console.log('- Cross-reference validation between specifications');
      console.log('- Version consistency across all OSSA files');
      console.log('- Compliance level determination and suggestions');
      console.log('- Integration with OpenAPI validation ecosystem');
      console.log('- Performance optimization and caching');
      
    } catch (error) {
      console.error('❌ Demo failed:', error.message);
      console.error(error.stack);
    }
  }

  /**
   * Demonstrate Zod validation capabilities
   */
  async demonstrateZodValidation() {
    console.log('\n🔍 1. Zod Schema Validation Demo (VoltAgent Pattern)');
    console.log('-' .repeat(50));

    for (const testFile of this.testFiles) {
      const filePath = join(__dirname, testFile);
      if (existsSync(filePath)) {
        console.log(`\n📝 Validating: ${testFile}`);
        
        try {
          const result = await this.zodValidator.validateFile(filePath);
          
          if (result.valid) {
            console.log(`   ✅ Valid - Compliance Level: ${result.level?.toUpperCase()}`);
            
            if (result.warnings?.length > 0) {
              console.log(`   ⚠️  Warnings: ${result.warnings.length}`);
              result.warnings.slice(0, 2).forEach(warning => 
                console.log(`      - ${warning}`)
              );
            }
            
            if (result.suggestions?.length > 0) {
              console.log(`   💡 Suggestions: ${result.suggestions.length}`);
              result.suggestions.slice(0, 2).forEach(suggestion => 
                console.log(`      - [${suggestion.priority}] ${suggestion.suggestion}`)
              );
            }
          } else {
            console.log(`   ❌ Invalid - Errors: ${result.errors.length}`);
            result.errors.slice(0, 3).forEach(error => 
              console.log(`      - ${error.path}: ${error.message}`)
            );
          }
        } catch (error) {
          console.log(`   ⚠️  Error: ${error.message}`);
        }
      } else {
        console.log(`\n📝 Skipping: ${testFile} (not found)`);
      }
    }
  }

  /**
   * Demonstrate JSON Schema validation with cross-references
   */
  async demonstrateJSONSchemaValidation() {
    console.log('\n\n🔗 2. JSON Schema Validation with Cross-References');
    console.log('-' .repeat(50));

    for (const testFile of this.testFiles) {
      const filePath = join(__dirname, testFile);
      if (existsSync(filePath)) {
        console.log(`\n📋 Validating: ${testFile}`);
        
        try {
          const result = await this.jsonSchemaValidator.validateFile(filePath);
          
          if (result.valid) {
            console.log(`   ✅ Valid - Compliance Level: ${result.compliance_level?.toUpperCase()}`);
            
            if (result.cross_references?.length > 0) {
              console.log(`   🔗 Cross-References: ${result.cross_references.length}`);
              result.cross_references.slice(0, 2).forEach(ref => 
                console.log(`      - ${ref.type}: ${ref.schema || ref.path || ref.capability}`)
              );
            }
            
            // Validate OpenAPI if present
            const openApiPath = this.findOpenAPISpec(testFile);
            if (openApiPath && existsSync(join(__dirname, openApiPath))) {
              const apiResult = await this.jsonSchemaValidator.validateOpenAPI(
                join(__dirname, openApiPath),
                result.data
              );
              console.log(`   📊 OpenAPI: ${apiResult.valid ? 'Valid' : 'Issues'} - ${apiResult.endpoints} endpoints`);
            }
          } else {
            console.log(`   ❌ Invalid - Errors: ${result.errors.length}`);
            result.errors.slice(0, 3).forEach(error => 
              console.log(`      - ${error.path}: ${error.message}`)
            );
          }
        } catch (error) {
          console.log(`   ⚠️  Error: ${error.message}`);
        }
      }
    }
  }

  /**
   * Demonstrate version consistency enforcement
   */
  async demonstrateVersionConsistency() {
    console.log('\n\n📌 3. Version Consistency Enforcement');
    console.log('-' .repeat(50));
    
    try {
      // Scan for version inconsistencies
      const projectRoot = join(__dirname, '../..');
      console.log(`\n🔍 Scanning project root: ${projectRoot}`);
      
      const consistencyReport = await this.versionEnforcer.scanDirectory(projectRoot, {
        targetVersion: '0.1.8',
        autoFix: false
      });
      
      console.log(`\n📊 Version Consistency Results:`);
      console.log(`   Consistency Score: ${consistencyReport.consistency_score}%`);
      console.log(`   Files Scanned: ${consistencyReport.summary.files_scanned}`);
      console.log(`   Inconsistent Files: ${consistencyReport.summary.inconsistent_files}`);
      
      if (Object.keys(consistencyReport.inconsistencies_by_type).length > 0) {
        console.log(`\n   📈 Inconsistency Types:`);
        Object.entries(consistencyReport.inconsistencies_by_type)
          .slice(0, 5)
          .forEach(([type, count]) => 
            console.log(`      - ${type}: ${count} files`)
          );
      }
      
      if (consistencyReport.most_common_issues.length > 0) {
        console.log(`\n   🔍 Most Common Issues:`);
        consistencyReport.most_common_issues
          .slice(0, 3)
          .forEach(({ issue, count }) => 
            console.log(`      - ${issue} (${count} files)`)
          );
      }
      
      if (consistencyReport.recommendations.length > 0) {
        console.log(`\n   💡 Recommendations:`);
        consistencyReport.recommendations
          .slice(0, 3)
          .forEach(rec => 
            console.log(`      - [${rec.priority.toUpperCase()}] ${rec.message}`)
          );
      }
      
    } catch (error) {
      console.log(`   ⚠️  Version consistency check failed: ${error.message}`);
    }
  }

  /**
   * Demonstrate integrated validation workflow
   */
  async demonstrateIntegratedWorkflow() {
    console.log('\n\n🔄 4. Integrated Validation Workflow');
    console.log('-' .repeat(50));
    
    const testFile = this.testFiles.find(f => existsSync(join(__dirname, f)));
    if (!testFile) {
      console.log('   ⚠️  No test files available');
      return;
    }
    
    const filePath = join(__dirname, testFile);
    console.log(`\n🔬 Comprehensive validation of: ${testFile}`);
    
    try {
      // Step 1: Zod validation
      console.log('\n   Step 1: Type-safe schema validation');
      const zodResult = await this.zodValidator.validateFile(filePath);
      console.log(`      Result: ${zodResult.valid ? 'PASS' : 'FAIL'}`);
      if (zodResult.level) {
        console.log(`      Compliance Level: ${zodResult.level.toUpperCase()}`);
      }
      
      // Step 2: JSON Schema validation with cross-references
      console.log('\n   Step 2: Cross-reference validation');
      const jsonResult = await this.jsonSchemaValidator.validateFile(filePath);
      console.log(`      Result: ${jsonResult.valid ? 'PASS' : 'FAIL'}`);
      if (jsonResult.cross_references?.length > 0) {
        console.log(`      Cross-references: ${jsonResult.cross_references.length} validated`);
      }
      
      // Step 3: Version consistency
      console.log('\n   Step 3: Version consistency check');
      const versionResult = await this.versionEnforcer.scanDirectory(dirname(filePath), {
        targetVersion: '0.1.8'
      });
      const fileResult = versionResult.files.find(f => f.file.includes(testFile.split('/').pop()));
      console.log(`      Result: ${fileResult ? (fileResult.inconsistencies.length === 0 ? 'PASS' : 'FAIL') : 'PASS'}`);
      
      // Step 4: Integrated scoring
      console.log('\n   Step 4: Integrated quality score');
      const qualityScore = this.calculateQualityScore(zodResult, jsonResult, versionResult);
      console.log(`      Quality Score: ${qualityScore}%`);
      console.log(`      Overall Assessment: ${this.getQualityAssessment(qualityScore)}`);
      
    } catch (error) {
      console.log(`   ❌ Integrated validation failed: ${error.message}`);
    }
  }

  /**
   * Demonstrate performance optimizations
   */
  async demonstratePerformanceOptimizations() {
    console.log('\n\n⚡ 5. Performance Optimization & Best Practices');
    console.log('-' .repeat(50));
    
    console.log('\n   🚀 Performance Features:');
    console.log('      - Schema compilation and caching');
    console.log('      - Batch validation processing');
    console.log('      - Incremental validation');
    console.log('      - Memory-efficient parsing');
    
    // Demonstrate batch validation
    const validFiles = this.testFiles.filter(f => existsSync(join(__dirname, f)));
    if (validFiles.length > 1) {
      console.log('\n   📦 Batch Validation Performance Test');
      
      const startTime = Date.now();
      const batchResults = await this.zodValidator.validateBatch(
        validFiles.map(f => join(__dirname, f))
      );
      const endTime = Date.now();
      
      console.log(`      Files processed: ${batchResults.summary.total}`);
      console.log(`      Processing time: ${endTime - startTime}ms`);
      console.log(`      Average time per file: ${Math.round((endTime - startTime) / batchResults.summary.total)}ms`);
      console.log(`      Success rate: ${Math.round((batchResults.summary.valid / batchResults.summary.total) * 100)}%`);
    }
    
    console.log('\n   💡 Best Practice Recommendations:');
    console.log('      - Cache compiled schemas for repeated validation');
    console.log('      - Use streaming validation for large files');
    console.log('      - Implement incremental validation for development');
    console.log('      - Combine multiple validation types in single pass');
    console.log('      - Use worker threads for parallel processing');
  }

  /**
   * Find corresponding OpenAPI spec for agent file
   */
  findOpenAPISpec(agentFile) {
    const baseDir = agentFile.replace('/agent.yml', '');
    return `${baseDir}/openapi.yaml`;
  }

  /**
   * Calculate integrated quality score
   */
  calculateQualityScore(zodResult, jsonResult, versionResult) {
    let score = 0;
    
    // Zod validation (40%)
    if (zodResult.valid) {
      score += 40;
      
      // Bonus for higher compliance levels
      const levelBonus = {
        'core': 0,
        'silver': 5,
        'gold': 10,
        'platinum': 15
      };
      score += levelBonus[zodResult.level] || 0;
    }
    
    // JSON Schema validation (30%)
    if (jsonResult.valid) {
      score += 30;
      
      // Bonus for cross-references
      if (jsonResult.cross_references?.length > 0) {
        score += 5;
      }
    }
    
    // Version consistency (20%)
    const hasVersionIssues = versionResult.files?.some(f => f.inconsistencies?.length > 0);
    if (!hasVersionIssues) {
      score += 20;
    }
    
    // General quality (10%)
    const hasWarnings = zodResult.warnings?.length > 0 || jsonResult.warnings?.length > 0;
    if (!hasWarnings) {
      score += 10;
    }
    
    return Math.min(100, score);
  }

  /**
   * Get quality assessment based on score
   */
  getQualityAssessment(score) {
    if (score >= 90) return 'EXCELLENT';
    if (score >= 80) return 'GOOD';
    if (score >= 70) return 'SATISFACTORY';
    if (score >= 60) return 'NEEDS_IMPROVEMENT';
    return 'POOR';
  }
}

// Run demo if called directly
if (import.meta.url === `file://${__filename}`) {
  const demo = new ComprehensiveValidationDemo();
  demo.runDemo().catch(console.error);
}

export default ComprehensiveValidationDemo;