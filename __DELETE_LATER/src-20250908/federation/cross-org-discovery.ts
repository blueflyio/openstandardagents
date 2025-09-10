/**
 * OSSA 0.1.9 Phase 2: Cross-Organization Discovery System
 * Implements federated agent discovery and capability advertisement
 */

export interface FederatedAgent {
  id: string;
  name: string;
  organization: string;
  capabilities: string[];
  trustScore: number;
  endpoint: string;
  certification: 'bronze' | 'silver' | 'gold';
  lastSeen: Date;
}

export interface CapabilityAdvertisement {
  agentId: string;
  capabilities: string[];
  metadata: Record<string, any>;
  ttl: number;
  signature: string;
}

export interface TrustMetrics {
  reputation: number;
  uptime: number;
  responseTime: number;
  successRate: number;
  communityRating: number;
}

export class CrossOrgDiscoveryAgent {
  private discoveredAgents: Map<string, FederatedAgent> = new Map();
  private advertisements: Map<string, CapabilityAdvertisement> = new Map();
  private trustScores: Map<string, TrustMetrics> = new Map();

  constructor(
    private organizationId: string,
    private federationEndpoint: string
  ) {}

  /**
   * Advertise agent capabilities across federation
   */
  async advertiseCapabilities(agent: FederatedAgent): Promise<AdvertisementResult> {
    const advertisement: CapabilityAdvertisement = {
      agentId: agent.id,
      capabilities: agent.capabilities,
      metadata: {
        endpoint: agent.endpoint,
        certification: agent.certification,
        organization: this.organizationId
      },
      ttl: 3600, // 1 hour
      signature: await this.signAdvertisement(agent)
    };

    this.advertisements.set(agent.id, advertisement);
    
    // Broadcast to federation network
    await this.broadcastAdvertisement(advertisement);
    
    return {
      success: true,
      agentId: agent.id,
      advertisementId: `${this.organizationId}:${agent.id}`,
      expiresAt: new Date(Date.now() + advertisement.ttl * 1000)
    };
  }

  /**
   * Discover agents across federated organizations
   */
  async discoverAgents(capability: string): Promise<FederatedAgent[]> {
    // Search local cache first
    const localMatches = Array.from(this.discoveredAgents.values())
      .filter(agent => agent.capabilities.includes(capability))
      .filter(agent => this.isAgentHealthy(agent));

    // Query federation network for additional matches
    const federatedMatches = await this.queryFederationNetwork(capability);
    
    // Merge and deduplicate results
    const allMatches = [...localMatches, ...federatedMatches];
    const uniqueMatches = this.deduplicateAgents(allMatches);
    
    // Sort by trust score and capability match quality
    return uniqueMatches.sort((a, b) => {
      const scoreA = this.calculateCapabilityMatchScore(a, capability);
      const scoreB = this.calculateCapabilityMatchScore(b, capability);
      return scoreB - scoreA;
    });
  }

  /**
   * Establish trust relationship with another organization
   */
  async establishTrust(organization: string): Promise<TrustScore> {
    const existingTrust = await this.getTrustScore(organization);
    
    if (existingTrust) {
      return existingTrust;
    }

    // Initiate trust handshake
    const handshakeResult = await this.initiateTriistHandshake(organization);
    
    if (handshakeResult.success) {
      const initialTrust: TrustScore = {
        organization,
        score: 0.5, // Neutral starting point
        factors: {
          reputation: 0.5,
          certification: handshakeResult.certification || 'bronze',
          uptime: 1.0,
          successRate: 1.0
        },
        establishedAt: new Date(),
        lastUpdated: new Date()
      };

      await this.storeTrustScore(initialTrust);
      return initialTrust;
    }

    throw new Error(`Failed to establish trust with organization: ${organization}`);
  }

  /**
   * Update trust score based on interaction history
   */
  async updateTrustScore(
    organizationId: string, 
    metrics: Partial<TrustMetrics>
  ): Promise<void> {
    const currentTrust = await this.getTrustScore(organizationId);
    
    if (currentTrust) {
      // Apply weighted update based on interaction history
      const updatedScore = this.calculateUpdatedTrustScore(currentTrust, metrics);
      await this.storeTrustScore({
        ...currentTrust,
        score: updatedScore,
        lastUpdated: new Date()
      });
    }
  }

