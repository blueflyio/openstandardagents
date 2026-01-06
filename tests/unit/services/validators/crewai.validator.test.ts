/**
 * CrewAI Validator Tests
 */

import { describe, it, expect } from '@jest/globals';
import { CrewAIValidator } from '../../../../src/services/validators/crewai.validator.js';

describe('CrewAIValidator', () => {
  const validator = new CrewAIValidator();

  it('should validate valid CrewAI extension', () => {
    const manifest = {
      extensions: {
        crewai: {
          enabled: true,
          agent_type: 'worker',
          role: 'Worker Agent',
          goal: 'Complete assigned tasks',
          backstory: 'Experienced worker',
        },
      },
    };

    const result = validator.validate(manifest);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject missing role', () => {
    const manifest = {
      extensions: {
        crewai: {
          enabled: true,
          agent_type: 'worker',
          goal: 'Complete tasks',
        },
      },
    };

    const result = validator.validate(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('role');
  });

  it('should reject missing goal', () => {
    const manifest = {
      extensions: {
        crewai: {
          enabled: true,
          agent_type: 'worker',
          role: 'Worker',
        },
      },
    };

    const result = validator.validate(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('goal');
  });

  it('should validate all agent types', () => {
    const validTypes = ['worker', 'manager', 'researcher', 'analyst', 'custom'];

    validTypes.forEach((type) => {
      const manifest = {
        extensions: {
          crewai: {
            enabled: true,
            agent_type: type,
            role: 'Test Role',
            goal: 'Test Goal',
          },
        },
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });
  });

  it('should reject invalid agent_type', () => {
    const manifest = {
      extensions: {
        crewai: {
          enabled: true,
          agent_type: 'invalid',
          role: 'Test',
          goal: 'Test',
        },
      },
    };

    const result = validator.validate(manifest);
    expect(result.valid).toBe(false);
  });

  it('should validate max_iterations', () => {
    const manifest = {
      extensions: {
        crewai: {
          enabled: true,
          agent_type: 'worker',
          role: 'Test',
          goal: 'Test',
          max_iterations: 10,
        },
      },
    };

    const result = validator.validate(manifest);
    expect(result.valid).toBe(true);
  });

  it('should reject invalid max_iterations', () => {
    const manifest = {
      extensions: {
        crewai: {
          enabled: true,
          agent_type: 'worker',
          role: 'Test',
          goal: 'Test',
          max_iterations: 0,
        },
      },
    };

    const result = validator.validate(manifest);
    expect(result.valid).toBe(false);
  });

  it('should return warnings for missing backstory', () => {
    const manifest = {
      extensions: {
        crewai: {
          enabled: true,
          agent_type: 'worker',
          role: 'Test',
          goal: 'Test',
        },
      },
    };

    const result = validator.validate(manifest);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
