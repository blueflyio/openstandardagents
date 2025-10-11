#  Langflow Integration - Quick Start

## Your Setup

Based on your Python code, here's how the integration works with YOUR Langflow:

## 1. Your Token Location
```
/Users/flux423/.tokens/langflow.token
```

The integration automatically loads your token from this location.

## 2. Test Your Integration

```bash
# Run the test
cd common_npm/agent-ops
npx tsx src/langflow/test-integration.ts
```

This will:
-  Load your token from `/Users/flux423/.tokens/langflow.token`
-  Connect to Langflow at `http://localhost:7860`
-  Run your example flow (`ca6846ff-331e-4108-b5cb-886b5ac4da81`)
-  Show you the results

## 3. Use in Your Code

### JavaScript/TypeScript Version of Your Python Code:

```typescript
import { langflowClient } from './common_npm/agent-ops/src/langflow/client';

// Your exact flow from Python
async function runMyFlow() {
  const result = await langflowClient.runFlow({
    flowId: 'ca6846ff-331e-4108-b5cb-886b5ac4da81',
    inputValue: 'hello world!',
    outputType: 'text',
    inputType: 'text'
  });

  console.log(result);
}

// Run it
runMyFlow();
```

### Direct Usage (matches your Python exactly):

```typescript
// This is EXACTLY like your Python code
const result = await langflowClient.runFlow({
  flowId: 'ca6846ff-331e-4108-b5cb-886b5ac4da81',  // Your flow ID
  inputValue: 'hello world!',                       // Your input
  outputType: 'text',                              // Output type
  inputType: 'text'                                // Input type
});
```

## 4. For Other Developers on Your Team

When they clone your repo:

```bash
# Install dependencies
npm install

# Their token location (cross-platform)
# macOS: /Users/[username]/.tokens/langflow.token
# Linux: /home/[username]/.tokens/langflow.token
# Windows: C:\Users\[username]\.tokens\langflow.token

# Or use environment variable
export LANGFLOW_API_KEY="their-api-key"

# Test it works
npx tsx src/langflow/test-integration.ts
```

## 5. Available Methods

```typescript
// Run any flow
await langflowClient.runFlow({
  flowId: 'your-flow-id',
  inputValue: 'your input'
});

// List all flows
const flows = await langflowClient.listFlows();

// Run with parameter overrides (tweaks)
await langflowClient.runFlowWithTweaks(
  'flow-id',
  'input',
  { temperature: 0.7, max_tokens: 1000 }
);

// Upload a flow
await langflowClient.uploadFlow(flowData);

// Stream long-running flows
const stream = await langflowClient.streamFlow({
  flowId: 'long-running-flow',
  inputValue: 'process this'
});

for await (const chunk of stream) {
  console.log('Streaming:', chunk);
}
```

## 6. Event Handling

```typescript
// Listen to flow events
langflowClient.on('flow:executed', (data) => {
  console.log('Flow completed:', data);
});

langflowClient.on('flow:error', (error) => {
  console.error('Flow failed:', error);
});

langflowClient.on('request', (config) => {
  console.log('API Request:', config.url);
});

langflowClient.on('response', (response) => {
  console.log('API Response:', response.status);
});
```

## 7. Integration with All Projects

Every npm project now has Langflow support:

```typescript
// In agent-ops
import { langflowClient } from './src/langflow/client';

// In workflow-engine
import { workflowOrchestrator } from './src/langflow/orchestrator';

// In any project
const result = await langflowClient.runFlow({
  flowId: 'project-specific-flow',
  inputValue: data
});
```

## 8. Your Flows Location

All flows are stored at:
```
~/Library/Application Support/Langflow/flows/
```

Project-specific flows:
```
~/Library/Application Support/Langflow/flows/agent-ops/
~/Library/Application Support/Langflow/flows/workflow-engine/
~/Library/Application Support/Langflow/flows/compliance-engine/
... etc
```

##  That's It!

You now have:
-  Full TypeScript/JavaScript version of your Python Langflow code
-  Automatic token loading from `/Users/flux423/.tokens/langflow.token`
-  Same API endpoints and authentication as your Python version
-  Integration in all npm projects
-  Production-ready flows for every service

Just run flows exactly like your Python code, but in TypeScript! 