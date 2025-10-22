#!/usr/bin/env ts-node
/**
 * Resource Validation Tool
 * 
 * Validates Kubernetes manifests to prevent cluster resource exhaustion.
 * Integrates with CI/CD to block deployments with excessive resource requests.
 * 
 * Usage:
 *   ts-node validate-resources.ts examples/bridges/k8s/
 *   npm run validate:resources
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

interface ResourceLimits {
  cpu: string;
  memory: string;
}

interface ResourceRequests {
  requests?: ResourceLimits;
  limits?: ResourceLimits;
}

interface ValidationRule {
  maxCpuRequest: number;      // In millicores (e.g., 100 = 100m)
  maxMemoryRequest: number;   // In Mi (e.g., 512 = 512Mi)
  maxCpuLimit: number;
  maxMemoryLimit: number;
  maxReplicas: number;
}

// STRICT LIMITS for shared clusters
const RESOURCE_RULES: ValidationRule = {
  maxCpuRequest: 100,      // Max 100m CPU request
  maxMemoryRequest: 512,   // Max 512Mi memory request
  maxCpuLimit: 500,        // Max 500m CPU limit
  maxMemoryLimit: 1024,    // Max 1Gi memory limit
  maxReplicas: 3,          // Max 3 replicas
};

interface ValidationError {
  file: string;
  resource: string;
  field: string;
  actual: string | number;
  max: number;
  severity: 'error' | 'warning';
}

/**
 * Parse resource string to numeric value
 */
function parseResource(value: string, type: 'cpu' | 'memory'): number {
  if (type === 'cpu') {
    // Parse CPU (e.g., "100m", "0.5", "1")
    if (value.endsWith('m')) {
      return parseInt(value.slice(0, -1), 10);
    }
    return parseFloat(value) * 1000; // Convert cores to millicores
  } else {
    // Parse memory (e.g., "512Mi", "1Gi")
    if (value.endsWith('Mi')) {
      return parseInt(value.slice(0, -2), 10);
    }
    if (value.endsWith('Gi')) {
      return parseInt(value.slice(0, -2), 10) * 1024;
    }
    if (value.endsWith('M')) {
      return parseInt(value.slice(0, -1), 10);
    }
    if (value.endsWith('G')) {
      return parseInt(value.slice(0, -1), 10) * 1024;
    }
    // Assume bytes, convert to Mi
    return Math.ceil(parseInt(value, 10) / (1024 * 1024));
  }
}

/**
 * Validate a single Kubernetes manifest
 */
function validateManifest(filePath: string, content: any): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Check if it's a Deployment, StatefulSet, or DaemonSet
  if (!['Deployment', 'StatefulSet', 'DaemonSet'].includes(content.kind)) {
    return errors;
  }
  
  const fileName = path.basename(filePath);
  const spec = content.spec?.template?.spec;
  
  if (!spec || !spec.containers) {
    return errors;
  }
  
  // Check replicas
  const replicas = content.spec?.replicas || 1;
  if (replicas > RESOURCE_RULES.maxReplicas) {
    errors.push({
      file: fileName,
      resource: content.metadata?.name || 'unknown',
      field: 'replicas',
      actual: replicas,
      max: RESOURCE_RULES.maxReplicas,
      severity: 'error',
    });
  }
  
  // Check each container's resources
  for (const container of spec.containers) {
    const resources: ResourceRequests = container.resources || {};
    
    // Validate CPU requests
    if (resources.requests?.cpu) {
      const cpuRequest = parseResource(resources.requests.cpu, 'cpu');
      if (cpuRequest > RESOURCE_RULES.maxCpuRequest) {
        errors.push({
          file: fileName,
          resource: container.name,
          field: 'resources.requests.cpu',
          actual: resources.requests.cpu,
          max: RESOURCE_RULES.maxCpuRequest,
          severity: 'error',
        });
      }
    }
    
    // Validate memory requests
    if (resources.requests?.memory) {
      const memRequest = parseResource(resources.requests.memory, 'memory');
      if (memRequest > RESOURCE_RULES.maxMemoryRequest) {
        errors.push({
          file: fileName,
          resource: container.name,
          field: 'resources.requests.memory',
          actual: resources.requests.memory,
          max: RESOURCE_RULES.maxMemoryRequest,
          severity: 'error',
        });
      }
    }
    
    // Validate CPU limits
    if (resources.limits?.cpu) {
      const cpuLimit = parseResource(resources.limits.cpu, 'cpu');
      if (cpuLimit > RESOURCE_RULES.maxCpuLimit) {
        errors.push({
          file: fileName,
          resource: container.name,
          field: 'resources.limits.cpu',
          actual: resources.limits.cpu,
          max: RESOURCE_RULES.maxCpuLimit,
          severity: 'warning',
        });
      }
    }
    
    // Validate memory limits
    if (resources.limits?.memory) {
      const memLimit = parseResource(resources.limits.memory, 'memory');
      if (memLimit > RESOURCE_RULES.maxMemoryLimit) {
        errors.push({
          file: fileName,
          resource: container.name,
          field: 'resources.limits.memory',
          actual: resources.limits.memory,
          max: RESOURCE_RULES.maxMemoryLimit,
          severity: 'warning',
        });
      }
    }
    
    // Warn if no resource requests defined
    if (!resources.requests) {
      errors.push({
        file: fileName,
        resource: container.name,
        field: 'resources.requests',
        actual: 'undefined',
        max: 0,
        severity: 'warning',
      });
    }
  }
  
  return errors;
}

