/**
 * Proxy Resolver — Auto-detect and configure HTTP proxies for all agent HTTP clients.
 *
 * Uses proxy-agent to support HTTP, HTTPS, SOCKS4/5, and PAC proxies.
 * Respects HTTP_PROXY, HTTPS_PROXY, NO_PROXY environment variables.
 *
 * Usage:
 *   import { getProxyAgent } from './proxy-resolver';
 *   const agent = getProxyAgent();
 *   fetch(url, { agent });
 */

import { ProxyAgent } from 'proxy-agent';
import type { Agent } from 'http';

let cachedAgent: Agent | undefined;

/**
 * Get a proxy-aware HTTP agent. Auto-detects from env vars:
 * - HTTP_PROXY / http_proxy
 * - HTTPS_PROXY / https_proxy
 * - NO_PROXY / no_proxy
 * - ALL_PROXY / all_proxy
 *
 * Returns undefined if no proxy is configured (direct connection).
 */
export function getProxyAgent(): Agent | undefined {
  const proxyUrl =
    process.env.HTTP_PROXY ||
    process.env.http_proxy ||
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.ALL_PROXY ||
    process.env.all_proxy;

  if (!proxyUrl) return undefined;

  if (!cachedAgent) {
    cachedAgent = new ProxyAgent() as unknown as Agent;
  }
  return cachedAgent;
}

/**
 * Check if a proxy is configured in the environment.
 */
export function isProxyConfigured(): boolean {
  return !!(
    process.env.HTTP_PROXY ||
    process.env.http_proxy ||
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.ALL_PROXY ||
    process.env.all_proxy
  );
}

/**
 * Get proxy configuration summary for diagnostics/logging.
 */
export function getProxyInfo(): {
  configured: boolean;
  httpProxy?: string;
  httpsProxy?: string;
  noProxy?: string;
} {
  return {
    configured: isProxyConfigured(),
    httpProxy: process.env.HTTP_PROXY || process.env.http_proxy,
    httpsProxy: process.env.HTTPS_PROXY || process.env.https_proxy,
    noProxy: process.env.NO_PROXY || process.env.no_proxy,
  };
}
