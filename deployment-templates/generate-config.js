#!/usr/bin/env node

/**
 * OSSA Buildkit Deployment Config Generator
 *
 * Generates deployment configurations from Handlebars templates
 * for Railway, Render, and Fly.io platforms.
 *
 * Usage:
 *   node generate-config.js --platform railway --values my-values.json
 *   node generate-config.js --platform render --values my-values.json
 *   node generate-config.js --platform fly --values my-values.json
 *   node generate-config.js --all --values my-values.json
 */

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

// Parse command line arguments
const args = process.argv.slice(2);
const platform = args.includes('--all') ? 'all' : args[args.indexOf('--platform') + 1];
const valuesFile = args[args.indexOf('--values') + 1];
const outputDir = args.includes('--output') ? args[args.indexOf('--output') + 1] : process.cwd();

// Validate arguments
if (!platform || (!args.includes('--all') && !['railway', 'render', 'fly'].includes(platform))) {
  console.error('Error: Please specify a valid platform (railway, render, fly) or use --all');
  console.error('Usage: node generate-config.js --platform <railway|render|fly|all> --values <values-file.json>');
  process.exit(1);
}

if (!valuesFile) {
  console.error('Error: Please specify a values file with --values');
  console.error('Usage: node generate-config.js --platform <railway|render|fly|all> --values <values-file.json>');
  process.exit(1);
}

// Load template values
let values;
try {
  const valuesPath = path.resolve(valuesFile);
  values = JSON.parse(fs.readFileSync(valuesPath, 'utf8'));
  console.log(`✓ Loaded values from ${valuesPath}`);
} catch (error) {
  console.error(`Error loading values file: ${error.message}`);
  process.exit(1);
}

// Register Handlebars helpers
Handlebars.registerHelper('eq', (a, b) => a === b);
Handlebars.registerHelper('ne', (a, b) => a !== b);
Handlebars.registerHelper('gt', (a, b) => a > b);
Handlebars.registerHelper('lt', (a, b) => a < b);
Handlebars.registerHelper('or', (...args) => args.slice(0, -1).some(Boolean));
Handlebars.registerHelper('and', (...args) => args.slice(0, -1).every(Boolean));

// Platform configurations
const platforms = {
  railway: {
    template: 'railway.json.hbs',
    output: 'railway.json'
  },
  render: {
    template: 'render.yaml.hbs',
    output: 'render.yaml'
  },
  fly: {
    template: 'fly.toml.hbs',
    output: 'fly.toml'
  }
};

/**
 * Generate configuration for a platform
 */
