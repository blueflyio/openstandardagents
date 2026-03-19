import type {
  UadpManifest, OssaSkill, OssaAgent, PaginatedResponse,
  FederationResponse, ValidationResult, ListParams, Peer
} from './types.js';

export interface UadpClientOptions {
  /** Custom fetch implementation (defaults to global fetch) */
  fetch?: typeof fetch;
  /** Request timeout in ms (default: 10000) */
  timeout?: number;
  /** Custom headers to include in all requests */
  headers?: Record<string, string>;
}

export class UadpClient {
  private manifest: UadpManifest | null = null;
  private fetchFn: typeof fetch;
  private timeout: number;
  private headers: Record<string, string>;

  constructor(
    /** Base URL of the UADP node (e.g., "https://marketplace.example.com") */
    public readonly baseUrl: string,
    options: UadpClientOptions = {},
  ) {
    this.fetchFn = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.timeout = options.timeout ?? 10000;
    this.headers = options.headers ?? {};
  }

  /** Discover the node by fetching /.well-known/uadp.json */
  async discover(): Promise<UadpManifest> {
    const url = new URL('/.well-known/uadp.json', this.baseUrl);
    const res = await this.request(url.toString());
    this.manifest = res as UadpManifest;
    return this.manifest;
  }

  /** Get the cached manifest, or discover if not yet fetched */
  async getManifest(): Promise<UadpManifest> {
    if (!this.manifest) await this.discover();
    return this.manifest!;
  }

  /** List skills from the node */
  async listSkills(params?: ListParams): Promise<PaginatedResponse<OssaSkill>> {
    const manifest = await this.getManifest();
    if (!manifest.endpoints.skills) throw new Error('Node does not expose a skills endpoint');
    const url = this.buildUrl(manifest.endpoints.skills, params);
    return this.request(url) as Promise<PaginatedResponse<OssaSkill>>;
  }

  /** List agents from the node */
  async listAgents(params?: ListParams): Promise<PaginatedResponse<OssaAgent>> {
    const manifest = await this.getManifest();
    if (!manifest.endpoints.agents) throw new Error('Node does not expose an agents endpoint');
    const url = this.buildUrl(manifest.endpoints.agents, params);
    return this.request(url) as Promise<PaginatedResponse<OssaAgent>>;
  }

  /** Get federation peers */
  async getFederation(): Promise<FederationResponse> {
    const manifest = await this.getManifest();
    if (!manifest.endpoints.federation) throw new Error('Node does not expose a federation endpoint');
    return this.request(manifest.endpoints.federation) as Promise<FederationResponse>;
  }

  /** Register as a federation peer */
  async registerAsPeer(myUrl: string, myName: string): Promise<{ success: boolean; peer?: Peer }> {
    const manifest = await this.getManifest();
    if (!manifest.endpoints.federation) throw new Error('Node does not expose a federation endpoint');
    return this.request(manifest.endpoints.federation, {
      method: 'POST',
      body: JSON.stringify({ url: myUrl, name: myName }),
    }) as Promise<{ success: boolean; peer?: Peer }>;
  }

  /** Validate a manifest against the node's validation service */
  async validate(manifest: string): Promise<ValidationResult> {
    const nodeManifest = await this.getManifest();
    if (!nodeManifest.endpoints.validate) throw new Error('Node does not expose a validation endpoint');
    return this.request(nodeManifest.endpoints.validate, {
      method: 'POST',
      body: JSON.stringify({ manifest }),
    }) as Promise<ValidationResult>;
  }

  private buildUrl(base: string, params?: ListParams): string {
    const url = new URL(base);
    if (params?.search) url.searchParams.set('search', params.search);
    if (params?.category) url.searchParams.set('category', params.category);
    if (params?.trust_tier) url.searchParams.set('trust_tier', params.trust_tier);
    if (params?.page) url.searchParams.set('page', String(params.page));
    if (params?.limit) url.searchParams.set('limit', String(params.limit));
    return url.toString();
  }

  private async request(url: string, init?: RequestInit): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      const res = await this.fetchFn(url, {
        ...init,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...this.headers,
          ...init?.headers,
        },
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new UadpError(`HTTP ${res.status}: ${body}`, res.status);
      }
      return res.json();
    } finally {
      clearTimeout(timer);
    }
  }
}

export class UadpError extends Error {
  constructor(message: string, public readonly statusCode?: number) {
    super(message);
    this.name = 'UadpError';
  }
}
