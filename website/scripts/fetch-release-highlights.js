#!/usr/bin/env node
/**
 * Fetch release highlights from spec CHANGELOGs
 * Parses the "What's New" section and generates structured JSON for the homepage
 *
 * This enables the website to be 100% dynamic - no manual updates needed
 * When a new version is released, the homepage auto-updates with new features
 *
 * Run: npm run fetch-highlights
 * Auto-runs on: npm run dev, npm run build
 */

const fs = require('fs');
const path = require('path');

const SPEC_DIR = path.join(__dirname, '../../spec');
const OUTPUT_PATH = path.join(__dirname, '../lib/release-highlights.json');

// Category icons and colors for homepage display
const CATEGORY_CONFIG = {
  'security': {
    color: 'green',
    icon: 'shield',
    keywords: ['security', 'auth', 'scopes', 'compliance', 'hipaa', 'gdpr', 'soc2', 'fedramp', 'secrets', 'sandboxing']
  },
  'orchestration': {
    color: 'blue',
    icon: 'workflow',
    keywords: ['orchestration', 'multi-agent', 'a2a', 'protocol', 'agent-to-agent', 'capability', 'registry', 'session', 'instance']
  },
  'observability': {
    color: 'purple',
    icon: 'chart',
    keywords: ['observability', 'telemetry', 'opentelemetry', 'trace', 'reasoning', 'react', 'cot', 'tot', 'prompt', 'template']
  },
  'developer': {
    color: 'orange',
    icon: 'code',
    keywords: ['developer', 'cli', 'validation', 'conformance', 'testing', 'agents.md', 'llms.txt', 'integration', 'sdk']
  },
  'transport': {
    color: 'teal',
    icon: 'network',
    keywords: ['transport', 'streaming', 'grpc', 'http', 'websocket', 'protocol', 'bidirectional']
  },
  'state': {
    color: 'indigo',
    icon: 'database',
    keywords: ['state', 'memory', 'storage', 'session', 'context', 'retention', 'vector-db']
  },
  'adk': {
    color: 'red',
    icon: 'google',
    keywords: ['google', 'adk', 'gemini', 'vertex']
  }
};

