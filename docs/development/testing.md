# Testing Guide - openapi-ai-agents-standard

## Test Framework

Jest and Playwright for comprehensive testing

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- --testNamePattern="specific test"
```

## Test Coverage Requirements

- Unit Tests: 80% minimum
- Integration Tests: 85% minimum
- Critical Paths: 90% minimum

## Writing Tests

Guidelines for writing effective tests:
- Test behavior, not implementation
- Use descriptive test names
- Include setup and teardown
- Test both success and failure cases
- Mock external dependencies
