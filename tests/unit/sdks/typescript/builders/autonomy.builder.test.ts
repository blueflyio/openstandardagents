/**
 * Tests for AutonomyBuilder
 */

import { describe, it, expect } from '@jest/globals';
import { AutonomyBuilder } from '../../../../../src/sdks/typescript/builders/autonomy.builder.js';

describe('AutonomyBuilder', () => {
  describe('Access Tiers', () => {
    it('should build supervised/read-only config', () => {
      const config = AutonomyBuilder.supervised().build();

      expect(config.accessTier).toBe('tier_1_read');
    });

    it('should build readOnly config (alias for supervised)', () => {
      const config = AutonomyBuilder.readOnly().build();

      expect(config.accessTier).toBe('tier_1_read');
    });

    it('should build semi-autonomous config', () => {
      const config = AutonomyBuilder.semiAutonomous().build();

      expect(config.accessTier).toBe('tier_2_write_limited');
    });

    it('should build limitedWrite config (alias for semiAutonomous)', () => {
      const config = AutonomyBuilder.limitedWrite().build();

      expect(config.accessTier).toBe('tier_2_write_limited');
    });

    it('should build autonomous config', () => {
      const config = AutonomyBuilder.autonomous().build();

      expect(config.accessTier).toBe('tier_3_write_elevated');
    });

    it('should build elevatedWrite config (alias for autonomous)', () => {
      const config = AutonomyBuilder.elevatedWrite().build();

      expect(config.accessTier).toBe('tier_3_write_elevated');
    });

    it('should build policy config', () => {
      const config = AutonomyBuilder.policy().build();

      expect(config.accessTier).toBe('tier_4_policy');
    });

    it('should build custom access tier config', () => {
      const config = AutonomyBuilder.custom('tier_2_write_limited').build();

      expect(config.accessTier).toBe('tier_2_write_limited');
    });

    it('should support shorthand access tiers', () => {
      const config = AutonomyBuilder.custom('read').build();

      expect(config.accessTier).toBe('read');
    });
  });

  describe('Approval Requirements', () => {
    it('should set approval required actions', () => {
      const config = AutonomyBuilder.supervised()
        .approvalRequired(['deploy', 'delete'])
        .build();

      expect(config.approvalRequired).toEqual(['deploy', 'delete']);
    });

    it('should add individual approval actions', () => {
      const config = AutonomyBuilder.supervised()
        .requireApproval('deploy')
        .requireApproval('delete')
        .requireApproval('merge')
        .build();

      expect(config.approvalRequired).toEqual(['deploy', 'delete', 'merge']);
    });
  });

  describe('Cost Threshold', () => {
    it('should set max cost', () => {
      const config = AutonomyBuilder.supervised().maxCost(100).build();

      expect(config.maxCost).toBe(100);
    });

    it('should validate maxCost is non-negative', () => {
      expect(() => {
        AutonomyBuilder.supervised().maxCost(-1).build();
      }).toThrow('maxCost must be non-negative');
    });

    it('should allow maxCost of 0', () => {
      const config = AutonomyBuilder.supervised().maxCost(0).build();

      expect(config.maxCost).toBe(0);
    });
  });

  describe('Audit Level', () => {
    it('should set standard audit level', () => {
      const config = AutonomyBuilder.supervised()
        .auditLevel('standard')
        .build();

      expect(config.auditLevel).toBe('standard');
    });

    it('should set detailed audit level', () => {
      const config = AutonomyBuilder.supervised()
        .auditLevel('detailed')
        .build();

      expect(config.auditLevel).toBe('detailed');
    });

    it('should set comprehensive audit level', () => {
      const config = AutonomyBuilder.supervised()
        .auditLevel('comprehensive')
        .build();

      expect(config.auditLevel).toBe('comprehensive');
    });
  });

  describe('Isolation Level', () => {
    it('should set no isolation', () => {
      const config = AutonomyBuilder.autonomous().isolation('none').build();

      expect(config.isolation).toBe('none');
    });

    it('should set standard isolation', () => {
      const config = AutonomyBuilder.autonomous().isolation('standard').build();

      expect(config.isolation).toBe('standard');
    });

    it('should set strict isolation', () => {
      const config = AutonomyBuilder.policy().isolation('strict').build();

      expect(config.isolation).toBe('strict');
    });
  });

  describe('Validation', () => {
    it('should require access tier', () => {
      const builder = new (AutonomyBuilder as any)();
      builder.config = {};
      expect(() => builder.build()).toThrow('Access tier is required');
    });
  });

  describe('Edge Cases', () => {
    it('should build minimal config', () => {
      const config = AutonomyBuilder.supervised().build();

      expect(config.accessTier).toBe('tier_1_read');
      expect(config.approvalRequired).toBeUndefined();
      expect(config.maxCost).toBeUndefined();
      expect(config.auditLevel).toBeUndefined();
      expect(config.isolation).toBeUndefined();
    });
  });

  describe('Comprehensive Config', () => {
    it('should build comprehensive autonomy config', () => {
      const config = AutonomyBuilder.supervised()
        .approvalRequired(['deploy', 'delete'])
        .maxCost(100)
        .auditLevel('comprehensive')
        .isolation('standard')
        .build();

      expect(config.accessTier).toBe('tier_1_read');
      expect(config.approvalRequired).toEqual(['deploy', 'delete']);
      expect(config.maxCost).toBe(100);
      expect(config.auditLevel).toBe('comprehensive');
      expect(config.isolation).toBe('standard');
    });
  });

  describe('Fluent API', () => {
    it('should support method chaining', () => {
      const config = AutonomyBuilder.supervised()
        .requireApproval('deploy')
        .requireApproval('delete')
        .maxCost(100)
        .auditLevel('detailed')
        .isolation('standard')
        .build();

      expect(config.accessTier).toBe('tier_1_read');
      expect(config.approvalRequired).toEqual(['deploy', 'delete']);
      expect(config.maxCost).toBe(100);
      expect(config.auditLevel).toBe('detailed');
      expect(config.isolation).toBe('standard');
    });
  });

  describe('Use Cases', () => {
    it('should build config for analyzer agent (tier_1_read)', () => {
      const config = AutonomyBuilder.supervised()
        .auditLevel('standard')
        .build();

      expect(config.accessTier).toBe('tier_1_read');
      expect(config.auditLevel).toBe('standard');
    });

    it('should build config for reviewer agent (tier_2_write_limited)', () => {
      const config = AutonomyBuilder.semiAutonomous()
        .requireApproval('merge')
        .auditLevel('detailed')
        .build();

      expect(config.accessTier).toBe('tier_2_write_limited');
      expect(config.approvalRequired).toEqual(['merge']);
      expect(config.auditLevel).toBe('detailed');
    });

    it('should build config for deployer agent (tier_3_write_elevated)', () => {
      const config = AutonomyBuilder.autonomous()
        .requireApproval('deploy')
        .maxCost(1000)
        .auditLevel('comprehensive')
        .build();

      expect(config.accessTier).toBe('tier_3_write_elevated');
      expect(config.approvalRequired).toEqual(['deploy']);
      expect(config.maxCost).toBe(1000);
      expect(config.auditLevel).toBe('comprehensive');
    });

    it('should build config for policy agent (tier_4_policy)', () => {
      const config = AutonomyBuilder.policy()
        .isolation('strict')
        .auditLevel('comprehensive')
        .build();

      expect(config.accessTier).toBe('tier_4_policy');
      expect(config.isolation).toBe('strict');
      expect(config.auditLevel).toBe('comprehensive');
    });
  });
});