// Parse CHANGELOG.md to extract highlights
function parseChangelog(content, version) {
  const highlights = {
    version,
    releaseDate: null,
    overview: '',
    categories: [],
    features: []
  };

  // Extract release date
  const dateMatch = content.match(/\*\*Release Date\*\*:\s*(.+)/);
  if (dateMatch) {
    highlights.releaseDate = dateMatch[1].trim();
  }

  // Extract overview
  const overviewMatch = content.match(/## Overview\n\n(.+?)(?=\n\n##|\n##)/s);
  if (overviewMatch) {
    highlights.overview = overviewMatch[1].trim();
  }

  // Extract "What's New" section
  const whatsNewMatch = content.match(/## What's New\n\n([\s\S]+?)(?=\n## Breaking Changes|\n## Deprecations|\n## Migration|\n## Installation|$)/);
  if (!whatsNewMatch) {
    return highlights;
  }

  const whatsNewContent = whatsNewMatch[1];

  // Parse each ### subsection
  const sectionRegex = /### (.+?)\n\n([\s\S]+?)(?=\n### |\n## |$)/g;
  let match;

  while ((match = sectionRegex.exec(whatsNewContent)) !== null) {
    const title = match[1].trim();
    const content = match[2].trim();

    // Categorize the feature
    const category = categorizeFeature(title, content);

    // Extract bullet points (key features)
    const bulletPoints = extractBulletPoints(content);

    const feature = {
      title,
      description: extractFirstParagraph(content),
      category: category.name,
      color: category.color,
      bullets: bulletPoints.slice(0, 3) // Max 3 bullets per feature
    };

    highlights.features.push(feature);

    // Track unique categories
    if (!highlights.categories.find(c => c.name === category.name)) {
      highlights.categories.push(category);
    }
  }

  return highlights;
}

// Categorize a feature based on keywords
function categorizeFeature(title, content) {
  const combined = (title + ' ' + content).toLowerCase();

  for (const [name, config] of Object.entries(CATEGORY_CONFIG)) {
    for (const keyword of config.keywords) {
      if (combined.includes(keyword)) {
        return { name, ...config };
      }
    }
  }

  // Default to developer category
  return { name: 'developer', ...CATEGORY_CONFIG.developer };
}

// Extract first paragraph of content
function extractFirstParagraph(content) {
  const lines = content.split('\n');
  let paragraph = '';

  for (const line of lines) {
    if (line.startsWith('```') || line.startsWith('-') || line.startsWith('*') || line.startsWith('#')) {
      break;
    }
    if (line.trim()) {
      paragraph += (paragraph ? ' ' : '') + line.trim();
    } else if (paragraph) {
      break;
    }
  }

  return paragraph || content.split('\n')[0];
}

// Extract bullet points from content
function extractBulletPoints(content) {
  const bullets = [];

  // Match markdown bold text patterns like **text** or `code`
  const boldMatches = content.match(/\*\*([^*]+)\*\*/g) || [];
  const codeMatches = content.match(/`([^`]+)`/g) || [];

  // Extract from list items
  const listItems = content.match(/^[-*]\s+(.+)$/gm) || [];
  for (const item of listItems.slice(0, 5)) {
    const cleanItem = item.replace(/^[-*]\s+/, '').replace(/\*\*/g, '').trim();
    if (cleanItem.length > 10 && cleanItem.length < 100) {
      bullets.push(cleanItem);
    }
  }

  // If no list items, extract key phrases from bold text
  if (bullets.length === 0) {
    for (const bold of boldMatches.slice(0, 5)) {
      const clean = bold.replace(/\*\*/g, '');
      if (clean.length > 5 && clean.length < 80) {
        bullets.push(clean);
      }
    }
  }

  return bullets;
}

// Group features by category for homepage display
function groupByCategory(features) {
  const grouped = {};

  for (const feature of features) {
    if (!grouped[feature.category]) {
      grouped[feature.category] = {
        category: feature.category,
        color: feature.color,
        features: []
      };
    }
    grouped[feature.category].features.push({
      title: feature.title,
      bullets: feature.bullets
    });
  }

  // Convert to array and limit to 4 categories for homepage
  return Object.values(grouped).slice(0, 4);
}

// Generate homepage-ready highlights
function generateHomepageHighlights(highlights) {
  const categories = groupByCategory(highlights.features);

  // Map to homepage card format
  return categories.map(cat => {
    // Flatten all bullets from features in this category
    const allBullets = cat.features.flatMap(f => f.bullets);

    // Get unique, meaningful bullets
    const uniqueBullets = [...new Set(allBullets)]
      .filter(b => b.length > 10)
      .slice(0, 3);

    // Generate a title based on category
    const titles = {
      security: 'Enterprise Security',
      orchestration: 'Multi-Agent Orchestration',
      observability: 'Observability',
      developer: 'Developer Experience',
      transport: 'Transport & Streaming',
      state: 'State Management',
      adk: 'Google ADK Integration'
    };

    return {
      title: titles[cat.category] || cat.features[0]?.title || 'New Features',
      color: cat.color,
      bullets: uniqueBullets
    };
  });
}

async function main() {
  console.log('🔄 Fetching release highlights from spec CHANGELOGs...\n');

  // Find all version directories
  const versions = fs.readdirSync(SPEC_DIR)
    .filter(f => f.startsWith('v') && fs.statSync(path.join(SPEC_DIR, f)).isDirectory())
    .sort((a, b) => {
      // Sort by semver descending
      const parseVersion = v => v.replace('v', '').split(/[-.]/).map(n => parseInt(n) || 0);
      const aParts = parseVersion(a);
      const bParts = parseVersion(b);
      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        if ((aParts[i] || 0) !== (bParts[i] || 0)) {
          return (bParts[i] || 0) - (aParts[i] || 0);
        }
      }
      return 0;
    });

  if (versions.length === 0) {
    console.log('⚠️  No version directories found in spec/');
    console.log('  Generating default highlights...');
    
    // Generate default highlights when no spec directories exist
    const highlights = {
      version: '0.2.9',
      releaseDate: new Date().toISOString().split('T')[0],
      overview: 'The latest OSSA release brings enterprise-grade specifications for production multi-agent systems.',
      features: [],
      categories: [],
      homepage: [
        {
          title: 'Enterprise Security',
          color: 'green',
          bullets: [
            'Formal security model with authentication & authorization',
            'Secrets management & sandboxing requirements',
            'FedRAMP, SOC2, HIPAA compliance profiles'
          ]
        },
        {
          title: 'Multi-Agent Orchestration',
          color: 'blue',
          bullets: [
            'A2A Protocol for agent-to-agent communication',
            'Capability URI scheme with registry format',
            'Instance, session, and interaction IDs'
          ]
        },
        {
          title: 'Observability',
          color: 'purple',
          bullets: [
            'OpenTelemetry semantic conventions',
            'Reasoning trace export (ReAct, CoT, ToT)',
            'Versioned prompt template management'
          ]
        },
        {
          title: 'Developer Experience',
          color: 'orange',
          bullets: [
            'Conformance testing (Basic, Standard, Enterprise)',
            'agents.md & llms.txt integration',
            'Enhanced CLI validation tools'
          ]
        }
      ]
    };
    
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(highlights, null, 2));
    console.log(`\n✅ Generated ${OUTPUT_PATH} with default highlights`);
    process.exit(0);
  }

  const latestVersion = versions[0];
  console.log(`Latest version: ${latestVersion}`);

  // Try to find CHANGELOG.md
  const changelogPath = path.join(SPEC_DIR, latestVersion, 'CHANGELOG.md');
  const readmePath = path.join(SPEC_DIR, latestVersion, 'README.md');

  let highlights = null;

  if (fs.existsSync(changelogPath)) {
    console.log(`  Parsing ${changelogPath}...`);
    const content = fs.readFileSync(changelogPath, 'utf8');
    highlights = parseChangelog(content, latestVersion.replace('v', ''));
  } else if (fs.existsSync(readmePath)) {
    console.log(`  No CHANGELOG.md found, parsing ${readmePath}...`);
    const content = fs.readFileSync(readmePath, 'utf8');
    highlights = parseChangelog(content, latestVersion.replace('v', ''));
  } else {
    console.log(`  No CHANGELOG.md or README.md found for ${latestVersion}`);

    // Try previous stable version
    for (const version of versions.slice(1)) {
      const altChangelog = path.join(SPEC_DIR, version, 'CHANGELOG.md');
      if (fs.existsSync(altChangelog) && !version.includes('dev') && !version.includes('RC')) {
        console.log(`  Falling back to ${version}/CHANGELOG.md...`);
        const content = fs.readFileSync(altChangelog, 'utf8');
        highlights = parseChangelog(content, version.replace('v', ''));
        break;
      }
    }
  }

  if (!highlights || highlights.features.length === 0) {
    // Generate default highlights
    console.log('  Generating default highlights...');
    highlights = {
      version: latestVersion.replace('v', ''),
      releaseDate: new Date().toISOString().split('T')[0],
      overview: 'The latest OSSA release brings enterprise-grade specifications for production multi-agent systems.',
      features: [],
      categories: [],
      homepage: [
        {
          title: 'Enterprise Security',
          color: 'green',
          bullets: [
            'Formal security model with authentication & authorization',
            'Secrets management & sandboxing requirements',
            'FedRAMP, SOC2, HIPAA compliance profiles'
          ]
        },
        {
          title: 'Multi-Agent Orchestration',
          color: 'blue',
          bullets: [
            'A2A Protocol for agent-to-agent communication',
            'Capability URI scheme with registry format',
            'Instance, session, and interaction IDs'
          ]
        },
        {
          title: 'Observability',
          color: 'purple',
          bullets: [
            'OpenTelemetry semantic conventions',
            'Reasoning trace export (ReAct, CoT, ToT)',
            'Versioned prompt template management'
          ]
        },
        {
          title: 'Developer Experience',
          color: 'orange',
          bullets: [
            'Conformance testing (Basic, Standard, Enterprise)',
            'agents.md & llms.txt integration',
            'Enhanced CLI validation tools'
          ]
        }
      ]
    };
  } else {
    // Generate homepage-ready format
    highlights.homepage = generateHomepageHighlights(highlights);

    // Ensure we have 4 categories
    while (highlights.homepage.length < 4) {
      const defaults = [
        {
          title: 'Enterprise Security',
          color: 'green',
          bullets: ['Built-in compliance frameworks', 'Security best practices', 'Audit trail support']
        },
        {
          title: 'Multi-Agent Orchestration',
          color: 'blue',
          bullets: ['Agent-to-agent communication', 'Workflow orchestration', 'Capability management']
        },
        {
          title: 'Observability',
          color: 'purple',
          bullets: ['Tracing and monitoring', 'Performance metrics', 'Debug tooling']
        },
        {
          title: 'Developer Experience',
          color: 'orange',
          bullets: ['CLI tools', 'Validation utilities', 'IDE integrations']
        }
      ];

      const missing = defaults.find(d => !highlights.homepage.find(h => h.title === d.title));
      if (missing) {
        highlights.homepage.push(missing);
      } else {
        break;
      }
    }
  }

  // Write output
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(highlights, null, 2));
  console.log(`\n✅ Generated ${OUTPUT_PATH}`);
  console.log(`   Version: ${highlights.version}`);
  console.log(`   Features: ${highlights.features.length}`);
  console.log(`   Homepage cards: ${highlights.homepage.length}`);
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
