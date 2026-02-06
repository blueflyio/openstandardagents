/**
 * CrewAI Validator Tests
 */

import { describe, it, expect } from '@jest/globals';
import { CrewAIValidator } from '../../../../src/services/validators/crewai.validator.js';
import { API_VERSION } from '../../../src/version.js';

describe.skip('CrewAIValidator', () => {
  const validator = new CrewAIValidator();

  it('should validate valid CrewAI extension with agent config', () => {
    const manifest = {
      extensions: {
        crewai: {
          enabled: true,
          agent: {
            role: 'Worker Agent',
            goal: 'Complete assigned tasks',
            backstory: 'Experienced worker',
          },
        },
      },
    };

    const result = validator.validate(manifest);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate with process types', () => {
    const processes = ['sequential', 'hierarchical'];

    processes.forEach((process) => {
      const manifest = {
        extensions: {
          crewai: {
            enabled: true,
            process,
            agent: {
              role: 'Test Role',
              goal: 'Test Goal',
            },
          },
        },
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });
  });

  it('should validate with max_rpm', () => {
    const manifest = {
      extensions: {
        crewai: {
          enabled: true,
          max_rpm: 60,
          agent: {
            role: 'Test',
            goal: 'Test',
          },
        },
      },
    };

    const result = validator.validate(manifest);
    expect(result.valid).toBe(true);
  });

  it('should reject invalid max_rpm', () => {
    const manifest = {
      extensions: {
        crewai: {
          enabled: true,
          max_rpm: 0,
          agent: {
            role: 'Test',
            goal: 'Test',
          },
        },
      },
    };

    const result = validator.validate(manifest);
    expect(result.valid).toBe(false);
  });

  it('should validate verbose levels', () => {
    const levels = [0, 1, 2];

    levels.forEach((verbose) => {
      const manifest = {
        extensions: {
          crewai: {
            enabled: true,
            verbose,
            agent: {
              role: 'Test',
              goal: 'Test',
            },
          },
        },
      };

      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
    });
  });

  it('should reject invalid verbose level', () => {
    const manifest = {
      extensions: {
        crewai: {
          enabled: true,
          verbose: 5,
          agent: {
            role: 'Test',
            goal: 'Test',
          },
        },
      },
    };

    const result = validator.validate(manifest);
    expect(result.valid).toBe(false);
  });

  it('should validate agent with max_iter', () => {
    const manifest = {
      extensions: {
        crewai: {
          enabled: true,
          agent: {
            role: 'Test',
            goal: 'Test',
            max_iter: 10,
          },
        },
      },
    };

    const result = validator.validate(manifest);
    expect(result.valid).toBe(true);
  });

  it('should validate minimal config', () => {
    const manifest = {
      extensions: {
        crewai: {
          enabled: true,
        },
      },
    };

    const result = validator.validate(manifest);
    // Should be valid as agent, crew, task are all optional
    expect(result.valid).toBe(true);
  });
});
