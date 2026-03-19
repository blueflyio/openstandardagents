#!/usr/bin/env node

const port = process.env.PORT || '3000';
const url = `http://127.0.0.1:${port}/health`;

try {
  const response = await fetch(url);
  if (response.ok) {
    console.log('Health check passed');
    process.exit(0);
  }

  console.error(`Health check failed with status ${response.status}`);
  process.exit(1);
} catch (error) {
  console.error(`Health check failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
