#!/usr/bin/env tsx
/**
 * Generate AGENTS.md from project OSSA manifest
 * Uses the agents-md extension to generate comprehensive AGENTS.md
 */

import { readFileSync, writeFileSync } from 'fs'
import { parse } from 'yaml'
import path from 'path'

const manifestPath = path.join(process.cwd(), '.ossa/project.ossa.yaml')
const outputPath = path.join(process.cwd(), 'AGENTS.md')

interface Manifest {
  metadata: {
    name: string
    version: string
    description: string
    labels?: Record<string, string>
    annotations?: Record<string, string>
  }
  spec: {
    role: string
    tools?: Array<{
      type: string
      name: string
      config?: {
        command?: string
        description?: string
      }
    }>
    constraints?: {
      performance?: {
        maxLatencySeconds?: number
        timeoutSeconds?: number
      }
      quality?: {
        minCoverage?: number
        maxComplexity?: number
        requireTests?: boolean
      }
      prohibited?: string[]
    }
    autonomy?: {
      level?: string
      approval_required?: boolean
      allowed_actions?: string[]
      blocked_actions?: string[]
    }
    safety?: {
      content_filter?: string
      pii_detection?: boolean
      prohibited_topics?: string[]
    }
  }
  extensions?: {
    agents_md?: {
      sections?: {
        dev_environment?: {
          enabled?: boolean
          source?: string
          append?: string
        }
        testing?: {
          enabled?: boolean
          source?: string
          custom?: string
        }
        pr_instructions?: {
          enabled?: boolean
          source?: string
          title_format?: string
          append?: string
        }
        code_style?: {
          enabled?: boolean
          custom?: string
        }
        security?: {
          enabled?: boolean
          source?: string
          append?: string
        }
        architecture?: {
          enabled?: boolean
          custom?: string
        }
      }
    }
  }
}

