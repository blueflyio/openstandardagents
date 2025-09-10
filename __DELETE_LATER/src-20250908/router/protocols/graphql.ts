/**
 * GraphQL Protocol Implementation
 * High-performance GraphQL API for agent discovery with subscriptions
 */

import { ApolloServer, BaseContext } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { Server as HttpServer } from 'http';
import { BaseProtocol } from './base';
import { GraphQLConfig, DiscoveryQuery, OSSAAgent } from '../types';
import { OSSARouter } from '../router';

export class GraphQLProtocol extends BaseProtocol {
  private server?: ApolloServer;
  private config: GraphQLConfig;
  private router: OSSARouter;
  private httpServer?: HttpServer;
  private wsServer?: WebSocketServer;

  constructor(config: GraphQLConfig, router: OSSARouter) {
    super('GraphQL', '1.0.0');
    this.config = config;
    this.router = router;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;

    try {
      const schema = makeExecutableSchema({
        typeDefs: this.getTypeDefs(),
        resolvers: this.getResolvers(),
      });

      this.server = new ApolloServer({
        schema,
        plugins: [
          // Performance monitoring plugin
          {
            requestDidStart() {
              return {
                willSendResponse(requestContext) {
                  const responseTime = Date.now() - requestContext.request.http?.startTime!;
                  // Record metrics would be called here
                },
              };
            },
          },
        ],
        introspection: this.config.introspection,
        formatError: (error) => {
          console.error('GraphQL Error:', error);
          return {
            message: error.message,
            code: error.extensions?.code || 'INTERNAL_ERROR',
            path: error.path,
          };
        },
      });

      await this.server.start();
      this.isRunning = true;

      console.log(`🚀 GraphQL server started at ${this.config.endpoint}`);
      
    } catch (error) {
      throw new Error(`Failed to start GraphQL server: ${(error as Error).message}`);
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    try {
      if (this.wsServer) {
        this.wsServer.close();
      }

      if (this.server) {
        await this.server.stop();
      }

      this.isRunning = false;
      console.log('🛑 GraphQL server stopped');
      
    } catch (error) {
      console.error('Error stopping GraphQL server:', error);
    }
  }

  getExpressMiddleware() {
    if (!this.server) {
      throw new Error('GraphQL server not started');
    }

    return expressMiddleware(this.server, {
      context: async ({ req }) => ({
        startTime: Date.now(),
        user: req.headers.authorization, // Simple auth context
      }),
    });
  }

  setupWebSocketServer(httpServer: HttpServer): void {
    if (!this.config.subscriptions) return;

    this.httpServer = httpServer;
    this.wsServer = new WebSocketServer({
      server: httpServer,
      path: this.config.endpoint,
    });

    const schema = makeExecutableSchema({
      typeDefs: this.getTypeDefs(),
      resolvers: this.getResolvers(),
    });

    useServer(
      {
        schema,
        context: () => ({
          router: this.router,
        }),
        onConnect: () => {
          console.log('GraphQL WebSocket client connected');
        },
        onDisconnect: () => {
          console.log('GraphQL WebSocket client disconnected');
        },
      },
      this.wsServer
    );
  }

  private getTypeDefs(): string {
    return `
      # Scalar types
      scalar DateTime
      scalar JSON

      # Core types
      type Agent {
        id: ID!
        name: String!
        version: String!
        endpoint: String!
        status: AgentStatus!
        lastSeen: DateTime!
        registrationTime: DateTime!
        metadata: AgentMetadata!
        capabilities: AgentCapabilities!
        protocols: [ProtocolSupport!]!
        endpoints: AgentEndpoints!
        performance: PerformanceMetrics!
        compliance: ComplianceInfo
      }

      type AgentMetadata {
        class: AgentClass!
        category: AgentCategory!
        conformanceTier: ConformanceTier!
        certificationLevel: CertificationLevel
      }

      type AgentCapabilities {
        primary: [String!]!
        secondary: [String!]
        domains: [String!]!
      }

      type ProtocolSupport {
        name: ProtocolType!
        version: String!
        required: Boolean!
        endpoints: JSON
        features: [String!]
      }

      type AgentEndpoints {
        health: String!
        capabilities: String
        api: String!
        metrics: String
        openapi: String
      }

      type PerformanceMetrics {
        avgResponseTimeMs: Float!
        uptimePercentage: Float!
        requestsHandled: Int!
        successRate: Float!
        throughputRps: Float!
      }

      type ComplianceInfo {
        frameworks: [String!]!
        certifications: [String!]
        auditDate: DateTime
      }

      # Discovery types
      input DiscoveryInput {
        capabilities: [String!]
        domains: [String!]
        protocols: [ProtocolType!]
        performanceTier: CertificationLevel
        conformanceTier: ConformanceTier
        complianceFrameworks: [String!]
        healthStatus: AgentStatus
        maxResults: Int
        includeInactive: Boolean
        sortBy: SortField
        sortOrder: SortOrder
      }

      type DiscoveryResult {
        agents: [Agent!]!
        discoveryTimeMs: Float!
        totalFound: Int!
        query: DiscoveryQuery!
        ranking: RankingInfo!
        cache: CacheInfo!
      }

      type DiscoveryQuery {
        capabilities: [String!]
        domains: [String!]
        protocols: [ProtocolType!]
        performanceTier: CertificationLevel
        conformanceTier: ConformanceTier
        complianceFrameworks: [String!]
        healthStatus: AgentStatus
        maxResults: Int
        includeInactive: Boolean
        sortBy: SortField
        sortOrder: SortOrder
      }

      type RankingInfo {
        enabled: Boolean!
        algorithm: String!
        factors: [String!]!
      }

      type CacheInfo {
        hit: Boolean!
        ttl: Int
      }

      # Registry types
      input AgentRegistrationInput {
        name: String!
        version: String!
        endpoint: String!
        metadata: AgentMetadataInput!
        capabilities: AgentCapabilitiesInput!
        protocols: [ProtocolSupportInput!]!
        endpoints: AgentEndpointsInput!
        compliance: ComplianceInfoInput
      }

      input AgentMetadataInput {
        class: AgentClass!
        category: AgentCategory!
        conformanceTier: ConformanceTier!
        certificationLevel: CertificationLevel
      }

      input AgentCapabilitiesInput {
        primary: [String!]!
        secondary: [String!]
        domains: [String!]!
      }

      input ProtocolSupportInput {
        name: ProtocolType!
        version: String!
        required: Boolean!
        endpoints: JSON
        features: [String!]
      }

      input AgentEndpointsInput {
        health: String!
        capabilities: String
        api: String!
        metrics: String
        openapi: String
      }

      input ComplianceInfoInput {
        frameworks: [String!]!
        certifications: [String!]
        auditDate: DateTime
      }

      input AgentUpdateInput {
        version: String
        endpoint: String
        metadata: AgentMetadataInput
        capabilities: AgentCapabilitiesInput
        protocols: [ProtocolSupportInput!]
        endpoints: AgentEndpointsInput
        compliance: ComplianceInfoInput
      }

      # Health and metrics
      type Health {
        status: HealthStatus!
        uptime: Float!
        version: String!
        services: JSON!
        performance: HealthPerformance!
      }

      type HealthPerformance {
        avgResponseTime: Float!
        p95ResponseTime: Float!
        cacheHitRate: Float!
      }

      type RouterMetrics {
        timestamp: DateTime!
        totalQueries: Int!
        avgResponseTime: Float!
        p95ResponseTime: Float!
        p99ResponseTime: Float!
        cacheHitRate: Float!
        activeConnections: Int!
        memoryUsage: Float!
        cpuUsage: Float!
        uptime: Float!
        protocols: [String!]!
      }

      # Event types for subscriptions
      type AgentEvent {
        type: EventType!
        timestamp: DateTime!
        agentId: String!
        agent: Agent
        data: JSON
      }

      type DiscoveryEvent {
        type: String!
        timestamp: DateTime!
        query: DiscoveryQuery!
        result: DiscoveryResult!
      }

      # Enums
      enum AgentStatus {
        HEALTHY
        DEGRADED
        UNHEALTHY
      }

      enum AgentClass {
        GENERAL
        SPECIALIST
        WORKFLOW
        INTEGRATION
      }

      enum AgentCategory {
        ASSISTANT
        TOOL
        SERVICE
        COORDINATOR
      }

      enum ConformanceTier {
        CORE
        GOVERNED
        ADVANCED
      }

      enum CertificationLevel {
        BRONZE
        SILVER
        GOLD
        PLATINUM
      }

      enum ProtocolType {
        REST
        GRAPHQL
        GRPC
        WEBSOCKET
        MCP
      }

      enum SortField {
        NAME
        PERFORMANCE
        CAPABILITY_MATCH
        LAST_SEEN
      }

      enum SortOrder {
        ASC
        DESC
      }

      enum HealthStatus {
        HEALTHY
        DEGRADED
        UNHEALTHY
      }

      enum EventType {
        AGENT_REGISTERED
        AGENT_UPDATED
        AGENT_REMOVED
        HEALTH_CHANGED
      }

      # Root types
      type Query {
        # Agent discovery
        discoverAgents(query: DiscoveryInput!): DiscoveryResult!
        
        # Agent management
        agent(id: ID!): Agent
        agents(
          limit: Int = 20
          offset: Int = 0
          class: AgentClass
          tier: ConformanceTier
        ): AgentConnection!
        
        # Health and metrics
        health: Health!
        metrics: RouterMetrics!
        
        # Capability exploration
        availableCapabilities: [String!]!
        availableDomains: [String!]!
        availableProtocols: [ProtocolType!]!
      }

      type Mutation {
        # Agent registration
        registerAgent(input: AgentRegistrationInput!): Agent!
        updateAgent(id: ID!, input: AgentUpdateInput!): Agent!
        removeAgent(id: ID!): Boolean!
        
        # Health checks
        healthCheckAgent(id: ID!): Agent!
        healthCheckAll: [Agent!]!
      }

      type Subscription {
        # Agent events
        agentEvents(agentIds: [ID!]): AgentEvent!
        allAgentEvents: AgentEvent!
        
        # Discovery events
        discoveryEvents: DiscoveryEvent!
        
        # Health monitoring
        healthUpdates: AgentEvent!
        
        # Performance monitoring
        performanceUpdates: RouterMetrics!
      }

      # Pagination
      type AgentConnection {
        agents: [Agent!]!
        total: Int!
        limit: Int!
        offset: Int!
        hasMore: Boolean!
      }
    `;
  }

  private getResolvers(): any {
    return {
      Query: {
        discoverAgents: async (_: any, { query }: { query: DiscoveryQuery }) => {
          const startTime = performance.now();
          
          try {
            const result = await this.router.discoverAgents(query);
            const responseTime = performance.now() - startTime;
            this.recordRequest(responseTime);
            
            return result;
          } catch (error) {
            const responseTime = performance.now() - startTime;
            this.recordRequest(responseTime, true);
            throw error;
          }
        },

        agent: async (_: any, { id }: { id: string }) => {
          const startTime = performance.now();
          
          try {
            const agent = await this.router.getAgent(id);
            const responseTime = performance.now() - startTime;
            this.recordRequest(responseTime);
            
            return agent;
          } catch (error) {
            const responseTime = performance.now() - startTime;
            this.recordRequest(responseTime, true);
            throw error;
          }
        },

        agents: async (_: any, { limit, offset, class: agentClass, tier }) => {
          const startTime = performance.now();
          
          try {
            const query: DiscoveryQuery = {
              maxResults: Math.min(limit || 20, 100),
              includeInactive: true,
              conformanceTier: tier,
            };

            // Add class filter if provided (would need to be handled in discovery engine)
            const result = await this.router.discoverAgents(query);
            const responseTime = performance.now() - startTime;
            this.recordRequest(responseTime);

            const agents = result.agents.slice(offset || 0, (offset || 0) + (limit || 20));
            
            return {
              agents,
              total: result.totalFound,
              limit: limit || 20,
              offset: offset || 0,
              hasMore: (offset || 0) + agents.length < result.totalFound,
            };
          } catch (error) {
            const responseTime = performance.now() - startTime;
            this.recordRequest(responseTime, true);
            throw error;
          }
        },

        health: async () => {
          return await this.router.getHealth();
        },

        metrics: async () => {
          return this.router.getMetrics();
        },

        availableCapabilities: async () => {
          // This would need to be implemented in the discovery engine
          // Return unique capabilities from all registered agents
          const result = await this.router.discoverAgents({ includeInactive: true });
          const capabilities = new Set<string>();
          
          result.agents.forEach(agent => {
            agent.capabilities.primary.forEach(cap => capabilities.add(cap));
            agent.capabilities.secondary?.forEach(cap => capabilities.add(cap));
          });
          
          return Array.from(capabilities).sort();
        },

        availableDomains: async () => {
          const result = await this.router.discoverAgents({ includeInactive: true });
          const domains = new Set<string>();
          
          result.agents.forEach(agent => {
            agent.capabilities.domains.forEach(domain => domains.add(domain));
          });
          
          return Array.from(domains).sort();
        },

        availableProtocols: () => {
          return ['REST', 'GRAPHQL', 'GRPC', 'WEBSOCKET', 'MCP'];
        },
      },

      Mutation: {
        registerAgent: async (_: any, { input }) => {
          const startTime = performance.now();
          
          try {
            const agentData = {
              ...input,
              status: 'healthy' as const,
              performance: {
                avgResponseTimeMs: 0,
                uptimePercentage: 100,
                requestsHandled: 0,
                successRate: 1.0,
                throughputRps: 0,
              },
            };

            const agentId = await this.router.registerAgent(agentData);
            const agent = await this.router.getAgent(agentId);
            
            const responseTime = performance.now() - startTime;
            this.recordRequest(responseTime);
            
            return agent;
          } catch (error) {
            const responseTime = performance.now() - startTime;
            this.recordRequest(responseTime, true);
            throw error;
          }
        },

        updateAgent: async (_: any, { id, input }) => {
          const startTime = performance.now();
          
          try {
            await this.router.updateAgent(id, input);
            const agent = await this.router.getAgent(id);
            
            const responseTime = performance.now() - startTime;
            this.recordRequest(responseTime);
            
            return agent;
          } catch (error) {
            const responseTime = performance.now() - startTime;
            this.recordRequest(responseTime, true);
            throw error;
          }
        },

        removeAgent: async (_: any, { id }) => {
          const startTime = performance.now();
          
          try {
            await this.router.removeAgent(id);
            const responseTime = performance.now() - startTime;
            this.recordRequest(responseTime);
            
            return true;
          } catch (error) {
            const responseTime = performance.now() - startTime;
            this.recordRequest(responseTime, true);
            throw error;
          }
        },

        healthCheckAgent: async (_: any, { id }) => {
          // This would trigger a health check and return updated agent
          const agent = await this.router.getAgent(id);
          // Trigger health check logic here
          return agent;
        },

        healthCheckAll: async () => {
          // Trigger health check for all agents
          const result = await this.router.discoverAgents({ includeInactive: true });
          return result.agents;
        },
      },

      Subscription: {
        agentEvents: {
          subscribe: () => {
            // Return an async iterator for agent events
            // This would be connected to the router's event system
            return {
              [Symbol.asyncIterator]() {
                return this;
              },
              async next() {
                // Implementation would listen to router events
                return { done: false, value: null };
              }
            };
          },
        },

        allAgentEvents: {
          subscribe: () => {
            // Similar to above but for all agent events
            return {
              [Symbol.asyncIterator]() {
                return this;
              },
              async next() {
                return { done: false, value: null };
              }
            };
          },
        },

        discoveryEvents: {
          subscribe: () => {
            return {
              [Symbol.asyncIterator]() {
                return this;
              },
              async next() {
                return { done: false, value: null };
              }
            };
          },
        },

        healthUpdates: {
          subscribe: () => {
            return {
              [Symbol.asyncIterator]() {
                return this;
              },
              async next() {
                return { done: false, value: null };
              }
            };
          },
        },

        performanceUpdates: {
          subscribe: () => {
            return {
              [Symbol.asyncIterator]() {
                return this;
              },
              async next() {
                return { done: false, value: null };
              }
            };
          },
        },
      },

      // Custom scalar resolvers
      DateTime: {
        serialize: (value: Date) => value.toISOString(),
        parseValue: (value: string) => new Date(value),
        parseLiteral: (ast: any) => new Date(ast.value),
      },

      JSON: {
        serialize: (value: any) => value,
        parseValue: (value: any) => value,
        parseLiteral: (ast: any) => JSON.parse(ast.value),
      },
    };
  }
}