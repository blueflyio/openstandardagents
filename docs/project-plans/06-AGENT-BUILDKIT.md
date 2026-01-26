# Project: agent-buildkit (SDK Enhancement)

**Epic**: SDK CLI Commands  
**Phase**: 2 - SDK Enhancement  
**Timeline**: Week 6-8 (Feb 24 - Mar 14, 2025)  
**Owner**: SDK Team  
**Priority**: 🟡 HIGH - SDK command enhancement for customers

---

## Project Overview

**Package**: `@bluefly/agent-buildkit`  
**Repository**: `gitlab.com/blueflyio/agent-platform/agent-buildkit`  
**NAS Location**: `/Volumes/AgentPlatform/repos/bare/blueflyio/agent-platform/agent-buildkit.git`  
**Purpose**: CLI toolkit for SDK operations and agent development

---

## Current Status

- **Overall Health**: ✅ Operational (Core CLI functional)
- **SDK Commands**: 12 existing, 8 new required
- **Integration Status**: Platform agents operational
- **Revenue Impact**: $500K/year SDK support contracts

---

## Phase 2 Objectives (Weeks 6-8)

### SDK Command Matrix

| Week | Commands | Purpose | Revenue Impact |
|------|----------|---------|----------------|
| 6 | sdk init, sdk validate | Project setup | Foundation |
| 7 | sdk test, sdk publish | Quality & distribution | $500K/year |
| 8 | sdk docs, sdk analytics | Documentation & insights | Enhancement |

### Week 6: SDK Initialization Commands

**STASH-27: sdk init**
```typescript
// src/commands/sdk/init.ts
import { Command } from 'commander';
import { SdkScaffoldService } from '../../services/sdk/scaffold.service';

export const sdkInitCommand = new Command('init')
  .description('Initialize new SDK project')
  .option('--template <type>', 'Project template', 'typescript')
  .option('--name <name>', 'Package name')
  .option('--description <desc>', 'Package description')
  .action(async (options) => {
    const scaffold = new SdkScaffoldService();
    
    await scaffold.createProject({
      template: options.template,
      name: options.name || await prompt('Package name: '),
      description: options.description || await prompt('Description: '),
      features: await scaffold.selectFeatures(),
    });
    
    console.log('✅ SDK project initialized');
    console.log('📦 Next: npm install && npm run build');
  });
```

**STASH-28: sdk validate**
```typescript
// src/commands/sdk/validate.ts
import { Command } from 'commander';
import { SdkValidationService } from '../../services/sdk/validation.service';

export const sdkValidateCommand = new Command('validate')
  .description('Validate SDK package')
  .option('--ossa', 'Validate OSSA compliance')
  .option('--api', 'Validate OpenAPI specs')
  .option('--security', 'Run security scan')
  .action(async (options) => {
    const validator = new SdkValidationService();
    
    const results = await validator.validateAll({
      ossa: options.ossa !== false,
      openapi: options.api !== false,
      security: options.security !== false,
    });
    
    validator.printReport(results);
    
    if (results.errors > 0) {
      process.exit(1);
    }
  });
```

### Week 7: Testing & Publishing Commands

**STASH-29: sdk test**
```typescript
// src/commands/sdk/test.ts
import { Command } from 'commander';
import { SdkTestService } from '../../services/sdk/test.service';

export const sdkTestCommand = new Command('test')
  .description('Run SDK tests')
  .option('--unit', 'Run unit tests')
  .option('--integration', 'Run integration tests')
  .option('--e2e', 'Run end-to-end tests')
  .option('--coverage', 'Generate coverage report')
  .action(async (options) => {
    const tester = new SdkTestService();
    
    const suites = [];
    if (options.unit !== false) suites.push('unit');
    if (options.integration) suites.push('integration');
    if (options.e2e) suites.push('e2e');
    
    const results = await tester.runSuites(suites, {
      coverage: options.coverage,
    });
    
    tester.printResults(results);
    
    if (results.failed > 0) {
      process.exit(1);
    }
  });
```