function generateConfig(platformName) {
  const config = platforms[platformName];

  try {
    // Read template
    const templatePath = path.join(__dirname, config.template);
    const templateContent = fs.readFileSync(templatePath, 'utf8');

    // Compile template
    const template = Handlebars.compile(templateContent);

    // Generate output
    const output = template(values);

    // Write output file
    const outputPath = path.join(outputDir, config.output);
    fs.writeFileSync(outputPath, output, 'utf8');

    console.log(`✓ Generated ${platformName} configuration: ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`✗ Error generating ${platformName} configuration: ${error.message}`);
    return false;
  }
}

/**
 * Validate required values
 */
function validateValues() {
  const required = [
    'serviceName',
    'githubRepo',
    'branch',
    'buildCommand',
    'startCommand'
  ];

  const missing = required.filter(key => !values[key]);

  if (missing.length > 0) {
    console.error('Error: Missing required values:');
    missing.forEach(key => console.error(`  - ${key}`));
    return false;
  }

  return true;
}

/**
 * Set default values
 */
function setDefaults() {
  const defaults = {
    nodeEnv: 'production',
    port: 8080,
    bridgePort: 8081,
    metricsPort: 9090,
    logLevel: 'info',
    replicas: 1,
    minReplicas: 1,
    maxReplicas: 5,
    autoscalingEnabled: true,
    targetCpu: 70,
    targetMemory: 80,
    memory: '2Gi',
    memoryMb: 1024,
    cpu: '1',
    cpus: 1,
    cpuKind: 'shared',
    rateLimitWindow: 60000,
    rateLimitMax: 100,
    vectorDbCollection: 'ossa_agents',
    maxConcurrentAgents: 10,
    agentTimeoutMs: 300000,
    cacheTtlSeconds: 300,
    enableMetrics: true,
    enableDebug: false,
    postgresMaxConnections: 100,
    postgresSharedBuffers: '256MB',
    redisMaxMemory: '512mb',
    redisMaxMemoryPolicy: 'allkeys-lru',
    maxPayloadSize: '10mb',
    requestTimeoutMs: 30000,
    enableCors: true,
    workerConcurrency: 5,
    workerPollInterval: 1000,
    cleanupRetentionDays: 30,
    syncBatchSize: 100,
    diskSizeGb: 10,
    dataMountSizeGb: 10,
    logsMountSizeGb: 5,
    killTimeout: '30s',
    autoStopMachines: false,
    autoStartMachines: true,
    minMachinesRunning: 1,
    concurrencyType: 'requests',
    concurrencyHardLimit: 250,
    concurrencySoftLimit: 200,
    healthCheckInterval: '30s',
    healthCheckTimeout: '10s',
    healthCheckGracePeriod: '30s',
    deployStrategy: 'rolling',
    maxUnavailable: 1,
    autoRollback: true,
    logFormat: 'json',
    sslMinVersion: '1.2',
    sslPreferServerCiphers: true
  };

  // Apply defaults for missing values
  Object.keys(defaults).forEach(key => {
    if (values[key] === undefined) {
      values[key] = defaults[key];
    }
  });

  // Set environment-specific values
  if (values.nodeEnv === 'production') {
    values.isProduction = true;
    values.productionCpus = values.productionCpus || 2;
    values.productionMemoryMb = values.productionMemoryMb || 2048;
    values.productionMinReplicas = values.productionMinReplicas || 2;
    values.productionMaxReplicas = values.productionMaxReplicas || 10;
  } else if (values.nodeEnv === 'staging') {
    values.isStaging = true;
    values.stagingCpus = values.stagingCpus || 1;
    values.stagingMemoryMb = values.stagingMemoryMb || 1024;
    values.stagingMinReplicas = values.stagingMinReplicas || 1;
    values.stagingMaxReplicas = values.stagingMaxReplicas || 3;
  } else if (values.nodeEnv === 'development') {
    values.isDevelopment = true;
    values.developmentCpus = values.developmentCpus || 1;
    values.developmentMemoryMb = values.developmentMemoryMb || 512;
  }
}

/**
 * Display summary
 */
function displaySummary() {
  console.log('\n' + '='.repeat(60));
  console.log('Configuration Summary');
  console.log('='.repeat(60));
  console.log(`Service Name: ${values.serviceName}`);
  console.log(`Environment: ${values.nodeEnv}`);
  console.log(`Repository: ${values.githubRepo}`);
  console.log(`Branch: ${values.branch}`);
  console.log(`Replicas: ${values.minReplicas}-${values.maxReplicas} (autoscaling: ${values.autoscalingEnabled ? 'enabled' : 'disabled'})`);
  console.log(`Resources: ${values.cpu} CPU, ${values.memory || values.memoryMb + 'MB'} memory`);
  if (values.customDomain) {
    console.log(`Custom Domain: ${values.customDomain}`);
  }
  console.log('='.repeat(60) + '\n');
}

/**
 * Main execution
 */
function main() {
  console.log('OSSA Buildkit Deployment Config Generator\n');

  // Validate values
  if (!validateValues()) {
    process.exit(1);
  }

  // Set defaults
  setDefaults();

  // Display summary
  displaySummary();

  // Generate configurations
  let success = true;

  if (platform === 'all') {
    console.log('Generating all platform configurations...\n');
    success = Object.keys(platforms).every(p => generateConfig(p));
  } else {
    console.log(`Generating ${platform} configuration...\n`);
    success = generateConfig(platform);
  }

  if (success) {
    console.log('\n✓ Configuration generation complete!');
    console.log('\nNext steps:');

    if (platform === 'railway' || platform === 'all') {
      console.log('  Railway: railway up');
    }
    if (platform === 'render' || platform === 'all') {
      console.log('  Render: Connect repository in Render dashboard');
    }
    if (platform === 'fly' || platform === 'all') {
      console.log('  Fly.io: fly deploy');
    }

    console.log('\nDon\'t forget to set environment secrets!');
    console.log('See ENVIRONMENT_VARIABLES.md for details.\n');
  } else {
    console.log('\n✗ Configuration generation failed');
    process.exit(1);
  }
}

// Run
main();
