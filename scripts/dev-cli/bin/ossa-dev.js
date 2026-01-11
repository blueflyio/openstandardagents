#!/usr/bin/env node

// OSSA Developer CLI Entry Point
// This file is generated from src/index.ts during build

import('../dist/index.js').catch(err => {
  console.error('Error loading OSSA Developer CLI:', err);
  process.exit(1);
});
