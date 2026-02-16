/**
 * Tests for SafetyBuilder
 */

import { describe, it, expect } from '@jest/globals';
import { SafetyBuilder } from '../../../../../src/sdks/typescript/builders/safety.builder.js';

describe('SafetyBuilder', () => {
  describe('Guardrails', () => {
    it('should build safety config with guardrails', () => {
      const safety = SafetyBuilder.create()
        .maxActionsPerMinute(10)
        .costThreshold(100)
        .auditAllActions(true)
        .build();

      expect(safety.guardrails?.max_actions_per_minute).toBe(10);
      expect(safety.guardrails?.cost_threshold_usd).toBe(100);
      expect(safety.guardrails?.audit_all_actions).toBe(true);
    });

    it('should set approval required actions', () => {
      const safety = SafetyBuilder.create()
        .requireApprovalFor(['deploy', 'delete', 'merge'])
        .build();

      expect(safety.guardrails?.require_human_approval_for).toEqual([
        'deploy',
        'delete',
        'merge',
      ]);
    });

    it('should add individual approval actions', () => {
      const safety = SafetyBuilder.create()
        .requireApproval('deploy')
        .requireApproval('delete')
        .build();

      expect(safety.guardrails?.require_human_approval_for).toEqual([
        'deploy',
        'delete',
      ]);
    });

    it('should set blocked actions', () => {
      const safety = SafetyBuilder.create()
        .blockActions(['force_push', 'delete_branch'])
        .build();

      expect(safety.guardrails?.blocked_actions).toEqual([
        'force_push',
        'delete_branch',
      ]);
    });

    it('should add individual blocked actions', () => {
      const safety = SafetyBuilder.create()
        .blockAction('force_push')
        .blockAction('delete_branch')
        .build();

      expect(safety.guardrails?.blocked_actions).toEqual([
        'force_push',
        'delete_branch',
      ]);
    });
  });

  describe('Content Filtering', () => {
    it('should set content filtering types', () => {
      const safety = SafetyBuilder.create()
        .contentFiltering(['hate_speech', 'violence'])
        .build();

      expect((safety.guardrails as any)?.content_filtering).toEqual([
        'hate_speech',
        'violence',
      ]);
    });

    it('should support custom content filtering types', () => {
      const safety = SafetyBuilder.create()
        .contentFiltering(['custom_type_1', 'custom_type_2'])
        .build();

      expect((safety.guardrails as any)?.content_filtering).toEqual([
        'custom_type_1',
        'custom_type_2',
      ]);
    });
  });

  describe('PII Detection', () => {
    it('should set PII detection types', () => {
      const safety = SafetyBuilder.create()
        .piiDetection(['email', 'phone', 'ssn'])
        .build();

      expect((safety.guardrails as any)?.pii_detection).toEqual([
        'email',
        'phone',
        'ssn',
      ]);
    });

    it('should support custom PII detection types', () => {
      const safety = SafetyBuilder.create()
        .piiDetection(['custom_pii_1', 'custom_pii_2'])
        .build();

      expect((safety.guardrails as any)?.pii_detection).toEqual([
        'custom_pii_1',
        'custom_pii_2',
      ]);
    });

    it('should set PII handling policy', () => {
      const safety = SafetyBuilder.create().piiHandling('redact').build();

      expect(safety.pii_handling).toBe('redact');
    });
  });

  describe('Data Classification', () => {
    it('should set data classification', () => {
      const safety = SafetyBuilder.create()
        .dataClassification('confidential')
        .build();

      expect(safety.data_classification).toBe('confidential');
    });
  });

  describe('Validation', () => {
    it('should validate maxActionsPerMinute is positive', () => {
      expect(() => {
        SafetyBuilder.create().maxActionsPerMinute(0).build();
      }).toThrow('maxActionsPerMinute must be positive');

      expect(() => {
        SafetyBuilder.create().maxActionsPerMinute(-1).build();
      }).toThrow('maxActionsPerMinute must be positive');
    });

    it('should validate costThreshold is non-negative', () => {
      expect(() => {
        SafetyBuilder.create().costThreshold(-1).build();
      }).toThrow('costThreshold must be non-negative');
    });

    it('should allow costThreshold of 0', () => {
      const safety = SafetyBuilder.create().costThreshold(0).build();
      expect(safety.guardrails?.cost_threshold_usd).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should build empty safety config', () => {
      const safety = SafetyBuilder.create().build();

      expect(safety).toEqual({});
    });

    it('should not include guardrails if none are set', () => {
      const safety = SafetyBuilder.create().piiHandling('redact').build();

      expect(safety.guardrails).toBeUndefined();
      expect(safety.pii_handling).toBe('redact');
    });

    it('should handle auditAllActions with default true', () => {
      const safety = SafetyBuilder.create().auditAllActions().build();

      expect(safety.guardrails?.audit_all_actions).toBe(true);
    });

    it('should handle auditAllActions set to false', () => {
      const safety = SafetyBuilder.create().auditAllActions(false).build();

      expect(safety.guardrails?.audit_all_actions).toBe(false);
    });
  });

  describe('Comprehensive Config', () => {
    it('should build comprehensive safety config', () => {
      const safety = SafetyBuilder.create()
        .maxActionsPerMinute(10)
        .requireApprovalFor(['deploy', 'delete'])
        .blockActions(['force_push'])
        .auditAllActions(true)
        .costThreshold(100)
        .contentFiltering(['hate_speech', 'violence'])
        .piiDetection(['email', 'phone', 'ssn'])
        .piiHandling('redact')
        .dataClassification('confidential')
        .build();

      expect(safety.guardrails?.max_actions_per_minute).toBe(10);
      expect(safety.guardrails?.require_human_approval_for).toEqual([
        'deploy',
        'delete',
      ]);
      expect(safety.guardrails?.blocked_actions).toEqual(['force_push']);
      expect(safety.guardrails?.audit_all_actions).toBe(true);
      expect(safety.guardrails?.cost_threshold_usd).toBe(100);
      expect((safety.guardrails as any)?.content_filtering).toEqual([
        'hate_speech',
        'violence',
      ]);
      expect((safety.guardrails as any)?.pii_detection).toEqual([
        'email',
        'phone',
        'ssn',
      ]);
      expect(safety.pii_handling).toBe('redact');
      expect(safety.data_classification).toBe('confidential');
    });
  });

  describe('Fluent API', () => {
    it('should support method chaining', () => {
      const safety = SafetyBuilder.create()
        .maxActionsPerMinute(10)
        .costThreshold(100)
        .requireApproval('deploy')
        .requireApproval('delete')
        .blockAction('force_push')
        .auditAllActions()
        .build();

      expect(safety.guardrails?.max_actions_per_minute).toBe(10);
      expect(safety.guardrails?.cost_threshold_usd).toBe(100);
      expect(safety.guardrails?.require_human_approval_for).toEqual([
        'deploy',
        'delete',
      ]);
      expect(safety.guardrails?.blocked_actions).toEqual(['force_push']);
      expect(safety.guardrails?.audit_all_actions).toBe(true);
    });
  });
});
