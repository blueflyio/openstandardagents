# Integration Tests

This directory contains integration tests for OAAS components, following the co-location principle where possible.

## Test Structure

Integration tests verify that multiple components work together correctly:

- `multi-agent-orchestration.test.js` - Tests multi-agent coordination workflows
- Other integration tests should be added here as needed

## Running Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific test
node tests/integration/multi-agent-orchestration.test.js
```

## Co-location Note

While these tests are in a centralized location due to their cross-component nature, component-specific integration tests should be co-located with their components:

```
services/workspace-orchestrator/
├── src/orchestrator.ts
├── src/orchestrator.test.ts        # Unit tests (co-located)
├── src/orchestrator.spec.ts        # Component integration tests (co-located)
└── examples/
    └── orchestration-workflow.ts   # Usage examples (co-located)
```

Only use this directory for tests that span multiple services or the entire system.