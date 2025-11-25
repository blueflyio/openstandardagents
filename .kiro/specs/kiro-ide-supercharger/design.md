# Design Document: Kiro IDE Supercharger

## Overview

This design transforms the development environment into an AI-powered productivity platform by leveraging Kiro's full capabilities alongside existing Cursor and VS Code configurations. The system will provide intelligent automation, context-aware assistance, and seamless tool integration specifically optimized for OSSA (Open Standard for Scalable AI Agents) development.

The design focuses on five core pillars:
1. **Intelligent Context Management** - Steering rules and smart context loading
2. **Workflow Automation** - Agent hooks for event-driven development
3. **External Tool Integration** - MCP servers for enhanced capabilities
4. **Spec-Driven Development** - Systematic feature building with PBT
5. **Tool Orchestration** - Seamless coordination between Kiro, Cursor, and VS Code

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Developer Interface                       │
│  (Kiro Chat, Cursor Editor, VS Code, Terminal)              │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────────┐
│                  Kiro Core Engine                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Steering   │  │  Agent Hooks │  │  Spec Engine │     │
│  │   Manager    │  │   Executor   │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────────┐
│              MCP Integration Layer                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Filesystem│  │ Database │  │   HTTP   │  │  Custom  │   │
│  │  Server  │  │  Server  │  │  Server  │  │  Servers │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────────┐
│              External Services & Tools                       │
│  GitLab API │ K8s Cluster │ npm Registry │ Test Runners    │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
Developer Action → Kiro Receives Event → Steering Rules Applied
                                              ↓
                                    Context Assembled
                                              ↓
                                    Agent Hook Triggered (if configured)
                                              ↓
                                    MCP Servers Queried (if needed)
                                              ↓
                                    AI Processing with Full Context
                                              ↓
                                    Actions Executed → Results Returned
```

## Components and Interfaces

### 1. Steering System

**Purpose**: Provide project-specific context and rules to Kiro automatically

**Location**: `.kiro/steering/`

**Key Files**:
- `ossa-standards.md` - OSSA development standards and best practices
- `schema-validation.md` - Schema-specific rules (conditional on schema files)
- `testing-requirements.md` - TDD and PBT requirements
- `openapi-workflow.md` - OpenAPI spec development workflow
- `git-workflow.md` - Branch protection and commit standards

**Interface**:
```typescript
interface SteeringRule {
  name: string;
  inclusion: 'always' | 'conditional' | 'manual';
  fileMatchPattern?: string; // For conditional inclusion
  content: string; // Markdown content with instructions
  priority: number; // Higher priority rules override lower
}
```

**Behavior**:
- Always-included rules load on every Kiro interaction
- Conditional rules load when matching files are in context
- Manual rules load when referenced via `#` in chat
- Rules can reference external files via `#[[file:path]]`

### 2. Agent Hooks System

**Purpose**: Automate repetitive tasks through event-driven execution

**Location**: `.kiro/hooks/`

**Hook Types**:
```typescript
type HookTrigger = 
  | 'onFileSave'
  | 'onMessageSend'
  | 'onAgentComplete'
  | 'onSessionStart'
  | 'onManualTrigger';

interface AgentHook {
  name: string;
  trigger: HookTrigger;
  filePattern?: string; // e.g., "**/*.schema.json"
  action: {
    type: 'message' | 'command';
    content: string;
  };
  enabled: boolean;
}
```

**Key Hooks for OSSA Development**:

1. **Schema Change Hook**
   - Trigger: `onFileSave` matching `spec/**/*.schema.json`
   - Action: Run `npm run gen:types && npm run gen:zod`
   - Message: "Schema updated, regenerating types and validators"

2. **Test Execution Hook**
   - Trigger: `onFileSave` matching `src/**/*.ts`
   - Action: Run related tests
   - Message: "Running tests for modified files"

3. **OpenAPI Validation Hook**
   - Trigger: `onFileSave` matching `openapi/**/*.yaml`
   - Action: Run `npm run validate:schema`
   - Message: "Validating OpenAPI specification"

