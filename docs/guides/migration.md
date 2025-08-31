# Migration Guide
## Moving from Existing Agent Formats to OAAS

> **Zero Breaking Changes**: OAAS works with your existing agents without modification  
> **Progressive Enhancement**: Add OAAS benefits while keeping everything working

---

## 🎯 **Migration Philosophy**

**OAAS is designed for zero-disruption adoption**:
- ✅ **No file modifications** required
- ✅ **Existing agents keep working** exactly as before
- ✅ **Progressive enhancement** - add OAAS benefits incrementally
- ✅ **Rollback safety** - can disable OAAS without impact

---

## 🔄 **Migration Scenarios**

### **Scenario 1: Pure Discovery (Recommended Start)**

**Goal**: Discover and catalog your existing agents without any changes.

```typescript
// Step 1: Install OAAS
npm install @bluefly/oaas-services

// Step 2: Discover existing agents
import { OAASService } from '@bluefly/oaas-services';

const service = new OAASService({
  projectRoot: process.cwd(),
  runtimeTranslation: false,  // Start with discovery only
  cacheEnabled: true
});

const agents = await service.discoverAgents();
console.log(`Found ${agents.length} existing agents`);
```

**Result**: Complete inventory of all your agents across all formats, with zero risk.

### **Scenario 2: Runtime Translation**

**Goal**: Enable cross-format translation while keeping originals unchanged.

```typescript
// Enable runtime translation
const service = new OAASService({
  projectRoot: process.cwd(),
  runtimeTranslation: true,   // Enable translation
  cacheEnabled: true
});

// Your existing agents now work with any framework
const drupalAgent = agents.find(a => a.format === 'drupal');
const langchainTool = await service.getAgentForFramework(
  drupalAgent.id, 
  'langchain'
);

// Use Drupal agent in LangChain workflow - no file changes!
```

**Result**: Cross-format interoperability with zero file modifications.

### **Scenario 3: Full OAAS Integration**

**Goal**: Create new agents in OAAS format while keeping existing ones.

```typescript
// Create new OAAS-native agents alongside existing ones
// agents/new-oaas-agent.yaml
apiVersion: open-standards-scalable-agents/v0.1.2
kind: Agent
metadata:
  name: enhanced-agent
spec:
  # Full OAAS specification
```

**Result**: Unified environment with OSSA-native agents.

---

## 📁 **Format-Specific Migration**

### **From Drupal AI Agent Plugins**

**Current State**: You have Drupal AI agent plugins like this:

```php
<?php
/**
 * @AIAgent(
 *   id = "content_creator",
 *   name = "Content Creator",
 *   description = "Creates content based on prompts"
 * )
 */
class ContentCreatorPlugin extends AIAgentPluginBase {
  
  public function createArticle($title, $content) {
    // Your existing implementation
    return $this->drupal->createNode('article', $title, $content);
  }
  
  public function createPage($title, $content) {
    // Your existing implementation  
    return $this->drupal->createNode('page', $title, $content);
  }
}
```

**Migration Steps**:

1. **Discovery** (No changes):
   ```typescript
   const agents = await service.discoverAgents();
   const drupalAgents = agents.filter(a => a.format === 'drupal');
   // OAAS automatically finds your existing plugins
   ```

2. **Cross-format usage** (No changes to PHP):
   ```typescript
   // Use your Drupal plugin in LangChain
   const langchainTool = await service.getAgentForFramework(
     'content_creator', 'langchain'
   );
   
   // Or in CrewAI
   const crewaiAgent = await service.getAgentForFramework(
     'content_creator', 'crewai'
   );
   ```

3. **Optional: Create OAAS version** (Keep original):
   ```yaml
   # agents/content-creator-oaas.yaml
   apiVersion: open-standards-scalable-agents/v0.1.2
   kind: Agent
   metadata:
     name: content-creator-enhanced
   spec:
     openapi: 3.1.0
     paths:
       /create-article:
         post:
           operationId: createArticle
           # Enhanced with full OpenAPI spec
   ```

**Result**: Your PHP plugins work unchanged + new OAAS capabilities.

---

### **From MCP Tools**

**Current State**: You have MCP server tools:

```json
{
  "name": "file-operations",
  "version": "1.0.0",
  "tools": [
    {
      "name": "read_file",
      "description": "Read file contents",
      "inputSchema": {
        "type": "object",
        "properties": {
          "path": { "type": "string" }
        },
        "required": ["path"]
      }
    },
    {
      "name": "write_file", 
      "description": "Write file contents",
      "inputSchema": {
        "type": "object",
        "properties": {
          "path": { "type": "string" },
          "content": { "type": "string" }
        },
        "required": ["path", "content"]
      }
    }
  ]
}
```

**Migration Steps**:

1. **Discovery** (No changes):
   ```typescript
   const mcpAgents = await service.discoverAgents();
   // OAAS finds your MCP tools automatically
   ```

