# Kiro IDE Supercharger Spec

**An npm package for transforming ANY development environment into an AI-powered productivity platform.**

## What This Is

This spec creates `@bluefly/kiro-supercharger` - an npm package that provides:
- **Intelligent Steering Rules** - Project-aware context and standards
- **Automated Agent Hooks** - Event-driven development workflows
- **MCP Integration** - External tool and service connections
- **Spec-Driven Development** - Systematic feature building
- **Context Management** - Smart information assembly

## Architecture (DRY Approach)

Instead of copying folders to 40 projects, we create an npm package:

```
@bluefly/kiro-supercharger (npm package)
├── templates/              # Reusable templates
│   ├── steering/          # Steering rule templates
│   ├── hooks/             # Hook templates
│   ├── settings/          # Config templates
│   └── specs/             # Spec templates
├── cli/                   # CLI for setup
│   └── kiro-init.ts      # Initialize in any project
└── docs/                  # Shared documentation

Your 40 Projects
├── agent-brain/
│   ├── .kiro/
│   │   └── config.json   # Just points to @bluefly/kiro-supercharger
│   └── package.json      # Depends on @bluefly/kiro-supercharger
├── agent-docker/
│   ├── .kiro/
│   │   └── config.json   # Same config
│   └── package.json      # Same dependency
└── ... (38 more projects)
```

## DRY Benefits

✅ **Single Source of Truth** - Update once, all projects benefit
✅ **Version Control** - `npm update @bluefly/kiro-supercharger`
✅ **Consistency** - All projects use same Kiro setup
✅ **Customization** - Override templates per project if needed

## What Gets Created

### Configuration Files (In Your Repo)
```
.kiro/
├── steering/              # Context rules for Kiro
│   ├── project-standards.md
│   ├── schema-validation.md
│   ├── testing-requirements.md
│   ├── api-workflow.md
│   └── git-workflow.md
├── hooks/                 # Automated event triggers
│   ├── schema-change.hook.json
│   ├── test-execution.hook.json
│   ├── api-validation.hook.json
│   └── pre-commit.hook.json
├── settings/              # Kiro configuration
│   ├── mcp.json          # MCP server configs
│   └── context.json      # Context management
└── templates/             # Reusable templates
    ├── requirements-template.md
    ├── design-template.md
    ├── tasks-template.md
    ├── unit-test-template.ts
    ├── property-test-template.ts
    └── mcp-server-template.js
```

### Documentation (In GitLab Wiki)
All documentation goes in your project's GitLab wiki:
- `Kiro-IDE-Supercharger` - Main guide
- `Kiro-Capabilities` - Feature reference
- `Kiro-Quick-Reference` - Cheat sheet
- `Spec-Driven-Development-Workflow` - Spec workflow guide
- `Property-Based-Testing` - PBT guide
- `Context-Management-Strategy` - Context guide
- `Testing-Strategy` - Testing approach
- `Project-Workflows` - Automation workflows
- `Tool-Integration` - Kiro + Cursor + VS Code
- `MCP-Setup-and-Security` - MCP installation
- `MCP-Git-Platforms` - Git platform integration
- `MCP-Infrastructure` - Infrastructure integration
- `MCP-Code-Quality` - Code quality tools
- `MCP-Security` - Security best practices
- `Workflow-Type-Generation` - Type gen demo
- `Workflow-Spec-Driven-Development` - Spec demo
- `Workflow-MCP-Debugging` - MCP debugging demo
- `Workflow-Automated-Testing` - Testing demo

## NO Clutter

❌ **This spec does NOT create:**
- Deployment checklists
- Release strategies
- Enterprise documentation
- Project-specific guides
- Any files not required to run the project

✅ **Only creates:**
- Configuration files Kiro needs to function
- Templates for code generation
- Wiki documentation (not in repo)

## How to Use

### 1. Install in Any Project
```bash
npm install --save-dev @bluefly/kiro-supercharger
npx kiro-init
```

### 2. What Gets Created
```
your-project/
├── .kiro/
│   ├── config.json        # Points to @bluefly/kiro-supercharger
│   └── overrides/         # Project-specific customizations (optional)
└── package.json           # Dependency added
```

### 3. Kiro Automatically Loads
- Steering rules from `@bluefly/kiro-supercharger/templates/steering/`
- Hooks from `@bluefly/kiro-supercharger/templates/hooks/`
- MCP configs from `@bluefly/kiro-supercharger/templates/settings/`

### 4. Customize Per Project (Optional)
```bash
# Override specific steering rules
npx kiro-init --override steering/project-standards

# This creates .kiro/overrides/steering/project-standards.md
# Edit to customize for this specific project
```

### 5. Update All Projects
```bash
# In any project
npm update @bluefly/kiro-supercharger

# All 40 projects get the latest Kiro setup!
```

## Integration with Existing Tools

### Works with agent-buildkit
```bash
# agent-buildkit can use Kiro's context
buildkit agents deploy --use-kiro-context

# Kiro can trigger agent-buildkit commands
# Via hooks: .kiro/hooks/agent-validation.hook.json
```

### Works with GitLab Ultimate
```yaml
# .kiro/config.json
{
  "mcp": {
    "gitlab": {
      "enabled": true,
      "features": ["k8s-agent", "ci-cd", "issues"]
    }
  }
}
```

### Shared Across Your Ecosystem
All your projects get consistent Kiro setup:
- agent-brain
- agent-docker
- agent-mesh
- agent-protocol
- agent-router
- agent-tracer
- agentic-flows
- compliance-engine
- doc-engine
- foundation-bridge
- workflow-engine
- ... and 29 more!

## Property-Based Testing

This spec includes 35 correctness properties that validate the Kiro setup works correctly. All tests are required (no optional tests).

## Support

For questions or issues:
1. Check the GitLab wiki documentation
2. Review the templates in `.kiro/templates/`
3. Open an issue in your project's issue tracker

## License

This spec is part of your project and follows your project's license.
