/**
 * OSSA HTTP Client — wraps fetch with proxy support and standard user-agent.
 *
 * Two usage patterns:
 * 1. Direct: `import { ossaFetch } from './http-client.js'` — explicit proxy+UA fetch
 * 2. Global: `import { installGlobalFetch } from './http-client.js'` — patches globalThis.fetch
 *    so ALL existing fetch() calls automatically get proxy + UA. Call once at startup.
 */

import { getProxyAgent } from './proxy-resolver.js';
import { getOssaUserAgent } from './user-agent.js';

export interface OssaFetchOptions extends RequestInit {
  agentName?: string;
}

/**
 * Proxy-aware fetch with standard OSSA user-agent header.
 * Drop-in replacement for fetch() — same API, adds proxy + UA automatically.
 */
export async function ossaFetch(
  url: string | URL,
  options: OssaFetchOptions = {},
): Promise<Response> {
  const { agentName, ...fetchOpts } = options;

  const headers = new Headers(fetchOpts.headers);
  if (!headers.has('user-agent')) {
    headers.set('user-agent', getOssaUserAgent(agentName));
  }

  const dispatcher = getProxyAgent();

  return fetch(url, {
    ...fetchOpts,
    headers,
    ...(dispatcher ? { dispatcher } : {}),
  } as RequestInit);
}

let installed = false;

/**
 * Patch globalThis.fetch so ALL fetch() calls in the process get proxy + UA.
 * Call once at CLI entry point. Safe to call multiple times (idempotent).
 */
export function installGlobalFetch(): void {
  if (installed) return;
  installed = true;

  const originalFetch = globalThis.fetch;

  globalThis.fetch = async function patchedFetch(
    input: string | URL | Request,
    init?: RequestInit,
  ): Promise<Response> {
    const headers = new Headers(init?.headers);
    if (!headers.has('user-agent')) {
      headers.set('user-agent', getOssaUserAgent());
    }

    const dispatcher = getProxyAgent();

    return originalFetch(input, {
      ...init,
      headers,
      ...(dispatcher ? { dispatcher } : {}),
    } as RequestInit);
  } as typeof fetch;
}