function generateAgentsMd(manifest: Manifest): string {
  const sections: string[] = []
  const ext = manifest.extensions?.agents_md

  // Title
  sections.push(`# ${manifest.metadata.name}`)
  sections.push('')
  sections.push(manifest.metadata.description)
  sections.push('')

  // Project Overview
  sections.push('## Project Overview')
  sections.push('')
  sections.push(manifest.spec.role.trim())
  sections.push('')

  // Setup Commands
  sections.push('## Setup Commands')
  sections.push('')
  if (manifest.spec.tools) {
    manifest.spec.tools.forEach(tool => {
      if (tool.config?.command) {
        sections.push(`- ${tool.config.description || tool.name}: \`${tool.config.command}\``)
      }
    })
  }
  sections.push('')

  // Code Style
  if (ext?.sections?.code_style?.enabled !== false && ext?.sections?.code_style?.custom) {
    sections.push('## Code Style')
    sections.push('')
    sections.push(ext.sections.code_style.custom)
    sections.push('')
  }

  // File Organization
  if (ext?.sections?.architecture?.enabled !== false && ext?.sections?.architecture?.custom) {
    sections.push('## File Organization')
    sections.push('')
    sections.push(ext.sections.architecture.custom)
    sections.push('')
  }

  // Testing Instructions
  if (ext?.sections?.testing?.enabled !== false) {
    sections.push('## Testing Instructions')
    sections.push('')
    if (ext.sections.testing.custom) {
      sections.push(ext.sections.testing.custom)
    } else if (manifest.spec.constraints) {
      if (manifest.spec.constraints.performance) {
        sections.push('### Performance Requirements')
        const perf = manifest.spec.constraints.performance
        if (perf.maxLatencySeconds) {
          sections.push(`- Maximum latency: ${perf.maxLatencySeconds}s`)
        }
        if (perf.timeoutSeconds) {
          sections.push(`- Timeout: ${perf.timeoutSeconds}s`)
        }
        sections.push('')
      }
      if (manifest.spec.constraints.quality) {
        sections.push('### Quality Gates')
        const qual = manifest.spec.constraints.quality
        if (qual.minCoverage) {
          sections.push(`- Minimum coverage: ${qual.minCoverage}%`)
        }
        if (qual.maxComplexity) {
          sections.push(`- Maximum complexity: ${qual.maxComplexity}`)
        }
        sections.push('')
      }
    }
    sections.push('')
  }

  // Build Process
  sections.push('## Build Process')
  sections.push('')
  sections.push('- TypeScript compilation: `npm run build`')
  sections.push('- Generate types from schemas: `npm run generate:types`')
  sections.push('- Generate Zod validators: `npm run generate:zod`')
  sections.push('- Validate schemas: `npm run validate:all`')
  sections.push('')
  sections.push('**Build Output:**')
  sections.push('- Compiled code goes to `dist/`')
  sections.push('- Types generated to `dist/` with `.d.ts` files')
  sections.push('- Schemas remain in `spec/` directory')
  sections.push('')

  // Version Management
  sections.push('## Version Management')
  sections.push('')
  sections.push('**CRITICAL**: Never manually update version numbers!')
  sections.push('')
  sections.push('- Single source of truth: `.version.json`')
  sections.push('- Use `npm run version:sync` to sync versions')
  sections.push('- Use `{{VERSION}}` placeholders in files')
  sections.push('- CI replaces `{{VERSION}}` during build')
  sections.push('- Version validator enforces this: `npm run prevent-hardcoded-versions`')
  sections.push('')

  // Migration System
  sections.push('## Migration System')
  sections.push('')
  sections.push('- Check migrations needed: `npm run migrate:check`')
  sections.push('- Dry run: `npm run migrate:dry`')
  sections.push('- Apply migrations: `npm run migrate`')
  sections.push('- Auto-runs on `npm install` via `postinstall` hook')
  sections.push('')

  // Git Workflow
  sections.push('## Git Workflow')
  sections.push('')
  sections.push('- Feature branches branch off `development`')
  sections.push('- NO direct commits to `main` or `development`')
  sections.push('- Create Merge Request (MR) for all changes')
  sections.push('- Use `git worktree` for feature branches')
  sections.push('- Follow Conventional Commits format')
  sections.push('')
  sections.push('**Branch Policy:**')
  sections.push('- `main` - Production (protected, no direct commits)')
  sections.push('- `development` - Integration branch (MRs only)')
  sections.push('- `feature/*` - Feature branches (your work)')
  sections.push('- `release/*` - Release branches')
  sections.push('')

  // PR Instructions
  if (ext?.sections?.pr_instructions?.enabled !== false) {
    sections.push('## PR Instructions')
    sections.push('')
    sections.push('- **Title format**: `type(scope): description`')
    sections.push('  - Examples: `feat(cli): add validate command`, `fix(schema): correct trigger validation`')
    sections.push('- **Description**: Include context, changes, and testing notes')
    sections.push('- **Checklist**:')
    sections.push('  - [ ] All tests pass')
    sections.push('  - [ ] Linting passes')
    sections.push('  - [ ] Documentation updated')
    sections.push('  - [ ] Examples updated (if schema changed)')
    sections.push('  - [ ] Migration guide added (if breaking change)')
    sections.push('- **CI must pass** before merge')
    sections.push('- **No hardcoded versions** - use `{{VERSION}}` placeholders')
    if (ext.sections.pr_instructions.append) {
      sections.push('')
      sections.push(ext.sections.pr_instructions.append)
    }
    sections.push('')
  }

  // Architecture Principles
  sections.push('## Architecture Principles')
  sections.push('')
  sections.push('- **SOLID**: Single Responsibility, Dependency Injection')
  sections.push('- **DRY**: Shared utilities, no duplication')
  sections.push('- **Zod**: Runtime validation throughout')
  sections.push('- **OpenAPI**: Types align with OpenAPI spec')
  sections.push('- **CRUD**: Full Create/Read/Update/Delete operations')
  sections.push('')

  // Common Tasks
  sections.push('## Common Tasks')
  sections.push('')
  sections.push('### Adding a New CLI Command')
  sections.push('')
  sections.push('1. Create command in `src/cli/commands/`')
  sections.push('2. Register in `src/cli/index.ts`')
  sections.push('3. Add OpenAPI spec in `openapi/cli-commands.openapi.yaml`')
  sections.push('4. Add tests in `tests/cli/`')
  sections.push('5. Update documentation')
  sections.push('')

  sections.push('### Adding a New SDK Feature')
  sections.push('')
  sections.push('1. Add to shared utilities in `src/sdks/shared/`')
  sections.push('2. Implement in `src/sdks/typescript/` or `src/sdks/python/`')
  sections.push('3. Export from `src/sdks/index.ts`')
  sections.push('4. Add validation with Zod')
  sections.push('5. Add tests')
  sections.push('')

  sections.push('### Updating OSSA Schema')
  sections.push('')
  sections.push('1. Update schema JSON in `spec/v0.3.3/`')
  sections.push('2. Run `npm run generate:types`')
  sections.push('3. Run `npm run generate:zod`')
  sections.push('4. Run `npm run validate:schema`')
  sections.push('5. Update examples')
  sections.push('6. Create migration guide if breaking change')
  sections.push('')

  // Security Considerations
  if (ext?.sections?.security?.enabled !== false) {
    sections.push('## Security Considerations')
    sections.push('')
    if (manifest.spec.safety) {
      if (manifest.spec.safety.content_filter === 'enabled') {
        sections.push('- Content filtering enabled')
      }
      if (manifest.spec.safety.pii_detection) {
        sections.push('- PII detection enabled')
      }
      if (manifest.spec.safety.prohibited_topics?.length) {
        sections.push('- Prohibited topics:')
        manifest.spec.safety.prohibited_topics.forEach(topic => {
          sections.push(`  - ${topic}`)
        })
      }
    }
    if (ext.sections.security.append) {
      sections.push('')
      sections.push(ext.sections.security.append)
    }
    sections.push('')
  }

  // Debugging
  sections.push('## Debugging')
  sections.push('')
  sections.push('- Use TypeScript source maps for debugging')
  sections.push('- Check `dist/` for compiled output')
  sections.push('- Run `npm run typecheck` to find type errors')
  sections.push('- Use `npm run validate:all` to check manifests')
  sections.push('- Check CI logs for detailed error messages')
  sections.push('')

  // Resources
  sections.push('## Resources')
  sections.push('')
  sections.push('- **Specification**: https://openstandardagents.org')
  sections.push('- **Documentation**: `docs/` directory')
  sections.push('- **Examples**: `examples/` directory')
  sections.push('- **OpenAPI Specs**: `openapi/` directory')
  sections.push('- **GitLab Issues**: https://gitlab.com/blueflyio/ossa/openstandardagents/-/issues')
  sections.push('')

  // Important Notes
  sections.push('## Important Notes')
  sections.push('')
  sections.push('- This is an **open source project** for the **community**')
  sections.push('- Code should be clean, well-documented, and maintainable')
  sections.push('- Follow existing patterns and conventions')
  sections.push('- Ask questions if unsure - we\'re here to help!')
  sections.push('- Remember: OSSA = Standard, not implementation')
  sections.push('')

  return sections.join('\n')
}

function main() {
  try {
    console.log(`Reading manifest from ${manifestPath}...`)
    const content = readFileSync(manifestPath, 'utf-8')
    const manifest = parse(content) as Manifest

    console.log('Generating AGENTS.md...')
    const agentsMd = generateAgentsMd(manifest)

    console.log(`Writing to ${outputPath}...`)
    writeFileSync(outputPath, agentsMd, 'utf-8')

    console.log('✅ AGENTS.md generated successfully!')
  } catch (error) {
    console.error('❌ Error generating AGENTS.md:', error)
    process.exit(1)
  }
}

main()
