/**
 * User Agent — Consistent identification for all OSSA agent HTTP requests.
 *
 * Uses universal-user-agent for cross-runtime compatibility.
 */

import { getUserAgent } from 'universal-user-agent';

const BASE_USER_AGENT = getUserAgent();

/**
 * Get the OSSA user-agent string for HTTP requests.
 * Format: ossa-cli/{version} ({agentName}) {runtimeUA}
 */
export function getOssaUserAgent(agentName?: string): string {
  const version = process.env.npm_package_version || '0.5.1';
  const agent = agentName ? ` (${agentName})` : '';
  return `ossa-cli/${version}${agent} ${BASE_USER_AGENT}`;
}
