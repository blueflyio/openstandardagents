<!--
OSSA Operations: automation-roadmap.md
Purpose: Internal operations and automation documentation
Audience: Maintainers and contributors
Educational Focus: Document automation and operational procedures
-->
# Automation Audit Report

## Shell Scripts Found (Convert to TypeScript)

### 1. `.gitlab/release-automation/setup.sh`
**Current**: Bash script for release setup
**Convert to**: 
- TypeScript service with Zod validation
- OSSA CLI command: `ossa release setup`
- GitLab CI job (automated)

### 2. `website/restart-dev.sh`
**Current**: Bash script to restart dev server
**Action**: DELETE - Not needed in production
**Alternative**: Use `npm run dev` directly

### 3. `scripts/setup-branch-protection.sh`
**Current**: Bash script for branch protection
**Convert to**:
- TypeScript service with GitLab API client
- OSSA CLI command: `ossa repo protect`
- Run automatically in CI on repo setup

### 4. `infrastructure/k8s/monitoring/deploy.sh`
**Current**: Bash deployment script
**Convert to**:
- TypeScript K8s client with Zod schemas
- OSSA CLI command: `ossa k8s deploy`
- GitLab CI job (automated)

## Manual CI Jobs (Automate)

Found **13 manual jobs** in CI config.

### High Priority Automations

1. **Release Process**
   - Current: Manual trigger
   - Automate: On tag push
   - Agent: Release automation agent

2. **Dependency Updates**
   - Current: Manual Dependabot review
   - Automate: Daily scheduled sync (DONE in MR !65)
   - Agent: GitHub sync agent

3. **Branch Protection**
   - Current: Manual setup
   - Automate: On repo creation
   - Agent: Repository setup agent

4. **Deployment**
   - Current: Manual trigger
   - Automate: On merge to main
   - Agent: Deployment agent

5. **Version Bumping**
   - Current: Manual npm version
   - Automate: Semantic release (already exists)
   - Agent: Version management agent

## Opportunities for GitLab Agents

### 1. Code Review Agent
```yaml
code-review:
  stage: .pre
  script:
    - ossa review mr $CI_MERGE_REQUEST_IID
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

### 2. Documentation Agent
```yaml
docs-update:
  stage: .post
  script:
    - ossa docs sync
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

### 3. Security Scan Agent
```yaml
security-scan:
  stage: test
  script:
    - ossa security scan
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

### 4. Performance Test Agent
```yaml
performance:
  stage: test
  script:
    - ossa perf test
  rules:
    - if: $CI_MERGE_REQUEST_LABELS =~ /performance/
```

## Conversion Plan

### Phase 1: Core Scripts (Week 1)

1. **Release Automation**
   ```typescript
   // src/services/release/release.service.ts
   export class ReleaseService {
     async setup(): Promise<void>
     async bump(type: 'major' | 'minor' | 'patch'): Promise<string>
     async publish(): Promise<void>
   }
   ```

2. **Branch Protection**
   ```typescript
   // src/services/repo/protection.service.ts
   export class ProtectionService {
     async protect(branch: string, rules: ProtectionRules): Promise<void>
     async unprotect(branch: string): Promise<void>
   }
   ```

### Phase 2: Infrastructure (Week 2)

3. **K8s Deployment**
   ```typescript
   // src/services/k8s/deploy.service.ts
   export class K8sDeployService {
     async deploy(manifest: K8sManifest): Promise<DeployResult>
     async rollback(deployment: string): Promise<void>
   }
   ```

4. **Monitoring Setup**
   ```typescript
   // src/services/monitoring/setup.service.ts
   export class MonitoringService {
     async setup(config: MonitoringConfig): Promise<void>
     async health(): Promise<HealthStatus>
   }
   ```

### Phase 3: Agents (Week 3)

5. **GitLab Agents**
   - Code review agent
   - Documentation agent
   - Security scan agent
   - Performance test agent

## Implementation Template

### Service Structure
```typescript
// src/services/{domain}/{service}.service.ts
import { z } from 'zod';

const ConfigSchema = z.object({
  // Zod validation
});

export class ServiceName {
  constructor(config: z.infer<typeof ConfigSchema>) {
    ConfigSchema.parse(config);
  }

  async operation(): Promise<Result> {
    // Implementation
  }
}
```

### CLI Command
```typescript
// src/cli/commands/{domain}.command.ts
import { Command } from 'commander';
import { ServiceName } from '../../services/{domain}/{service}.service';

export const commandName = new Command('name')
  .description('Description')
  .action(async () => {
    const service = new ServiceName(config);
    await service.operation();
  });
```

### OpenAPI Spec
```yaml
# openapi/{service}.yaml
paths:
  /{operation}:
    post:
      operationId: operation
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Request'
```

### GitLab CI Job
```yaml
# .gitlab/ci/{service}.yml
{service}:
  stage: {stage}
  script:
    - ossa {command}
  rules:
    - if: {condition}
```

## Metrics

### Current State
- Shell scripts: 4
- Manual CI jobs: 13
- Automation coverage: ~40%

### Target State
- Shell scripts: 0
- Manual CI jobs: 3 (deploy to prod, rollback, emergency)
- Automation coverage: ~95%

### Benefits
- Faster development
- Fewer errors
- Better testing
- Type safety
- Maintainability

## Priority Order

1. ✅ GitHub PR sync (DONE - MR !65)
2. 🔄 Release automation
3. 🔄 Branch protection
4. 🔄 K8s deployment
5. 🔄 Code review agent
6. 🔄 Security scan agent
7. 🔄 Documentation agent
8. 🔄 Performance test agent

