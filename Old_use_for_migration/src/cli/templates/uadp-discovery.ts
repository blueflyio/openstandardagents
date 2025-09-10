/**
 * OSSA v0.1.8 - Universal Agent Discovery Protocol (UADP) Implementation
 * Provides standardized agent discovery and registration capabilities
 */

import { EventEmitter } from 'events';
import * as dgram from 'dgram';
import * as crypto from 'crypto';
import * as os from 'os';

interface OSSAAgentMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  capabilities: {
    primary: Array<{ id: string; name: string; description: string }>;
    secondary?: Array<{ id: string; name: string; description: string }>;
  };
  interfaces: {
    api: {
      base_url: string;
      openapi?: string;
    };
    protocols: Array<{
      type: string;
      version: string;
      endpoint?: string;
    }>;
  };
  discovery: {
    uadp: {
      enabled: boolean;
      registry?: string;
      heartbeat_interval: number;
    };
  };
}

interface UADPMessage {
  version: string;
  message_type: 'announce' | 'query' | 'response' | 'heartbeat' | 'goodbye';
  agent_id: string;
  timestamp: number;
  signature?: string;
  payload: any;
}

interface DiscoveredAgent {
  metadata: OSSAAgentMetadata;
  last_seen: number;
  network_info: {
    ip: string;
    port: number;
    hostname?: string;
  };
  health_status: 'healthy' | 'degraded' | 'unknown';
}

export class UADPDiscoveryService extends EventEmitter {
  private agent_metadata: OSSAAgentMetadata;
  private multicast_socket?: dgram.Socket;
  private registry_client?: any;
  private discovered_agents: Map<string, DiscoveredAgent> = new Map();
  private heartbeat_interval?: NodeJS.Timeout;
  private cleanup_interval?: NodeJS.Timeout;
  
  // UADP Configuration
  private readonly UADP_VERSION = '1.0.0';
  private readonly MULTICAST_GROUP = '239.255.255.250';
  private readonly MULTICAST_PORT = 1900;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly AGENT_TTL = 90000; // 90 seconds
  
  constructor(agent_metadata: OSSAAgentMetadata) {
    super();
    this.agent_metadata = agent_metadata;
    
    if (!agent_metadata.discovery?.uadp?.enabled) {
      throw new Error('UADP discovery not enabled in agent configuration');
    }
  }
  
  /**
   * Start UADP discovery service
   */
  async start(): Promise<void> {
    try {
      // Initialize multicast discovery
      if (this.agent_metadata.discovery.uadp.enabled) {
        await this.initializeMulticastDiscovery();
      }
      
      // Initialize registry client
      if (this.agent_metadata.discovery.uadp.registry) {
        await this.initializeRegistryClient();
      }
      
      // Start heartbeat
      this.startHeartbeat();
      
      // Start cleanup process
      this.startCleanup();
      
      // Announce presence
      await this.announcePresence();
      
      console.log(`UADP Discovery Service started for agent: ${this.agent_metadata.id}`);
      this.emit('started');
      
    } catch (error) {
      console.error('Failed to start UADP discovery service:', error);
      throw error;
    }
  }
  
  /**
   * Stop UADP discovery service
   */
  async stop(): Promise<void> {
    try {
      // Send goodbye message
      await this.sendGoodbye();
      
      // Stop intervals
      if (this.heartbeat_interval) {
        clearInterval(this.heartbeat_interval);
      }
      
      if (this.cleanup_interval) {
        clearInterval(this.cleanup_interval);
      }
      
      // Close multicast socket
      if (this.multicast_socket) {
        this.multicast_socket.close();
      }
      
      // Unregister from registry
      if (this.registry_client) {
        await this.unregisterFromRegistry();
      }
      
      console.log(`UADP Discovery Service stopped for agent: ${this.agent_metadata.id}`);
      this.emit('stopped');
      
    } catch (error) {
      console.error('Error stopping UADP discovery service:', error);
    }
  }
  
