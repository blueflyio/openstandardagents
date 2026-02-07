/**
 * Agent Discovery Providers
 * Integrations with external service discovery systems
 *
 * Supports:
 * - DNS-based discovery (agents.internal)
 * - Consul/etcd integration
 * - Kubernetes Service Discovery
 * - Service mesh integration (Istio/Linkerd)
 */

import { AgentCard } from './types.js';
import { AgentRegistry } from './discovery.js';
import { getApiVersion } from '../utils/version.js';

/**
 * Discovery Provider Interface
 * Abstract interface for different discovery mechanisms
 */
export interface DiscoveryProvider {
  /**
   * Name of the provider
   */
  readonly name: string;

  /**
   * Initialize the provider
   */
  initialize(): Promise<void>;

  /**
   * Discover agents
   */
  discover(query?: DiscoveryQuery): Promise<AgentCard[]>;

  /**
   * Register agent with this provider
   */
  register(agent: AgentCard): Promise<void>;

  /**
   * Unregister agent from this provider
   */
  unregister(agentUri: string): Promise<void>;

  /**
   * Health check
   */
  healthCheck(): Promise<boolean>;

  /**
   * Close provider
   */
  close(): Promise<void>;
}

/**
 * Discovery Query
 */
export interface DiscoveryQuery {
  capability?: string;
  namespace?: string;
  region?: string;
  tags?: string[];
  healthyOnly?: boolean;
}

/**
 * DNS-based Discovery Provider
 * Uses DNS SRV records for agent discovery (agents.internal domain)
 */
export class DNSDiscoveryProvider implements DiscoveryProvider {
  readonly name = 'dns';
  private domain: string;
  private resolver?: typeof import('dns').promises;

  constructor(config: { domain?: string } = {}) {
    this.domain = config.domain || 'agents.internal';
  }

  async initialize(): Promise<void> {
    // Dynamically import Node.js dns module
    const dns = await import('dns');
    this.resolver = dns.promises;
  }

  async discover(query?: DiscoveryQuery): Promise<AgentCard[]> {
    if (!this.resolver) {
      throw new Error('DNS provider not initialized');
    }

    const agents: AgentCard[] = [];

    try {
      // Build DNS query based on parameters
      const dnsName = this.buildDnsQuery(query);

      // Query DNS SRV records
      const records = await this.resolver.resolveSrv(dnsName);

      // Query TXT records for agent metadata
      for (const record of records) {
        try {
          const txtRecords = await this.resolver.resolveTxt(record.name);
          const agent = this.parseAgentFromTxt(record, txtRecords);
          if (agent && this.matchesQuery(agent, query)) {
            agents.push(agent);
          }
        } catch (error) {
          console.warn(`Failed to resolve TXT for ${record.name}:`, error);
        }
      }
    } catch (error) {
      console.warn(`DNS discovery failed:`, error);
    }

    return agents;
  }

  async register(agent: AgentCard): Promise<void> {
    // DNS registration is typically handled by infrastructure (external-dns, etc.)
    // This would integrate with your DNS management system
    console.log(`DNS registration for ${agent.uri} should be handled by infrastructure`);
  }

  async unregister(agentUri: string): Promise<void> {
    console.log(`DNS unregistration for ${agentUri} should be handled by infrastructure`);
  }

  async healthCheck(): Promise<boolean> {
    if (!this.resolver) return false;

    try {
      await this.resolver.resolve4('google.com');
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    // No cleanup needed
  }

  private buildDnsQuery(query?: DiscoveryQuery): string {
    if (!query) {
      return `_agents._tcp.${this.domain}`;
    }

    // Build hierarchical DNS query: _capability._namespace._tcp.agents.internal
    const parts = ['_agents'];

    if (query.capability) {
      parts.unshift(`_${query.capability}`);
    }
    if (query.namespace) {
      parts.unshift(`_${query.namespace}`);
    }

    return `${parts.join('.')}._tcp.${this.domain}`;
  }

  private parseAgentFromTxt(
    srv: { name: string; port: number; priority: number; weight: number },
    txtRecords: string[][]
  ): AgentCard | null {
    try {
      // Combine TXT records
      const metadata = txtRecords.flat().join('');
      const data = JSON.parse(metadata);

      return {
        uri: data.uri,
        name: data.name,
        version: data.version,
        ossaVersion: data.ossaVersion,
        capabilities: data.capabilities || [],
        endpoints: {
          http: `http://${srv.name}:${srv.port}`,
        },
        transport: ['http'],
        authentication: data.authentication || ['bearer'],
        encryption: data.encryption || { tlsRequired: true, minTlsVersion: '1.3' as const },
        status: 'healthy',
        metadata: data.metadata,
      };
    } catch (error) {
      console.warn('Failed to parse agent TXT record:', error);
      return null;
    }
  }

  private matchesQuery(agent: AgentCard, query?: DiscoveryQuery): boolean {
    if (!query) return true;

    if (query.capability && !agent.capabilities.includes(query.capability)) {
      return false;
    }

    if (query.namespace && agent.metadata?.team !== query.namespace) {
      return false;
    }

    if (query.region && agent.metadata?.region !== query.region) {
      return false;
    }

    if (query.healthyOnly && agent.status !== 'healthy') {
      return false;
    }

    return true;
  }
}

/**
 * Consul Discovery Provider
 * Integrates with HashiCorp Consul for service discovery
 */
export class ConsulDiscoveryProvider implements DiscoveryProvider {
  readonly name = 'consul';
  private consulUrl: string;
  private datacenter: string;

