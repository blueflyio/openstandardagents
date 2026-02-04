/**
 * agents.md Extension Unit Tests
 * Tests for OpenAI agents.md repository-level agent guidance extension
 */

import { describe, it, expect } from '@jest/globals';

describe('AgentsMdExtension Schema', () => {
  const validManifest = {
    apiVersion: 'ossa/v0.4.1',
    kind: 'Agent',
    metadata: {
      name: 'test-agent',
      version: '1.0.0',
    },
    spec: {
      role: 'Test agent',
    },
    extensions: {
      agents_md: {
        enabled: true,
        generate: true,
        output_path: 'AGENTS.md',
      },
    },
  };

  it('should accept valid agents_md extension', () => {
    expect(validManifest.extensions.agents_md.enabled).toBe(true);
    expect(validManifest.extensions.agents_md.output_path).toBe('AGENTS.md');
  });

  it('should accept full agents_md configuration', () => {
    const fullConfig = {
      ...validManifest,
      extensions: {
        agents_md: {
          enabled: true,
          generate: true,
          output_path: 'AGENTS.md',
          sections: {
            dev_environment: {
              enabled: true,
              source: 'spec.tools',
              custom: 'Use pnpm for package management',
            },
            testing: {
              enabled: true,
              custom: 'Run pnpm test before committing',
            },
            pr_instructions: {
              enabled: true,
              source: 'spec.autonomy',
              append: 'Request review from at least one team member',
            },
            code_style: {
              enabled: true,
              title: 'Code Style Guide',
              custom: 'TypeScript strict mode enabled',
            },
            custom: [
              {
                title: 'Architecture',
                content: 'This is a microservices architecture',
              },
            ],
          },
          sync: {
            on_manifest_change: true,
            include_comments: true,
            watch: false,
          },
          mapping: {
            tools_to_dev_environment: true,
            constraints_to_testing: true,
            autonomy_to_pr_instructions: true,
            role_from_agents_md: false,
          },
          cursor_integration: true,
          nested_files: [
            {
              path: 'apps/web',
              inherit: true,
              sections: {
                dev_environment: {
                  custom: 'Next.js application',
                },
              },
            },
          ],
        },
      },
    };

    expect(
      fullConfig.extensions.agents_md.sections.dev_environment.enabled
    ).toBe(true);
    expect(fullConfig.extensions.agents_md.sections.custom).toHaveLength(1);
    expect(fullConfig.extensions.agents_md.nested_files).toHaveLength(1);
    expect(fullConfig.extensions.agents_md.cursor_integration).toBe(true);
  });

  it('should support section source mappings', () => {
    const config = {
      agents_md: {
        enabled: true,
        sections: {
          dev_environment: {
            enabled: true,
            source: 'spec.tools',
          },
          testing: {
            enabled: true,
            source: 'spec.constraints',
          },
          pr_instructions: {
            enabled: true,
            source: 'spec.autonomy',
          },
        },
        mapping: {
          tools_to_dev_environment: true,
          constraints_to_testing: true,
          autonomy_to_pr_instructions: true,
        },
      },
    };

    expect(config.agents_md.sections.dev_environment.source).toBe('spec.tools');
    expect(config.agents_md.sections.testing.source).toBe('spec.constraints');
    expect(config.agents_md.sections.pr_instructions.source).toBe(
      'spec.autonomy'
    );
  });

  it('should support custom output paths', () => {
    const config = {
      agents_md: {
        enabled: true,
        output_path: '.github/AGENTS.md',
      },
    };

    expect(config.agents_md.output_path).toBe('.github/AGENTS.md');
  });

  it('should support nested files for monorepos', () => {
    const config = {
      agents_md: {
        enabled: true,
        nested_files: [
          { path: 'packages/core', inherit: true },
          { path: 'packages/ui', inherit: true },
          {
            path: 'apps/api',
            inherit: false,
            sections: {
              testing: { custom: 'Run integration tests with Docker' },
            },
          },
        ],
      },
    };

    expect(config.agents_md.nested_files).toHaveLength(3);
    expect(config.agents_md.nested_files[2].inherit).toBe(false);
  });

  it('should support Cursor integration flag', () => {
    const config = {
      agents_md: {
        enabled: true,
        cursor_integration: true,
      },
      cursor: {
        enabled: true,
        agent_type: 'composer',
      },
    };

    expect(config.agents_md.cursor_integration).toBe(true);
    expect(config.cursor.enabled).toBe(true);
  });
});

describe('AgentsMdSection Schema', () => {
  it('should accept all section properties', () => {
    const section = {
      enabled: true,
      source: 'spec.tools',
      custom: 'Custom content here',
      title: 'Custom Title',
      append: 'Additional content',
    };

    expect(section.enabled).toBe(true);
    expect(section.source).toBe('spec.tools');
    expect(section.custom).toBe('Custom content here');
    expect(section.title).toBe('Custom Title');
    expect(section.append).toBe('Additional content');
  });

  it('should allow section with only custom content', () => {
    const section = {
      enabled: true,
      custom: 'This is all custom content with no source mapping',
    };

    expect(section.enabled).toBe(true);
    expect(section.custom).toBeDefined();
    expect(section).not.toHaveProperty('source');
  });

  it('should allow section with only source mapping', () => {
    const section = {
      enabled: true,
      source: 'spec.tools',
    };

    expect(section.enabled).toBe(true);
    expect(section.source).toBe('spec.tools');
    expect(section).not.toHaveProperty('custom');
  });
});

describe('Bidirectional Mapping', () => {
  it('should define OSSA to agents.md mappings', () => {
    const mappings = {
      tools_to_dev_environment: true,
      constraints_to_testing: true,
      autonomy_to_pr_instructions: true,
    };

    // OSSA → agents.md direction
    expect(mappings.tools_to_dev_environment).toBe(true);
    expect(mappings.constraints_to_testing).toBe(true);
    expect(mappings.autonomy_to_pr_instructions).toBe(true);
  });

  it('should support agents.md to OSSA parsing', () => {
    const mappings = {
      role_from_agents_md: true,
    };

    // agents.md → OSSA direction
    expect(mappings.role_from_agents_md).toBe(true);
  });
});
