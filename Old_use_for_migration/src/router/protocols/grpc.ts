/**
 * gRPC Protocol Implementation
 * High-performance gRPC service for agent discovery with streaming
 */

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { BaseProtocol } from './base';
import { GRPCConfig, DiscoveryQuery, OSSAAgent } from '../types';
import { OSSARouter } from '../router';
import { join } from 'path';
import { writeFileSync, mkdirSync, existsSync } from 'fs';

export class GRPCProtocol extends BaseProtocol {
  private server?: grpc.Server;
  private config: GRPCConfig;
  private router: OSSARouter;
  private protoPath: string;
  private activeStreams = new Set<grpc.ServerWritableStream<any, any>>();

  constructor(config: GRPCConfig, router: OSSARouter) {
    super('gRPC', '1.0.0');
    this.config = config;
    this.router = router;
    this.protoPath = this.generateProtoFile();
  }

  async start(): Promise<void> {
    if (this.isRunning) return;

    try {
      // Load the protocol buffer definition
      const packageDefinition = protoLoader.loadSync(this.protoPath, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });

      const proto = grpc.loadPackageDefinition(packageDefinition) as any;

      this.server = new grpc.Server({
        'grpc.keepalive_time_ms': 30000,
        'grpc.keepalive_timeout_ms': 10000,
        'grpc.keepalive_permit_without_calls': true,
        'grpc.http2.max_pings_without_data': 0,
        'grpc.http2.min_time_between_pings_ms': 10000,
        'grpc.http2.min_ping_interval_without_data_ms': 300000,
      });

      // Add the discovery service
      this.server.addService(proto.ossa.discovery.DiscoveryService.service, {
        DiscoverAgents: this.discoverAgents.bind(this),
        StreamDiscovery: this.streamDiscovery.bind(this),
        GetAgent: this.getAgent.bind(this),
        RegisterAgent: this.registerAgent.bind(this),
        UpdateAgent: this.updateAgent.bind(this),
        RemoveAgent: this.removeAgent.bind(this),
        HealthCheck: this.healthCheck.bind(this),
        GetMetrics: this.getMetrics.bind(this),
        StreamEvents: this.streamEvents.bind(this),
      });

      // Start the server
      return new Promise((resolve, reject) => {
        this.server!.bindAsync(
          `0.0.0.0:${this.config.port}`,
          grpc.ServerCredentials.createInsecure(),
          (error, port) => {
            if (error) {
              reject(error);
              return;
            }

            this.server!.start();
            this.isRunning = true;
            console.log(`🔧 gRPC server listening on port ${port}`);
            resolve();
          }
        );
      });
    } catch (error) {
      throw new Error(`Failed to start gRPC server: ${(error as Error).message}`);
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning || !this.server) return;

