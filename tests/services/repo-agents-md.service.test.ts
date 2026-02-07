import 'reflect-metadata';
import { RepoAgentsMdService } from '../../src/services/agents-md/repo-agents-md.service.js';
import { TemplateProcessorService } from '../../src/services/template-processor.service.js';
import { GitService } from '../../src/services/git.service.js';
import { jest } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import { API_VERSION } from '../../../src/version.js';

// Mock fs and other dependencies
jest.mock('fs/promises');
jest.mock('../../src/services/git.service.js');

describe('RepoAgentsMdService', () => {
  let service: RepoAgentsMdService;
  let templateProcessor: TemplateProcessorService;
  let gitService: jest.Mocked<GitService>;

  beforeEach(() => {
    templateProcessor = new TemplateProcessorService();
    gitService = new GitService() as jest.Mocked<GitService>;
    service = new RepoAgentsMdService(templateProcessor, gitService);
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should validate standard AGENTS.md content', async () => {
      const content = '# Project Name\n\nDescription here';
      const result = await service.validate(content);
      expect(result.valid).toBe(true);
      expect(result.follows_standard).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for empty content', async () => {
      const result = await service.validate('');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Content is empty');
    });

    it('should warn about unreplaced placeholders', async () => {
      const content = '# {PROJECT_NAME}\n\n{UNREPLACED}';
      const result = await service.validate(content);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Contains unreplaced placeholders');
    });

    it('should require an H1 title', async () => {
      const content = 'Just text without header';
      const result = await service.validate(content);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing H1 title');
    });
  });

  describe('generate', () => {
    it('should generate content using the template processor', async () => {
      const repoPath = '/tmp/test-repo';
      const config = { repo_path: repoPath, project_name: 'Test Project' };

      // Mock template processor and fs
      jest
        .spyOn(templateProcessor, 'extractVariablesFromRepo')
        .mockResolvedValue({
          PROJECT_NAME: 'Extracted',
          PROJECT_DESCRIPTION: 'Desc',
          REPO_URL: 'url',
          REPO_PATH: 'path',
          PROJECT_TYPE: 'npm',
          PROJECT_STATUS: 'Active',
          WIKI_URL: 'wiki',
        });
      jest
        .spyOn(templateProcessor, 'loadDefaultTemplate')
        .mockResolvedValue('# {PROJECT_NAME}\n{PROJECT_DESCRIPTION}');
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      const result = await service.generate(config);

      expect(result.status).toBe('success');
      expect(result.content).toBe('# Test Project\nDesc');
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(repoPath, 'AGENTS.md'),
        expect.any(String),
        'utf-8'
      );
    });

    it('should handle errors during generation', async () => {
      jest
        .spyOn(templateProcessor, 'extractVariablesFromRepo')
        .mockRejectedValue(new Error('FS Error'));

      const result = await service.generate({ repo_path: '/invalid' });

      expect(result.status).toBe('failed');
      expect(result.error).toBe('FS Error');
    });
  });
});
