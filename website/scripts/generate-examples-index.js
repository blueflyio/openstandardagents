#!/usr/bin/env node

/**
 * Generate examples index JSON for static export
 * Run during build to create examples.json
 */

const fs = require('fs');
const path = require('path');

const examplesDir = path.join(__dirname, '../../examples');
const outputFile = path.join(__dirname, '../public/examples.json');

function getAllExamples() {
  const examples = [];

  if (!fs.existsSync(examplesDir)) {
    console.log('⚠️  Examples directory not found:', examplesDir);
    return examples;
  }

  // Map directories to 10 main categories
  function getCategory(dirPath) {
    const relativePath = path.relative(examplesDir, dirPath).toLowerCase();
    const pathParts = relativePath.split(path.sep);
    const topLevel = pathParts[0];

    // 1. Getting Started
    if (topLevel === 'getting-started' || topLevel === 'quickstart' || topLevel === 'minimal') {
      return 'Getting Started';
    }

    // 2. Framework Integration
    if (['langchain', 'crewai', 'openai', 'anthropic', 'autogen', 'langflow', 'langgraph', 'llamaindex', 'cursor', 'vercel'].includes(topLevel)) {
      return 'Framework Integration';
    }

    // 3. Agent Types
    if (topLevel === 'agent-manifests' || pathParts.includes('workers') || pathParts.includes('orchestrators') || 
        pathParts.includes('critics') || pathParts.includes('judges') || pathParts.includes('monitors') || 
        pathParts.includes('governors') || pathParts.includes('integrators')) {
      return 'Agent Types';
    }

    // 4. Production
    if (topLevel === 'production' || topLevel === 'enterprise' || relativePath.includes('compliance')) {
      return 'Production';
    }

    // 5. Infrastructure
    if (topLevel === 'kagent' || topLevel === 'bridges' || relativePath.includes('k8s') || 
        relativePath.includes('kubernetes') || relativePath.includes('docker') || relativePath.includes('serverless')) {
      return 'Infrastructure';
    }

    // 6. Advanced Patterns
    if (topLevel === 'advanced' || relativePath.includes('patterns') || relativePath.includes('workflows') ||
        relativePath.includes('model-router') || relativePath.includes('smart-model')) {
      return 'Advanced Patterns';
    }

    // 7. Integration Patterns
    if (topLevel === 'integration-patterns' || topLevel === 'adk-integration' || 
        (topLevel === 'bridges' && !relativePath.includes('k8s') && !relativePath.includes('phase4'))) {
      return 'Integration Patterns';
    }

    // 8. OpenAPI Extensions
    if (topLevel === 'openapi-extensions' || (relativePath.includes('openapi') && topLevel !== 'openapi-extensions')) {
      return 'OpenAPI Extensions';
    }

    // 9. Migration Guides
    if (topLevel === 'migration-guides') {
      return 'Migration Guides';
    }

    // 10. Spec Examples & Templates
    if (topLevel === 'spec-examples' || topLevel === 'templates' || topLevel === 'extensions' ||
        topLevel === 'common_npm' || topLevel === 'architecture' || topLevel === 'typescript' ||
        topLevel === 'drupal') {
      return 'Spec Examples & Templates';
    }

    // Handle root-level files
    if (relativePath === '' || pathParts.length === 0 || !topLevel) {
      return 'Getting Started';
    }
    
    return 'Getting Started';
  }

  function traverseDir(dir, parentCategory = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const currentCategory = getCategory(dir);

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(examplesDir, fullPath);

      // Skip certain directories
      if (entry.isDirectory()) {
        if (entry.name === '__pycache__' || entry.name === 'node_modules' || entry.name === '.git') {
          continue;
        }
        traverseDir(fullPath, currentCategory);
      } else if (
        entry.isFile() &&
        (entry.name.endsWith('.yml') ||
          entry.name.endsWith('.yaml') ||
          entry.name.endsWith('.json') ||
          entry.name.endsWith('.ts')) &&
        !entry.name.startsWith('.') &&
        entry.name !== '.gitlab-ci.yml'
      ) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          // Get category from file path for better categorization
          let fileCategory = currentCategory || getCategory(path.dirname(fullPath));
          
          // Override category based on filename for root-level files
          const fileName = entry.name.toLowerCase();
          if (relativePath === entry.name) {
            // Root-level file
            if (fileName.includes('compliance')) {
              fileCategory = 'Production';
            } else if (fileName.includes('bridge')) {
              fileCategory = 'Integration Patterns';
            } else {
              fileCategory = 'Getting Started';
            }
          } else if (fileName.includes('service-registry') || fileName.includes('registry')) {
            fileCategory = 'Spec Examples & Templates';
          }
          
          examples.push({
            name: entry.name,
            path: relativePath,
            content,
            category: fileCategory,
          });
        } catch (error) {
          console.warn(`⚠️  Skipping ${fullPath}:`, error.message);
        }
      }
    }
  }

  traverseDir(examplesDir);
  return examples;
}

const examples = getAllExamples();

// Ensure public directory exists
const publicDir = path.dirname(outputFile);
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(outputFile, JSON.stringify(examples, null, 2));
console.log(`✅ Generated ${outputFile} with ${examples.length} examples`);

