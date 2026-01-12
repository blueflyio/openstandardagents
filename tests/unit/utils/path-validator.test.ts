/**
 * Path Validator Tests
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  validateFilePath,
  validateDirectoryPath,
  PathValidationError,
} from '../../../src/utils/path-validator';

describe('PathValidationError', () => {
  it('should be an instance of Error', () => {
    const error = new PathValidationError('test error');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('PathValidationError');
    expect(error.message).toBe('test error');
  });
});

describe('validateFilePath', () => {
  let tempDir: string;
  let tempFile: string;

  beforeEach(() => {
    // Create temp directory and file for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'path-validator-test-'));
    tempFile = path.join(tempDir, 'test.txt');
    fs.writeFileSync(tempFile, 'test content');
  });

  afterEach(() => {
    // Cleanup
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    if (fs.existsSync(tempDir)) {
      fs.rmdirSync(tempDir);
    }
  });

  it('should validate and return absolute path for valid file', () => {
    const result = validateFilePath(tempFile);
    expect(result).toBe(path.resolve(tempFile));
    expect(path.isAbsolute(result)).toBe(true);
  });

  it('should throw error for non-existent file', () => {
    const nonExistentFile = path.join(tempDir, 'non-existent.txt');
    expect(() => validateFilePath(nonExistentFile)).toThrow(PathValidationError);
    expect(() => validateFilePath(nonExistentFile)).toThrow('File not found');
  });

  it('should throw error for directory instead of file', () => {
    expect(() => validateFilePath(tempDir)).toThrow(PathValidationError);
    expect(() => validateFilePath(tempDir)).toThrow('Path is not a file');
  });

  it('should allow any path when basePath is null (default)', () => {
    // Create file in /tmp
    const tmpFile = path.join(os.tmpdir(), 'test-anywhere.txt');
    fs.writeFileSync(tmpFile, 'test');

    const result = validateFilePath(tmpFile);
    expect(result).toBe(path.resolve(tmpFile));

    // Cleanup
    fs.unlinkSync(tmpFile);
  });

  it('should prevent path traversal when basePath is provided', () => {
    const restrictedBase = tempDir;
    const outsideFile = path.join(os.tmpdir(), 'outside.txt');
    fs.writeFileSync(outsideFile, 'test');

    expect(() => validateFilePath(outsideFile, restrictedBase)).toThrow(PathValidationError);
    expect(() => validateFilePath(outsideFile, restrictedBase)).toThrow(
      'attempts to escape base directory'
    );

    // Cleanup
    fs.unlinkSync(outsideFile);
  });

  it('should allow file within basePath when basePath is provided', () => {
    const result = validateFilePath(tempFile, tempDir);
    expect(result).toBe(path.resolve(tempFile));
  });

  it('should handle relative paths correctly', () => {
    const originalCwd = process.cwd();
    try {
      process.chdir(tempDir);
      const relativeFile = 'test.txt';
      const result = validateFilePath(relativeFile);
      // Normalize paths to handle macOS /var vs /private/var symlink
      const expected = path.resolve(tempDir, relativeFile);
      // Use realpathSync to resolve symlinks for comparison
      expect(fs.realpathSync(result)).toBe(fs.realpathSync(expected));
    } finally {
      process.chdir(originalCwd);
    }
  });
});

describe('validateDirectoryPath', () => {
  let tempDir: string;
  let tempFile: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dir-validator-test-'));
    tempFile = path.join(tempDir, 'file.txt');
    fs.writeFileSync(tempFile, 'content');
  });

  afterEach(() => {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    if (fs.existsSync(tempDir)) {
      fs.rmdirSync(tempDir);
    }
  });

  it('should validate and return absolute path for valid directory', () => {
    const result = validateDirectoryPath(tempDir);
    expect(result).toBe(path.resolve(tempDir));
    expect(path.isAbsolute(result)).toBe(true);
  });

  it('should throw error for non-existent directory', () => {
    const nonExistentDir = path.join(tempDir, 'non-existent');
    expect(() => validateDirectoryPath(nonExistentDir)).toThrow(PathValidationError);
    expect(() => validateDirectoryPath(nonExistentDir)).toThrow('Directory not found');
  });

  it('should throw error for file instead of directory', () => {
    expect(() => validateDirectoryPath(tempFile)).toThrow(PathValidationError);
    expect(() => validateDirectoryPath(tempFile)).toThrow('Path is not a directory');
  });

  it('should prevent path traversal when basePath is provided', () => {
    const subDir = path.join(tempDir, 'subdir');
    fs.mkdirSync(subDir);

    const outsideDir = os.tmpdir();
    expect(() => validateDirectoryPath(outsideDir, tempDir)).toThrow(PathValidationError);
    expect(() => validateDirectoryPath(outsideDir, tempDir)).toThrow(
      'attempts to escape base directory'
    );

    // Cleanup
    fs.rmdirSync(subDir);
  });

  it('should allow directory within basePath when basePath is provided', () => {
    const subDir = path.join(tempDir, 'subdir');
    fs.mkdirSync(subDir);

    const result = validateDirectoryPath(subDir, tempDir);
    expect(result).toBe(path.resolve(subDir));

    // Cleanup
    fs.rmdirSync(subDir);
  });

  it('should handle relative paths correctly', () => {
    const originalCwd = process.cwd();
    try {
      process.chdir(tempDir);
      const result = validateDirectoryPath('.');
      // Normalize paths to handle macOS /var vs /private/var symlink
      const expected = path.resolve(tempDir);
      // Use realpathSync to resolve symlinks for comparison
      expect(fs.realpathSync(result)).toBe(fs.realpathSync(expected));
    } finally {
      process.chdir(originalCwd);
    }
  });
});
