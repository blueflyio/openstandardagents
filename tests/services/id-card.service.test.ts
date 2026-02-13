/**
 * IdCardService Tests
 *
 * Tests for hash computation, ID Card creation, audit trail management,
 * chain integrity verification, fingerprint recomputation, and mutation wiring.
 */

import { IdCardService } from '../../src/services/id-card.service.js';
import type { OssaAgent } from '../../src/types/index.js';

describe('IdCardService', () => {
  describe('computeHash', () => {
    it('should return sha256-prefixed hash by default', () => {
      const hash = IdCardService.computeHash('hello');
      expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    });

    it('should produce deterministic output', () => {
      const a = IdCardService.computeHash('test-content');
      const b = IdCardService.computeHash('test-content');
      expect(a).toBe(b);
    });

    it('should produce different hashes for different content', () => {
      const a = IdCardService.computeHash('content-a');
      const b = IdCardService.computeHash('content-b');
      expect(a).not.toBe(b);
    });

    it('should support sha384', () => {
      const hash = IdCardService.computeHash('hello', 'sha384');
      expect(hash).toMatch(/^sha384:[a-f0-9]{96}$/);
    });

    it('should support sha512', () => {
      const hash = IdCardService.computeHash('hello', 'sha512');
      expect(hash).toMatch(/^sha512:[a-f0-9]{128}$/);
    });
  });

  describe('createIdCard', () => {
    it('should create an ID Card with required fields', () => {
      const card = IdCardService.createIdCard({
        nickname: 'Scout',
        createdBy: 'testuser',
      });

      expect(card.nickname).toBe('Scout');
      expect(card.provenance?.createdBy).toBe('testuser');
      expect(card.provenance?.createdAt).toBeDefined();
      expect(card.provenance?.createdWith).toMatch(/^ossa-cli\//);
      expect(card.auditTrail?.hashAlgorithm).toBe('sha256');
      expect(card.auditTrail?.chainType).toBe('merkle');
      expect(card.auditTrail?.genesisHash).toMatch(/^sha256:/);
      expect(card.auditTrail?.entries).toHaveLength(1);
    });

    it('should create genesis entry as first audit trail entry', () => {
      const card = IdCardService.createIdCard({
        nickname: 'Drupa',
        createdBy: 'admin',
      });

      const entry = card.auditTrail!.entries![0];
      expect(entry.seq).toBe(0);
      expect(entry.action).toBe('created');
      expect(entry.actor).toBe('admin');
      expect(entry.prevHash).toBeNull();
      expect(entry.hash).toBe(card.auditTrail!.genesisHash);
      expect(entry.details?.field).toBe('idCard');
      expect(entry.details?.newValue).toBe('Drupa');
    });

    it('should set optional fields when provided', () => {
      const card = IdCardService.createIdCard({
        nickname: 'TestBot',
        displayName: 'Test Bot Agent',
        avatar: 'https://example.com/avatar.png',
        registryId: 'ossa://blueflyio/test-bot@0.4.5',
        createdBy: 'dev',
        createdWith: 'ossa-test/1.0.0',
        hashAlgorithm: 'sha512',
        chainType: 'linear',
      });

      expect(card.displayName).toBe('Test Bot Agent');
      expect(card.avatar).toBe('https://example.com/avatar.png');
      expect(card.registryId).toBe('ossa://blueflyio/test-bot@0.4.5');
      expect(card.provenance?.createdWith).toBe('ossa-test/1.0.0');
      expect(card.auditTrail?.hashAlgorithm).toBe('sha512');
      expect(card.auditTrail?.chainType).toBe('linear');
      expect(card.auditTrail?.genesisHash).toMatch(/^sha512:/);
    });

    it('should add lineage when provided', () => {
      const card = IdCardService.createIdCard({
        nickname: 'ForkedBot',
        createdBy: 'dev',
        lineage: [{
          ancestor: 'ossa://blueflyio/original-bot@0.4.0',
          relationship: 'forked-from',
          commitHash: 'abc123',
        }],
      });

      expect(card.provenance?.lineage).toHaveLength(1);
      expect(card.provenance!.lineage![0].ancestor).toBe('ossa://blueflyio/original-bot@0.4.0');
      expect(card.provenance!.lineage![0].relationship).toBe('forked-from');
      expect(card.provenance!.lineage![0].commitHash).toBe('abc123');
      expect(card.provenance!.lineage![0].timestamp).toBeDefined();
    });

    it('should not include optional fields when not provided', () => {
      const card = IdCardService.createIdCard({
        nickname: 'Minimal',
        createdBy: 'dev',
      });

      expect(card.displayName).toBeUndefined();
      expect(card.avatar).toBeUndefined();
      expect(card.registryId).toBeUndefined();
      expect(card.provenance?.lineage).toBeUndefined();
    });
  });

  describe('appendAuditEntry', () => {
    let card: ReturnType<typeof IdCardService.createIdCard>;

    beforeEach(() => {
      card = IdCardService.createIdCard({
        nickname: 'TestAgent',
        createdBy: 'dev',
      });
    });

    it('should append an entry linked to the previous hash', () => {
      const genesisHash = card.auditTrail!.entries![0].hash;

      IdCardService.appendAuditEntry(card, {
        action: 'capability-added',
        actor: 'dev',
        details: {
          field: 'capabilities',
          newValue: 'code-review',
          reason: 'Added code review capability',
        },
      });

      expect(card.auditTrail!.entries).toHaveLength(2);

      const newEntry = card.auditTrail!.entries![1];
      expect(newEntry.seq).toBe(1);
      expect(newEntry.action).toBe('capability-added');
      expect(newEntry.actor).toBe('dev');
      expect(newEntry.prevHash).toBe(genesisHash);
      expect(newEntry.hash).toMatch(/^sha256:/);
      expect(newEntry.hash).not.toBe(genesisHash);
      expect(newEntry.details?.reason).toBe('Added code review capability');
    });

    it('should chain multiple entries correctly', () => {
      IdCardService.appendAuditEntry(card, {
        action: 'tool-added',
        actor: 'dev',
      });

      IdCardService.appendAuditEntry(card, {
        action: 'version-bumped',
        actor: 'ci',
        details: { oldValue: '0.4.4', newValue: '0.4.5' },
      });

      const entries = card.auditTrail!.entries!;
      expect(entries).toHaveLength(3);
      expect(entries[0].seq).toBe(0);
      expect(entries[1].seq).toBe(1);
      expect(entries[2].seq).toBe(2);
      expect(entries[1].prevHash).toBe(entries[0].hash);
      expect(entries[2].prevHash).toBe(entries[1].hash);
    });

    it('should initialize audit trail if missing', () => {
      const bareCard: any = { nickname: 'Bare' };

      IdCardService.appendAuditEntry(bareCard, {
        action: 'created',
        actor: 'dev',
      });

      expect(bareCard.auditTrail).toBeDefined();
      expect(bareCard.auditTrail.entries).toHaveLength(1);
      expect(bareCard.auditTrail.entries[0].prevHash).toBeNull();
    });

    it('should return the same card reference', () => {
      const returned = IdCardService.appendAuditEntry(card, {
        action: 'config-changed',
        actor: 'dev',
      });
      expect(returned).toBe(card);
    });
  });

  describe('verifyChainIntegrity', () => {
    it('should pass for a valid chain', () => {
      const card = IdCardService.createIdCard({
        nickname: 'Valid',
        createdBy: 'dev',
      });

      IdCardService.appendAuditEntry(card, {
        action: 'tool-added',
        actor: 'dev',
      });

      IdCardService.appendAuditEntry(card, {
        action: 'capability-added',
        actor: 'dev',
      });

      const result = IdCardService.verifyChainIntegrity(card);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.entriesChecked).toBe(3);
    });

    it('should pass for an empty trail', () => {
      const card: any = {
        nickname: 'Empty',
        auditTrail: { entries: [] },
      };

      const result = IdCardService.verifyChainIntegrity(card);
      expect(result.valid).toBe(true);
      expect(result.entriesChecked).toBe(0);
    });

    it('should fail if first entry seq is not 0', () => {
      const card: any = {
        nickname: 'Bad',
        auditTrail: {
          entries: [{
            seq: 1,
            action: 'created',
            timestamp: new Date().toISOString(),
            actor: 'dev',
            hash: 'sha256:abc',
            prevHash: null,
          }],
        },
      };

      const result = IdCardService.verifyChainIntegrity(card);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('First entry seq should be 0'));
    });

    it('should fail if chain linkage is broken', () => {
      const card = IdCardService.createIdCard({
        nickname: 'Tampered',
        createdBy: 'dev',
      });

      IdCardService.appendAuditEntry(card, {
        action: 'tool-added',
        actor: 'dev',
      });

      // Tamper with the first entry's hash
      card.auditTrail!.entries![0].hash = 'sha256:tampered';

      const result = IdCardService.verifyChainIntegrity(card);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('does not match previous entry hash'));
    });

    it('should fail if genesis hash does not match first entry', () => {
      const card = IdCardService.createIdCard({
        nickname: 'BadGenesis',
        createdBy: 'dev',
      });

      card.auditTrail!.genesisHash = 'sha256:wronghash';

      const result = IdCardService.verifyChainIntegrity(card);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('Genesis hash mismatch'));
    });

    it('should fail if sequence numbers are not monotonic', () => {
      const card = IdCardService.createIdCard({
        nickname: 'BadSeq',
        createdBy: 'dev',
      });

      // Manually add a bad entry
      const lastHash = card.auditTrail!.entries![0].hash;
      card.auditTrail!.entries!.push({
        seq: 5, // Should be 1
        action: 'tool-added',
        timestamp: new Date().toISOString(),
        actor: 'dev',
        hash: 'sha256:somehash',
        prevHash: lastHash,
      });

      const result = IdCardService.verifyChainIntegrity(card);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('seq should be 1, got 5'));
    });
  });

  describe('recomputeFingerprint', () => {
    it('should compute and set fingerprint on agent', () => {
      const card = IdCardService.createIdCard({
        nickname: 'FP',
        createdBy: 'dev',
      });

      const agent: Partial<OssaAgent> = {
        apiVersion: 'ossa/v0.4.5' as any,
        kind: 'Agent',
        metadata: { name: 'test-agent', idCard: card },
        spec: { role: 'tester' },
      };

      const fp = IdCardService.recomputeFingerprint(agent);
      expect(fp).toMatch(/^sha256:[a-f0-9]{64}$/);
      expect(agent.metadata!.idCard!.fingerprint).toBe(fp);
    });

    it('should set birthHash on first call', () => {
      const card = IdCardService.createIdCard({
        nickname: 'Birth',
        createdBy: 'dev',
      });

      const agent: Partial<OssaAgent> = {
        apiVersion: 'ossa/v0.4.5' as any,
        kind: 'Agent',
        metadata: { name: 'birth-test', idCard: card },
        spec: {},
      };

      const fp = IdCardService.recomputeFingerprint(agent);
      expect(agent.metadata!.idCard!.birthHash).toBe(fp);
    });

    it('should not change birthHash on subsequent calls', () => {
      const card = IdCardService.createIdCard({
        nickname: 'Immutable',
        createdBy: 'dev',
      });

      const agent: Partial<OssaAgent> = {
        apiVersion: 'ossa/v0.4.5' as any,
        kind: 'Agent',
        metadata: { name: 'immutable-test', idCard: card },
        spec: {},
      };

      const fp1 = IdCardService.recomputeFingerprint(agent);
      const birthHash = agent.metadata!.idCard!.birthHash;

      // Mutate the agent
      agent.spec = { role: 'changed' };
      const fp2 = IdCardService.recomputeFingerprint(agent);

      expect(fp2).not.toBe(fp1);
      expect(agent.metadata!.idCard!.birthHash).toBe(birthHash);
    });

    it('should throw if agent has no ID Card', () => {
      const agent: Partial<OssaAgent> = {
        metadata: { name: 'no-card' },
      };

      expect(() => IdCardService.recomputeFingerprint(agent)).toThrow('Agent has no ID Card');
    });
  });

  describe('applyMutation', () => {
    it('should append audit entry and recompute fingerprint', () => {
      const card = IdCardService.createIdCard({
        nickname: 'Mutant',
        createdBy: 'dev',
      });

      const agent: Partial<OssaAgent> = {
        apiVersion: 'ossa/v0.4.5' as any,
        kind: 'Agent',
        metadata: { name: 'mutant-test', idCard: card },
        spec: { role: 'worker' },
      };

      // Set initial fingerprint
      IdCardService.recomputeFingerprint(agent);
      const initialFp = agent.metadata!.idCard!.fingerprint;

      // Apply mutation
      (agent.spec as any).role = 'supervisor';
      IdCardService.applyMutation(agent, {
        action: 'config-changed',
        actor: 'ci',
        details: {
          field: 'spec.role',
          oldValue: 'worker',
          newValue: 'supervisor',
          reason: 'Role change',
        },
      });

      expect(agent.metadata!.idCard!.auditTrail!.entries).toHaveLength(2);
      expect(agent.metadata!.idCard!.fingerprint).not.toBe(initialFp);
    });

    it('should be a no-op for agents without ID Card', () => {
      const agent: Partial<OssaAgent> = {
        metadata: { name: 'no-card' },
        spec: {},
      };

      const returned = IdCardService.applyMutation(agent, {
        action: 'config-changed',
        actor: 'dev',
      });

      expect(returned).toBe(agent);
      expect(agent.metadata?.idCard).toBeUndefined();
    });
  });

  describe('buildRegistryId', () => {
    it('should build registry ID with version', () => {
      const id = IdCardService.buildRegistryId('blueflyio', 'drupal-reviewer', '0.4.5');
      expect(id).toBe('ossa://blueflyio/drupal-reviewer@0.4.5');
    });

    it('should build registry ID without version', () => {
      const id = IdCardService.buildRegistryId('blueflyio', 'scout');
      expect(id).toBe('ossa://blueflyio/scout');
    });
  });
});
