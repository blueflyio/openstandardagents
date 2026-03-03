/**
 * SkillManifestService — CRUD for skill.ossa.yaml manifests
 *
 * Wraps existing converter functions + validation for skills.
 */

import { injectable, inject } from 'inversify';
import * as fs from 'node:fs';
import * as path from 'node:path';
import fg from 'fast-glob';
import { ValidationService } from '../validation.service.js';
import type { OssaSkill, ValidationResult } from '../../types/index.js';
import { safeParseYAML } from '../../utils/yaml-parser.js';

export interface CreateSkillInput {
  name: string;
  version?: string;
  description?: string;
  instructions?: string;
  platforms?: string[];
}

@injectable()
export class SkillManifestService {
  constructor(
    @inject(ValidationService) private validationService: ValidationService
  ) {}

  async create(input: CreateSkillInput): Promise<OssaSkill> {
    const skill: OssaSkill = {
      apiVersion: 'ossa/v1',
      kind: 'Skill',
      metadata: {
        name: input.name,
        version: input.version || '1.0.0',
        description: input.description || `Skill: ${input.name}`,
      },
      spec: {
        instructions: input.instructions || `You are a ${input.name} skill.`,
        platforms: input.platforms || ['claude-code'],
      },
    } as OssaSkill;

    return skill;
  }

  async read(filePath: string): Promise<OssaSkill> {
    const content = fs.readFileSync(path.resolve(filePath), 'utf8');
    return safeParseYAML(content) as OssaSkill;
  }

  async validate(skill: unknown): Promise<ValidationResult> {
    return this.validationService.validate(skill);
  }

  async list(directory: string): Promise<OssaSkill[]> {
    const dir = path.resolve(directory);
    const patterns = [
      '**/*.skill.ossa.yaml',
      '**/*.skill.ossa.yml',
      '**/skill.ossa.yaml',
    ];
    const files = await fg(patterns, {
      cwd: dir,
      ignore: ['**/node_modules/**', '**/dist/**'],
      absolute: true,
    });

    const skills: OssaSkill[] = [];
    for (const f of files) {
      try {
        const content = fs.readFileSync(f, 'utf8');
        const parsed = safeParseYAML(content) as OssaSkill;
        if (parsed.kind === 'Skill') {
          skills.push(parsed);
        }
      } catch {
        // Skip unparseable files
      }
    }
    return skills;
  }
}
