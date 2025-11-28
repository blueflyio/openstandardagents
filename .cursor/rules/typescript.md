# TypeScript Development Rules

## Type Safety
- Use strict TypeScript mode
- No `any` types (use `unknown` if needed)
- Proper type inference
- Interface over type aliases for objects

## Code Style
- Use async/await over promises
- Prefer const over let
- Use arrow functions for callbacks
- Destructure objects and arrays

## Imports
- Use ES modules (`import`/`export`)
- Group imports: external, internal, types
- Use type-only imports when appropriate: `import type { ... }`

## Error Handling
- Use try/catch for async operations
- Provide meaningful error messages
- Log errors appropriately
- Don't swallow errors

## Testing
- Mock external dependencies
- Test edge cases
- Use descriptive test names
- One assertion per test (when possible)

