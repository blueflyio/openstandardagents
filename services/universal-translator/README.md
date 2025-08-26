# OAAS Universal Translator Service

> **Runtime translation for any agent format to OAAS without file modification**

## 🎯 Mission

Transform your existing 58+ agents (Drupal, MCP, LangChain, CrewAI, etc.) into a unified OAAS-compliant ecosystem **without changing a single file**. The Universal Translator provides runtime translation, cross-framework bridging, and universal discovery.

## 🚀 Key Benefits

### ✅ Zero Breaking Changes
- **NO file modifications** - all existing code continues to work
- **NO rewrites required** - gradual adoption of OAAS features
- **NO disruption** - existing workflows remain intact

### 🌐 Universal Compatibility
- **Any agent format works everywhere** - Drupal plugin as LangChain tool
- **Runtime translation** - format conversion happens in memory
- **Cross-framework bridging** - MCP server ↔ CrewAI agent seamlessly

### 📊 Instant Benefits
- **58+ agents discovered automatically** from your existing codebase
- **Unified execution interface** regardless of original format
- **OAAS compliance checking** without code changes

## 📦 Installation

```bash
# Install the universal translator
npm install @bluefly/oaas-universal-translator

# Install in your TDDAI project
cd /Users/flux423/Sites/LLM/common_npm/tddai
npm install @bluefly/oaas-universal-translator
```

## 🔧 Usage

### Basic Discovery & Translation

```typescript
import { OAASService } from '@bluefly/oaas-universal-translator';

// Initialize with your project
const oaas = new OAASService({
  projectRoot: '/Users/flux423/Sites/LLM/llm-platform',
  runtimeTranslation: true
});

// Discover ALL agents regardless of format
const agents = await oaas.discoverAgents();
console.log(`Found ${agents.length} agents!`);

// Execute any agent capability
await oaas.executeCapability('drupal-content-type', 'create_content', {
  title: 'Blog Post',
  fields: ['title', 'body', 'tags']
});
```

### TDDAI CLI Integration

```bash
# New enhanced commands (no changes to existing commands)
tddai ai agents discover                    # Find all 58+ agents
tddai ai agents list --format drupal       # List Drupal agents only
tddai ai agents execute drupal-content-type create_content
tddai ai agents bridge drupal-field-type langchain
tddai ai agents validate --strict

# Enhanced existing commands
tddai ai train --agent-discovery           # Use discovered agents as context
tddai ai orchestrate --mixed-formats       # Orchestrate across formats
```

## 🏗️ Architecture

### Discovery Engine
```
🔍 Scans project for agents in ANY format:
├── Drupal PHP Plugins (58+ in ai_agents module)
├── MCP Server Configurations (mcp.json files)  
├── LangChain Tools (@tool decorators, Tool classes)
├── CrewAI Agent Definitions (Agent(), Crew())
├── OpenAI Assistant Configs (assistant patterns)
├── Anthropic Tool Definitions (claude/tool_use)
└── Generic Agent Files (*agent*.py/js/ts)
```

### Runtime Translation
```
🔄 Translates agents to OAAS format in memory:
├── DrupalTranslator (PHP → OAAS spec)
├── MCPTranslator (mcp.json → OAAS spec)
├── LangChainTranslator (Python/JS tools → OAAS spec)
├── CrewAITranslator (crew definitions → OAAS spec)
└── UniversalTranslator (routes to appropriate translator)
```

### Runtime Bridge
```
🌉 Executes agents in any framework:
├── Drupal Agent → LangChain Tool
├── MCP Server → CrewAI Agent  
├── LangChain Tool → OpenAI Function
└── Any format → Any other format
```

## 📁 Discovered Agents Example

Your existing `/llm-platform/web/modules/custom/ai_agents/` will be discovered as:

```yaml
Discovered Agents: 58+
├── drupal-content-type (ContentType.php)
│   ├── Capabilities: create_content_type, configure_fields
│   ├── Prompts: 6 YAML files in prompts/node_content_type_agent/
│   └── OAAS Compliance: Gold
├── drupal-field-type (FieldType.php)  
│   ├── Capabilities: create_field, configure_storage
│   ├── Prompts: 7 YAML files in prompts/field_type_agent/
│   └── OAAS Compliance: Gold
├── drupal-taxonomy (TaxonomyAgent.php)
│   ├── Capabilities: create_vocabulary, manage_terms
│   ├── Prompts: 4 YAML files in prompts/taxonomy_agent/
│   └── OAAS Compliance: Silver
└── ... 55+ more agents automatically discovered
```

