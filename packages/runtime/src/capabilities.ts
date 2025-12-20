/**
 * OSSA Runtime Capability Registry
 * Manages capability definitions and their handlers
 */

import type {
  Capability,
  CapabilityHandler,
  CapabilityRegistry as ICapabilityRegistry,
} from './types.js';

/**
 * Default capability registry implementation
 */
export class CapabilityRegistry implements ICapabilityRegistry {
  private capabilities: Map<string, Capability> = new Map();
  private handlers: Map<string, CapabilityHandler> = new Map();

  /**
   * Register a capability with its handler
   */
  register(capability: Capability, handler: CapabilityHandler): void {
    if (!capability.name) {
      throw new Error('Capability name is required');
    }

    if (typeof handler !== 'function') {
      throw new Error('Capability handler must be a function');
    }

    this.capabilities.set(capability.name, capability);
    this.handlers.set(capability.name, handler);
  }

  /**
   * Get a capability by name
   */
  get(name: string): Capability | undefined {
    return this.capabilities.get(name);
  }

  /**
   * Get capability handler by name
   */
  getHandler(name: string): CapabilityHandler | undefined {
    return this.handlers.get(name);
  }

  /**
   * Check if capability exists
   */
  has(name: string): boolean {
    return this.capabilities.has(name);
  }

  /**
   * Get all capabilities
   */
  getAll(): Map<string, Capability> {
    return new Map(this.capabilities);
  }

  /**
   * Remove a capability
   */
  remove(name: string): boolean {
    const hadCapability = this.capabilities.has(name);
    this.capabilities.delete(name);
    this.handlers.delete(name);
    return hadCapability;
  }

  /**
   * Clear all capabilities
   */
  clear(): void {
    this.capabilities.clear();
    this.handlers.clear();
  }

  /**
   * Get the number of registered capabilities
   */
  get size(): number {
    return this.capabilities.size;
  }

  /**
   * Get all capability names
   */
  getNames(): string[] {
    return Array.from(this.capabilities.keys());
  }

  /**
   * Validate capability schema
   */
  validateCapability(capability: Capability): boolean {
    if (!capability.name || typeof capability.name !== 'string') {
      throw new Error('Capability must have a valid name');
    }

    if (!capability.description || typeof capability.description !== 'string') {
      throw new Error(`Capability ${capability.name} must have a description`);
    }

    if (!capability.input_schema) {
      throw new Error(
        `Capability ${capability.name} must have an input_schema`
      );
    }

    if (!capability.output_schema) {
      throw new Error(
        `Capability ${capability.name} must have an output_schema`
      );
    }

    return true;
  }
}

/**
 * Create a new capability registry instance
 */
export function createCapabilityRegistry(): CapabilityRegistry {
  return new CapabilityRegistry();
}
