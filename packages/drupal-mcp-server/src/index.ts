#!/usr/bin/env node

/**
 * Drupal MCP Server Entry Point
 * Production-grade MCP server for Drupal operations
 */

import * as dotenv from 'dotenv';
import { DrupalMCPServer } from './server.js';
import { AuthConfig } from './types/drupal.js';

// Load environment variables
dotenv.config();

// Get configuration from environment
const authConfig: AuthConfig = {
  type: (process.env.DRUPAL_AUTH_TYPE || 'oauth2') as 'oauth2' | 'api-key' | 'jwt',
  baseUrl: process.env.DRUPAL_BASE_URL || '',
  credentials: {
    clientId: process.env.DRUPAL_CLIENT_ID,
    clientSecret: process.env.DRUPAL_CLIENT_SECRET,
    apiKey: process.env.DRUPAL_API_KEY,
    token: process.env.DRUPAL_JWT_TOKEN,
    username: process.env.DRUPAL_USERNAME,
    password: process.env.DRUPAL_PASSWORD,
  },
};

// Validate configuration
if (!authConfig.baseUrl) {
  console.error('Error: DRUPAL_BASE_URL environment variable is required');
  process.exit(1);
}

if (authConfig.type === 'oauth2') {
  if (!authConfig.credentials.clientId || !authConfig.credentials.clientSecret) {
    console.error('Error: OAuth2 requires DRUPAL_CLIENT_ID and DRUPAL_CLIENT_SECRET');
    process.exit(1);
  }
} else if (authConfig.type === 'api-key') {
  if (!authConfig.credentials.apiKey) {
    console.error('Error: API Key auth requires DRUPAL_API_KEY');
    process.exit(1);
  }
} else if (authConfig.type === 'jwt') {
  if (!authConfig.credentials.token) {
    console.error('Error: JWT auth requires DRUPAL_JWT_TOKEN');
    process.exit(1);
  }
}

// Start the server
const server = new DrupalMCPServer(authConfig);
server.start().catch((error) => {
  console.error('Failed to start Drupal MCP server:', error);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('Shutting down Drupal MCP server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Shutting down Drupal MCP server...');
  process.exit(0);
});
