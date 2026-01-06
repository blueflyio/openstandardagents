# Development Guide

This guide helps you develop and test the OSSA VS Code extension locally.

## Setup

### 1. Prerequisites
- Node.js 18+ and npm
- Visual Studio Code 1.75.0+
- Git

### 2. Install Dependencies
```bash
cd /Users/flux423/Sites/LLM/openstandardagents/src/tools/vscode-ossa
npm install
```

### 3. Compile TypeScript
```bash
npm run compile
# Or watch mode for development
npm run watch
```

## Project Structure

```
vscode-ossa/
├── src/
│   ├── extension.ts      # Main extension entry point
│   ├── validator.ts      # OSSA schema validation
│   └── commands.ts       # Command implementations
├── snippets/
│   └── ossa-snippets.json # Code snippets
├── package.json          # Extension manifest
├── tsconfig.json         # TypeScript config
├── language-configuration.json # Language settings
├── README.md             # User-facing documentation
├── CHANGELOG.md          # Release notes
├── PUBLISHING.md         # Publishing guide
└── DEVELOPMENT.md        # This file
```

## Development Workflow

### Running the Extension

1. Open this folder in VS Code:
   ```bash
   code /Users/flux423/Sites/LLM/openstandardagents/src/tools/vscode-ossa
   ```

2. Press `F5` to launch Extension Development Host
   - A new VS Code window opens with the extension loaded
   - The original window shows debug console

3. In the Extension Development Host:
   - Create a test file: `test.ossa.yaml`
   - Type `ossa-agent` and press Tab to test snippets
   - Make intentional errors to test validation
   - Use Command Palette (`Cmd+Shift+P`) to test commands

### Development Commands

```bash
# Compile once
npm run compile

# Watch mode (auto-compile on save)
npm run watch

# Lint code
npm run lint

# Fix lint issues
npm run lint -- --fix

# Run tests (when implemented)
npm test

# Package extension
npm run package
```

### Debugging

1. **Extension Host Debugging**
   - Set breakpoints in TypeScript files
   - Press `F5` to start debugging
   - Breakpoints hit in main VS Code window

2. **Console Logging**
   ```typescript
   console.log('Debug message');  // Shows in Debug Console
   ```

3. **Output Channel**
   ```typescript
   const output = vscode.window.createOutputChannel('OSSA');
   output.appendLine('Debug info');
   output.show();
   ```

## Testing the Extension

### Manual Testing

1. **Snippet Testing**
   - Create `test.ossa.yaml`
   - Type each snippet prefix and verify output
   - Check all placeholders are correct

2. **Validation Testing**
   - Valid manifest: Should show no errors
   - Invalid manifest: Should show diagnostics
   - Test various schema versions

3. **Command Testing**
   - `OSSA: New Agent Manifest`
   - `OSSA: New Task Manifest`
   - `OSSA: New Workflow Manifest`
   - `OSSA: Validate Manifest`

4. **File Detection**
   - Test with: `.ossa.yaml`, `.ossa.json`
   - Test with: `manifest.ossa.yaml`
   - Test with: `.agents/*/manifest.yaml`

### Test Files

Create these test files in a separate test directory:

**Valid Agent**
```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: test-agent
  version: 1.0.0
spec:
  role: "Test agent"
  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
```

**Invalid Agent (missing required fields)**
```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: test-agent
# Missing: version, spec
```

**Invalid Agent (bad naming)**
```yaml
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: Test_Agent  # Should be lowercase with hyphens
  version: 1.0.0
spec:
  role: "Test"
  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
```

## Code Style

### TypeScript Guidelines

- Use TypeScript strict mode
- Prefer `const` over `let`
- Use async/await over promises
- Add JSDoc comments for public methods
- Follow existing code patterns

### Example
```typescript
/**
 * Validates an OSSA manifest document
 * @param document The VS Code document to validate
 */
async validateDocument(document: vscode.TextDocument): Promise<void> {
  // Implementation
}
```

## Extension Architecture

### Main Components

1. **extension.ts**
   - Entry point (`activate`, `deactivate`)
   - Registers commands
   - Sets up event listeners
   - Manages status bar

2. **validator.ts**
   - Schema fetching and caching
   - AJV validation
   - Diagnostic creation
   - OSSA-specific validations

3. **commands.ts**
   - Command implementations
   - Interactive manifest creation
   - Template generation

### VS Code API Usage

```typescript
// Register command
context.subscriptions.push(
  vscode.commands.registerCommand('ossa.validate', handler)
);

// Create diagnostics
const diagnostics = vscode.languages.createDiagnosticCollection('ossa');

// Show message
vscode.window.showInformationMessage('Success!');

// Get configuration
const config = vscode.workspace.getConfiguration('ossa');
const enabled = config.get('validation.enabled', true);
```

## Adding New Features

### Add New Snippet

1. Edit `snippets/ossa-snippets.json`
2. Add new snippet with unique prefix
3. Test in Extension Development Host
4. Update README.md snippet table

### Add New Command

1. Define command in `package.json`:
   ```json
   "commands": [
     {
       "command": "ossa.myNewCommand",
       "title": "OSSA: My New Feature"
     }
   ]
   ```

2. Implement in `commands.ts` or `extension.ts`

3. Register in `extension.ts`:
   ```typescript
   context.subscriptions.push(
     vscode.commands.registerCommand('ossa.myNewCommand', handler)
   );
   ```

### Add New Validation Rule

1. Edit `validator.ts`
2. Add validation logic in `performOSSAValidations`
3. Test with valid/invalid manifests

## Common Issues

### Extension Not Loading
- Check `package.json` activation events
- Verify compilation succeeded
- Check Debug Console for errors

### Snippets Not Working
- Ensure `ossa.snippets.enabled` is true
- Verify file is recognized as YAML/JSON
- Check snippet syntax is valid JSON

### Validation Failing
- Check schema URL is accessible
- Verify AJV configuration
- Test with known-valid OSSA manifest

## Performance Considerations

- Schema caching: Fetch schema once, cache for session
- Debounce validation: Don't validate on every keystroke
- Lazy loading: Only activate for OSSA files

## Security

- Never execute user code
- Sanitize all user inputs
- Validate URLs before fetching
- Use HTTPS for schema fetching

## Dependencies

```json
{
  "ajv": "^8.12.0",           // JSON Schema validation
  "ajv-formats": "^3.0.1",    // Additional format validators
  "yaml": "^2.3.0"            // YAML parsing
}
```

## VS Code Extension Guidelines

Follow official guidelines:
- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
- [UX Guidelines](https://code.visualstudio.com/api/ux-guidelines/overview)

## Useful Resources

- [VS Code API](https://code.visualstudio.com/api)
- [Extension Samples](https://github.com/microsoft/vscode-extension-samples)
- [OSSA Specification](https://openstandardagents.org)
- [JSON Schema](https://json-schema.org/)

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

See main project CONTRIBUTING.md for full guidelines.