**STASH-30: sdk publish**
```typescript
// src/commands/sdk/publish.ts
import { Command } from 'commander';
import { SdkPublishService } from '../../services/sdk/publish.service';

export const sdkPublishCommand = new Command('publish')
  .description('Publish SDK package')
  .option('--registry <url>', 'NPM registry')
  .option('--tag <tag>', 'NPM tag', 'latest')
  .option('--dry-run', 'Simulate publish')
  .action(async (options) => {
    const publisher = new SdkPublishService();
    
    // Pre-publish validation
    await publisher.validatePackage();
    
    // Publish
    const result = await publisher.publish({
      registry: options.registry || process.env.NPM_REGISTRY,
      tag: options.tag,
      dryRun: options.dryRun,
    });
    
    console.log(`✅ Published ${result.name}@${result.version}`);
  });
```

### Week 8: Documentation & Analytics Commands

**STASH-31: sdk docs**
```typescript
// src/commands/sdk/docs.ts
import { Command } from 'commander';
import { SdkDocsService } from '../../services/sdk/docs.service';

export const sdkDocsCommand = new Command('docs')
  .description('Generate SDK documentation')
  .option('--api', 'Generate API docs from OpenAPI')
  .option('--readme', 'Generate README from package.json')
  .option('--changelog', 'Generate CHANGELOG from git')
  .option('--serve', 'Serve docs locally')
  .action(async (options) => {
    const docs = new SdkDocsService();
    
    if (options.api !== false) {
      await docs.generateApiDocs();
    }
    
    if (options.readme) {
      await docs.generateReadme();
    }
    
    if (options.changelog) {
      await docs.generateChangelog();
    }
    
    if (options.serve) {
      await docs.serve({ port: 3000 });
    }
  });
```

**STASH-32: sdk analytics**
```typescript
// src/commands/sdk/analytics.ts
import { Command } from 'commander';
import { SdkAnalyticsService } from '../../services/sdk/analytics.service';

export const sdkAnalyticsCommand = new Command('analytics')
  .description('View SDK usage analytics')
  .option('--downloads', 'Show download stats')
  .option('--usage', 'Show API usage stats')
  .option('--errors', 'Show error rates')
  .action(async (options) => {
    const analytics = new SdkAnalyticsService();
    
    if (options.downloads !== false) {
      await analytics.showDownloads();
    }
    
    if (options.usage) {
      await analytics.showUsage();
    }
    
    if (options.errors) {
      await analytics.showErrors();
    }
  });
```

---

## OpenAPI Extension

```yaml
# spec/agent-buildkit.openapi.yaml (additions)
/api/sdk/projects:
  post:
    summary: Create SDK project
    requestBody:
      schema:
        type: object
        properties:
          name:
            type: string
          template:
            type: string
            enum: [typescript, python, go]

/api/sdk/validate:
  post:
    summary: Validate SDK package
    requestBody:
      schema:
        type: object
        properties:
          path:
            type: string
          checks:
            type: array
            items:
              type: string
              enum: [ossa, openapi, security]

/api/sdk/publish:
  post:
    summary: Publish SDK package
    requestBody:
      schema:
        type: object
        properties:
          registry:
            type: string
          tag:
            type: string
```

---

## Dependencies

- **platform-agents**: Agent registry operational
- **doc-engine**: Documentation generation
- **compliance-engine**: Security scanning

---

## Success Metrics

### Week 6
```yaml
Commands: 2 (init, validate)
Usage: 50+ SDK projects created
Quality: 100% OSSA compliance
```

### Week 7
```yaml
Commands: +2 (test, publish)
Usage: 25+ packages published
Quality: >90% test coverage
```

### Week 8
```yaml
Commands: +2 (docs, analytics)
Total: 6 SDK commands
Revenue: $500K/year enabled
```

---

## Next Actions (Week 6 Start)

```bash
# 1. Create worktree
cd /Volumes/AgentPlatform/repos/bare/blueflyio/agent-platform/agent-buildkit.git
git worktree add /Volumes/AgentPlatform/worktrees/shared/2025-02-24/agent-buildkit/sdk-commands main

# 2. Implement sdk init
cd /Volumes/AgentPlatform/worktrees/shared/2025-02-24/agent-buildkit/sdk-commands
npm run dev:new-command -- sdk/init
```

---

**Status**: ⏳ Phase 2 - Awaiting Phase 1 completion  
**Owner**: SDK Team
