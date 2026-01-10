# Agents.md Extension for OSSA v0.3.3

## Overview

The **Agents.md Extension** provides bidirectional mapping between the [agents.md](https://agents.md) markdown-based agent definition format and OSSA manifests. This extension enables:

- **Generation**: Create AGENTS.md files from OSSA manifests
- **Parsing**: Convert existing AGENTS.md files to OSSA manifests
- **Synchronization**: Keep AGENTS.md and OSSA manifests in sync
- **Validation**: Ensure consistency between formats

The agents.md format has been widely adopted by AI coding tools (Cursor, GitHub Copilot, Google Jules, OpenAI) with 20,000+ open-source projects using it for repository-level agent guidance.

## Schema Definition

```yaml
extensions:
  agents_md:
    type: object
    description: "Agents.md extension for bidirectional markdown/OSSA conversion"
    properties:
      enabled:
        type: boolean
        default: false
        description: "Enable agents_md extension"

      file_path:
        type: string
        default: "AGENTS.md"
        description: "Path to AGENTS.md file (relative to repository root)"
        examples:
          - "AGENTS.md"
          - ".github/AGENTS.md"
          - "docs/AGENTS.md"

      generate:
        type: boolean
        default: true
        description: "Auto-generate AGENTS.md from manifest"

      auto_discover:
        type: boolean
        default: false
        description: "Auto-discover agents from AGENTS.md sections"

      sections:
        type: object
        description: "Section-level configuration for AGENTS.md"
        properties:
          dev_environment:
            $ref: "#/definitions/AgentsMdSection"
          testing:
            $ref: "#/definitions/AgentsMdSection"
          pr_instructions:
            $ref: "#/definitions/AgentsMdSection"
          code_style:
            $ref: "#/definitions/AgentsMdSection"
          security:
            $ref: "#/definitions/AgentsMdSection"
          architecture:
            $ref: "#/definitions/AgentsMdSection"
          custom:
            type: array
            items:
              $ref: "#/definitions/AgentsMdSection"
            description: "Additional custom sections"
        additionalProperties:
          $ref: "#/definitions/AgentsMdSection"

      sync:
        type: object
        description: "Synchronization configuration"
        properties:
          on_manifest_change:
            type: boolean
            default: true
            description: "Regenerate AGENTS.md when manifest changes"
          include_comments:
            type: boolean
            default: true
            description: "Include generation comments in output"
          preserve_custom:
            type: boolean
            default: true
            description: "Preserve custom sections not mapped to manifest"
          watch:
            type: boolean
            default: false
            description: "Watch for file changes"

      mapping:
        type: object
        description: "Explicit mapping between OSSA and agents.md"
        properties:
          tools_to_dev_environment:
            type: boolean
            default: true
          constraints_to_testing:
            type: boolean
            default: true
          autonomy_to_pr_instructions:
            type: boolean
            default: true
          safety_to_security:
            type: boolean
            default: true
          role_to_overview:
            type: boolean
            default: true

      cursor_integration:
        type: boolean
        default: false
        description: "Generate Cursor-compatible content"

      include_metadata:
        type: boolean
        default: true
        description: "Include OSSA metadata in generated AGENTS.md"

definitions:
  AgentsMdSection:
    type: object
    properties:
      enabled:
        type: boolean
        default: true
        description: "Whether this section is enabled"
      source:
        type: string
        description: "OSSA manifest path to derive content from"
        examples:
          - "spec.tools"
          - "spec.constraints"
          - "spec.autonomy"
          - "spec.role"
      custom:
        type: string
        description: "Custom markdown content for this section"
      append:
        type: string
        description: "Content to append after auto-generated content"
      prepend:
        type: string
        description: "Content to prepend before auto-generated content"
      title:
        type: string
        description: "Override default section title"
      title_format:
        type: string
        description: "Format string for section title"
        examples:
          - "[{metadata.labels.domain}] {title}"
```

## Bidirectional Mapping Tables

### AGENTS.md to OSSA Manifest (Parsing)

| AGENTS.md Section | OSSA Property | Description |
|-------------------|---------------|-------------|
| `# Overview` | `spec.role` | Agent's primary purpose and behavior |
| `## Agent: <name>` | `metadata.name` | Agent identifier |
| `# Development Environment` | `spec.tools` | Tool setup and configuration |
| `# Testing` | `spec.constraints` | Performance requirements, quality gates |
| `# PR Instructions` | `spec.autonomy` | Approval workflows, action permissions |
| `# Code Style` | `spec.constraints.quality` | Quality constraints and coding standards |
| `# Security` | `spec.safety` | Safety rails and security constraints |
| `# Architecture` | `metadata.annotations` | Architecture notes, context |
| `## Tools:` subsection | `spec.tools[]` | Individual tool definitions |
| `## Triggers:` subsection | `spec.triggers[]` (Workflow) | Event triggers for workflows |
| `## Constraints:` subsection | `spec.constraints` | Explicit constraints |
| `## Examples:` subsection | `spec.examples` | Usage examples |

### OSSA Manifest to AGENTS.md (Generation)

| OSSA Property | AGENTS.md Section | Description |
|---------------|-------------------|-------------|
| `metadata.name` | `# {name}` | Document title |
| `metadata.description` | Intro paragraph | Agent description |
| `metadata.version` | Footer | Version info |
| `spec.role` | `# Overview` | Role/system prompt |
| `spec.tools` | `# Development Environment` | Tool setup |
| `spec.tools[].capabilities` | `## {tool.name}` subsections | Individual capabilities |
| `spec.constraints.performance` | `# Testing` - Performance | Performance requirements |
| `spec.constraints.cost` | `# Testing` - Cost | Cost constraints |
| `spec.autonomy.level` | `# PR Instructions` | Autonomy level |
| `spec.autonomy.approval_required` | `# PR Instructions` | Approval requirements |
| `spec.autonomy.allowed_actions` | `# PR Instructions` - Allowed | Permitted actions |
| `spec.autonomy.blocked_actions` | `# PR Instructions` - Blocked | Prohibited actions |
| `spec.safety` | `# Security` | Safety configuration |
| `spec.observability` | `# Monitoring` | Observability config |
| `extensions.agents_md.sections.*.custom` | Custom content | User-defined content |

### Section Mapping: Instructions to System Prompt

| AGENTS.md Pattern | OSSA `spec.role` Mapping |
|-------------------|--------------------------|
| `You are a...` | Direct inclusion in role |
| `Always follow...` | Append to role with constraint context |
| `Never do...` | Map to `spec.constraints.prohibited` |
| `When reviewing...` | Context-specific instructions in role |
| `For code changes...` | Workflow-specific guidance |

### Section Mapping: Tools to Capabilities

| AGENTS.md Tool Pattern | OSSA `spec.tools[]` Mapping |
|------------------------|----------------------------|
| `- npm install` | `{ type: "function", name: "npm_install", config: { command: "npm install" } }` |
| `- git commit` | `{ type: "mcp", name: "git", server: "git", capabilities: ["commit"] }` |
| `- Read files: ...` | `{ type: "mcp", name: "filesystem", capabilities: ["read_file"] }` |
| `- API: https://...` | `{ type: "http", endpoint: "https://..." }` |

### Section Mapping: Context to Resources

| AGENTS.md Context | OSSA Resource Mapping |
|-------------------|----------------------|
| `README.md` reference | `{ type: "mcp", name: "filesystem", resources: ["README.md"] }` |
| `src/**/*.ts` pattern | `extensions.cursor.workspace_config.context_files` |
| `See docs/` | `spec.resources[]` with documentation URIs |
| `@codebase` mention | `extensions.cursor.workspace_config.include_patterns` |

### Section Mapping: Triggers to Workflow Triggers

| AGENTS.md Trigger Pattern | OSSA `spec.triggers[]` Mapping |
|---------------------------|-------------------------------|
| `On PR creation` | `{ type: "webhook", path: "/webhook/pr", event: "pull_request.opened" }` |
| `Every 6 hours` | `{ type: "cron", schedule: "0 */6 * * *" }` |
| `When tests fail` | `{ type: "event", source: "ci", event: "test.failed" }` |
| `Manual trigger` | `{ type: "manual" }` |

### Section Mapping: Constraints to OSSA Constraints

| AGENTS.md Constraint | OSSA `spec.constraints` Mapping |
|---------------------|--------------------------------|
| `Max response time: 30s` | `constraints.performance.maxLatencySeconds: 30` |
| `Max tokens: 4000` | `llm.maxTokens: 4000` |
| `Coverage > 80%` | `constraints.quality.minCoverage: 80` |
| `No production access` | `constraints.prohibited: ["production_access"]` |

## Example Manifests

### Example 1: OSSA Manifest with Agents.md Extension

```yaml
apiVersion: ossa/v0.3.3
kind: Agent
metadata:
  name: code-review-agent
  version: 1.0.0
  description: AI agent for automated code review and quality checks
  labels:
    domain: development
    capability: code-review

spec:
  role: |
    You are a code review agent that analyzes pull requests for code quality,
    best practices, and potential issues. You provide constructive feedback
    and suggest improvements.

  llm:
    provider: anthropic
    model: claude-sonnet-4-5-20250929
    temperature: 0.3
    maxTokens: 4000

  tools:
    - type: mcp
      name: git_operations
      server: git-mcp-server
      namespace: default
      capabilities:
        - read_diff
        - list_files
        - get_file_content

    - type: function
      name: run_linter
      config:
        command: npm run lint

  autonomy:
    level: supervised
    approval_required: true
    allowed_actions:
      - comment_on_pr
      - request_changes
      - approve_pr
    blocked_actions:
      - merge_pr
      - delete_branch

  constraints:
    performance:
      maxLatencySeconds: 30
      timeoutSeconds: 60
    quality:
      minCoverage: 80
      maxComplexity: 15

  safety:
    content_filter: enabled
    pii_detection: true
    prohibited_topics:
      - credentials
      - secrets

extensions:
  agents_md:
    enabled: true
    generate: true
    file_path: AGENTS.md
    sections:
      dev_environment:
        enabled: true
        source: spec.tools
        append: |
          ## Additional Setup
          - Configure IDE: Install ESLint extension
          - Enable pre-commit hooks: `npm run prepare`
      testing:
        enabled: true
        source: spec.constraints
        custom: |
          - Run linting: `npm run lint`
          - Run tests: `npm test`
          - Ensure all checks pass before requesting review
      pr_instructions:
        enabled: true
        source: spec.autonomy
        title_format: "[{metadata.labels.domain}] {title}"
      security:
        enabled: true
        source: spec.safety
    sync:
      on_manifest_change: true
      include_comments: true
      preserve_custom: true
    mapping:
      tools_to_dev_environment: true
      constraints_to_testing: true
      autonomy_to_pr_instructions: true
      safety_to_security: true
    cursor_integration: true
```

### Example 2: Generated AGENTS.md Output

```markdown
<!-- Generated from OSSA manifest: code-review-agent v1.0.0 -->
<!-- Source: .agents/code-review-agent/manifest.yaml -->
<!-- DO NOT EDIT MANUALLY - Changes will be overwritten on sync -->

# Code Review Agent

> AI agent for automated code review and quality checks

**Version**: 1.0.0
**Domain**: development
**Capability**: code-review

## Overview

You are a code review agent that analyzes pull requests for code quality,
best practices, and potential issues. You provide constructive feedback
and suggest improvements.

## Development Environment

### Tools

- **git_operations**: MCP server integration (git-mcp-server)
  - Capabilities: read_diff, list_files, get_file_content
  - Namespace: default

- **run_linter**: Function tool
  - Command: `npm run lint`

### Additional Setup

- Configure IDE: Install ESLint extension
- Enable pre-commit hooks: `npm run prepare`

## Testing

### Requirements

- Run linting: `npm run lint`
- Run tests: `npm test`
- Ensure all checks pass before requesting review

### Performance Requirements

- Maximum latency: 30s
- Timeout: 60s

### Quality Gates

- Minimum coverage: 80%
- Maximum complexity: 15

## PR Instructions

### Autonomy

- **Level**: supervised
- **Approval required**: Yes

### Allowed Actions

- Comment on PR
- Request changes
- Approve PR

### Blocked Actions

- Merge PR
- Delete branch

### Title Format

`[development] <description>`

## Security

### Content Filtering

- PII detection: enabled
- Content filter: enabled

### Prohibited Topics

- credentials
- secrets

---

*Generated by OSSA agents_md extension v0.3.3*
*Last synced: 2025-12-31T12:00:00Z*
```

### Example 3: Parsing AGENTS.md to OSSA

**Input: AGENTS.md**

```markdown
# Repository Code Assistant

You are a helpful coding assistant for this TypeScript repository.
Always follow clean code principles and write comprehensive tests.

## Development Environment

- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Build: `npm run build`

### Tools

- Filesystem access for reading/writing files
- Git operations for version control
- ESLint for code quality

## Testing

- Run tests: `npm test`
- Coverage requirement: 80%
- Max response time: 5 seconds

## PR Instructions

- Use conventional commits
- Include tests for new features
- Request review from at least one maintainer

## Constraints

- Never modify production configs
- Never commit secrets
- Max 4000 tokens per response
```

**Output: OSSA Manifest**

```yaml
apiVersion: ossa/v0.3.3
kind: Agent
metadata:
  name: repository-code-assistant
  version: 1.0.0
  description: Helpful coding assistant for TypeScript repository
  annotations:
    source: AGENTS.md
    parsed_at: "2025-12-31T12:00:00Z"

spec:
  role: |
    You are a helpful coding assistant for this TypeScript repository.
    Always follow clean code principles and write comprehensive tests.

  tools:
    - type: mcp
      name: filesystem
      server: filesystem
      capabilities:
        - read_file
        - write_file
        - list_directory

    - type: mcp
      name: git
      server: git
      capabilities:
        - status
        - diff
        - commit

    - type: function
      name: eslint
      config:
        command: npm run lint

  autonomy:
    level: supervised
    approval_required: true
    allowed_actions:
      - read
      - write
      - test

  constraints:
    performance:
      maxLatencySeconds: 5
    quality:
      minCoverage: 80
    prohibited:
      - modify_production_configs
      - commit_secrets

  llm:
    maxTokens: 4000

extensions:
  agents_md:
    enabled: true
    file_path: AGENTS.md
    auto_discover: true
    sync:
      on_manifest_change: true
      preserve_custom: true
```

### Example 4: Multi-Agent AGENTS.md

**AGENTS.md with Multiple Agents**

```markdown
# Project Agents

This repository uses multiple AI agents for different tasks.

## Agent: code-reviewer

**Role**: Reviews pull requests for code quality

### Instructions

You are an expert code reviewer. Focus on:
- Code correctness
- Best practices
- Performance implications
- Security concerns

### Tools

- Git diff reading
- File content access
- Comment posting

### Triggers

- On PR creation
- On PR update

### Constraints

- Max 30 second response time
- Supervised autonomy
- Cannot merge PRs

---

## Agent: test-generator

**Role**: Generates unit tests for new code

### Instructions

You generate comprehensive unit tests using Jest.
Aim for 90% code coverage on new features.

### Tools

- Filesystem read/write
- Test runner execution
- Coverage reporting

### Triggers

- On new file creation
- Manual trigger

### Constraints

- Max 60 second response time
- Semi-autonomous
- Cannot modify production code

---

## Agent: doc-writer

**Role**: Maintains documentation

### Instructions

You keep documentation up to date.
Generate JSDoc comments and update README files.

### Tools

- Markdown editing
- JSDoc generation
- README templates

### Triggers

- On code changes
- Weekly schedule

### Constraints

- Max 45 second response time
- Autonomous for docs only
```

**Parsed to Multiple OSSA Manifests**

```yaml
# code-reviewer.ossa.yaml
apiVersion: ossa/v0.3.3
kind: Agent
metadata:
  name: code-reviewer
  labels:
    source: AGENTS.md
spec:
  role: |
    You are an expert code reviewer. Focus on:
    - Code correctness
    - Best practices
    - Performance implications
    - Security concerns
  tools:
    - type: mcp
      name: git
      capabilities: [read_diff, get_file_content]
    - type: mcp
      name: github
      capabilities: [post_comment]
  autonomy:
    level: supervised
    blocked_actions: [merge_pr]
  constraints:
    performance:
      maxLatencySeconds: 30
extensions:
  agents_md:
    enabled: true
    file_path: AGENTS.md
    sections:
      _agent_section: "## Agent: code-reviewer"
---
# test-generator.ossa.yaml
apiVersion: ossa/v0.3.3
kind: Agent
metadata:
  name: test-generator
  labels:
    source: AGENTS.md
spec:
  role: |
    You generate comprehensive unit tests using Jest.
    Aim for 90% code coverage on new features.
  tools:
    - type: mcp
      name: filesystem
      capabilities: [read_file, write_file]
    - type: function
      name: jest
      config:
        command: npm test
  autonomy:
    level: semi-autonomous
    blocked_actions: [modify_production_code]
  constraints:
    performance:
      maxLatencySeconds: 60
    quality:
      minCoverage: 90
---
# doc-writer.ossa.yaml
apiVersion: ossa/v0.3.3
kind: Agent
metadata:
  name: doc-writer
  labels:
    source: AGENTS.md
spec:
  role: |
    You keep documentation up to date.
    Generate JSDoc comments and update README files.
  tools:
    - type: function
      name: jsdoc
    - type: mcp
      name: filesystem
      capabilities: [read_file, write_file]
  autonomy:
    level: autonomous
    scope: documentation
  constraints:
    performance:
      maxLatencySeconds: 45
```

## CLI Commands

### Generate AGENTS.md from OSSA

```bash
# Generate from single manifest
ossa agents-md generate manifest.yaml

# Generate with custom output path
ossa agents-md generate manifest.yaml --output .github/AGENTS.md

# Generate from multiple manifests
ossa agents-md generate .agents/*/manifest.yaml --output AGENTS.md --merge

# Verbose output
ossa agents-md generate manifest.yaml --verbose
```

### Parse AGENTS.md to OSSA

```bash
# Parse AGENTS.md to OSSA manifest
ossa agents-md parse AGENTS.md --output manifest.yaml

# Parse with auto-discovery of multiple agents
ossa agents-md parse AGENTS.md --discover --output-dir .agents/

# Parse and validate
ossa agents-md parse AGENTS.md --validate --output manifest.yaml
```

### Validate Consistency

```bash
# Validate AGENTS.md against manifest
ossa agents-md validate AGENTS.md manifest.yaml

# Validate with strict mode (fail on any difference)
ossa agents-md validate AGENTS.md manifest.yaml --strict

# Show diff between AGENTS.md and manifest
ossa agents-md diff AGENTS.md manifest.yaml
```

### Sync

```bash
# One-time sync
ossa agents-md sync manifest.yaml

# Watch mode - auto-sync on changes
ossa agents-md sync manifest.yaml --watch

# Bidirectional sync (merge changes from both)
ossa agents-md sync manifest.yaml --bidirectional
```

## Zod Validation Schema

```typescript
import { z } from 'zod';

// Section configuration schema
const AgentsMdSectionSchema = z.object({
  enabled: z.boolean().default(true),
  source: z.string().optional(),
  custom: z.string().optional(),
  append: z.string().optional(),
  prepend: z.string().optional(),
  title: z.string().optional(),
  title_format: z.string().optional(),
});

// Sync configuration schema
const AgentsMdSyncSchema = z.object({
  on_manifest_change: z.boolean().default(true),
  include_comments: z.boolean().default(true),
  preserve_custom: z.boolean().default(true),
  watch: z.boolean().default(false),
});

// Mapping configuration schema
const AgentsMdMappingSchema = z.object({
  tools_to_dev_environment: z.boolean().default(true),
  constraints_to_testing: z.boolean().default(true),
  autonomy_to_pr_instructions: z.boolean().default(true),
  safety_to_security: z.boolean().default(true),
  role_to_overview: z.boolean().default(true),
});

// Sections configuration schema
const AgentsMdSectionsSchema = z.object({
  dev_environment: AgentsMdSectionSchema.optional(),
  testing: AgentsMdSectionSchema.optional(),
  pr_instructions: AgentsMdSectionSchema.optional(),
  code_style: AgentsMdSectionSchema.optional(),
  security: AgentsMdSectionSchema.optional(),
  architecture: AgentsMdSectionSchema.optional(),
  custom: z.array(AgentsMdSectionSchema).optional(),
}).catchall(AgentsMdSectionSchema);

// Main extension schema
export const AgentsMdExtensionSchema = z.object({
  enabled: z.boolean().default(false),
  file_path: z.string().default('AGENTS.md'),
  generate: z.boolean().default(true),
  auto_discover: z.boolean().default(false),
  sections: AgentsMdSectionsSchema.optional(),
  sync: AgentsMdSyncSchema.optional(),
  mapping: AgentsMdMappingSchema.optional(),
  cursor_integration: z.boolean().default(false),
  include_metadata: z.boolean().default(true),
});

export type AgentsMdExtension = z.infer<typeof AgentsMdExtensionSchema>;
```

## OpenAPI Specification

```yaml
openapi: 3.1.0
info:
  title: OSSA Agents.md Extension API
  version: 0.3.3
paths:
  /agents-md/generate:
    post:
      operationId: generateAgentsMd
      summary: Generate AGENTS.md from OSSA manifest
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/GenerateRequest'
      responses:
        '200':
          description: Generated AGENTS.md content
          content:
            text/markdown:
              schema:
                type: string

  /agents-md/parse:
    post:
      operationId: parseAgentsMd
      summary: Parse AGENTS.md to OSSA manifest
      requestBody:
        required: true
        content:
          text/markdown:
            schema:
              type: string
      responses:
        '200':
          description: Parsed OSSA manifest
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/OSSAManifest'

  /agents-md/validate:
    post:
      operationId: validateAgentsMd
      summary: Validate AGENTS.md against manifest
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ValidateRequest'
      responses:
        '200':
          description: Validation result
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ValidationResult'

  /agents-md/sync:
    post:
      operationId: syncAgentsMd
      summary: Synchronize AGENTS.md with manifest
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SyncRequest'
      responses:
        '200':
          description: Sync result
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SyncResult'

components:
  schemas:
    GenerateRequest:
      type: object
      required:
        - manifest
      properties:
        manifest:
          $ref: '#/components/schemas/OSSAManifest'
        options:
          $ref: '#/components/schemas/GenerateOptions'

    GenerateOptions:
      type: object
      properties:
        include_comments:
          type: boolean
          default: true
        include_metadata:
          type: boolean
          default: true
        sections:
          type: object
          additionalProperties:
            $ref: '#/components/schemas/SectionConfig'

    SectionConfig:
      type: object
      properties:
        enabled:
          type: boolean
        source:
          type: string
        custom:
          type: string
        append:
          type: string
        prepend:
          type: string

    ValidateRequest:
      type: object
      required:
        - agents_md
        - manifest
      properties:
        agents_md:
          type: string
          description: AGENTS.md content
        manifest:
          $ref: '#/components/schemas/OSSAManifest'
        strict:
          type: boolean
          default: false

    ValidationResult:
      type: object
      properties:
        valid:
          type: boolean
        errors:
          type: array
          items:
            $ref: '#/components/schemas/ValidationError'
        warnings:
          type: array
          items:
            $ref: '#/components/schemas/ValidationWarning'
        diff:
          type: object

    ValidationError:
      type: object
      properties:
        path:
          type: string
        message:
          type: string
        expected:
          type: string
        actual:
          type: string

    ValidationWarning:
      type: object
      properties:
        path:
          type: string
        message:
          type: string

    SyncRequest:
      type: object
      required:
        - manifest_path
      properties:
        manifest_path:
          type: string
        agents_md_path:
          type: string
          default: AGENTS.md
        direction:
          type: string
          enum: [manifest_to_md, md_to_manifest, bidirectional]
          default: manifest_to_md
        preserve_custom:
          type: boolean
          default: true

    SyncResult:
      type: object
      properties:
        success:
          type: boolean
        changes:
          type: array
          items:
            type: object
            properties:
              path:
                type: string
              type:
                type: string
                enum: [added, modified, removed]
              before:
                type: string
              after:
                type: string

    OSSAManifest:
      type: object
      description: OSSA v0.3.3 Manifest
      # Full manifest schema reference
```

## CRUD Patterns

### Create (Generate)

```typescript
interface AgentsMdGenerator {
  // Generate AGENTS.md from OSSA manifest
  generate(manifest: OSSAManifest, options?: GenerateOptions): Promise<string>;

  // Generate with custom template
  generateWithTemplate(
    manifest: OSSAManifest,
    template: string
  ): Promise<string>;
}
```

### Read (Parse)

```typescript
interface AgentsMdParser {
  // Parse AGENTS.md to OSSA manifest
  parse(content: string): Promise<OSSAManifest>;

  // Parse with discovery of multiple agents
  parseWithDiscovery(content: string): Promise<OSSAManifest[]>;

  // Extract specific sections
  extractSections(content: string): Promise<AgentsMdSections>;
}
```

### Update (Sync)

```typescript
interface AgentsMdSync {
  // Sync manifest changes to AGENTS.md
  syncToMd(manifest: OSSAManifest, existingMd?: string): Promise<string>;

  // Sync AGENTS.md changes to manifest
  syncToManifest(
    content: string,
    existingManifest?: OSSAManifest
  ): Promise<OSSAManifest>;

  // Bidirectional merge
  merge(
    manifest: OSSAManifest,
    content: string
  ): Promise<{ manifest: OSSAManifest; content: string }>;
}
```

### Delete (Cleanup)

```typescript
interface AgentsMdCleanup {
  // Remove AGENTS.md sections not in manifest
  cleanupOrphanedSections(
    content: string,
    manifest: OSSAManifest
  ): Promise<string>;

  // Remove manifest properties not in AGENTS.md
  cleanupOrphanedProperties(
    manifest: OSSAManifest,
    content: string
  ): Promise<OSSAManifest>;
}
```

## Best Practices

### 1. Single Source of Truth

Choose either OSSA manifest or AGENTS.md as the source of truth:

```yaml
# Manifest as source (recommended for complex agents)
extensions:
  agents_md:
    enabled: true
    generate: true
    sync:
      on_manifest_change: true
```

```yaml
# AGENTS.md as source (for simple repos)
extensions:
  agents_md:
    enabled: true
    auto_discover: true
    generate: false
```

### 2. Preserve Custom Content

Always preserve user-added content when regenerating:

```yaml
extensions:
  agents_md:
    sync:
      preserve_custom: true
```

### 3. Include Comments for Traceability

```yaml
extensions:
  agents_md:
    sync:
      include_comments: true
```

### 4. Integrate with Cursor

```yaml
extensions:
  agents_md:
    cursor_integration: true
  cursor:
    workspace_config:
      context_files:
        - AGENTS.md
```

### 5. Version Control

- Commit both OSSA manifest and generated AGENTS.md
- Use `.gitattributes` to show diffs properly
- Consider pre-commit hooks to validate sync

## Related Resources

- [agents.md Specification](https://agents.md)
- [OpenAI agents.md Repository](https://github.com/openai/agents.md)
- [OSSA v0.3.3 Schema](../ossa-0.3.3.schema.json)
- [Cursor Extension](./cursor.md)
- [MCP Extension](./mcp.md)

## Version History

| Version | Changes |
|---------|---------|
| 0.3.3 | Initial extension specification |
| 0.3.3 | Preliminary support (experimental) |
| 0.2.9 | Added agents_md extension |
| 0.2.8 | Initial implementation |