2. **Cross-format usage**:
   ```typescript
   // Use MCP tool in LangChain
   const langchainTool = await service.getAgentForFramework(
     'file-operations', 'langchain'
   );
   
   // Use MCP tool as OpenAI function
   const openaiFunction = await service.getAgentForFramework(
     'file-operations', 'openai'
   );
   ```

**Result**: MCP tools unchanged + work in all frameworks.

---

### **From LangChain Tools**

**Current State**: You have LangChain tools:

```python
from langchain.tools import BaseTool

class WebScrapeTool(BaseTool):
    name = "web_scrape"
    description = "Scrape content from web pages"
    
    def _run(self, url: str) -> str:
        # Your scraping implementation
        return scrape_webpage(url)
    
    def _arun(self, url: str) -> str:
        # Async version
        return await async_scrape_webpage(url)
```

**Migration Steps**:

1. **Discovery**:
   ```typescript
   const langchainAgents = agents.filter(a => a.format === 'langchain');
   // OAAS finds your LangChain tools
   ```

2. **Cross-format usage**:
   ```typescript
   // Use LangChain tool in CrewAI
   const crewaiAgent = await service.getAgentForFramework(
     'web_scrape', 'crewai'
   );
   
   // Use in Drupal
   const result = await service.executeCapability(
     'web_scrape', 'scrape', { url: 'https://example.com' }
   );
   ```

**Result**: LangChain tools unchanged + work everywhere.

---

### **From CrewAI Agents**

**Current State**: You have CrewAI agents:

```yaml
# agents/researcher.yaml
role: Research Specialist
goal: Conduct thorough research on given topics
backstory: Expert researcher with access to various data sources
tools:
  - web_search
  - document_analysis
allow_delegation: false
verbose: true
```

**Migration Steps**:

1. **Discovery**:
   ```typescript
   const crewaiAgents = agents.filter(a => a.format === 'crewai');
   ```

2. **Cross-format integration**:
   ```typescript
   // Use CrewAI agent capabilities in other frameworks
   const researchCapability = await service.getAgentForFramework(
     'researcher', 'langchain'
   );
   ```

**Result**: CrewAI agents unchanged + broader integration.

---

## 🔧 **Migration Tools**

### **Migration Assistant CLI**

```bash
# Install migration tools
npm install -g @bluefly/tddai

# Analyze existing project
tddai ai agents analyze --format all --output migration-plan.json

# Generate migration roadmap
tddai ai agents migration-plan --input migration-plan.json

# Test compatibility
tddai ai agents test-compatibility --dry-run
```

### **Compatibility Checker**

```typescript
import { OAASService } from '@bluefly/oaas-services';

const service = new OAASService({ projectRoot: process.cwd() });

// Check compatibility before migration
const compatibility = await service.checkCompatibility();

console.log('Migration Compatibility Report:');
console.log(`✅ Compatible agents: ${compatibility.compatible.length}`);
console.log(`⚠️  Partially compatible: ${compatibility.partial.length}`);
console.log(`❌ Incompatible agents: ${compatibility.incompatible.length}`);

// Get detailed recommendations
compatibility.recommendations.forEach(rec => {
  console.log(`${rec.severity}: ${rec.message}`);
});
```

---

## 📊 **Migration Strategies**

### **Strategy 1: Big Bang (Not Recommended)**

```typescript
// DON'T DO THIS - too risky
const service = new OAASService({
  projectRoot: process.cwd(),
  runtimeTranslation: true,
  validationStrict: true,  // Too strict for initial migration
  replaceExistingAgents: true  // Too aggressive
});
```

### **Strategy 2: Gradual Migration (Recommended)**

```typescript
// Phase 1: Discovery only
const phase1Service = new OAASService({
  projectRoot: process.cwd(),
  runtimeTranslation: false,
  cacheEnabled: true
});

// Phase 2: Add translation for specific formats
const phase2Service = new OAASService({
  projectRoot: process.cwd(),
  runtimeTranslation: true,
  enabledFormats: ['drupal', 'mcp'],  // Start with most stable
  validationStrict: false
});

// Phase 3: Full integration
const phase3Service = new OAASService({
  projectRoot: process.cwd(),
  runtimeTranslation: true,
  enabledFormats: 'all',
  validationStrict: false,  // Still relaxed
  newAgentsOAASOnly: true   // New agents use OAAS format
});
```

### **Strategy 3: Hybrid Approach**

```typescript
// Keep existing agents + add OAAS for new features
const hybridService = new OAASService({
  projectRoot: process.cwd(),
  runtimeTranslation: true,
  preserveOriginalAPIs: true,      // Keep existing APIs
  addOAASAPIs: true,              // Add OAAS APIs alongside
  crossFormatOrchestration: true   // Enable mixed workflows
});
```

