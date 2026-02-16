#!/usr/bin/env node
/**
 * Template Rendering Script
 * Renders Handlebars templates with values from YAML files
 *
 * Usage:
 *   node render-templates.js --type docker --values docker/values.yaml --output ./rendered/
 *   node render-templates.js --type kubernetes --values k8s-values.yaml --output ./k8s/
 *   node render-templates.js --help
 */

const Handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// ============================================================================
// Handlebars Helpers
// ============================================================================

// Base64 encoding helper
Handlebars.registerHelper('base64', (str) => {
  if (!str) return '';
  return Buffer.from(str).toString('base64');
});

// Indentation helper
Handlebars.registerHelper('indent', (count, content) => {
  if (!content) return '';
  const spaces = ' '.repeat(count);
  return content
    .split('\n')
    .map((line, index) => (index === 0 ? line : spaces + line))
    .join('\n');
});

// Uppercase helper
Handlebars.registerHelper('uppercase', (str) => {
  return (str || '').toUpperCase();
});

// Lowercase helper
Handlebars.registerHelper('lowercase', (str) => {
  return (str || '').toLowerCase();
});

// JSON stringify helper
Handlebars.registerHelper('json', (obj) => {
  return JSON.stringify(obj, null, 2);
});

// Equals helper
Handlebars.registerHelper('eq', (a, b) => {
  return a === b;
});

// Not equals helper
Handlebars.registerHelper('ne', (a, b) => {
  return a !== b;
});

// ============================================================================
// Template Rendering Functions
// ============================================================================

function renderTemplate(templatePath, values, outputPath) {
  try {
    // Read template
    const templateContent = fs.readFileSync(templatePath, 'utf8');

    // Compile template
    const template = Handlebars.compile(templateContent);

    // Render with values
    const output = template(values);

    // Write output
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(outputPath, output);

    console.log(`✓ Generated ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to render ${templatePath}:`, error.message);
    return false;
  }
}

function loadValues(valuesPath) {
  try {
    const valuesContent = fs.readFileSync(valuesPath, 'utf8');
    return yaml.load(valuesContent);
  } catch (error) {
    console.error(`✗ Failed to load values from ${valuesPath}:`, error.message);
    process.exit(1);
  }
}

// ============================================================================
// Docker Templates
// ============================================================================

function renderDockerTemplates(valuesPath, outputDir) {
  const values = loadValues(valuesPath);

  const templates = [
    {
      template: 'docker/Dockerfile.hbs',
      output: path.join(outputDir, 'Dockerfile'),
    },
    {
      template: 'docker/docker-compose.yml.hbs',
      output: path.join(outputDir, 'docker-compose.yml'),
    },
  ];

  console.log('\n📦 Rendering Docker templates...\n');

  let success = 0;
  let failed = 0;

  templates.forEach(({ template, output }) => {
    const templatePath = path.join(__dirname, template);
    if (renderTemplate(templatePath, values, output)) {
      success++;
    } else {
      failed++;
    }
  });

  console.log(`\n✓ Successfully rendered ${success} template(s)`);
  if (failed > 0) {
    console.log(`✗ Failed to render ${failed} template(s)`);
  }
}

// ============================================================================
// Kubernetes Templates
// ============================================================================