/**
 * Validate all YAML files in a directory
 */
function validateDirectory(dirPath: string): ValidationError[] {
  const allErrors: ValidationError[] = [];
  
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    if (!file.endsWith('.yaml') && !file.endsWith('.yml')) {
      continue;
    }
    
    const filePath = path.join(dirPath, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    try {
      const docs = yaml.loadAll(content);
      
      for (const doc of docs) {
        if (doc && typeof doc === 'object') {
          const errors = validateManifest(filePath, doc);
          allErrors.push(...errors);
        }
      }
    } catch (error) {
      console.error(`Failed to parse ${file}:`, error);
    }
  }
  
  return allErrors;
}

/**
 * Print validation results
 */
function printResults(errors: ValidationError[]): number {
  if (errors.length === 0) {
    console.log('✅ All resource limits are within acceptable ranges!');
    return 0;
  }
  
  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;
  
  console.log('\n🚨 Resource Validation Failed!\n');
  
  // Print errors
  const errorList = errors.filter(e => e.severity === 'error');
  if (errorList.length > 0) {
    console.log('❌ ERRORS (blocking):');
    for (const err of errorList) {
      console.log(`   ${err.file} - ${err.resource}:`);
      console.log(`     ${err.field} = ${err.actual}`);
      console.log(`     Maximum allowed: ${err.max}${err.field.includes('cpu') ? 'm' : 'Mi'}`);
      console.log('');
    }
  }
  
  // Print warnings
  const warningList = errors.filter(e => e.severity === 'warning');
  if (warningList.length > 0) {
    console.log('⚠️  WARNINGS:');
    for (const warn of warningList) {
      console.log(`   ${warn.file} - ${warn.resource}:`);
      console.log(`     ${warn.field} = ${warn.actual}`);
      if (warn.actual !== 'undefined') {
        console.log(`     Recommended max: ${warn.max}${warn.field.includes('cpu') ? 'm' : 'Mi'}`);
      }
      console.log('');
    }
  }
  
  console.log(`\n📊 Summary: ${errorCount} errors, ${warningCount} warnings`);
  console.log('\n💡 Resource Limits (shared cluster):');
  console.log(`   CPU Request:    max ${RESOURCE_RULES.maxCpuRequest}m`);
  console.log(`   Memory Request: max ${RESOURCE_RULES.maxMemoryRequest}Mi`);
  console.log(`   Replicas:       max ${RESOURCE_RULES.maxReplicas}`);
  console.log('\n🔧 Fix: Reduce resource requests in deployment.yaml\n');
  
  return errorCount > 0 ? 1 : 0;
}

/**
 * Main
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: validate-resources.ts <directory>');
    console.error('Example: validate-resources.ts examples/bridges/k8s/');
    process.exit(1);
  }
  
  const dirPath = args[0];
  
  if (!fs.existsSync(dirPath)) {
    console.error(`Directory not found: ${dirPath}`);
    process.exit(1);
  }
  
  console.log(`🔍 Validating Kubernetes manifests in ${dirPath}...\n`);
  
  const errors = validateDirectory(dirPath);
  const exitCode = printResults(errors);
  
  process.exit(exitCode);
}

// Run if called directly
if (require.main === module) {
  main();
}

export { validateManifest, validateDirectory, RESOURCE_RULES };

