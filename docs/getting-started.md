# Getting Started with OAAS
## 5-Minute Setup Guide

> **Goal**: Get the OpenAPI AI Agents Standard working with your existing agents in under 5 minutes

---

## 🚀 **Quick Installation**

### **1. Install the Universal Translator**

```bash
# Install the core OAAS services package
npm install @bluefly/oaas-services

# For CLI integration, install enhanced TDDAI
npm install -g @bluefly/tddai
```

### **2. Basic Discovery**

Create a simple discovery script:

```javascript
// discover-agents.js
import { OAASService } from '@bluefly/oaas-services';

const service = new OAASService({
  projectRoot: process.cwd(),
  runtimeTranslation: true,
  cacheEnabled: true
});

console.log('🔍 Discovering agents...');
const agents = await service.discoverAgents();

console.log(`✅ Found ${agents.length} agents`);
agents.forEach((agent, i) => {
  console.log(`  ${i + 1}. ${agent.name} (${agent.format})`);
});
```

```bash
# Run discovery
node discover-agents.js
```

### **3. Expected Output**

```
🔍 Discovering agents...
🔍 Starting universal agent discovery...
📁 Project root: /your/project/path
✅ Discovered 15 unique agents
✅ Found 15 agents
  1. Content Creator Agent (drupal)
  2. File Manager Tool (mcp)
  3. Web Scraper (langchain)
  4. Content Writer (crewai)
  5. ...
```

---

## 📁 **Project Structure Setup**

### **Recommended Structure**

```
your-project/
├── agents/                  # Custom OAAS agents
│   ├── content-creator.yaml
│   └── data-processor.yaml
├── src/
│   ├── drupal-plugins/      # Existing Drupal agents
│   ├── mcp-tools/          # MCP server tools
│   └── langchain-tools/    # LangChain tools
├── package.json
└── oaas.config.js          # Optional configuration
```

### **Configuration File (Optional)**

```javascript
// oaas.config.js
export default {
  projectRoot: process.cwd(),
  runtimeTranslation: true,
  cacheEnabled: true,
  validationStrict: false,
  discoveryPaths: [
    'src/agents',
    'src/drupal-plugins',
    'src/mcp-tools',
    'custom/ai-tools'
  ],
  excludePatterns: [
    'node_modules',
    'dist',
    '*.test.*'
  ]
};
```

---

## 🔧 **CLI Usage**

### **Enhanced TDDAI Commands**

```bash
# Discover all agents in current project
tddai ai agents discover

# Filter by specific format
tddai ai agents discover --format drupal

# Show detailed agent information
tddai ai agents list --capabilities

# Test cross-format orchestration
tddai ai orchestrate --mixed-formats

# Enhanced training with agent context
tddai ai train --agent-discovery
```

---

## 🎯 **Your First Agent**

### **Create a Simple OAAS Agent**

```yaml
# agents/hello-world.yaml
apiVersion: openapi-ai-agents/v0.1.1
kind: Agent
metadata:
  name: hello-world
  description: A simple greeting agent
  version: 1.0.0
spec:
  openapi: 3.1.0
  info:
    title: Hello World Agent
    version: 1.0.0
    description: Provides friendly greetings
  paths:
    /greet:
      post:
        operationId: greet
        summary: Generate a personalized greeting
        requestBody:
          required: true
          content:
            application/json:
              schema:
                type: object
                required: [name]
                properties:
                  name:
                    type: string
                    description: Name of person to greet
        responses:
          '200':
            description: Greeting response
            content:
              application/json:
                schema:
                  type: object
                  properties:
                    greeting:
                      type: string
```

### **Test Your Agent**

```javascript
import { OAASService } from '@bluefly/oaas-services';

const service = new OAASService({
  projectRoot: process.cwd(),
  runtimeTranslation: true
});

// Discover agents (will find your hello-world agent)
const agents = await service.discoverAgents();
const helloAgent = agents.find(a => a.name === 'hello-world');

if (helloAgent) {
  console.log('✅ Found hello-world agent');
  
  // Execute the greeting capability
  const result = await service.executeCapability(
    helloAgent.id,
    'greet',
    { name: 'World' }
  );
  
  console.log('Result:', result);
}
```

---

## 🔄 **Working with Existing Agents**

### **Drupal AI Agents**

If you have existing Drupal AI agent plugins:

```php
<?php
/**
 * @AIAgent(
 *   id = "content_generator",
 *   name = "Content Generator",
 *   description = "Generates content based on prompts"
 * )
 */
class ContentGeneratorPlugin extends AIAgentPluginBase {
  
  public function generateContent($prompt, $type = 'article') {
    // Your existing implementation
    return $this->llm->generate($prompt);
  }
}
```

**OAAS will automatically discover this without any modifications!**

### **MCP Tools**

For existing MCP server tools:

```json
{
  "name": "file-manager",
  "version": "1.0.0",
  "tools": [
    {
      "name": "read_file",
      "description": "Read contents of a file",
      "inputSchema": {
        "type": "object",
        "properties": {
          "path": { "type": "string" }
        }
      }
    }
  ]
}
```

**OAAS discovers MCP tools automatically from manifest files!**

---

## ✅ **Verify Installation**

### **Health Check**

```bash
# Check OAAS system health
tddai ai agents health

# Expected output:
# ✅ Universal Translator: Ready
# ✅ Discovery Engine: Ready  
# ✅ Runtime Bridge: Ready
# ✅ Agent Registry: Ready
```

### **Discovery Test**

```bash
# Run discovery and show statistics
tddai ai agents discover --stats

# Expected output:
# 🔍 Universal agent discovery completed
# ✅ Total agents: 42
# 📊 By format:
#    - drupal: 15 agents
#    - mcp: 8 agents  
#    - langchain: 12 agents
#    - crewai: 7 agents
```

---

## 🎉 **Next Steps**

### **Level 1: Basic Usage**
1. ✅ Install and run discovery
2. ✅ Find your existing agents
3. ✅ Create your first OAAS agent
4. ✅ Test agent execution

### **Level 2: Integration**
- 📖 Read [Integration Guide](integration-guide.md)
- 🔧 Set up framework bridges (LangChain, CrewAI)
- 🚀 Build cross-format workflows
- 📊 Monitor performance with caching

### **Level 3: Advanced**
- 🏗️ Study [Universal Translator](universal-translator.md) architecture
- 🔍 Deep dive into [Agent Discovery Protocol](agent-discovery.md)
- 🏢 Explore [Enterprise Features](enterprise-features.md)
- 🤝 Contribute to the [project](https://github.com/bluefly-ai/openapi-ai-agents-standard)

---

## 🆘 **Troubleshooting**

### **Common Issues**

| Issue | Solution |
|-------|----------|
| **No agents found** | Check `discoveryPaths` in configuration |
| **Permission errors** | Ensure read access to source directories |
| **Translation failures** | Check agent format compliance |
| **Performance issues** | Enable caching and adjust batch size |

### **Debug Mode**

```javascript
const service = new OAASService({
  projectRoot: process.cwd(),
  runtimeTranslation: true,
  debug: true  // Enable detailed logging
});
```

### **Get Help**

- 📖 **Documentation**: Check other guides in this docs folder
- 🐛 **Issues**: [GitHub Issues](https://github.com/bluefly-ai/openapi-ai-agents-standard/issues)
- 💬 **Community**: [GitHub Discussions](https://github.com/bluefly-ai/openapi-ai-agents-standard/discussions)

---

**🎯 You're now ready to use OAAS with your existing agents - no file modifications required!**