function renderKubernetesTemplates(valuesPath, outputDir) {
  const values = loadValues(valuesPath);

  const templates = [
    {
      template: 'kubernetes/deployment.yaml.hbs',
      output: path.join(outputDir, 'deployment.yaml'),
    },
    {
      template: 'kubernetes/service.yaml.hbs',
      output: path.join(outputDir, 'service.yaml'),
    },
    {
      template: 'kubernetes/ingress.yaml.hbs',
      output: path.join(outputDir, 'ingress.yaml'),
    },
    {
      template: 'kubernetes/configmap.yaml.hbs',
      output: path.join(outputDir, 'configmap.yaml'),
    },
    {
      template: 'kubernetes/secret.yaml.hbs',
      output: path.join(outputDir, 'secret.yaml'),
    },
    {
      template: 'kubernetes/hpa.yaml.hbs',
      output: path.join(outputDir, 'hpa.yaml'),
    },
    {
      template: 'kubernetes/rbac.yaml.hbs',
      output: path.join(outputDir, 'rbac.yaml'),
    },
    {
      template: 'kubernetes/networkpolicy.yaml.hbs',
      output: path.join(outputDir, 'networkpolicy.yaml'),
    },
  ];

  console.log('\n☸️  Rendering Kubernetes templates...\n');

  let success = 0;
  let failed = 0;

  templates.forEach(({ template, output }) => {
    const templatePath = path.join(__dirname, template);
    if (renderTemplate(templatePath, values, output)) {
      success++;
    } else {
      failed++;
    }
  });

  console.log(`\n✓ Successfully rendered ${success} template(s)`);
  if (failed > 0) {
    console.log(`✗ Failed to render ${failed} template(s)`);
  }

  // Warn about secrets
  console.log('\n⚠️  WARNING: secret.yaml contains base64-encoded values.');
  console.log('   Never commit this file to version control!');
  console.log('   Use Sealed Secrets or External Secrets Operator in production.\n');
}

// ============================================================================
// CLI Interface
// ============================================================================

function printHelp() {
  console.log(`
Template Rendering Script

Usage:
  node render-templates.js --type <docker|kubernetes> --values <path> [options]

Options:
  --type, -t        Template type: "docker" or "kubernetes" (required)
  --values, -v      Path to values YAML file (required)
  --output, -o      Output directory (default: ./rendered/)
  --help, -h        Show this help message

Examples:
  # Render Docker templates
  node render-templates.js \\
    --type docker \\
    --values docker/docker-values.yaml \\
    --output ./

  # Render Kubernetes templates
  node render-templates.js \\
    --type kubernetes \\
    --values my-app-k8s-values.yaml \\
    --output ./k8s/

Environment-specific rendering:
  node render-templates.js \\
    --type kubernetes \\
    --values values/production.yaml \\
    --output ./k8s/production/
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    type: null,
    values: null,
    output: './rendered/',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }

    if (arg === '--type' || arg === '-t') {
      options.type = args[++i];
    } else if (arg === '--values' || arg === '-v') {
      options.values = args[++i];
    } else if (arg === '--output' || arg === '-o') {
      options.output = args[++i];
    }
  }

  // Validate required options
  if (!options.type) {
    console.error('✗ Error: --type is required');
    printHelp();
    process.exit(1);
  }

  if (!options.values) {
    console.error('✗ Error: --values is required');
    printHelp();
    process.exit(1);
  }

  if (!['docker', 'kubernetes'].includes(options.type)) {
    console.error('✗ Error: --type must be "docker" or "kubernetes"');
    process.exit(1);
  }

  if (!fs.existsSync(options.values)) {
    console.error(`✗ Error: Values file not found: ${options.values}`);
    process.exit(1);
  }

  return options;
}

// ============================================================================
// Main
// ============================================================================

function main() {
  const options = parseArgs();

  console.log(`
╔═══════════════════════════════════════════════════╗
║   Template Rendering Script                      ║
║   Production-ready deployment configurations     ║
╚═══════════════════════════════════════════════════╝

Configuration:
  Type:   ${options.type}
  Values: ${options.values}
  Output: ${options.output}
`);

  if (options.type === 'docker') {
    renderDockerTemplates(options.values, options.output);
  } else if (options.type === 'kubernetes') {
    renderKubernetesTemplates(options.values, options.output);
  }

  console.log('\n✨ Done!\n');
}

// Run if called directly
if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error('\n✗ Unexpected error:', error.message);
    process.exit(1);
  }
}

module.exports = {
  renderTemplate,
  loadValues,
  renderDockerTemplates,
  renderKubernetesTemplates,
};