4. **Pre-Commit Validation Hook**
   - Trigger: `onManualTrigger` (button in UI)
   - Action: Run full test suite and linting
   - Message: "Running pre-commit validation"

### 3. MCP Integration Layer

**Purpose**: Connect Kiro to external tools and services

**Configuration Location**: `.kiro/settings/mcp.json`

**Core MCP Servers**:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "uvx",
      "args": ["mcp-server-filesystem"],
      "env": {
        "ALLOWED_DIRECTORIES": "/Users/flux423/Sites/LLM/openstandardagents"
      }
    },
    "gitlab": {
      "command": "uvx",
      "args": ["mcp-server-gitlab"],
      "env": {
        "GITLAB_TOKEN": "${GITLAB_TOKEN}",
        "GITLAB_URL": "https://gitlab.com"
      }
    },
    "kubernetes": {
      "command": "node",
      "args": ["./mcp-servers/k8s-server.js"],
      "env": {
        "KUBECONFIG": "${HOME}/.kube/config"
      }
    }
  }
}
```

**MCP Server Capabilities**:

1. **Filesystem Server**
   - Read/write files with permission control
   - Search across codebase
   - Watch for file changes

2. **GitLab Server**
   - Query issues and merge requests
   - Trigger CI/CD pipelines
   - Access repository metadata

3. **Kubernetes Server** (Custom)
   - Query cluster state
   - Validate OSSA agent deployments
   - Check pod health and logs

4. **Database Server** (Optional)
   - Query test databases
   - Validate migrations
   - Check data integrity

### 4. Spec-Driven Development Engine

**Purpose**: Guide systematic feature development with requirements → design → implementation

**Workflow**:

```
1. Requirements Phase
   ├─ User provides rough idea
   ├─ Kiro generates EARS-compliant requirements
   ├─ User reviews and approves
   └─ requirements.md created

2. Design Phase
   ├─ Kiro conducts research
   ├─ Generates architecture and components
   ├─ Creates correctness properties for PBT
   ├─ User reviews and approves
   └─ design.md created

3. Task Planning Phase
   ├─ Kiro breaks design into tasks
   ├─ Creates property-based test tasks
   ├─ Establishes checkpoints
   ├─ User reviews and approves
   └─ tasks.md created

4. Implementation Phase
   ├─ Execute tasks one at a time
   ├─ Write code + tests together
   ├─ Run property-based tests (100+ iterations)
   ├─ Validate at checkpoints
   └─ Feature complete
```

**Property-Based Testing Integration**:
- Library: `fast-check` (TypeScript)
- Minimum iterations: 100 per property
- Each property tagged with design doc reference
- Properties test universal rules, not specific examples

### 5. Context Management System

**Purpose**: Intelligently manage what information Kiro has access to

**Strategy**:

```typescript
interface ContextStrategy {
  // Automatic inclusions
  alwaysInclude: string[]; // e.g., ["package.json", "tsconfig.json"]
  
  // Smart dependency resolution
  followImports: boolean; // Include imported files
  maxDepth: number; // How deep to follow imports
  
  // File type priorities
  priorities: {
    [fileType: string]: number; // Higher = more important
  };
  