    return new Promise((resolve) => {
      // Close all active streams
      this.activeStreams.forEach((stream) => {
        stream.end();
      });
      this.activeStreams.clear();

      this.server!.tryShutdown(() => {
        this.isRunning = false;
        console.log('🛑 gRPC server stopped');
        resolve();
      });
    });
  }

  getMetrics(): any {
    const baseMetrics = super.getMetrics();
    return {
      ...baseMetrics,
      activeStreams: this.activeStreams.size,
    };
  }

  // gRPC Service Implementations
  
  private async discoverAgents(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> {
    const startTime = performance.now();
    
    try {
      const query = this.convertGrpcDiscoveryQuery(call.request);
      const result = await this.router.discoverAgents(query);
      
      const grpcResult = this.convertToGrpcDiscoveryResult(result);
      
      const responseTime = performance.now() - startTime;
      this.recordRequest(responseTime);
      
      callback(null, grpcResult);
    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.recordRequest(responseTime, true);
      
      callback({
        code: grpc.status.INTERNAL,
        message: (error as Error).message,
      });
    }
  }

  private async streamDiscovery(
    call: grpc.ServerWritableStream<any, any>
  ): Promise<void> {
    this.activeStreams.add(call);
    
    call.on('cancelled', () => {
      this.activeStreams.delete(call);
    });

    try {
      const query = this.convertGrpcDiscoveryQuery(call.request);
      
      // For streaming, we can send incremental results
      const result = await this.router.discoverAgents(query);
      
      // Send agents in batches for streaming
      const batchSize = 10;
      for (let i = 0; i < result.agents.length; i += batchSize) {
        const batch = result.agents.slice(i, i + batchSize);
        const streamResponse = {
          agents: batch.map(agent => this.convertToGrpcAgent(agent)),
          totalFound: result.totalFound,
          discoveryTimeMs: result.discoveryTimeMs,
          isComplete: i + batchSize >= result.agents.length,
        };
        
        call.write(streamResponse);
        
        // Small delay between batches to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      call.end();
    } catch (error) {
      call.emit('error', {
        code: grpc.status.INTERNAL,
        message: (error as Error).message,
      });
    } finally {
      this.activeStreams.delete(call);
    }
  }

  private async getAgent(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> {
    const startTime = performance.now();
    
    try {
      const agent = await this.router.getAgent(call.request.agentId);
      
      const responseTime = performance.now() - startTime;
      this.recordRequest(responseTime);
      
      if (!agent) {
        callback({
          code: grpc.status.NOT_FOUND,
          message: 'Agent not found',
        });
        return;
      }

      const grpcAgent = this.convertToGrpcAgent(agent);
      callback(null, grpcAgent);
    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.recordRequest(responseTime, true);
      
      callback({
        code: grpc.status.INTERNAL,
        message: (error as Error).message,
      });
    }
  }

  private async registerAgent(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> {
    const startTime = performance.now();
    
    try {
      const agentData = this.convertFromGrpcAgent(call.request);
      const agentId = await this.router.registerAgent(agentData);
      const agent = await this.router.getAgent(agentId);
      
      const responseTime = performance.now() - startTime;
      this.recordRequest(responseTime);
      
      const grpcAgent = this.convertToGrpcAgent(agent!);
      callback(null, grpcAgent);
    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.recordRequest(responseTime, true);
      
      callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: (error as Error).message,
      });
    }
  }

  private async updateAgent(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> {
    const startTime = performance.now();
    
    try {
      const updates = call.request.updates;
      await this.router.updateAgent(call.request.agentId, updates);
      const agent = await this.router.getAgent(call.request.agentId);
      
      const responseTime = performance.now() - startTime;
      this.recordRequest(responseTime);
      
      if (!agent) {
        callback({
          code: grpc.status.NOT_FOUND,
          message: 'Agent not found',
        });
        return;
      }

      const grpcAgent = this.convertToGrpcAgent(agent);
      callback(null, grpcAgent);
    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.recordRequest(responseTime, true);
      
      callback({
        code: grpc.status.INTERNAL,
        message: (error as Error).message,
      });
    }
  }

  private async removeAgent(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> {
    const startTime = performance.now();
    
    try {
      await this.router.removeAgent(call.request.agentId);
      
      const responseTime = performance.now() - startTime;
      this.recordRequest(responseTime);
      
      callback(null, { success: true });
    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.recordRequest(responseTime, true);
      
      callback({
        code: grpc.status.NOT_FOUND,
        message: (error as Error).message,
      });
    }
  }

  private async healthCheck(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> {
    try {
      const health = await this.router.getHealth();
      callback(null, health);
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: (error as Error).message,
      });
    }
  }

  private async getMetrics(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> {
    try {
      const metrics = this.router.getMetrics();
      callback(null, metrics);
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: (error as Error).message,
      });
    }
  }

  private async streamEvents(
    call: grpc.ServerWritableStream<any, any>
  ): Promise<void> {
    this.activeStreams.add(call);
    
    call.on('cancelled', () => {
      this.activeStreams.delete(call);
    });

    try {
      // Listen to router events and stream them to client
      const eventHandler = (event: any) => {
        if (!call.destroyed) {
          call.write({
            type: event.type,
            timestamp: event.timestamp.toISOString(),
            agentId: event.agentId,
            data: JSON.stringify(event.data || {}),
          });
        }
      };

      // Subscribe to router events
      this.router.on('agent_registered', eventHandler);
      this.router.on('agent_updated', eventHandler);
      this.router.on('agent_removed', eventHandler);
      this.router.on('agent_health_changed', eventHandler);

      // Keep the stream alive until cancelled
      call.on('cancelled', () => {
        this.router.removeListener('agent_registered', eventHandler);
        this.router.removeListener('agent_updated', eventHandler);
        this.router.removeListener('agent_removed', eventHandler);
        this.router.removeListener('agent_health_changed', eventHandler);
        this.activeStreams.delete(call);
      });
    } catch (error) {
      call.emit('error', {
        code: grpc.status.INTERNAL,
        message: (error as Error).message,
      });
      this.activeStreams.delete(call);
    }
  }

  // Utility methods for data conversion

  private convertGrpcDiscoveryQuery(grpcQuery: any): DiscoveryQuery {
    return {
      capabilities: grpcQuery.capabilities || [],
      domains: grpcQuery.domains || [],
      protocols: grpcQuery.protocols || [],
      performanceTier: grpcQuery.performanceTier,
      conformanceTier: grpcQuery.conformanceTier,
      complianceFrameworks: grpcQuery.complianceFrameworks || [],
      healthStatus: grpcQuery.healthStatus,
      maxResults: grpcQuery.maxResults,
      includeInactive: grpcQuery.includeInactive,
      sortBy: grpcQuery.sortBy,
      sortOrder: grpcQuery.sortOrder,
    };
  }

  private convertToGrpcDiscoveryResult(result: any): any {
    return {
      agents: result.agents.map((agent: OSSAAgent) => this.convertToGrpcAgent(agent)),
      discoveryTimeMs: result.discoveryTimeMs,
      totalFound: result.totalFound,
      query: result.query,
      ranking: result.ranking,
      cache: result.cache,
    };
  }

  private convertToGrpcAgent(agent: OSSAAgent): any {
    return {
      id: agent.id,
      name: agent.name,
      version: agent.version,
      endpoint: agent.endpoint,
      status: agent.status.toUpperCase(),
      lastSeen: agent.lastSeen.toISOString(),
      registrationTime: agent.registrationTime.toISOString(),
      metadata: {
        class: agent.metadata.class.toUpperCase(),
        category: agent.metadata.category.toUpperCase(),
        conformanceTier: agent.metadata.conformanceTier.toUpperCase(),
        certificationLevel: agent.metadata.certificationLevel?.toUpperCase(),
      },
      capabilities: {
        primary: agent.capabilities.primary,
        secondary: agent.capabilities.secondary || [],
        domains: agent.capabilities.domains,
      },
      protocols: agent.protocols.map(protocol => ({
        name: protocol.name.toUpperCase(),
        version: protocol.version,
        required: protocol.required,
        endpoints: JSON.stringify(protocol.endpoints || {}),
        features: protocol.features || [],
      })),
      endpoints: {
        health: agent.endpoints.health,
        capabilities: agent.endpoints.capabilities || '',
        api: agent.endpoints.api,
        metrics: agent.endpoints.metrics || '',
        openapi: agent.endpoints.openapi || '',
      },
      performance: {
        avgResponseTimeMs: agent.performance.avgResponseTimeMs,
        uptimePercentage: agent.performance.uptimePercentage,
        requestsHandled: agent.performance.requestsHandled,
        successRate: agent.performance.successRate,
        throughputRps: agent.performance.throughputRps,
      },
      compliance: agent.compliance ? {
        frameworks: agent.compliance.frameworks,
        certifications: agent.compliance.certifications || [],
        auditDate: agent.compliance.auditDate?.toISOString() || '',
      } : null,
    };
  }

  private convertFromGrpcAgent(grpcAgent: any): Omit<OSSAAgent, 'id' | 'registrationTime' | 'lastSeen'> {
    return {
      name: grpcAgent.name,
      version: grpcAgent.version,
      endpoint: grpcAgent.endpoint,
      status: grpcAgent.status.toLowerCase() as any,
      metadata: {
        class: grpcAgent.metadata.class.toLowerCase() as any,
        category: grpcAgent.metadata.category.toLowerCase() as any,
        conformanceTier: grpcAgent.metadata.conformanceTier.toLowerCase() as any,
        certificationLevel: grpcAgent.metadata.certificationLevel?.toLowerCase() as any,
      },
      capabilities: {
        primary: grpcAgent.capabilities.primary,
        secondary: grpcAgent.capabilities.secondary,
        domains: grpcAgent.capabilities.domains,
      },
      protocols: grpcAgent.protocols.map((protocol: any) => ({
        name: protocol.name.toLowerCase() as any,
        version: protocol.version,
        required: protocol.required,
        endpoints: protocol.endpoints ? JSON.parse(protocol.endpoints) : {},
        features: protocol.features,
      })),
      endpoints: grpcAgent.endpoints,
      performance: grpcAgent.performance,
      compliance: grpcAgent.compliance ? {
        frameworks: grpcAgent.compliance.frameworks,
        certifications: grpcAgent.compliance.certifications,
        auditDate: grpcAgent.compliance.auditDate ? new Date(grpcAgent.compliance.auditDate) : undefined,
      } : undefined,
    };
  }

  private generateProtoFile(): string {
    const protoContent = `
syntax = "proto3";

package ossa.discovery;

service DiscoveryService {
  rpc DiscoverAgents(DiscoveryQuery) returns (DiscoveryResult);
  rpc StreamDiscovery(DiscoveryQuery) returns (stream StreamDiscoveryResult);
  rpc GetAgent(GetAgentRequest) returns (Agent);
  rpc RegisterAgent(Agent) returns (Agent);
  rpc UpdateAgent(UpdateAgentRequest) returns (Agent);
  rpc RemoveAgent(RemoveAgentRequest) returns (RemoveAgentResponse);
  rpc HealthCheck(HealthCheckRequest) returns (HealthCheckResponse);
  rpc GetMetrics(MetricsRequest) returns (MetricsResponse);
  rpc StreamEvents(StreamEventsRequest) returns (stream EventMessage);
}

message DiscoveryQuery {
  repeated string capabilities = 1;
  repeated string domains = 2;
  repeated string protocols = 3;
  string performanceTier = 4;
  string conformanceTier = 5;
  repeated string complianceFrameworks = 6;
  string healthStatus = 7;
  int32 maxResults = 8;
  bool includeInactive = 9;
  string sortBy = 10;
  string sortOrder = 11;
}

message DiscoveryResult {
  repeated Agent agents = 1;
  double discoveryTimeMs = 2;
  int32 totalFound = 3;
  DiscoveryQuery query = 4;
  RankingInfo ranking = 5;
  CacheInfo cache = 6;
}

message StreamDiscoveryResult {
  repeated Agent agents = 1;
  int32 totalFound = 2;
  double discoveryTimeMs = 3;
  bool isComplete = 4;
}

message Agent {
  string id = 1;
  string name = 2;
  string version = 3;
  string endpoint = 4;
  string status = 5;
  string lastSeen = 6;
  string registrationTime = 7;
  AgentMetadata metadata = 8;
  AgentCapabilities capabilities = 9;
  repeated ProtocolSupport protocols = 10;
  AgentEndpoints endpoints = 11;
  PerformanceMetrics performance = 12;
  ComplianceInfo compliance = 13;
}

message AgentMetadata {
  string class = 1;
  string category = 2;
  string conformanceTier = 3;
  string certificationLevel = 4;
}

message AgentCapabilities {
  repeated string primary = 1;
  repeated string secondary = 2;
  repeated string domains = 3;
}

message ProtocolSupport {
  string name = 1;
  string version = 2;
  bool required = 3;
  string endpoints = 4; // JSON string
  repeated string features = 5;
}

message AgentEndpoints {
  string health = 1;
  string capabilities = 2;
  string api = 3;
  string metrics = 4;
  string openapi = 5;
}

message PerformanceMetrics {
  double avgResponseTimeMs = 1;
  double uptimePercentage = 2;
  int32 requestsHandled = 3;
  double successRate = 4;
  double throughputRps = 5;
}

message ComplianceInfo {
  repeated string frameworks = 1;
  repeated string certifications = 2;
  string auditDate = 3;
}

message RankingInfo {
  bool enabled = 1;
  string algorithm = 2;
  repeated string factors = 3;
}

message CacheInfo {
  bool hit = 1;
  int32 ttl = 2;
}

message GetAgentRequest {
  string agentId = 1;
}

message UpdateAgentRequest {
  string agentId = 1;
  Agent updates = 2;
}

message RemoveAgentRequest {
  string agentId = 1;
}

message RemoveAgentResponse {
  bool success = 1;
}

message HealthCheckRequest {}

message HealthCheckResponse {
  string status = 1;
  double uptime = 2;
  string version = 3;
  string services = 4; // JSON string
  string performance = 5; // JSON string
}

message MetricsRequest {}

message MetricsResponse {
  string timestamp = 1;
  int32 totalQueries = 2;
  double avgResponseTime = 3;
  double p95ResponseTime = 4;
  double p99ResponseTime = 5;
  double cacheHitRate = 6;
  int32 activeConnections = 7;
  double memoryUsage = 8;
  double cpuUsage = 9;
  double uptime = 10;
  repeated string protocols = 11;
}

message StreamEventsRequest {
  repeated string agentIds = 1;
}

message EventMessage {
  string type = 1;
  string timestamp = 2;
  string agentId = 3;
  string data = 4; // JSON string
}
`;

    // Write proto file to a temporary location
    const protoDir = join(__dirname, '../../../tmp/proto');
    if (!existsSync(protoDir)) {
      mkdirSync(protoDir, { recursive: true });
    }
    
    const protoPath = join(protoDir, 'discovery.proto');
    writeFileSync(protoPath, protoContent);
    
    return protoPath;
  }
}