  /**
   * Initialize multicast discovery
   */
  private async initializeMulticastDiscovery(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.multicast_socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
      
      this.multicast_socket.on('message', (buffer, remote_info) => {
        this.handleMulticastMessage(buffer, remote_info);
      });
      
      this.multicast_socket.on('error', (error) => {
        console.error('Multicast socket error:', error);
        reject(error);
      });
      
      this.multicast_socket.bind(this.MULTICAST_PORT, () => {
        this.multicast_socket!.addMembership(this.MULTICAST_GROUP);
        this.multicast_socket!.setMulticastTTL(255);
        console.log(`Joined multicast group ${this.MULTICAST_GROUP}:${this.MULTICAST_PORT}`);
        resolve();
      });
    });
  }
  
  /**
   * Initialize registry client
   */
  private async initializeRegistryClient(): Promise<void> {
    const registry_url = this.agent_metadata.discovery.uadp.registry;
    if (!registry_url) return;
    
    // Implementation would depend on registry API
    // This is a placeholder for registry client initialization
    console.log(`Initialized registry client for: ${registry_url}`);
  }
  
  /**
   * Handle incoming multicast messages
   */
  private handleMulticastMessage(buffer: Buffer, remote_info: dgram.RemoteInfo): void {
    try {
      const message: UADPMessage = JSON.parse(buffer.toString());
      
      // Validate message format
      if (!this.isValidUADPMessage(message)) {
        return;
      }
      
      // Ignore our own messages
      if (message.agent_id === this.agent_metadata.id) {
        return;
      }
      
      // Process message based on type
      switch (message.message_type) {
        case 'announce':
          this.handleAgentAnnouncement(message, remote_info);
          break;
        
        case 'query':
          this.handleDiscoveryQuery(message, remote_info);
          break;
        
        case 'response':
          this.handleDiscoveryResponse(message, remote_info);
          break;
        
        case 'heartbeat':
          this.handleHeartbeat(message, remote_info);
          break;
        
        case 'goodbye':
          this.handleGoodbye(message);
          break;
      }
      
    } catch (error) {
      console.error('Error processing multicast message:', error);
    }
  }
  
  /**
   * Validate UADP message format
   */
  private isValidUADPMessage(message: any): boolean {
    return (
      message.version &&
      message.message_type &&
      message.agent_id &&
      typeof message.timestamp === 'number' &&
      message.payload !== undefined
    );
  }
  
  /**
   * Handle agent announcement
   */
  private handleAgentAnnouncement(message: UADPMessage, remote_info: dgram.RemoteInfo): void {
    const agent_metadata = message.payload as OSSAAgentMetadata;
    
    const discovered_agent: DiscoveredAgent = {
      metadata: agent_metadata,
      last_seen: Date.now(),
      network_info: {
        ip: remote_info.address,
        port: remote_info.port,
        hostname: os.hostname()
      },
      health_status: 'unknown'
    };
    
    this.discovered_agents.set(message.agent_id, discovered_agent);
    
    console.log(`Discovered agent: ${agent_metadata.name} (${message.agent_id})`);
    this.emit('agent_discovered', discovered_agent);
  }
  
  /**
   * Handle discovery query
   */
  private handleDiscoveryQuery(message: UADPMessage, remote_info: dgram.RemoteInfo): void {
    const query = message.payload;
    
    // Check if we match the query criteria
    if (this.matchesQuery(query)) {
      // Send response
      this.sendDiscoveryResponse(remote_info.address, remote_info.port);
    }
  }
  
  /**
   * Handle discovery response
   */
  private handleDiscoveryResponse(message: UADPMessage, remote_info: dgram.RemoteInfo): void {
    this.handleAgentAnnouncement(message, remote_info);
  }
  
  /**
   * Handle heartbeat
   */
  private handleHeartbeat(message: UADPMessage, remote_info: dgram.RemoteInfo): void {
    const existing_agent = this.discovered_agents.get(message.agent_id);
    
    if (existing_agent) {
      existing_agent.last_seen = Date.now();
      existing_agent.health_status = message.payload.health_status || 'healthy';
    }
  }
  
  /**
   * Handle goodbye message
   */
  private handleGoodbye(message: UADPMessage): void {
    const removed_agent = this.discovered_agents.get(message.agent_id);
    
    if (removed_agent) {
      this.discovered_agents.delete(message.agent_id);
      console.log(`Agent left: ${removed_agent.metadata.name} (${message.agent_id})`);
      this.emit('agent_left', removed_agent);
    }
  }
  
  /**
   * Check if agent matches query criteria
   */
  private matchesQuery(query: any): boolean {
    // Simple capability-based matching
    if (query.capabilities) {
      const required_capabilities = Array.isArray(query.capabilities) 
        ? query.capabilities 
        : [query.capabilities];
      
      const our_capabilities = this.agent_metadata.capabilities.primary.map(c => c.id);
      
      return required_capabilities.every(cap => our_capabilities.includes(cap));
    }
    
    return true; // Match all if no specific criteria
  }
  
  /**
   * Announce agent presence
   */
  private async announcePresence(): Promise<void> {
    const message: UADPMessage = {
      version: this.UADP_VERSION,
      message_type: 'announce',
      agent_id: this.agent_metadata.id,
      timestamp: Date.now(),
      payload: this.agent_metadata
    };
    
    await this.sendMulticastMessage(message);
  }
  
  /**
   * Send discovery response
   */
  private async sendDiscoveryResponse(target_ip: string, target_port: number): Promise<void> {
    const message: UADPMessage = {
      version: this.UADP_VERSION,
      message_type: 'response',
      agent_id: this.agent_metadata.id,
      timestamp: Date.now(),
      payload: this.agent_metadata
    };
    
    await this.sendUnicastMessage(message, target_ip, target_port);
  }
  
  /**
   * Send heartbeat
   */
  private async sendHeartbeat(): Promise<void> {
    const message: UADPMessage = {
      version: this.UADP_VERSION,
      message_type: 'heartbeat',
      agent_id: this.agent_metadata.id,
      timestamp: Date.now(),
      payload: {
        health_status: 'healthy',
        uptime: process.uptime(),
        memory_usage: process.memoryUsage()
      }
    };
    
    await this.sendMulticastMessage(message);
  }
  
  /**
   * Send goodbye message
   */
  private async sendGoodbye(): Promise<void> {
    const message: UADPMessage = {
      version: this.UADP_VERSION,
      message_type: 'goodbye',
      agent_id: this.agent_metadata.id,
      timestamp: Date.now(),
      payload: {}
    };
    
    await this.sendMulticastMessage(message);
  }
  
  /**
   * Send multicast message
   */
  private async sendMulticastMessage(message: UADPMessage): Promise<void> {
    if (!this.multicast_socket) return;
    
    const buffer = Buffer.from(JSON.stringify(message));
    
    return new Promise((resolve, reject) => {
      this.multicast_socket!.send(
        buffer, 
        0, 
        buffer.length, 
        this.MULTICAST_PORT, 
        this.MULTICAST_GROUP,
        (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        }
      );
    });
  }
  
  /**
   * Send unicast message
   */
  private async sendUnicastMessage(message: UADPMessage, target_ip: string, target_port: number): Promise<void> {
    if (!this.multicast_socket) return;
    
    const buffer = Buffer.from(JSON.stringify(message));
    
    return new Promise((resolve, reject) => {
      this.multicast_socket!.send(
        buffer, 
        0, 
        buffer.length, 
        target_port, 
        target_ip,
        (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        }
      );
    });
  }
  
  /**
   * Start heartbeat interval
   */
  private startHeartbeat(): void {
    const interval = this.agent_metadata.discovery.uadp.heartbeat_interval || this.HEARTBEAT_INTERVAL;
    
    this.heartbeat_interval = setInterval(async () => {
      try {
        await this.sendHeartbeat();
      } catch (error) {
        console.error('Error sending heartbeat:', error);
      }
    }, interval);
  }
  
  /**
   * Start cleanup process for stale agents
   */
  private startCleanup(): void {
    this.cleanup_interval = setInterval(() => {
      const now = Date.now();
      const stale_agents: string[] = [];
      
      for (const [agent_id, agent] of this.discovered_agents.entries()) {
        if (now - agent.last_seen > this.AGENT_TTL) {
          stale_agents.push(agent_id);
        }
      }
      
      stale_agents.forEach(agent_id => {
        const removed_agent = this.discovered_agents.get(agent_id);
        this.discovered_agents.delete(agent_id);
        
        if (removed_agent) {
          console.log(`Removed stale agent: ${removed_agent.metadata.name} (${agent_id})`);
          this.emit('agent_timeout', removed_agent);
        }
      });
    }, this.AGENT_TTL / 2);
  }
  
  /**
   * Query for agents with specific capabilities
   */
  async queryAgents(capabilities?: string[]): Promise<DiscoveredAgent[]> {
    const query = {
      capabilities: capabilities,
      timestamp: Date.now()
    };
    
    const message: UADPMessage = {
      version: this.UADP_VERSION,
      message_type: 'query',
      agent_id: this.agent_metadata.id,
      timestamp: Date.now(),
      payload: query
    };
    
    await this.sendMulticastMessage(message);
    
    // Return currently known agents that match
    const matching_agents = Array.from(this.discovered_agents.values());
    
    if (capabilities) {
      return matching_agents.filter(agent => 
        capabilities.every(cap => 
          agent.metadata.capabilities.primary.some(c => c.id === cap)
        )
      );
    }
    
    return matching_agents;
  }
  
  /**
   * Get all discovered agents
   */
  getDiscoveredAgents(): DiscoveredAgent[] {
    return Array.from(this.discovered_agents.values());
  }
  
  /**
   * Get specific agent by ID
   */
  getAgent(agent_id: string): DiscoveredAgent | undefined {
    return this.discovered_agents.get(agent_id);
  }
  
  /**
   * Register with central registry
   */
  private async registerWithRegistry(): Promise<void> {
    // Implementation would depend on registry API
    console.log('Registered with central registry');
  }
  
  /**
   * Unregister from central registry
   */
  private async unregisterFromRegistry(): Promise<void> {
    // Implementation would depend on registry API
    console.log('Unregistered from central registry');
  }
}

/**
 * Factory function to create UADP discovery service
 */
export function createUADPDiscoveryService(agent_metadata: OSSAAgentMetadata): UADPDiscoveryService {
  return new UADPDiscoveryService(agent_metadata);
}

export default UADPDiscoveryService;