  // Token budget management
  maxTokens: number;
  pruningStrategy: 'oldest' | 'least-relevant' | 'smart';
}
```

**Context Assembly Process**:
1. Load always-included files (package.json, configs)
2. Load steering rules (always + conditional)
3. Load files explicitly referenced in chat
4. Follow imports from loaded files (up to maxDepth)
5. Add related test files
6. Prune if over token budget using smart strategy

## Data Models

### Steering Rule Model

```typescript
interface SteeringRule {
  id: string;
  name: string;
  filePath: string;
  inclusion: 'always' | 'conditional' | 'manual';
  fileMatchPattern?: RegExp;
  priority: number;
  content: string;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    author: string;
    tags: string[];
  };
}
```

### Agent Hook Model

```typescript
interface AgentHook {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: HookTrigger;
    filePattern?: string;
    conditions?: Record<string, any>;
  };
  action: {
    type: 'message' | 'command';
    content: string;
    timeout?: number;
  };
  enabled: boolean;
  metadata: {
    createdAt: Date;
    lastTriggered?: Date;
    triggerCount: number;
  };
}
```

### MCP Server Configuration Model

```typescript
interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env: Record<string, string>;
  disabled: boolean;
  autoApprove: string[]; // Tool names to auto-approve
  timeout?: number;
  retryPolicy?: {
    maxRetries: number;
    backoff: 'linear' | 'exponential';
  };
}
```

### Spec Model

```typescript
interface Spec {
  featureName: string;
  directory: string; // .kiro/specs/{featureName}
  requirements: {
    filePath: string;
    userStories: UserStory[];
    status: 'draft' | 'approved';
  };
  design: {
    filePath: string;
    architecture: string;
    correctnessProperties: Property[];
    status: 'draft' | 'approved';
  };
  tasks: {
    filePath: string;
    taskList: Task[];
    status: 'not_started' | 'in_progress' | 'completed';
  };
}