---

## 🧪 **Testing Migration**

### **Automated Testing**

```typescript
// Create comprehensive test suite
describe('OAAS Migration', () => {
  let service: OAASService;
  let originalAgents: any[];
  
  beforeAll(async () => {
    // Capture original state
    originalAgents = await captureOriginalAgents();
    
    service = new OAASService({
      projectRoot: process.cwd(),
      runtimeTranslation: true
    });
  });
  
  it('should discover all existing agents', async () => {
    const agents = await service.discoverAgents();
    expect(agents.length).toBeGreaterThanOrEqual(originalAgents.length);
  });
  
  it('should maintain original functionality', async () => {
    const agents = await service.discoverAgents();
    
    for (const agent of agents) {
      // Test each agent's capabilities
      for (const capability of agent.capabilities) {
        const result = await service.executeCapability(
          agent.id, capability.name, capability.testInput
        );
        expect(result).toBeDefined();
      }
    }
  });
  
  it('should enable cross-format translation', async () => {
    const agents = await service.discoverAgents();
    const drupalAgent = agents.find(a => a.format === 'drupal');
    
    if (drupalAgent) {
      const langchainVersion = await service.getAgentForFramework(
        drupalAgent.id, 'langchain'
      );
      expect(langchainVersion).toBeDefined();
    }
  });
});
```

### **Performance Testing**

```typescript
// Ensure migration doesn't degrade performance
describe('Migration Performance', () => {
  it('should maintain execution speed', async () => {
    const startTime = Date.now();
    
    const agents = await service.discoverAgents();
    const discoveryTime = Date.now() - startTime;
    
    // Discovery should be fast
    expect(discoveryTime).toBeLessThan(5000); // 5 seconds max
    
    // Translation should be cached and fast
    const translationStart = Date.now();
    await service.getAgentForFramework(agents[0].id, 'langchain');
    const translationTime = Date.now() - translationStart;
    
    expect(translationTime).toBeLessThan(100); // 100ms max
  });
});
```

---

## 🔄 **Rollback Plan**

### **Safe Rollback**

Since OAAS never modifies your files, rollback is simply:

```typescript
// Option 1: Disable OAAS service
const service = new OAASService({
  projectRoot: process.cwd(),
  runtimeTranslation: false,  // Disable translation
  enabled: false              // Disable entirely
});

// Option 2: Uninstall package
npm uninstall @bluefly/oaas-services

// Option 3: Use feature flags
const service = new OAASService({
  projectRoot: process.cwd(),
  runtimeTranslation: process.env.OAAS_ENABLED === 'true',
  featureFlags: {
    crossFormatExecution: false,
    newFormatSupport: false
  }
});
```

**Your original agents continue working exactly as before.**

---

## 📈 **Success Metrics**

### **Migration Success Indicators**

```typescript
// Track migration progress
const metrics = await service.getMigrationMetrics();

console.log('Migration Success Metrics:', {
  // Discovery metrics
  totalAgentsFound: metrics.discovery.total,
  discoverySuccessRate: metrics.discovery.successRate,
  
  // Translation metrics
  translationSuccessRate: metrics.translation.successRate,
  averageTranslationTime: metrics.translation.averageTime,
  
  // Execution metrics
  crossFormatExecutions: metrics.execution.crossFormat,
  executionSuccessRate: metrics.execution.successRate,
  
  // Performance metrics
  performanceImprovement: metrics.performance.improvement,
  cacheHitRate: metrics.cache.hitRate
});
```

### **Business Value Metrics**

- ✅ **Developer Productivity**: Faster agent development
- ✅ **Code Reuse**: Agents work across multiple frameworks  
- ✅ **Time to Market**: Reduced integration complexity
- ✅ **Maintenance Cost**: Single agent, multiple frameworks
- ✅ **Innovation Speed**: Focus on capabilities, not integration

---

## 🎯 **Migration Checklist**

### **Pre-Migration**
- [ ] Backup current project
- [ ] Document existing agent inventory
- [ ] Set up testing environment
- [ ] Install OAAS tools

### **Phase 1: Discovery**
- [ ] Run agent discovery
- [ ] Verify all agents found
- [ ] Check discovery accuracy
- [ ] Generate agent inventory report

### **Phase 2: Translation**
- [ ] Enable runtime translation
- [ ] Test cross-format translation
- [ ] Verify performance acceptable
- [ ] Update documentation

### **Phase 3: Integration**
- [ ] Build cross-format workflows
- [ ] Create new OAAS agents
- [ ] Train team on OAAS concepts
- [ ] Monitor production performance

### **Post-Migration**
- [ ] Measure success metrics
- [ ] Gather team feedback
- [ ] Optimize performance
- [ ] Plan next enhancements

---

**🚀 OAAS migration is designed to be safe, gradual, and reversible - your existing agents always keep working.**