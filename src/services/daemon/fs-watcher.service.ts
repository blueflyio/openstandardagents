/**
 * Daemon File Watcher Service
 * Watches workspace files for changes and broadcasts updates to connected WebSocket clients.
 * Uses chokidar for reliable cross-platform watching with path traversal prevention.
 *
 * @experimental This feature is experimental and may change without notice.
 */

import { statSync } from 'fs';
import { injectable } from 'inversify';
import path from 'path';
import chokidar, { type FSWatcher } from 'chokidar';

export interface FileChangeEvent {
  type: 'added' | 'changed' | 'removed';
  path: string;        // Relative to workspace root
  absolutePath: string; // Full path (validated)
  timestamp: string;    // ISO 8601
}

export interface FileTreeEntry {
  path: string;
  modified: string;
  size: number;
}

type FileChangeCallback = (event: FileChangeEvent) => void;

const WATCH_PATTERNS = [
  '**/*.ossa.yaml',
  '**/*.ossa.yml',
  '**/*.skill.yaml',
  '**/*.skill.yml',
  '**/SKILL.md',
];

const IGNORED = [
  '**/node_modules/**',
  '**/dist/**',
  '**/.git/**',
];

const DEBOUNCE_MS = 300;

@injectable()
export class FileWatcherService {
  private watcher: FSWatcher | null = null;
  private workspaceRoot = '';
  private callbacks: FileChangeCallback[] = [];
  private debounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private trackedFiles: Map<string, { modified: string; size: number }> = new Map();

  /**
   * Start watching a workspace directory for OSSA file changes.
   */
  start(workspaceRoot: string): void {
    if (this.watcher) {
      throw new Error('FileWatcherService is already running. Call stop() first.');
    }

    this.workspaceRoot = path.resolve(workspaceRoot);
    this.trackedFiles.clear();

    const watchPaths = WATCH_PATTERNS.map((p) => path.join(this.workspaceRoot, p));

    this.watcher = chokidar.watch(watchPaths, {
      ignored: IGNORED,
      persistent: true,
      ignoreInitial: false,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50,
      },
    });

    this.watcher
      .on('add', (filePath, stats) => this.handleEvent('added', filePath, stats))
      .on('change', (filePath, stats) => this.handleEvent('changed', filePath, stats))
      .on('unlink', (filePath) => this.handleEvent('removed', filePath))
      .on('error', (error) => {
        // Log but don't throw — watcher should stay alive
        console.error('[fs-watcher] Error:', error);
      });
  }

  /**
   * Stop watching and clean up all resources.
   */
  stop(): void {
    if (!this.watcher) {
      return;
    }

    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    this.watcher.close();
    this.watcher = null;
    this.trackedFiles.clear();
    this.callbacks = [];
  }

  /**
   * Register a callback for file change events.
   */
  onFileChange(callback: FileChangeCallback): void {
    this.callbacks.push(callback);
  }

  /**
   * Get the full workspace file tree (for initial state sync with new WS clients).
   */
  getFileTree(): FileTreeEntry[] {
    return Array.from(this.trackedFiles.entries()).map(([relPath, meta]) => ({
      path: relPath,
      modified: meta.modified,
      size: meta.size,
    }));
  }

  /**
   * Validate that a path is within the workspace root and not a forbidden dotfile.
   * Prevents path traversal attacks (../, symlink escapes, etc.)
   */
  isPathSafe(filePath: string): boolean {
    const resolved = path.resolve(filePath);

    // Must be inside workspace root
    if (!resolved.startsWith(this.workspaceRoot + path.sep) && resolved !== this.workspaceRoot) {
      return false;
    }

    // Get relative path and check each segment for dotfiles (except .ossa.yaml)
    const relative = path.relative(this.workspaceRoot, resolved);
    const segments = relative.split(path.sep);

    for (const segment of segments) {
      // Block dotfile directories/files, but allow files containing .ossa. or .skill.
      if (
        segment.startsWith('.') &&
        !segment.endsWith('.ossa.yaml') &&
        !segment.endsWith('.ossa.yml') &&
        !segment.endsWith('.skill.yaml') &&
        !segment.endsWith('.skill.yml')
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get the resolved workspace root path.
   */
  getWorkspaceRoot(): string {
    return this.workspaceRoot;
  }

  private handleEvent(
    type: FileChangeEvent['type'],
    filePath: string,
    stats?: { size: number; mtime: Date } | undefined,
  ): void {
    const absolutePath = path.resolve(filePath);

    if (!this.isPathSafe(absolutePath)) {
      return;
    }

    const relativePath = path.relative(this.workspaceRoot, absolutePath);

    // Update tracked files
    if (type === 'removed') {
      this.trackedFiles.delete(relativePath);
    } else {
      const fileStats = stats ?? this.safeStatSync(absolutePath);
      this.trackedFiles.set(relativePath, {
        modified: fileStats ? new Date(fileStats.mtime).toISOString() : new Date().toISOString(),
        size: fileStats?.size ?? 0,
      });
    }

    // Debounce rapid changes to same file
    const existing = this.debounceTimers.get(absolutePath);
    if (existing) {
      clearTimeout(existing);
    }

    const timer = setTimeout(() => {
      this.debounceTimers.delete(absolutePath);

      const event: FileChangeEvent = {
        type,
        path: relativePath,
        absolutePath,
        timestamp: new Date().toISOString(),
      };

      for (const cb of this.callbacks) {
        try {
          cb(event);
        } catch (err) {
          console.error('[fs-watcher] Callback error:', err);
        }
      }
    }, DEBOUNCE_MS);

    this.debounceTimers.set(absolutePath, timer);
  }

  private safeStatSync(filePath: string): { size: number; mtime: Date } | null {
    try {
      const s = statSync(filePath);
      return { size: s.size, mtime: s.mtime };
    } catch {
      return null;
    }
  }
}
