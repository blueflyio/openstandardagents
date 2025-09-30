/**
 * Agent Capability Attestation Protocol (ACAP)
 * Verifiable capability attestation and credential generation for OSSA agents
 */

import { createHash, randomBytes } from 'crypto';
import { Agent, Capability, AgentStatus } from '../types/index.js';

export interface CapabilityAttestation {
  id: string;
  agentId: string;
  capability: string;
  version: string;
  attestedAt: Date;
  signature: string;
  proof: AttestationProof;
  status: 'valid' | 'invalid' | 'expired';
}

export interface AttestationProof {
  challenge: string;
  response: string;
  witness?: string;
  metadata: Record<string, any>;
}

export interface VerifiableCredential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: string;
  issuanceDate: string;
  credentialSubject: {
    id: string;
    capabilities: string[];
    attestations: CapabilityAttestation[];
  };
  proof: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    jws: string;
  };
}

export class ACAPProtocol {
  private readonly issuer: string;
  private readonly signingKey: string;

  constructor(issuer: string = 'ossa:acap:v1', signingKey?: string) {
    this.issuer = issuer;
    this.signingKey = signingKey || this.generateKey();
  }

  /**
   * Verify agent capability through challenge-response
   */
  async verifyCapability(agent: Agent, capability: string): Promise<CapabilityAttestation> {
    if (agent.status !== AgentStatus.IDLE) {
      throw new Error('Agent must be idle for capability verification');
    }

    const challenge = this.generateChallenge();
    const response = await this.executeCapabilityChallenge(agent, capability, challenge);

    const proof: AttestationProof = {
      challenge,
      response,
      metadata: { timestamp: Date.now(), version: capability }
    };

    const attestation: CapabilityAttestation = {
      id: this.generateId(),
      agentId: agent.id,
      capability,
      version: this.getCapabilityVersion(agent, capability),
      attestedAt: new Date(),
      signature: this.signAttestation(agent.id, capability, proof),
      proof,
      status: 'valid'
    };

    return attestation;
  }

  /**
   * Generate verifiable credential from attestations
   */
  generateCredential(agent: Agent, attestations: CapabilityAttestation[]): VerifiableCredential {
    const now = new Date().toISOString();

    return {
      '@context': ['https://www.w3.org/2018/credentials/v1', 'https://ossa.org/credentials/v1'],
      id: `urn:ossa:credential:${this.generateId()}`,
      type: ['VerifiableCredential', 'AgentCapabilityCredential'],
      issuer: this.issuer,
      issuanceDate: now,
      credentialSubject: {
        id: agent.id,
        capabilities: attestations.map((a) => a.capability),
        attestations
      },
      proof: {
        type: 'JsonWebSignature2020',
        created: now,
        verificationMethod: `${this.issuer}#key-1`,
        proofPurpose: 'assertionMethod',
        jws: this.signCredential(agent, attestations)
      }
    };
  }

  private generateChallenge(): string {
    return randomBytes(32).toString('hex');
  }

  private generateKey(): string {
    return randomBytes(32).toString('hex');
  }

  private generateId(): string {
    return randomBytes(16).toString('hex');
  }

  private async executeCapabilityChallenge(agent: Agent, capability: string, challenge: string): Promise<string> {
    // Simulate capability execution with challenge
    const input = `capability:${capability}:challenge:${challenge}`;
    return createHash('sha256')
      .update(input + agent.id)
      .digest('hex');
  }

  private getCapabilityVersion(agent: Agent, capability: string): string {
    const cap = agent.capabilities.find((c) => c.name === capability);
    return cap?.version || '1.0.0';
  }

  private signAttestation(agentId: string, capability: string, proof: AttestationProof): string {
    const payload = JSON.stringify({ agentId, capability, proof });
    return createHash('sha256')
      .update(payload + this.signingKey)
      .digest('hex');
  }

  private signCredential(agent: Agent, attestations: CapabilityAttestation[]): string {
    const payload = JSON.stringify({
      agentId: agent.id,
      attestations,
      issuer: this.issuer
    });
    return createHash('sha256')
      .update(payload + this.signingKey)
      .digest('hex');
  }
}
