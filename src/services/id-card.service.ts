/**
 * ID Card Service
 *
 * Reusable service for Agent ID Card operations: hash computation,
 * card creation, audit trail management, and chain integrity verification.
 *
 * Extracts shared logic from agent-wizard and wizard-api-first commands
 * into a single source of truth per DRY principle.
 *
 * SOLID: Single Responsibility — Agent ID Card lifecycle management only
 */

import * as crypto from 'crypto';
import type { OssaAgent } from '../types/index.js';

/** Supported hash algorithms for audit trail */
export type HashAlgorithm = 'sha256' | 'sha384' | 'sha512';

/** Supported chain types for audit trail */
export type ChainType = 'merkle' | 'linear' | 'signed';

/** Audit trail action types */
export type AuditAction =
  | 'created' | 'capability-added' | 'capability-removed'
  | 'tool-added' | 'tool-removed' | 'version-bumped' | 'config-changed'
  | 'ownership-transferred' | 'access-tier-changed' | 'forked'
  | 'retired' | 'reactivated' | 'nickname-changed' | 'custom';

/** Lineage relationship types */
export type LineageRelationship =
  | 'forked-from' | 'cloned-from' | 'derived-from' | 'inspired-by' | 'upgraded-from';

/** Options for creating a new ID Card */
export interface CreateIdCardOptions {
  nickname: string;
  displayName?: string;
  avatar?: string;
  registryId?: string;
  createdBy: string;
  createdWith?: string;
  hashAlgorithm?: HashAlgorithm;
  chainType?: ChainType;
  lineage?: Array<{
    ancestor: string;
    relationship: LineageRelationship;
    commitHash?: string;
  }>;
}

/** Options for appending an audit entry */
export interface AppendAuditEntryOptions {
  action: AuditAction;
  actor: string;
  details?: {
    field?: string;
    oldValue?: unknown;
    newValue?: unknown;
    reason?: string;
    commitHash?: string;
    [key: string]: unknown;
  };
}

/** Result of chain verification */
export interface ChainVerificationResult {
  valid: boolean;
  errors: string[];
  entriesChecked: number;
}

/** ID Card type extracted from OssaAgent */
export type IdCard = NonNullable<NonNullable<OssaAgent['metadata']>['idCard']>;

/** Audit trail entry type */
export type AuditTrailEntry = NonNullable<NonNullable<IdCard['auditTrail']>['entries']>[number];

export class IdCardService {
  /**
   * Compute a hash of content with the given algorithm, prefixed with algorithm name.
   * Example: "sha256:a1b2c3..."
   */
  static computeHash(content: string, algorithm: HashAlgorithm = 'sha256'): string {
    const hash = crypto.createHash(algorithm).update(content, 'utf-8').digest('hex');
    return `${algorithm}:${hash}`;
  }

  /**
   * Compute the fingerprint (content hash) of an agent manifest.
   * The fingerprint is recomputed on every change.
   */
  static computeFingerprint(agent: Partial<OssaAgent>): string {
    const content = JSON.stringify(agent, null, 2);
    return IdCardService.computeHash(content, 'sha256');
  }

  /**
   * Create a new Agent ID Card with genesis audit trail entry.
   * Returns the ID Card object — caller is responsible for attaching it to the manifest.
   */
  static createIdCard(options: CreateIdCardOptions): IdCard {
    const now = new Date().toISOString();
    const algorithm = options.hashAlgorithm || 'sha256';
    const chainType = options.chainType || 'merkle';

    // Build provenance
    const provenance: IdCard['provenance'] = {
      createdBy: options.createdBy,
      createdAt: now,
      createdWith: options.createdWith || `ossa-cli/0.4.5`,
    };

    if (options.lineage && options.lineage.length > 0) {
      provenance!.lineage = options.lineage.map(l => ({
        ancestor: l.ancestor,
        relationship: l.relationship,
        timestamp: now,
        ...(l.commitHash ? { commitHash: l.commitHash } : {}),
      }));
    }

    // Compute genesis hash
    const genesisContent = JSON.stringify({
      seq: 0,
      action: 'created',
      timestamp: now,
      actor: options.createdBy,
      nickname: options.nickname,
    });
    const genesisHash = IdCardService.computeHash(genesisContent, algorithm);

    // Build the ID Card
    const idCard: IdCard = {
      nickname: options.nickname,
      provenance,
      auditTrail: {
        hashAlgorithm: algorithm,
        chainType,
        genesisHash,
        entries: [{
          seq: 0,
          action: 'created',
          timestamp: now,
          actor: options.createdBy,
          hash: genesisHash,
          prevHash: null,
          details: {
            field: 'idCard',
            newValue: options.nickname,
            reason: 'Agent ID Card created',
          },
        }],
      },
    };

    if (options.displayName) idCard.displayName = options.displayName;
    if (options.avatar) idCard.avatar = options.avatar;
    if (options.registryId) idCard.registryId = options.registryId;

    return idCard;
  }