## 🎯 Real-World Example: Enhanced TDDAI Training

### Before (Current State)
```bash
# Limited to manual file input
tddai ai train --file /path/to/DRUPAL_WAY_COMPLIANCE.md --context "drupal-compliance"
```

### After (With OAAS Universal Translator)
```bash
# Automatically discover and use ALL agents as training context
tddai ai train --agent-discovery --agent-format drupal
# Now training with context from 58+ Drupal agents, their prompts, and capabilities!

# Cross-format training
tddai ai train --agent-discovery
# Training with Drupal + MCP + LangChain + CrewAI agents as context
```

## 🔍 Discovery Results for Your Project

Based on `/llm-platform/web/modules/custom/ai_agents/`, the Universal Translator will discover:

### Drupal AI Agents (58+ agents)
- **Core Agents**: ContentType, FieldType, TaxonomyAgent  
- **Extended Agents**: Webform (15 operations), Views, ModuleEnable
- **Function Call Agents**: 22 specialized function handlers
- **Validation Agents**: 4 validation plugins
- **Explorer Agents**: AgentDecision system
- **Form Integration**: Batch processing, content generation

### Capabilities Extracted
```yaml
Total Capabilities: 200+ 
├── Content Management: create_content_type, configure_fields, manage_entities
├── Field Operations: create_field_storage, modify_config, list_types
├── Taxonomy: create_vocabulary, manage_terms, configure_hierarchy  
├── Webform: create_form, add_fields, configure_emails, manage_submissions
├── Views: create_view, configure_fields, setup_filters, manage_displays
└── System: module_enable, entity_operations, config_management
```

### Prompts Library (40+ YAML files)
All existing prompt files automatically available:
- `prompts/node_content_type_agent/`: 6 prompts
- `prompts/field_type_agent/`: 7 prompts  
- `prompts/taxonomy_agent/`: 4 prompts
- `prompts/webform_agent/`: 15 prompts
- `prompts/views_agent/`: 4 prompts
- `prompts/module_enable/`: 2 prompts

## 🚦 Getting Started

### 1. Install & Discover
```bash
cd /Users/flux423/Sites/LLM/common_npm/tddai
npm install @bluefly/oaas-universal-translator
tddai ai agents discover
```

### 2. Validate Existing Agents
```bash
tddai ai agents validate --format drupal
# See OAAS compliance for all 58+ agents
```

### 3. Use Enhanced Training
```bash
tddai ai train --agent-discovery --validation
# Train models with all discovered agents as context
```

### 4. Cross-Format Execution
```bash
# Execute Drupal agent as if it were a LangChain tool
tddai ai agents bridge drupal-content-type langchain
```

## 🎉 Impact on Your TDDAI Commands

### Enhanced (Not Replaced) Commands
```bash
# Existing commands work exactly the same
tddai ai train --file compliance.md        # ✅ Still works
tddai ai orchestrate                        # ✅ Still works  
tddai ai optimize                          # ✅ Still works

# New superpowers added
tddai ai train --agent-discovery           # 🆕 Enhanced with 58+ agents
tddai ai orchestrate --mixed-formats       # 🆕 Cross-format orchestration
tddai ai agents discover                   # 🆕 Universal discovery
tddai ai agents execute drupal-content-type create_content  # 🆕 Direct execution
```

### Zero Disruption
- All existing TDDAI functionality preserved
- All existing Drupal agents continue to work in Drupal
- All existing MCP servers continue to work with Claude Desktop  
- All existing LangChain tools continue to work in LangChain

### Massive Enhancement
- 58+ agents now discoverable and executable from CLI
- Cross-format agent orchestration possible
- Training enhanced with comprehensive agent context
- Universal agent execution regardless of original format

## 🔄 Development Workflow

### Phase 1: Install & Discover (Today)
```bash
npm install @bluefly/oaas-universal-translator
tddai ai agents discover  # See all 58+ agents
```

### Phase 2: Enhanced Training (This Week)
```bash
tddai ai train --agent-discovery  # Use agents as training context
```

### Phase 3: Cross-Format Orchestration (Next Week)  
```bash
tddai ai orchestrate --mixed-formats  # Drupal + MCP + LangChain together
```

### Phase 4: Production Ready (This Month)
```bash
# Full ecosystem with universal agent support
tddai platform deploy --with-universal-agents
```

---

**The OAAS Universal Translator transforms your existing 58+ agents into a unified, cross-framework, OAAS-compliant ecosystem without changing a single file. Your TDDAI commands become dramatically more powerful while remaining 100% backward compatible.**