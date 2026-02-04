/**
 * File Watcher Service
 *
 * Watches OSSA manifest files for changes and triggers callbacks
 *
 * Features:
 * - Watch specific files or directories
 * - Debounced change detection
 * - File type filtering (*.ossa.yaml, *.ossa.yml)
 * - Graceful error handling
 *
 * SOLID: Single Responsibility - File watching only
 */

import chokidar, { FSWatcher } from 'chokidar';
import path from 'path';

export interface FileWatcherOptions {
  /**
   * Paths to watch (files or directories)
   */
  paths: string[];

  /**
   * Debounce delay in milliseconds
   * @default 300
   */
  debounceMs?: number;

  /**
   * File patterns to watch
   * @default ['**\/*.ossa.{yaml,yml}']
   */
  patterns?: string[];

  /**
   * Patterns to ignore
   * @default ['**\/node_modules\/**', '**\/.git\/**']
   */
  ignored?: string[];
}

export interface FileChangeEvent {
  /**
   * Type of change
   */
  type: 'add' | 'change' | 'unlink';

  /**
   * Absolute path to changed file
   */
  path: string;

  /**
   * Timestamp of change
   */
  timestamp: Date;

  /**
   * File stats (if available)
   */
  stats?: {
    size: number;
    modified: Date;
  };
}

export type FileChangeCallback = (
  event: FileChangeEvent
) => void | Promise<void>;

/**
 * File Watcher Service
 *
 * Watches OSSA manifest files and triggers callbacks on changes
 */
export class FileWatcher {
  private watcher?: FSWatcher;
  private callbacks: FileChangeCallback[] = [];
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private options: Required<FileWatcherOptions>;

  constructor(options: FileWatcherOptions) {
    this.options = {
      debounceMs: 300,
      patterns: ['**/*.ossa.{yaml,yml}'],
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
      ],
      ...options,
    };
  }

  /**
   * Start watching files
   */
  async start(): Promise<void> {
    if (this.watcher) {
      throw new Error('FileWatcher is already running');
    }

    this.watcher = chokidar.watch(this.options.paths, {
      ignored: this.options.ignored,
      persistent: true,
      ignoreInitial: false,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50,
      },
    });

    // Watch for file events
    this.watcher
      .on('add', (filePath, stats) => {
        if (this.shouldWatch(filePath)) {
          this.handleChange('add', filePath, stats);
        }
      })
      .on('change', (filePath, stats) => {
        if (this.shouldWatch(filePath)) {
          this.handleChange('change', filePath, stats);
        }
      })
      .on('unlink', (filePath) => {
        if (this.shouldWatch(filePath)) {
          this.handleChange('unlink', filePath);
        }
      })
      .on('error', (error) => {
        console.error('FileWatcher error:', error);
      });

    // Wait for initial scan to complete
    await new Promise<void>((resolve) => {
      this.watcher!.on('ready', () => resolve());
    });
  }

  /**
   * Stop watching files
   */
  async stop(): Promise<void> {
    if (!this.watcher) {
      return;
    }

    // Clear debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    await this.watcher.close();
    this.watcher = undefined;
  }

  /**
   * Register callback for file changes
   */
  onChange(callback: FileChangeCallback): void {
    this.callbacks.push(callback);
  }

  /**
   * Remove callback
   */
  offChange(callback: FileChangeCallback): void {
    const index = this.callbacks.indexOf(callback);
    if (index >= 0) {
      this.callbacks.splice(index, 1);
    }
  }

  /**
   * Get list of watched files
   */
  getWatchedFiles(): string[] {
    if (!this.watcher) {
      return [];
    }

    const watched = this.watcher.getWatched();
    const files: string[] = [];

    for (const [dir, fileNames] of Object.entries(watched)) {
      for (const fileName of fileNames) {
        const filePath = path.join(dir, fileName);
        if (this.shouldWatch(filePath)) {
          files.push(filePath);
        }
      }
    }

    return files;
  }

  /**
   * Check if file should be watched based on patterns
   */
  private shouldWatch(filePath: string): boolean {
    const fileName = path.basename(filePath);

    // Check if matches patterns
    return this.options.patterns.some((pattern) => {
      // Simple pattern matching (*.ossa.yaml, *.ossa.yml)
      if (pattern.includes('*')) {
        const regex = new RegExp(
          pattern
            .replace(/\*\*/g, '.*')
            .replace(/\*/g, '[^/]*')
            .replace(/\./g, '\\.')
        );
        return regex.test(filePath);
      }
      return fileName === pattern;
    });
  }

  /**
   * Handle file change with debouncing
   */
  private handleChange(
    type: 'add' | 'change' | 'unlink',
    filePath: string,
    stats?: { size: number; mtime: Date }
  ): void {
    const absolutePath = path.resolve(filePath);

    // Clear existing debounce timer
    const existingTimer = this.debounceTimers.get(absolutePath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Create new debounce timer
    const timer = setTimeout(() => {
      this.debounceTimers.delete(absolutePath);

      const event: FileChangeEvent = {
        type,
        path: absolutePath,
        timestamp: new Date(),
        stats: stats
          ? {
              size: stats.size,
              modified: new Date(stats.mtime),
            }
          : undefined,
      };

      // Trigger callbacks
      this.triggerCallbacks(event);
    }, this.options.debounceMs);

    this.debounceTimers.set(absolutePath, timer);
  }

  /**
   * Trigger all registered callbacks
   */
  private async triggerCallbacks(event: FileChangeEvent): Promise<void> {
    for (const callback of this.callbacks) {
      try {
        await callback(event);
      } catch (error) {
        console.error('FileWatcher callback error:', error);
      }
    }
  }
}