  constructor(config: { url?: string; datacenter?: string } = {}) {
    this.consulUrl = config.url || 'http://localhost:8500';
    this.datacenter = config.datacenter || 'dc1';
  }

  async initialize(): Promise<void> {
    // Verify Consul is accessible
    const healthy = await this.healthCheck();
    if (!healthy) {
      throw new Error('Consul is not accessible');
    }
  }

  async discover(query?: DiscoveryQuery): Promise<AgentCard[]> {
    try {
      // Query Consul catalog for services tagged with 'ossa-agent'
      const response = await fetch(
        `${this.consulUrl}/v1/catalog/services?tag=ossa-agent&dc=${this.datacenter}`
      );

      if (!response.ok) {
        throw new Error(`Consul query failed: ${response.statusText}`);
      }

      const services = await response.json() as Record<string, string[]>;
      const agents: AgentCard[] = [];

      // Fetch details for each service
      for (const [serviceName, tags] of Object.entries(services)) {
        const serviceAgents = await this.getServiceDetails(serviceName, query);
        agents.push(...serviceAgents);
      }

      return agents;
    } catch (error) {
      console.warn('Consul discovery failed:', error);
      return [];
    }
  }

  async register(agent: AgentCard): Promise<void> {
    try {
      const service = this.agentToConsulService(agent);

      const response = await fetch(
        `${this.consulUrl}/v1/agent/service/register`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(service),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to register agent: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to register agent with Consul:', error);
      throw error;
    }
  }

  async unregister(agentUri: string): Promise<void> {
    try {
      const serviceId = this.uriToServiceId(agentUri);

      const response = await fetch(
        `${this.consulUrl}/v1/agent/service/deregister/${serviceId}`,
        { method: 'PUT' }
      );

      if (!response.ok) {
        throw new Error(`Failed to unregister agent: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to unregister agent from Consul:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.consulUrl}/v1/status/leader`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    // No cleanup needed
  }

  private async getServiceDetails(
    serviceName: string,
    query?: DiscoveryQuery
  ): Promise<AgentCard[]> {
    try {
      const response = await fetch(
        `${this.consulUrl}/v1/health/service/${serviceName}?passing=true&dc=${this.datacenter}`
      );

      if (!response.ok) {
        return [];
      }

      const instances = await response.json() as Array<{
        Service: {
          ID: string;
          Service: string;
          Address: string;
          Port: number;
          Tags: string[];
          Meta: Record<string, string>;
        };
      }>;

      return instances
        .map(instance => this.consulServiceToAgent(instance.Service))
        .filter(agent => this.matchesQuery(agent, query));
    } catch (error) {
      console.warn(`Failed to get details for service ${serviceName}:`, error);
      return [];
    }
  }

  private consulServiceToAgent(service: {
    ID: string;
    Service: string;
    Address: string;
    Port: number;
    Tags: string[];
    Meta: Record<string, string>;
  }): AgentCard {
    return {
      uri: service.Meta.uri || `agent://consul/${service.ID}`,
      name: service.Service,
      version: service.Meta.version || '1.0.0',
      ossaVersion: service.Meta.ossaVersion || getApiVersion(),
      capabilities: service.Meta.capabilities?.split(',') || [],
      endpoints: {
        http: `http://${service.Address}:${service.Port}`,
      },
      transport: ['http'],
      authentication: ['bearer'],
      encryption: { tlsRequired: true, minTlsVersion: '1.3' as const },
      status: 'healthy',
      metadata: service.Meta,
    };
  }

  private agentToConsulService(agent: AgentCard) {
    const httpEndpoint = agent.endpoints.http || '';
    const url = new URL(httpEndpoint);

    return {
      ID: agent.uri.replace(/[^\w-]/g, '-'),
      Name: agent.name,
      Address: url.hostname,
      Port: parseInt(url.port) || 80,
      Tags: ['ossa-agent', ...agent.capabilities],
      Meta: {
        uri: agent.uri,
        version: agent.version,
        ossaVersion: agent.ossaVersion,
        capabilities: agent.capabilities.join(','),
        ...agent.metadata,
      },
      Check: {
        HTTP: `${httpEndpoint}/health`,
        Interval: '30s',
        Timeout: '5s',
      },
    };
  }

  private uriToServiceId(uri: string): string {
    return uri.replace(/[^\w-]/g, '-');
  }

  private matchesQuery(agent: AgentCard, query?: DiscoveryQuery): boolean {
    if (!query) return true;

    if (query.capability && !agent.capabilities.includes(query.capability)) {
      return false;
    }

    if (query.namespace && agent.metadata?.team !== query.namespace) {
      return false;
    }

    if (query.healthyOnly && agent.status !== 'healthy') {
      return false;
    }

    return true;
  }
}

/**
 * Kubernetes Discovery Provider
 * Uses Kubernetes API for service discovery
 */
export class KubernetesDiscoveryProvider implements DiscoveryProvider {
  readonly name = 'kubernetes';
  private apiServer: string;
  private namespace: string;
  private token?: string;

  constructor(config: {
    apiServer?: string;
    namespace?: string;
    token?: string;
  } = {}) {
    this.apiServer = config.apiServer || 'https://kubernetes.default.svc';
    this.namespace = config.namespace || 'default';
    this.token = config.token || process.env.KUBERNETES_SERVICE_TOKEN;
  }

  async initialize(): Promise<void> {
    // If no token provided, try to read from service account
    if (!this.token) {
      try {
        const fs = await import('fs');
        this.token = fs.readFileSync(
          '/var/run/secrets/kubernetes.io/serviceaccount/token',
          'utf8'
        );
      } catch {
        console.warn('No Kubernetes token available');
      }
    }
  }

  async discover(query?: DiscoveryQuery): Promise<AgentCard[]> {
    if (!this.token) {
      console.warn('Kubernetes discovery requires authentication token');
      return [];
    }

    try {
      // Query for services with ossa-agent label
      const response = await fetch(
        `${this.apiServer}/api/v1/namespaces/${this.namespace}/services?labelSelector=app.kubernetes.io/component=ossa-agent`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Kubernetes API error: ${response.statusText}`);
      }

      const data = await response.json() as {
        items: Array<{
          metadata: { name: string; labels: Record<string, string>; annotations: Record<string, string> };
          spec: { clusterIP: string; ports: Array<{ port: number; name: string }> };
        }>;
      };

      return data.items
        .map(svc => this.k8sServiceToAgent(svc))
        .filter(agent => this.matchesQuery(agent, query));
    } catch (error) {
      console.warn('Kubernetes discovery failed:', error);
      return [];
    }
  }

  async register(agent: AgentCard): Promise<void> {
    console.log('Kubernetes registration is handled by K8s Service/Deployment manifests');
  }

  async unregister(agentUri: string): Promise<void> {
    console.log('Kubernetes unregistration is handled by K8s Service/Deployment deletion');
  }

  async healthCheck(): Promise<boolean> {
    if (!this.token) return false;

    try {
      const response = await fetch(`${this.apiServer}/healthz`, {
        headers: { 'Authorization': `Bearer ${this.token}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    // No cleanup needed
  }

  private k8sServiceToAgent(service: {
    metadata: { name: string; labels: Record<string, string>; annotations: Record<string, string> };
    spec: { clusterIP: string; ports: Array<{ port: number; name: string }> };
  }): AgentCard {
    const annotations = service.metadata.annotations || {};
    const labels = service.metadata.labels || {};

    return {
      uri: annotations['ossa.io/agent-uri'] || `agent://k8s/${service.metadata.name}`,
      name: service.metadata.name,
      version: labels['app.kubernetes.io/version'] || '1.0.0',
      ossaVersion: annotations['ossa.io/version'] || getApiVersion(),
      capabilities: (annotations['ossa.io/capabilities'] || '').split(',').filter(Boolean),
      endpoints: {
        http: `http://${service.spec.clusterIP}:${service.spec.ports[0]?.port || 80}`,
      },
      transport: ['http'],
      authentication: ['bearer'],
      encryption: { tlsRequired: true, minTlsVersion: '1.3' as const },
      status: 'healthy',
      metadata: {
        namespace: this.namespace,
        ...labels,
      },
    };
  }

  private matchesQuery(agent: AgentCard, query?: DiscoveryQuery): boolean {
    if (!query) return true;

    if (query.capability && !agent.capabilities.includes(query.capability)) {
      return false;
    }

    if (query.healthyOnly && agent.status !== 'healthy') {
      return false;
    }

    return true;
  }
}

/**
 * Service Mesh Discovery Provider
 * Integrates with Istio/Linkerd service mesh for agent discovery
 */
export class ServiceMeshDiscoveryProvider implements DiscoveryProvider {
  readonly name: string;
  private meshType: 'istio' | 'linkerd';
  private k8sProvider: KubernetesDiscoveryProvider;

  constructor(config: {
    meshType: 'istio' | 'linkerd';
    apiServer?: string;
    namespace?: string;
  }) {
    this.meshType = config.meshType;
    this.name = `service-mesh-${config.meshType}`;
    this.k8sProvider = new KubernetesDiscoveryProvider({
      apiServer: config.apiServer,
      namespace: config.namespace,
    });
  }

  async initialize(): Promise<void> {
    await this.k8sProvider.initialize();
  }

  async discover(query?: DiscoveryQuery): Promise<AgentCard[]> {
    // Service mesh discovery leverages Kubernetes discovery
    // with additional mesh-specific metadata
    const agents = await this.k8sProvider.discover(query);

    // Enhance agents with mesh-specific information
    return agents.map(agent => ({
      ...agent,
      metadata: {
        ...agent.metadata,
        serviceMesh: this.meshType,
        mtlsEnabled: true,
      },
    }));
  }

  async register(agent: AgentCard): Promise<void> {
    await this.k8sProvider.register(agent);
  }

  async unregister(agentUri: string): Promise<void> {
    await this.k8sProvider.unregister(agentUri);
  }

  async healthCheck(): Promise<boolean> {
    return await this.k8sProvider.healthCheck();
  }

  async close(): Promise<void> {
    await this.k8sProvider.close();
  }
}

/**
 * Multi-Provider Discovery Registry
 * Aggregates multiple discovery providers
 */
export class MultiProviderRegistry implements AgentRegistry {
  private providers: DiscoveryProvider[] = [];
  private primaryProvider: DiscoveryProvider;

  constructor(primaryProvider: DiscoveryProvider, additionalProviders: DiscoveryProvider[] = []) {
    this.primaryProvider = primaryProvider;
    this.providers = [primaryProvider, ...additionalProviders];
  }

  async initialize(): Promise<void> {
    await Promise.all(this.providers.map(p => p.initialize()));
  }

  async register(agentCard: AgentCard, ttl?: number): Promise<void> {
    // Register with primary provider
    await this.primaryProvider.register(agentCard);
  }

  async unregister(agentUri: string): Promise<void> {
    await this.primaryProvider.unregister(agentUri);
  }

  async heartbeat(agentUri: string): Promise<void> {
    // Heartbeat not applicable for external providers
  }

  async findByCapability(capability: string): Promise<AgentCard[]> {
    // Query all providers and merge results
    const results = await Promise.all(
      this.providers.map(p => p.discover({ capability, healthyOnly: true }))
    );

    // Deduplicate by URI
    const agentMap = new Map<string, AgentCard>();
    for (const agents of results) {
      for (const agent of agents) {
        agentMap.set(agent.uri, agent);
      }
    }

    return Array.from(agentMap.values());
  }

  async findByUri(uri: string): Promise<AgentCard | null> {
    // Try each provider until we find the agent
    for (const provider of this.providers) {
      const agents = await provider.discover();
      const agent = agents.find(a => a.uri === uri);
      if (agent) return agent;
    }
    return null;
  }

  async listAll(): Promise<AgentCard[]> {
    const results = await Promise.all(
      this.providers.map(p => p.discover())
    );

    const agentMap = new Map<string, AgentCard>();
    for (const agents of results) {
      for (const agent of agents) {
        agentMap.set(agent.uri, agent);
      }
    }

    return Array.from(agentMap.values());
  }

  async findHealthy(): Promise<AgentCard[]> {
    const results = await Promise.all(
      this.providers.map(p => p.discover({ healthyOnly: true }))
    );

    const agentMap = new Map<string, AgentCard>();
    for (const agents of results) {
      for (const agent of agents) {
        agentMap.set(agent.uri, agent);
      }
    }

    return Array.from(agentMap.values());
  }
}