interface Property {
  id: string;
  number: number;
  description: string;
  validatesRequirements: string[]; // e.g., ["1.2", "1.3"]
  testable: boolean;
  propertyType: 'invariant' | 'round-trip' | 'idempotence' | 'metamorphic' | 'model-based';
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Steering System Properties

Property 1: Steering files automatically loaded
*For any* Kiro interaction, all steering files marked as "always" should be loaded and available in the context
**Validates: Requirements 2.1**

Property 2: Conditional steering activation
*For any* file in context matching a steering rule's file pattern, that steering rule should be loaded automatically
**Validates: Requirements 2.2, 2.5**

Property 3: OpenAPI validation on modification
*For any* OpenAPI spec file modification, validation should execute and types should be generated
**Validates: Requirements 2.4**

### Agent Hooks Properties

Property 4: Hook triggering on file save
*For any* file save event, if a hook is configured for that file pattern, the hook should execute automatically
**Validates: Requirements 3.1**

Property 5: Schema modification triggers regeneration
*For any* schema file save, TypeScript types and Zod validators should be regenerated
**Validates: Requirements 3.2**

Property 6: OpenAPI update triggers validation
*For any* OpenAPI spec file save, validation and documentation update should execute
**Validates: Requirements 3.3**

Property 7: Pre-commit validation execution
*For any* pre-commit hook trigger, code quality validation, linting, and tests should execute
**Validates: Requirements 3.5**

### MCP Integration Properties

Property 8: Filesystem operations use MCP
*For any* file system operation request, the MCP filesystem server should be invoked
**Validates: Requirements 4.1**

Property 9: Database operations use MCP
*For any* database query request, the MCP database server should be invoked
**Validates: Requirements 4.2**

Property 10: HTTP operations use MCP
*For any* API interaction request, the MCP HTTP server should be invoked
**Validates: Requirements 4.3**

Property 11: Command execution uses MCP
*For any* command execution request, the MCP command server should be invoked with appropriate permissions
**Validates: Requirements 4.4**

### Spec-Driven Development Properties

Property 12: EARS pattern enforcement
*For any* requirements document, all acceptance criteria should follow EARS patterns (WHEN/WHILE/IF/WHERE/THE/SHALL)
**Validates: Requirements 5.1**

Property 13: Correctness properties generation
*For any* design document, correctness properties should be generated for testable acceptance criteria
**Validates: Requirements 5.2**

Property 14: Task list structure
*For any* task list, it should contain dependencies, checkpoints, and property-based test tasks
**Validates: Requirements 5.3**

Property 15: Single task execution
*For any* task execution session, only one task should be marked as "in_progress" at a time
**Validates: Requirements 5.4**

Property 16: Dual test generation
*For any* feature implementation, both unit tests and property-based tests should be created
**Validates: Requirements 5.5, 7.1**

### Context Management Properties

Property 17: Import following
*For any* file in context, its imports should be included in context up to the configured depth limit
**Validates: Requirements 6.1**

Property 18: Schema context inclusion
*For any* schema file in context, related validation rules and type definitions should be included
**Validates: Requirements 6.2**

Property 19: Debug context inclusion
*For any* debugging session, error logs, test results, and related code should be included in context
**Validates: Requirements 6.3**

Property 20: Context pruning priority
*For any* context that exceeds token limits, lower-priority content should be removed before higher-priority content
**Validates: Requirements 6.4**

Property 21: Context continuity
*For any* conversation continuation, relevant context from previous messages should remain available
**Validates: Requirements 6.5**

### Testing Workflow Properties

Property 22: Coverage gap identification
*For any* code coverage report below threshold, untested code paths should be identified
**Validates: Requirements 7.3**

Property 23: Refactoring test preservation
*For any* refactoring operation, all existing tests should execute and pass
**Validates: Requirements 7.4**

Property 24: PBT configuration
*For any* property-based test generated, it should use fast-check library and configure minimum 100 iterations
**Validates: Requirements 7.5**

### OSSA Workflow Properties

Property 25: Agent manifest validation
*For any* generated OSSA agent manifest, it should validate against the current OSSA schema version
**Validates: Requirements 8.1, 8.4**

Property 26: Schema migration completeness
*For any* schema version update, all agent manifests should be migrated to the new version
**Validates: Requirements 8.2**

Property 27: Version synchronization
*For any* version release, version numbers should match across package.json, schema files, and documentation
**Validates: Requirements 8.3**

Property 28: Documentation synchronization
*For any* documentation update, content should be synchronized between GitLab wiki and website
**Validates: Requirements 8.5**

### Tool Integration Properties

Property 29: Schema configuration consistency
*For any* YAML schema configuration, it should be consistent across Kiro, Cursor, and VS Code settings
**Validates: Requirements 9.2**

Property 30: Formatter consistency
*For any* code formatting operation, Prettier and ESLint rules should produce consistent results across tools
**Validates: Requirements 9.3**

Property 31: Workspace configuration respect
*For any* project setting access, existing workspace configurations should be honored
**Validates: Requirements 9.4**

### Advanced MCP Properties

Property 32: GitLab MCP usage
*For any* GitLab operation (repository, issue, CI/CD), the GitLab MCP server should be used
**Validates: Requirements 10.2**

Property 33: Kubernetes MCP usage
*For any* Kubernetes operation (cluster query, deployment), the Kubernetes MCP server should be used
**Validates: Requirements 10.3**

Property 34: Code quality MCP integration
*For any* code quality analysis, MCP servers should be used to integrate with linters and static analysis tools
**Validates: Requirements 10.4**

Property 35: MCP security configuration
*For any* MCP server requiring authentication, proper auth configuration should be present
**Validates: Requirements 10.5**

## Error Handling

### Steering System Errors

**Missing Steering File**
- Detection: File referenced but not found
- Handling: Log warning, continue without that rule
- User notification: Show which steering file is missing
- Recovery: Provide template to create missing file

**Invalid Steering Syntax**
- Detection: Markdown parsing fails or invalid frontmatter
- Handling: Skip that rule, load others
- User notification: Show syntax error location
- Recovery: Validate steering files on save

**Circular File References**
- Detection: `#[[file:...]]` creates circular dependency
- Handling: Break cycle at detection point
- User notification: Show circular reference chain
- Recovery: Suggest restructuring references

### Agent Hooks Errors

**Hook Execution Failure**
- Detection: Command returns non-zero exit code
- Handling: Log error, show output to user
- User notification: Display command output and error
- Recovery: Allow retry or disable hook

**Hook Timeout**
- Detection: Command exceeds configured timeout
- Handling: Kill process, log timeout
- User notification: Show timeout duration and command
- Recovery: Suggest increasing timeout or optimizing command

**File Pattern Match Errors**
- Detection: Invalid regex in file pattern
- Handling: Disable that hook, log error
- User notification: Show invalid pattern
- Recovery: Provide pattern validation on save

### MCP Integration Errors

**Server Connection Failure**
- Detection: MCP server doesn't respond
- Handling: Retry with backoff, fallback to direct operations
- User notification: Show which server is unavailable
- Recovery: Restart server, check configuration

**Authentication Failure**
- Detection: MCP server returns auth error
- Handling: Prompt for credentials, disable server if repeated failures
- User notification: Show auth error and server name
- Recovery: Update credentials in configuration

**Tool Execution Failure**
- Detection: MCP tool returns error
- Handling: Log error, show to user, continue with other operations
- User notification: Display tool error message
- Recovery: Suggest alternative approaches

**Server Crash**
- Detection: MCP server process exits unexpectedly
- Handling: Attempt restart, log crash details
- User notification: Show crash notification
- Recovery: Check server logs, update server if needed

### Spec Workflow Errors

**Invalid Requirements Format**
- Detection: Requirements don't follow EARS patterns
- Handling: Highlight non-compliant requirements
- User notification: Show which requirements need fixing
- Recovery: Provide EARS pattern examples

**Missing Correctness Properties**
- Detection: Testable criteria without corresponding properties
- Handling: Warn user during design review
- User notification: List criteria missing properties
- Recovery: Generate properties for missing criteria

**Task Dependency Cycle**
- Detection: Tasks have circular dependencies
- Handling: Prevent task list approval
- User notification: Show dependency cycle
- Recovery: Suggest reordering tasks

**Test Failure During Implementation**
- Detection: Tests fail after code changes
- Handling: Stop implementation, show test output
- User notification: Display failing tests and errors
- Recovery: Debug and fix, or revert changes

### Context Management Errors

**Token Limit Exceeded**
- Detection: Context size exceeds model limits
- Handling: Apply pruning strategy automatically
- User notification: Show what was pruned
- Recovery: User can manually select what to keep

**Import Resolution Failure**
- Detection: Import path cannot be resolved
- Handling: Skip that import, continue with others
- User notification: Show unresolved import
- Recovery: Check file paths and tsconfig

**File Read Failure**
- Detection: File cannot be read (permissions, not found)
- Handling: Skip that file, log error
- User notification: Show which file failed
- Recovery: Check file permissions and existence

## Testing Strategy

### Unit Testing Approach

**Framework**: Jest with TypeScript support

**Coverage Requirements**:
- Minimum 95% code coverage
- All public APIs must have unit tests
- Edge cases and error conditions must be tested

**Test Organization**:
```
tests/
├── unit/
│   ├── steering/
│   │   ├── rule-loader.test.ts
│   │   ├── conditional-activation.test.ts
│   │   └── file-reference-resolver.test.ts
│   ├── hooks/
│   │   ├── hook-executor.test.ts
│   │   ├── file-pattern-matcher.test.ts
│   │   └── event-dispatcher.test.ts
│   ├── mcp/
│   │   ├── server-manager.test.ts
│   │   ├── connection-handler.test.ts
│   │   └── tool-executor.test.ts
│   ├── spec/
│   │   ├── requirements-validator.test.ts
│   │   ├── property-generator.test.ts
│   │   └── task-planner.test.ts
│   └── context/
│       ├── context-assembler.test.ts
│       ├── import-resolver.test.ts
│       └── pruning-strategy.test.ts
```

**Key Unit Tests**:

1. **Steering Rule Loading**
   - Test always-included rules load on every interaction
   - Test conditional rules load when file patterns match
   - Test manual rules load only when referenced
   - Test priority ordering works correctly

2. **Hook Execution**
   - Test hooks trigger on correct events
   - Test file pattern matching works
   - Test command execution and output capture
   - Test timeout handling

3. **MCP Server Management**
   - Test server connection establishment
   - Test authentication handling
   - Test tool invocation and response parsing
   - Test error recovery and retries

4. **Spec Workflow**
   - Test EARS pattern validation
   - Test property generation from criteria
   - Test task dependency resolution
   - Test checkpoint insertion

5. **Context Assembly**
   - Test import following up to depth limit
   - Test token budget management
   - Test pruning strategies
   - Test context continuity

### Property-Based Testing Approach

**Framework**: fast-check (TypeScript property-based testing library)

**Configuration**: Minimum 100 iterations per property

**Property Test Organization**:
```
tests/
├── properties/
│   ├── steering.properties.test.ts
│   ├── hooks.properties.test.ts
│   ├── mcp.properties.test.ts
│   ├── spec.properties.test.ts
│   └── context.properties.test.ts
```

**Key Property-Based Tests**:

1. **Property 1: Steering files automatically loaded**
```typescript
/**
 * Feature: kiro-ide-supercharger, Property 1: Steering files automatically loaded
 * Validates: Requirements 2.1
 */
fc.assert(
  fc.property(
    fc.array(steeringRuleGenerator({ inclusion: 'always' })),
    (alwaysRules) => {
      const context = assembleContext(alwaysRules);
      return alwaysRules.every(rule => 
        context.steeringRules.includes(rule)
      );
    }
  ),
  { numRuns: 100 }
);
```

2. **Property 4: Hook triggering on file save**
```typescript
/**
 * Feature: kiro-ide-supercharger, Property 4: Hook triggering on file save
 * Validates: Requirements 3.1
 */
fc.assert(
  fc.property(
    fc.record({
      hook: hookGenerator(),
      filePath: fc.string()
    }),
    ({ hook, filePath }) => {
      const shouldTrigger = matchesPattern(filePath, hook.filePattern);
      const didTrigger = triggerHooksForFile(filePath, [hook]).length > 0;
      return shouldTrigger === didTrigger;
    }
  ),
  { numRuns: 100 }
);
```

3. **Property 17: Import following**
```typescript
/**
 * Feature: kiro-ide-supercharger, Property 17: Import following
 * Validates: Requirements 6.1
 */
fc.assert(
  fc.property(
    fc.record({
      file: fileWithImportsGenerator(),
      maxDepth: fc.integer({ min: 1, max: 5 })
    }),
    ({ file, maxDepth }) => {
      const context = assembleContext([file], { maxDepth });
      const imports = getAllImports(file, maxDepth);
      return imports.every(imp => context.files.includes(imp));
    }
  ),
  { numRuns: 100 }
);
```

4. **Property 25: Agent manifest validation**
```typescript
/**
 * Feature: kiro-ide-supercharger, Property 25: Agent manifest validation
 * Validates: Requirements 8.1, 8.4
 */
fc.assert(
  fc.property(
    ossaAgentGenerator(),
    (agent) => {
      const manifest = generateAgentManifest(agent);
      const validation = validateAgainstSchema(manifest);
      return validation.valid === true;
    }
  ),
  { numRuns: 100 }
);
```

**Generators**:

Custom generators will be created for:
- `steeringRuleGenerator()` - Generates valid steering rules
- `hookGenerator()` - Generates valid agent hooks
- `fileWithImportsGenerator()` - Generates files with import statements
- `ossaAgentGenerator()` - Generates valid OSSA agent configurations
- `mcpServerConfigGenerator()` - Generates valid MCP server configs

### Integration Testing

**Scope**: Test interactions between components

**Key Integration Tests**:

1. **Steering + Context Assembly**
   - Test that conditional steering rules load when matching files are in context
   - Test that file references in steering rules are resolved correctly

2. **Hooks + MCP**
   - Test that hooks can trigger MCP server operations
   - Test that hook failures are handled gracefully

3. **Spec Workflow + Testing**
   - Test complete spec workflow from requirements to implementation
   - Test that property-based tests are generated and executed

4. **Context + MCP**
   - Test that MCP servers can provide additional context
   - Test that context assembly includes MCP-provided data

### End-to-End Testing

**Scope**: Test complete user workflows

**Key E2E Tests**:

1. **Complete Spec Workflow**
   - Create requirements → design → tasks → implementation
   - Verify all artifacts are created correctly
   - Verify tests pass

2. **Hook-Driven Development**
   - Save schema file → types regenerated → tests run
   - Verify complete automation chain works

3. **MCP-Enhanced Development**
   - Query GitLab via MCP → create issue → link to code
   - Verify MCP integration works end-to-end

## Implementation Notes

### Technology Stack

- **Language**: TypeScript 5.x
- **Testing**: Jest + fast-check
- **Configuration**: JSON/YAML
- **MCP**: Python (uvx) for standard servers, Node.js for custom servers
- **Documentation**: Markdown

### File Structure

```
.kiro/
├── steering/
│   ├── ossa-standards.md
│   ├── schema-validation.md
│   ├── testing-requirements.md
│   ├── openapi-workflow.md
│   └── git-workflow.md
├── hooks/
│   ├── schema-change.hook.json
│   ├── test-execution.hook.json
│   ├── openapi-validation.hook.json
│   └── pre-commit.hook.json
├── settings/
│   └── mcp.json
└── specs/
    └── kiro-ide-supercharger/
        ├── requirements.md
        ├── design.md
        └── tasks.md
```

### Dependencies

**Required**:
- `fast-check` - Property-based testing
- `ajv` - JSON schema validation
- `yaml` - YAML parsing
- `glob` - File pattern matching

**Optional**:
- `uv` / `uvx` - Python package manager for MCP servers
- `@gitbeaker/rest` - GitLab API client
- `@kubernetes/client-node` - Kubernetes API client

### Configuration Examples

**Steering Rule with Conditional Inclusion**:
```markdown
---
inclusion: conditional
fileMatchPattern: 'spec/**/*.schema.json'
priority: 10
---

# Schema Validation Rules

When working with OSSA schemas:
- Always validate against JSON Schema Draft 2020-12
- Run `npm run gen:types` after schema changes
- Update examples to match schema changes
- Increment schema version following semver
```

**Agent Hook Configuration**:
```json
{
  "name": "Schema Change Hook",
  "trigger": {
    "type": "onFileSave",
    "filePattern": "spec/**/*.schema.json"
  },
  "action": {
    "type": "command",
    "content": "npm run gen:types && npm run gen:zod",
    "timeout": 30000
  },
  "enabled": true
}
```

**MCP Server Configuration**:
```json
{
  "mcpServers": {
    "gitlab": {
      "command": "uvx",
      "args": ["mcp-server-gitlab"],
      "env": {
        "GITLAB_TOKEN": "${GITLAB_TOKEN}",
        "GITLAB_URL": "https://gitlab.com",
        "GITLAB_PROJECT": "llm/openapi-ai-agents-standard"
      },
      "disabled": false,
      "autoApprove": ["list_issues", "get_issue"]
    }
  }
}
```

### Performance Considerations

1. **Context Assembly**: Cache import resolution results
2. **Steering Rules**: Load and parse rules once, reuse across interactions
3. **MCP Connections**: Keep connections alive, use connection pooling
4. **Hook Execution**: Run hooks asynchronously, don't block user interactions
5. **Property Tests**: Run in parallel when possible

### Security Considerations

1. **MCP Servers**: 
   - Store credentials in environment variables, never in config files
   - Use least-privilege permissions
   - Validate all MCP server responses

2. **Hook Execution**:
   - Sanitize file paths to prevent injection
   - Run hooks with limited permissions
   - Timeout long-running hooks

3. **File Access**:
   - Respect workspace boundaries
   - Validate file paths before access
   - Handle symlinks carefully

4. **External APIs**:
   - Use authenticated requests
   - Validate SSL certificates
   - Rate limit API calls
