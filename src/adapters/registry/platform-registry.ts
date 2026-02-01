/**
 * Platform Registry
 *
 * Central registry for all export platform adapters.
 * Provides discovery, registration, and management of adapters.
 *
 * SOLID: Single Responsibility - Manages adapter registration only
 * DRY: Central place for all adapter management
 */

import type { PlatformAdapter } from '../base/adapter.interface.js';

/**
 * Platform Registry Singleton
 */
export class PlatformRegistry {
  private static instance: PlatformRegistry;
  private adapters: Map<string, PlatformAdapter> = new Map();

  private constructor() {}

  /**
   * Get registry instance (singleton)
   */
  static getInstance(): PlatformRegistry {
    if (!PlatformRegistry.instance) {
      PlatformRegistry.instance = new PlatformRegistry();
    }
    return PlatformRegistry.instance;
  }

  /**
   * Register a platform adapter
   */
  register(adapter: PlatformAdapter): void {
    if (this.adapters.has(adapter.platform)) {
      throw new Error(`Adapter already registered: ${adapter.platform}`);
    }
    this.adapters.set(adapter.platform, adapter);
  }

  /**
   * Unregister a platform adapter
   */
  unregister(platform: string): boolean {
    return this.adapters.delete(platform);
  }

  /**
   * Get adapter by platform name
   */
  getAdapter(platform: string): PlatformAdapter | undefined {
    return this.adapters.get(platform);
  }

  /**
   * Get all registered adapters
   */
  getAllAdapters(): PlatformAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Get all platform names
   */
  getPlatforms(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Check if platform is registered
   */
  has(platform: string): boolean {
    return this.adapters.has(platform);
  }

  /**
   * Get number of registered adapters
   */
  get size(): number {
    return this.adapters.size;
  }

  /**
   * Clear all registered adapters
   */
  clear(): void {
    this.adapters.clear();
  }

  /**
   * Get adapter info for CLI display
   */
  getAdapterInfo() {
    return this.getAllAdapters().map((adapter) => ({
      platform: adapter.platform,
      displayName: adapter.displayName,
      description: adapter.description,
      supportedVersions: adapter.supportedVersions,
    }));
  }
}

/**
 * Get the global registry instance
 */
export const registry = PlatformRegistry.getInstance();
