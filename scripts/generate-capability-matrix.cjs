#!/usr/bin/env node

/**
 * OSSA Agent Capability Matrix Generator
 * Generates a comprehensive matrix of all agent capabilities
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class CapabilityMatrixGenerator {
  constructor(agentsDir = '.agents') {
    this.agentsDir = path.resolve(agentsDir);
    this.matrix = {
      categories: {},
      capabilities: new Set(),
      domains: new Set(),
      integrations: new Set(),
      agents: []
    };
  }

  /**
   * Scan all agents and build capability matrix
   */
  async generate() {
    console.log('📊 Generating OSSA Agent Capability Matrix\n');

    // Scan each category
    const categories = fs.readdirSync(this.agentsDir)
      .filter(item => fs.statSync(path.join(this.agentsDir, item)).isDirectory())
      .filter(item => !item.startsWith('.'));

    for (const category of categories) {
      this.matrix.categories[category] = {
        agents: [],
        capabilities: new Set(),
        domains: new Set()
      };

      const categoryPath = path.join(this.agentsDir, category);
      const agents = fs.readdirSync(categoryPath)
        .filter(item => fs.statSync(path.join(categoryPath, item)).isDirectory());

      for (const agentName of agents) {
        const agentPath = path.join(categoryPath, agentName);
        const agentConfig = this.loadAgentConfig(agentPath);

        if (agentConfig) {
          const agentInfo = {
            name: agentName,
            category,
            ...agentConfig
          };

          // Add to matrix
          this.matrix.agents.push(agentInfo);
          this.matrix.categories[category].agents.push(agentName);

          // Collect capabilities
          if (agentConfig.capabilities) {
            agentConfig.capabilities.forEach(cap => {
              this.matrix.capabilities.add(cap);
              this.matrix.categories[category].capabilities.add(cap);
            });
          }

          // Collect domains
          if (agentConfig.domains) {
            agentConfig.domains.forEach(domain => {
              this.matrix.domains.add(domain);
              this.matrix.categories[category].domains.add(domain);
            });
          }

          // Collect integrations
          if (agentConfig.integrations) {
            agentConfig.integrations.forEach(integration => {
              this.matrix.integrations.add(integration);
            });
          }
        }
      }
    }

    // Generate outputs
    this.generateMarkdownMatrix();
    this.generateJSONMatrix();
    this.generateHTMLMatrix();
    this.printSummary();
  }

  /**
   * Load agent configuration
   */
  loadAgentConfig(agentPath) {
    const configPath = path.join(agentPath, 'agent.yml');

    try {
      if (fs.existsSync(configPath)) {
        return yaml.load(fs.readFileSync(configPath, 'utf8'));
      }
    } catch (error) {
      console.error(`Error loading ${configPath}: ${error.message}`);
    }

    return null;
  }

  /**
   * Generate Markdown capability matrix
   */
  generateMarkdownMatrix() {
    let markdown = '# OSSA Agent Capability Matrix\n\n';
    markdown += `*Generated: ${new Date().toISOString()}*\n\n`;

    // Summary statistics
    markdown += '## Summary\n\n';
    markdown += `- **Total Agents**: ${this.matrix.agents.length}\n`;
    markdown += `- **Categories**: ${Object.keys(this.matrix.categories).length}\n`;
    markdown += `- **Unique Capabilities**: ${this.matrix.capabilities.size}\n`;
    markdown += `- **Domains**: ${this.matrix.domains.size}\n`;
    markdown += `- **Integrations**: ${this.matrix.integrations.size}\n\n`;

    // Agents by category
    markdown += '## Agents by Category\n\n';
    for (const [category, data] of Object.entries(this.matrix.categories)) {
      if (data.agents.length > 0) {
        markdown += `### ${category.charAt(0).toUpperCase() + category.slice(1)} (${data.agents.length})\n\n`;
        markdown += '| Agent | Description | Capabilities |\n';
        markdown += '|-------|-------------|-------------|\n';

        for (const agentName of data.agents) {
          const agent = this.matrix.agents.find(a => a.name === agentName && a.category === category);
          if (agent) {
            const caps = agent.capabilities ? agent.capabilities.slice(0, 3).join(', ') : '-';
            markdown += `| ${agentName} | ${agent.description || '-'} | ${caps} |\n`;
          }
        }
        markdown += '\n';
      }
    }

    // Capability coverage
    markdown += '## Capability Coverage\n\n';
    markdown += '| Capability | Categories | Agent Count |\n';
    markdown += '|------------|------------|-------------|\n';

    const capabilityCoverage = {};
    for (const agent of this.matrix.agents) {
      if (agent.capabilities) {
        for (const cap of agent.capabilities) {
          if (!capabilityCoverage[cap]) {
            capabilityCoverage[cap] = { categories: new Set(), count: 0 };
          }
          capabilityCoverage[cap].categories.add(agent.category);
          capabilityCoverage[cap].count++;
        }
      }
    }

    // Sort by count
    const sortedCaps = Object.entries(capabilityCoverage)
      .sort(([, a], [, b]) => b.count - a.count);

    for (const [capability, data] of sortedCaps.slice(0, 20)) {
      const categories = Array.from(data.categories).join(', ');
      markdown += `| ${capability} | ${categories} | ${data.count} |\n`;
    }

    markdown += '\n';

    // Domain expertise
    markdown += '## Domain Expertise\n\n';
    const domainCoverage = {};
    for (const agent of this.matrix.agents) {
      if (agent.domains) {
        for (const domain of agent.domains) {
          if (!domainCoverage[domain]) {
            domainCoverage[domain] = [];
          }
          domainCoverage[domain].push(agent.name);
        }
      }
    }

    for (const [domain, agents] of Object.entries(domainCoverage).slice(0, 15)) {
      markdown += `- **${domain}**: ${agents.join(', ')}\n`;
    }

    // Save to file
    const outputPath = path.join(process.cwd(), 'docs', 'CAPABILITY-MATRIX.md');
    fs.writeFileSync(outputPath, markdown);
    console.log(`✅ Markdown matrix saved to: ${outputPath}`);
  }

  /**
   * Generate JSON matrix
   */
  generateJSONMatrix() {
    const jsonMatrix = {
      generated: new Date().toISOString(),
      statistics: {
        totalAgents: this.matrix.agents.length,
        categories: Object.keys(this.matrix.categories).length,
        capabilities: this.matrix.capabilities.size,
        domains: this.matrix.domains.size,
        integrations: this.matrix.integrations.size
      },
      categories: {},
      agents: this.matrix.agents
    };

    // Convert Sets to Arrays for JSON
    for (const [category, data] of Object.entries(this.matrix.categories)) {
      jsonMatrix.categories[category] = {
        agents: data.agents,
        capabilities: Array.from(data.capabilities),
        domains: Array.from(data.domains)
      };
    }

    const outputPath = path.join(process.cwd(), 'docs', 'capability-matrix.json');
    fs.writeFileSync(outputPath, JSON.stringify(jsonMatrix, null, 2));
    console.log(`✅ JSON matrix saved to: ${outputPath}`);
  }

  /**
   * Generate HTML visualization
   */
  generateHTMLMatrix() {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OSSA Agent Capability Matrix</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; background: #f5f5f5; }
    h1 { color: #333; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
    .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .stat-card h3 { margin: 0 0 10px 0; color: #666; font-size: 14px; text-transform: uppercase; }
    .stat-card .value { font-size: 32px; font-weight: bold; color: #2563eb; }
    .category { background: white; margin: 20px 0; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .category h2 { color: #333; margin: 0 0 15px 0; }
    .agent-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
    .agent { background: #f0f9ff; padding: 10px; border-radius: 4px; border-left: 3px solid #2563eb; }
    .agent-name { font-weight: bold; color: #1e40af; }
    .capabilities { margin-top: 5px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <h1>🤖 OSSA Agent Capability Matrix</h1>
  <p>Generated: ${new Date().toLocaleString()}</p>

  <div class="stats">
    <div class="stat-card">
      <h3>Total Agents</h3>
      <div class="value">${this.matrix.agents.length}</div>
    </div>
    <div class="stat-card">
      <h3>Categories</h3>
      <div class="value">${Object.keys(this.matrix.categories).length}</div>
    </div>
    <div class="stat-card">
      <h3>Capabilities</h3>
      <div class="value">${this.matrix.capabilities.size}</div>
    </div>
    <div class="stat-card">
      <h3>Domains</h3>
      <div class="value">${this.matrix.domains.size}</div>
    </div>
  </div>`;

    for (const [category, data] of Object.entries(this.matrix.categories)) {
      if (data.agents.length > 0) {
        html += `
  <div class="category">
    <h2>${category.charAt(0).toUpperCase() + category.slice(1)} (${data.agents.length} agents)</h2>
    <div class="agent-grid">`;

        for (const agentName of data.agents) {
          const agent = this.matrix.agents.find(a => a.name === agentName && a.category === category);
          if (agent) {
            const caps = agent.capabilities ? agent.capabilities.slice(0, 2).join(', ') : '';
            html += `
      <div class="agent">
        <div class="agent-name">${agentName}</div>
        ${caps ? `<div class="capabilities">${caps}</div>` : ''}
      </div>`;
          }
        }

        html += `
    </div>
  </div>`;
      }
    }

    html += `
</body>
</html>`;

    const outputPath = path.join(process.cwd(), 'docs', 'capability-matrix.html');
    fs.writeFileSync(outputPath, html);
    console.log(`✅ HTML matrix saved to: ${outputPath}`);
  }

  /**
   * Print summary to console
   */
  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('CAPABILITY MATRIX SUMMARY');
    console.log('='.repeat(60));
    console.log(`\nTotal Agents: ${this.matrix.agents.length}`);
    console.log(`Categories: ${Object.keys(this.matrix.categories).length}`);
    console.log(`Unique Capabilities: ${this.matrix.capabilities.size}`);
    console.log(`Domains: ${this.matrix.domains.size}`);
    console.log(`Integrations: ${this.matrix.integrations.size}`);

    console.log('\nAgents per Category:');
    for (const [category, data] of Object.entries(this.matrix.categories)) {
      if (data.agents.length > 0) {
        console.log(`  ${category}: ${data.agents.length}`);
      }
    }

    console.log('\nTop Capabilities:');
    const capCount = {};
    for (const agent of this.matrix.agents) {
      if (agent.capabilities) {
        for (const cap of agent.capabilities) {
          capCount[cap] = (capCount[cap] || 0) + 1;
        }
      }
    }

    Object.entries(capCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .forEach(([cap, count]) => {
        console.log(`  - ${cap}: ${count} agents`);
      });
  }
}

// CLI execution
if (require.main === module) {
  const generator = new CapabilityMatrixGenerator();
  generator.generate().catch(error => {
    console.error('Generation failed:', error);
    process.exit(1);
  });
}

module.exports = CapabilityMatrixGenerator;