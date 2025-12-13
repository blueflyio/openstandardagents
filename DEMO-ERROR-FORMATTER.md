# OSSA CLI Error Formatter - Demo

This document demonstrates the new helpful error formatting for OSSA CLI validation.

## Features

1. **Actual Values Display**: Shows the actual invalid values from the manifest
2. **Helpful Suggestions**: Detects common mistakes and suggests fixes
3. **Documentation Links**: Provides links to relevant documentation
4. **Typo Detection**: Uses Levenshtein distance to suggest correct field names
5. **Provider-Specific Hints**: Special hints for common provider/model mismatches
6. **Compact & Verbose Modes**: Different output levels for different needs

## Example 1: Invalid Provider

**Test File** (`test-provider-error.json`):
```json
{
  "apiVersion": "ossa/v0.3.0",
  "kind": "Agent",
  "metadata": {
    "name": "test-agent",
    "version": "1.0.0"
  },
  "spec": {
    "role": "chat",
    "llm": {
      "provider": "claude",  // ❌ Invalid: should be "anthropic"
      "model": "claude-sonnet-4-5-20250929",
      "temperature": 0.7
    }
  }
}
```

**Output (Verbose)**:
```
✗ Validation Failed
Found 4 error(s):

1. Validation Error at /spec/llm/provider

   Invalid value: "claude"

   Expected one of:
      • openai
      • anthropic
      • google
      [... more providers ...]

   💡 Claude models use provider: anthropic

   📖 Docs: https://openstandardagents.org/docs/llm-config#providers
```

**Output (Compact)**:
```
✗ Validation Failed
Found 4 error(s):

  1. /spec/llm/provider: invalid value "claude"
  2. /spec/llm/provider: must match pattern ...
  3. /spec/llm/provider: must match a schema in anyOf
  4. #/allOf/0/if: must match "then" schema

Use --verbose for detailed error information
📚 Docs: https://openstandardagents.org/docs
```

## Example 2: Type Mismatch

**Test File** (`test-type-error.json`):
```json
{
  "apiVersion": "ossa/v0.3.0",
  "kind": "Agent",
  "metadata": {
    "name": "test-agent",
    "version": "1.0.0"
  },
  "spec": {
    "role": "chat",
    "llm": {
      "provider": "anthropic",
      "model": "claude-sonnet-4-5-20250929"
    },
    "tools": "not-an-array"  // ❌ Should be array
  }
}
```

**Output (Verbose)**:
```
1. Validation Error at /spec/tools

   Type mismatch:
      Expected: array
      Received: string

   💡 This field expects an array. Try:
      tools: ["not-an-array"]

   📖 Docs: https://openstandardagents.org/docs/tools
```

**Output (Compact)**:
```
  1. /spec/tools: expected array, got string
```

## Example 3: Missing Required Field

**Test File** (missing `apiVersion`):
```json
{
  "kind": "Agent",
  "metadata": {
    "name": "test-agent"
  },
  "spec": {
    "role": "chat",
    "llm": {
      "provider": "anthropic",
      "model": "claude-sonnet-4-5-20250929"
    }
  }
}
```

**Output (Verbose)**:
```
6. Validation Error at #/required

   Missing required field: apiVersion

   💡 Did you mean one of these?
      • apiversion
      • api_version
      • api-version
      • version

   Example:
      apiVersion: <value>
```

## Example 4: Provider-Specific Suggestions

**GPT Provider Typo**:
```json
{
  "llm": {
    "provider": "gpt"  // ❌ Invalid
  }
}
```

**Output**:
```
   Invalid value: "gpt"

   Expected one of:
      • openai
      • anthropic
      [...]

   💡 Did you mean "groq"?

   💡 GPT models use provider: openai
```

## Implementation

The error formatter is located in:
- **File**: `src/cli/utils/error-formatter.ts`
- **Used by**:
  - `src/cli/commands/validate.command.ts`
  - `src/cli/commands/run.command.ts`

### Key Functions

1. **`formatValidationErrors(errors, manifest?)`**: Detailed error formatting with suggestions
2. **`formatErrorCompact(error, index, manifest?)`**: Compact one-line errors
3. **`findClosestMatch(invalid, validValues)`**: Levenshtein-based typo detection
4. **`getValueAtPath(manifest, path)`**: Extract actual values from manifest

### Configuration

The formatter includes configuration for:
- **Common Typos**: Mapping of correct field names to common misspellings
- **Known Enums**: Valid values for provider, role, kind, etc.
- **Provider Models**: Provider-specific model suggestions
- **Documentation Links**: Links to relevant docs for each field

## Testing

Test the error formatter:

```bash
# Verbose mode (detailed errors with suggestions)
npm run ossa -- validate test-provider-error.json --verbose

# Compact mode (one-line errors)
npm run ossa -- validate test-provider-error.json

# Valid manifest (should pass)
npm run ossa -- validate test-valid.json
```

## Before & After

### Before (Plain AJV Errors)
```
✗ Validation failed

Errors:
  1. /spec/llm/provider: must be equal to one of the allowed values
     Params: {"allowedValues":["openai","anthropic",...]}
```

### After (Helpful Error Formatter)
```
✗ Validation Failed
Found 1 error(s):

1. Validation Error at /spec/llm/provider

   Invalid value: "claude"

   Expected one of:
      • openai
      • anthropic
      [...]

   💡 Claude models use provider: anthropic

   📖 Docs: https://openstandardagents.org/docs/llm-config#providers
```

## Future Enhancements

Possible future improvements:
- [ ] Context-aware suggestions (e.g., if model contains "gpt", suggest provider: openai)
- [ ] More provider-specific model validation
- [ ] Interactive fix suggestions ("Would you like me to fix this?")
- [ ] JSON/YAML syntax highlighting in error messages
- [ ] Show line numbers for YAML/JSON files
- [ ] Diff view for suggested fixes
