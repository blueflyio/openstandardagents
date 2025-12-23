# Bug Report: `buildkit agents spawn` Command Not Working

## Issue Summary

The `buildkit agents spawn` command fails silently when the BuildKit API server is not running. Unlike `buildkit agents list`, which has a filesystem fallback, the `spawn` command only attempts API calls and provides no fallback mechanism.

## Current Behavior

```bash
$ buildkit agents spawn --agent gitlab-expert --task "Work on issue #21"
# Command exits with no output or error message
```

## Root Cause Analysis

### Location
- **File**: `/Users/flux423/Sites/LLM/agent-buildkit/src/cli/index.ts`
- **Lines**: 329-378 (agents spawn command)

### Problem
1. **No API Server Running**: The command requires `http://localhost:3001/api` to be running
2. **No Fallback**: Unlike `agents list` (lines 237-326), `agents spawn` has no filesystem fallback
3. **Silent Failure**: Error handling catches exceptions but may not provide clear feedback
4. **Missing Error Handling**: No graceful degradation when API is unavailable

### Code Reference

```typescript
// Line 329-378: agents spawn command
agents
  .command('spawn <agentId>')
  .description('Spawn a new agent instance')
  .option('-t, --task <task>', 'Task description for the agent')
  .action(async (agentId, options) => {
    try {
      // Makes POST to ${API_BASE_URL}/agent-lifecycle
      const response = await axios.post(
        `${API_BASE_URL}/agent-lifecycle`,
        requestBody
      );
      // ... success handling
    } catch (error: any) {
      console.error(
        chalk.red('❌ Error spawning agent:'),
        error.response?.data?.error || (error as Error).message
      );
      process.exit(1);
    }
  });
```

### Comparison with `agents list`

The `agents list` command (lines 227-327) has proper fallback:

```typescript
// Line 237-290: Try API first
if (!options.filesystem) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/agent-lifecycle?${params}`,
      { timeout: 2000 }
    );
    // ... handle API response
    return;
  } catch (apiError: unknown) {
    // Graceful fallback on ECONNREFUSED/timeout
    if (
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('timeout') ||
      error.message.includes('ENOTFOUND')
    ) {
      console.log(
        chalk.yellow(
          `⚠️  API server unavailable (${error.message}), falling back to filesystem discovery...\n`
        )
      );
    }
  }
}

// Line 293-313: Filesystem fallback
const workspace = new AgentWorkspaceService();
const discoveredAgents = await workspace.discoverAgents();
// ... display filesystem agents
```

## Expected Behavior

The `agents spawn` command should:

1. **Check API availability first** (with timeout)
2. **Fallback to alternative spawning methods** when API unavailable:
   - Filesystem-based agent discovery (like `agents list`)
   - Direct agent execution via OSSA manifests
   - GitLab CI job triggering (for CI-based agents)
   - Local process spawning (for development agents)
3. **Provide clear error messages** explaining what failed and what alternatives are available
4. **Support `--filesystem` flag** like `agents list` does

## Proposed Solution

### Option 1: Add Filesystem Fallback (Recommended)

Similar to `agents list`, add fallback logic:

```typescript
agents
  .command('spawn <agentId>')
  .description('Spawn a new agent instance')
  .option('-t, --task <task>', 'Task description for the agent')
  .option('--filesystem', 'Use filesystem discovery only (skip API)')
  .action(async (agentId, options) => {
    // Try API first (unless --filesystem flag)
    if (!options.filesystem) {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/agent-lifecycle`,
          requestBody,
          { timeout: 2000 }
        );
        // ... handle success
        return;
      } catch (apiError: unknown) {
        const error = apiError as Error;
        if (
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('timeout') ||
          error.message.includes('ENOTFOUND')
        ) {
          console.log(
            chalk.yellow(
              `⚠️  API server unavailable, falling back to filesystem agent discovery...\n`
            )
          );
        } else {
          throw apiError;
        }
      }
    }

    // Filesystem fallback
    const workspace = new AgentWorkspaceService();
    const agents = await workspace.discoverAgents();
    const agent = agents.find(a => a.id === agentId);
    
    if (!agent) {
      console.error(chalk.red(`❌ Agent not found: ${agentId}`));
      console.log(chalk.gray('\nAvailable agents:'));
      agents.forEach(a => console.log(`  - ${a.id}`));
      process.exit(1);
    }

    // Execute agent via OSSA manifest
    console.log(chalk.cyan(`🚀 Spawning agent from filesystem: ${agentId}`));
    // Use OSSA CLI or direct execution
    // ...
  });
```

### Option 2: Support Multiple Spawn Methods

Add support for different spawn backends:

```typescript
.option('--method <method>', 'Spawn method (api|filesystem|gitlab|local)', 'api')
```

### Option 3: Auto-detect Available Methods

Try multiple methods in order:
1. API server (if available)
2. Filesystem OSSA manifests
3. GitLab CI triggers
4. Local process execution

## Testing Requirements

1. **Test with API server running**: Should use API
2. **Test with API server down**: Should fallback gracefully
3. **Test with `--filesystem` flag**: Should skip API entirely
4. **Test error messages**: Should be clear and actionable
5. **Test agent discovery**: Should find agents from `.agents/` directories

## Related Files

- `/Users/flux423/Sites/LLM/agent-buildkit/src/cli/index.ts` - Main CLI entry point
- `/Users/flux423/Sites/LLM/agent-buildkit/src/experimental/services/agent-workspace.service.ts` - Filesystem agent discovery
- `/Users/flux423/Sites/LLM/agent-buildkit/src/cli/commands/agents.command.ts.bak*` - Backup files with different implementations

## Environment

- **BuildKit Version**: 0.2.1
- **Node Version**: 18.20.8
- **API Base URL**: `http://localhost:3001/api` (default)
- **API Server Status**: Not running (needs `buildkit start` or API server process)

## Priority

**High** - This blocks agent spawning functionality, which is a core feature of BuildKit.

## Acceptance Criteria

- [ ] `buildkit agents spawn` works when API server is running
- [ ] `buildkit agents spawn` falls back gracefully when API server is down
- [ ] `--filesystem` flag works to skip API entirely
- [ ] Clear error messages guide users to solutions
- [ ] Documentation updated with spawn methods and fallback behavior
