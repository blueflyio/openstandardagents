import { VersionManager } from './version-manager';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('VersionManager', () => {
  let versionManager: VersionManager;
  let tempDir: string;

  beforeEach(async () => {
    versionManager = new VersionManager();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ossa-version-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('validate', () => {
    it('should validate correct semantic versions', () => {
      const testCases = [
        '0.4.2',
        'v0.4.2',
        '1.2.3',
        '1.2.3-alpha.1',
        '2.0.0-rc.1+build.123',
      ];

      testCases.forEach((version) => {
        const result = versionManager.validate(version);
        expect(result.valid).toBe(true);
        expect(result.success).toBe(true);
        expect(result.parsed).toBeDefined();
      });
    });

    it('should reject invalid semantic versions', () => {
      const testCases = ['0.4', '1.2.3.4', 'latest', 'v1', 'invalid'];

      testCases.forEach((version) => {
        const result = versionManager.validate(version);
        expect(result.valid).toBe(false);
        expect(result.errors).toBeDefined();
      });
    });

    it('should parse version components correctly', () => {
      const result = versionManager.validate('1.2.3-alpha.1+build.123');
      expect(result.valid).toBe(true);
      expect(result.parsed).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: 'alpha.1',
        build: 'build.123',
      });
    });
  });

  describe('bump', () => {
    it('should bump major version', () => {
      const result = versionManager.bump('0.4.2', 'major');
      expect(result.success).toBe(true);
      expect(result.oldVersion).toBe('0.4.2');
      expect(result.newVersion).toBe('1.0.0');
      expect(result.bumpType).toBe('major');
    });

    it('should bump minor version', () => {
      const result = versionManager.bump('0.4.2', 'minor');
      expect(result.success).toBe(true);
      expect(result.newVersion).toBe('0.5.0');
    });

    it('should bump patch version', () => {
      const result = versionManager.bump('0.4.2', 'patch');
      expect(result.success).toBe(true);
      expect(result.newVersion).toBe('0.4.3');
    });

    it('should bump to prerelease', () => {
      const result = versionManager.bump('0.4.2', 'prerelease', 'alpha');
      expect(result.success).toBe(true);
      expect(result.newVersion).toBe('0.4.3-alpha.0');
    });

    it('should handle versions with v prefix', () => {
      const result = versionManager.bump('v0.4.2', 'patch');
      expect(result.success).toBe(true);
      expect(result.oldVersion).toBe('0.4.2');
      expect(result.newVersion).toBe('0.4.3');
    });
  });

  describe('substitute', () => {
    it('should replace placeholders in files', async () => {
      // Create test files
      const testFile1 = path.join(tempDir, 'test1.md');
      const testFile2 = path.join(tempDir, 'test2.json');

      await fs.writeFile(
        testFile1,
        '# Version {{VERSION}}\n\nThis is version {{VERSION}} of the project.'
      );
      await fs.writeFile(
        testFile2,
        JSON.stringify({
          apiVersion: 'ossa/v{{VERSION}}',
          version: '{{VERSION}}',
        })
      );

      const result = await versionManager.substitute({
        version: '0.4.2',
        paths: ['**/*.md', '**/*.json'],
        cwd: tempDir,
      });

      expect(result.success).toBe(true);
      expect(result.versionUsed).toBe('v0.4.2');
      expect(result.filesProcessed).toBe(2);
      expect(result.replacementsMade).toBe(4);

      // Verify file contents
      const content1 = await fs.readFile(testFile1, 'utf-8');
      expect(content1).toContain('# Version v0.4.2');
      expect(content1).toContain('This is version v0.4.2 of the project.');

      const content2 = await fs.readFile(testFile2, 'utf-8');
      const json = JSON.parse(content2);
      expect(json.apiVersion).toBe('ossa/vv0.4.2');
      expect(json.version).toBe('v0.4.2');
    });

    it('should support dry run mode', async () => {
      const testFile = path.join(tempDir, 'test.md');
      await fs.writeFile(testFile, '# Version {{VERSION}}');

      const result = await versionManager.substitute({
        version: '0.4.2',
        paths: ['**/*.md'],
        cwd: tempDir,
        dryRun: true,
      });

      expect(result.success).toBe(true);
      expect(result.dryRun).toBe(true);
      expect(result.replacementsMade).toBe(1);

      // Verify file was NOT modified
      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe('# Version {{VERSION}}');
    });

    it('should handle custom placeholders', async () => {
      const testFile = path.join(tempDir, 'test.md');
      await fs.writeFile(testFile, '# Version $VERSION');

      const result = await versionManager.substitute({
        version: '0.4.2',
        paths: ['**/*.md'],
        cwd: tempDir,
        placeholder: '$VERSION',
      });

      expect(result.success).toBe(true);
      expect(result.replacementsMade).toBe(1);

      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe('# Version v0.4.2');
    });

    it('should respect exclude patterns', async () => {
      // Create files
      const includedFile = path.join(tempDir, 'included.md');
      const excludedDir = path.join(tempDir, 'node_modules');
      await fs.mkdir(excludedDir);
      const excludedFile = path.join(excludedDir, 'excluded.md');

      await fs.writeFile(includedFile, '{{VERSION}}');
      await fs.writeFile(excludedFile, '{{VERSION}}');

      const result = await versionManager.substitute({
        version: '0.4.2',
        paths: ['**/*.md'],
        exclude: ['node_modules/**'],
        cwd: tempDir,
      });

      expect(result.filesProcessed).toBe(1);
      expect(result.replacementsMade).toBe(1);

      // Verify excluded file was NOT modified
      const excludedContent = await fs.readFile(excludedFile, 'utf-8');
      expect(excludedContent).toBe('{{VERSION}}');
    });
  });

  describe('restore', () => {
    it('should restore specific version to placeholder', async () => {
      const testFile = path.join(tempDir, 'test.md');
      await fs.writeFile(testFile, '# Version v0.4.2\n\nThis is v0.4.2.');

      const result = await versionManager.restore({
        version: '0.4.2',
        paths: ['**/*.md'],
        cwd: tempDir,
      });

      expect(result.success).toBe(true);
      expect(result.replacementsMade).toBe(2);

      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe('# Version {{VERSION}}\n\nThis is {{VERSION}}.');
    });

    it('should restore all versions to placeholder', async () => {
      const testFile = path.join(tempDir, 'test.md');
      await fs.writeFile(
        testFile,
        'v0.4.2, v0.4.1, v1.0.0, and even 2.3.4'
      );

      const result = await versionManager.restore({
        restoreAll: true,
        paths: ['**/*.md'],
        cwd: tempDir,
      });

      expect(result.success).toBe(true);
      expect(result.replacementsMade).toBe(4);

      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe('{{VERSION}}, {{VERSION}}, {{VERSION}}, and even {{VERSION}}');
    });
  });

  describe('detect', () => {
    it('should detect version from package.json', async () => {
      const packageJson = path.join(tempDir, 'package.json');
      await fs.writeFile(
        packageJson,
        JSON.stringify({ name: 'test', version: '0.4.2' })
      );

      const result = await versionManager.detect({ directory: tempDir });

      expect(result.success).toBe(true);
      expect(result.version).toBe('0.4.2');
      expect(result.source).toBe('package_json');
    });

    it('should detect version from VERSION file', async () => {
      const versionFile = path.join(tempDir, 'VERSION');
      await fs.writeFile(versionFile, 'v0.4.2\n');

      const result = await versionManager.detect({ directory: tempDir });

      expect(result.success).toBe(true);
      expect(result.version).toBe('v0.4.2');
      expect(result.source).toBe('VERSION_file');
    });

    it('should throw error when no version found', async () => {
      await expect(
        versionManager.detect({ directory: tempDir })
      ).rejects.toThrow('Could not detect version from any source');
    });
  });
});