  /**
   * Append a new audit trail entry to an existing ID Card.
   * The entry is hash-chained to the previous entry.
   * Returns the mutated ID Card (same reference).
   */
  static appendAuditEntry(idCard: IdCard, options: AppendAuditEntryOptions): IdCard {
    if (!idCard.auditTrail) {
      idCard.auditTrail = {
        hashAlgorithm: 'sha256',
        chainType: 'merkle',
        entries: [],
      };
    }

    if (!idCard.auditTrail.entries) {
      idCard.auditTrail.entries = [];
    }

    const entries = idCard.auditTrail.entries;
    const algorithm = (idCard.auditTrail.hashAlgorithm || 'sha256') as HashAlgorithm;
    const lastEntry = entries.length > 0 ? entries[entries.length - 1] : null;
    const seq = lastEntry ? lastEntry.seq + 1 : 0;
    const prevHash = lastEntry ? lastEntry.hash : null;
    const now = new Date().toISOString();

    const entryContent = JSON.stringify({
      seq,
      action: options.action,
      timestamp: now,
      actor: options.actor,
      prevHash,
    });
    const hash = IdCardService.computeHash(entryContent, algorithm);

    const entry: AuditTrailEntry = {
      seq,
      action: options.action,
      timestamp: now,
      actor: options.actor,
      hash,
      prevHash,
    };

    if (options.details) {
      entry.details = options.details;
    }

    entries.push(entry);

    return idCard;
  }

  /**
   * Recompute the fingerprint of an agent manifest and update the ID Card.
   * Call this after any mutation to keep the fingerprint current.
   * The birthHash is never modified (it's immutable).
   */
  static recomputeFingerprint(agent: Partial<OssaAgent>): string {
    const idCard = agent.metadata?.idCard;
    if (!idCard) {
      throw new Error('Agent has no ID Card — cannot recompute fingerprint');
    }

    // Temporarily clear fingerprint so it doesn't affect the hash
    delete idCard.fingerprint;

    const fingerprint = IdCardService.computeFingerprint(agent);
    idCard.fingerprint = fingerprint;

    // Set birthHash only if this is the first time (immutable)
    if (!idCard.birthHash) {
      idCard.birthHash = fingerprint;
    }

    return fingerprint;
  }

  /**
   * Verify the integrity of an audit trail chain.
   * Checks that each entry's prevHash matches the previous entry's hash,
   * and that sequence numbers are monotonically increasing.
   */
  static verifyChainIntegrity(idCard: IdCard): ChainVerificationResult {
    const result: ChainVerificationResult = {
      valid: true,
      errors: [],
      entriesChecked: 0,
    };

    const entries = idCard.auditTrail?.entries;
    if (!entries || entries.length === 0) {
      return result;
    }

    // Check first entry
    const first = entries[0];
    if (first.seq !== 0) {
      result.errors.push(`First entry seq should be 0, got ${first.seq}`);
      result.valid = false;
    }

    if (first.prevHash !== null && first.prevHash !== undefined) {
      result.errors.push(`First entry prevHash should be null, got "${first.prevHash}"`);
      result.valid = false;
    }

    // Check genesis hash matches first entry
    if (idCard.auditTrail?.genesisHash && first.hash !== idCard.auditTrail.genesisHash) {
      result.errors.push(
        `Genesis hash mismatch: trail says "${idCard.auditTrail.genesisHash}" but first entry hash is "${first.hash}"`
      );
      result.valid = false;
    }

    result.entriesChecked = 1;

    // Check chain linkage
    for (let i = 1; i < entries.length; i++) {
      const prev = entries[i - 1];
      const curr = entries[i];

      if (curr.seq !== prev.seq + 1) {
        result.errors.push(
          `Entry ${i}: seq should be ${prev.seq + 1}, got ${curr.seq}`
        );
        result.valid = false;
      }

      if (curr.prevHash !== prev.hash) {
        result.errors.push(
          `Entry ${i}: prevHash "${curr.prevHash}" does not match previous entry hash "${prev.hash}"`
        );
        result.valid = false;
      }

      result.entriesChecked++;
    }

    return result;
  }

  /**
   * Apply an ID Card mutation to a manifest with automatic audit entry.
   * This is the primary method that mutation commands should call.
   *
   * 1. Appends an audit entry describing the change
   * 2. Recomputes the fingerprint
   * 3. Returns the updated agent
   */
  static applyMutation(
    agent: Partial<OssaAgent>,
    options: AppendAuditEntryOptions,
  ): Partial<OssaAgent> {
    const idCard = agent.metadata?.idCard;
    if (!idCard) {
      return agent; // No ID Card — no-op
    }

    IdCardService.appendAuditEntry(idCard, options);
    IdCardService.recomputeFingerprint(agent);

    return agent;
  }

  /**
   * Build a registry ID from agent metadata.
   * Format: ossa://org/agent-name@version
   */
  static buildRegistryId(
    org: string,
    name: string,
    version?: string,
  ): string {
    const base = `ossa://${org}/${name}`;
    return version ? `${base}@${version}` : base;
  }
}