  private async signAdvertisement(agent: FederatedAgent): Promise<string> {
    // Cryptographic signature for advertisement integrity
    const payload = JSON.stringify({
      agentId: agent.id,
      capabilities: agent.capabilities,
      timestamp: Date.now()
    });
    
    // In production, use actual cryptographic signing
    return Buffer.from(payload).toString('base64');
  }

  private async broadcastAdvertisement(advertisement: CapabilityAdvertisement): Promise<void> {
    // Broadcast to known federation endpoints
    const federationEndpoints = await this.getFederationEndpoints();
    
    const broadcastPromises = federationEndpoints.map(endpoint =>
      fetch(`${endpoint}/api/v1/federation/advertisements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(advertisement)
      }).catch(error => {
        console.warn(`Failed to broadcast to ${endpoint}:`, error);
      })
    );
    
    await Promise.allSettled(broadcastPromises);
  }

  private async queryFederationNetwork(capability: string): Promise<FederatedAgent[]> {
    const federationEndpoints = await this.getFederationEndpoints();
    const results: FederatedAgent[] = [];
    
    for (const endpoint of federationEndpoints) {
      try {
        const response = await fetch(
          `${endpoint}/api/v1/federation/discover?capability=${encodeURIComponent(capability)}`
        );
        
        if (response.ok) {
          const agents: FederatedAgent[] = await response.json();
          results.push(...agents);
        }
      } catch (error) {
        console.warn(`Federation query failed for ${endpoint}:`, error);
      }
    }
    
    return results;
  }

  private deduplicateAgents(agents: FederatedAgent[]): FederatedAgent[] {
    const seen = new Set<string>();
    return agents.filter(agent => {
      const key = `${agent.organization}:${agent.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private calculateCapabilityMatchScore(agent: FederatedAgent, capability: string): number {
    const baseScore = agent.trustScore;
    const capabilityBonus = agent.capabilities.includes(capability) ? 0.3 : 0;
    const certificationBonus = {
      'bronze': 0.1,
      'silver': 0.2, 
      'gold': 0.3
    }[agent.certification];
    
    return baseScore + capabilityBonus + certificationBonus;
  }

  private isAgentHealthy(agent: FederatedAgent): boolean {
    const maxAge = 5 * 60 * 1000; // 5 minutes
    return (Date.now() - agent.lastSeen.getTime()) < maxAge;
  }

  private async getFederationEndpoints(): Promise<string[]> {
    // Return known federation endpoints
    return [
      'http://federation.ossa.orb.local:8090',
      'http://partner-org.ossa.net:8090',
      'http://enterprise.ossa.cloud:8090'
    ];
  }

  private async getTrustScore(organizationId: string): Promise<TrustScore | null> {
    // Retrieve from trust store (Redis/database)
    return null; // Placeholder
  }

  private async storeTrustScore(trust: TrustScore): Promise<void> {
    // Store in persistent trust database
  }

  private calculateUpdatedTrustScore(
    current: TrustScore, 
    metrics: Partial<TrustMetrics>
  ): number {
    // Weighted trust score calculation
    const weights = { reputation: 0.4, uptime: 0.2, responseTime: 0.2, successRate: 0.2 };
    let newScore = current.score;
    
    Object.entries(metrics).forEach(([key, value]) => {
      if (key in weights && typeof value === 'number') {
        newScore += (value - 0.5) * weights[key as keyof typeof weights] * 0.1;
      }
    });
    
    return Math.max(0, Math.min(1, newScore));
  }

  private async initiateTriistHandshake(organization: string): Promise<HandshakeResult> {
    // Implement trust establishment handshake
    return { success: true, certification: 'bronze' };
  }
}

export interface AdvertisementResult {
  success: boolean;
  agentId: string;
  advertisementId: string;
  expiresAt: Date;
}

export interface TrustScore {
  organization: string;
  score: number;
  factors: {
    reputation: number;
    certification: 'bronze' | 'silver' | 'gold';
    uptime: number;
    successRate: number;
  };
  establishedAt: Date;
  lastUpdated: Date;
}

interface HandshakeResult {
  success: boolean;
  certification?: 'bronze' | 'silver' | 'gold';
}