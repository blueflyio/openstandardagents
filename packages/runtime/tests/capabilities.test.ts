/**
 * Tests for CapabilityRegistry
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { CapabilityRegistry } from '../src/capabilities';
import type { Capability, CapabilityHandler } from '../src/types';

describe('CapabilityRegistry', () => {
  let registry: CapabilityRegistry;

  beforeEach(() => {
    registry = new CapabilityRegistry();
  });

  describe('register', () => {
    it('should register a capability with handler', () => {
      const capability: Capability = {
        name: 'test',
        description: 'Test capability',
        input_schema: { type: 'object' },
        output_schema: { type: 'object' },
      };

      const handler: CapabilityHandler = async (input) => ({ result: 'ok' });

      registry.register(capability, handler);

      expect(registry.has('test')).toBe(true);
      expect(registry.get('test')).toEqual(capability);
      expect(registry.getHandler('test')).toBe(handler);
    });

    it('should throw error if capability name is missing', () => {
      const capability = {
        name: '',
        description: 'Test',
        input_schema: {},
        output_schema: {},
      } as Capability;

      const handler: CapabilityHandler = async () => ({});

      expect(() => registry.register(capability, handler)).toThrow(
        'Capability name is required'
      );
    });

    it('should throw error if handler is not a function', () => {
      const capability: Capability = {
        name: 'test',
        description: 'Test',
        input_schema: {},
        output_schema: {},
      };

      expect(() => registry.register(capability, 'not a function' as any)).toThrow(
        'Capability handler must be a function'
      );
    });
  });

  describe('get', () => {
    it('should return capability if exists', () => {
      const capability: Capability = {
        name: 'test',
        description: 'Test',
        input_schema: {},
        output_schema: {},
      };

      registry.register(capability, async () => ({}));

      expect(registry.get('test')).toEqual(capability);
    });

    it('should return undefined if capability does not exist', () => {
      expect(registry.get('nonexistent')).toBeUndefined();
    });
  });

  describe('has', () => {
    it('should return true if capability exists', () => {
      const capability: Capability = {
        name: 'test',
        description: 'Test',
        input_schema: {},
        output_schema: {},
      };

      registry.register(capability, async () => ({}));

      expect(registry.has('test')).toBe(true);
    });

    it('should return false if capability does not exist', () => {
      expect(registry.has('nonexistent')).toBe(false);
    });
  });

  describe('remove', () => {
    it('should remove capability and handler', () => {
      const capability: Capability = {
        name: 'test',
        description: 'Test',
        input_schema: {},
        output_schema: {},
      };

      registry.register(capability, async () => ({}));
      const removed = registry.remove('test');

      expect(removed).toBe(true);
      expect(registry.has('test')).toBe(false);
      expect(registry.get('test')).toBeUndefined();
      expect(registry.getHandler('test')).toBeUndefined();
    });

    it('should return false if capability does not exist', () => {
      expect(registry.remove('nonexistent')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all capabilities', () => {
      registry.register(
        { name: 'cap1', description: 'Test', input_schema: {}, output_schema: {} },
        async () => ({})
      );
      registry.register(
        { name: 'cap2', description: 'Test', input_schema: {}, output_schema: {} },
        async () => ({})
      );

      expect(registry.size).toBe(2);

      registry.clear();

      expect(registry.size).toBe(0);
      expect(registry.has('cap1')).toBe(false);
      expect(registry.has('cap2')).toBe(false);
    });
  });

  describe('getAll', () => {
    it('should return all capabilities', () => {
      const cap1: Capability = {
        name: 'cap1',
        description: 'Test',
        input_schema: {},
        output_schema: {},
      };
      const cap2: Capability = {
        name: 'cap2',
        description: 'Test',
        input_schema: {},
        output_schema: {},
      };

      registry.register(cap1, async () => ({}));
      registry.register(cap2, async () => ({}));

      const all = registry.getAll();

      expect(all.size).toBe(2);
      expect(all.get('cap1')).toEqual(cap1);
      expect(all.get('cap2')).toEqual(cap2);
    });
  });

  describe('getNames', () => {
    it('should return all capability names', () => {
      registry.register(
        { name: 'cap1', description: 'Test', input_schema: {}, output_schema: {} },
        async () => ({})
      );
      registry.register(
        { name: 'cap2', description: 'Test', input_schema: {}, output_schema: {} },
        async () => ({})
      );

      const names = registry.getNames();

      expect(names).toEqual(['cap1', 'cap2']);
    });
  });

  describe('validateCapability', () => {
    it('should validate a valid capability', () => {
      const capability: Capability = {
        name: 'test',
        description: 'Test capability',
        input_schema: { type: 'object' },
        output_schema: { type: 'object' },
      };

      expect(registry.validateCapability(capability)).toBe(true);
    });

    it('should throw error if name is missing', () => {
      const capability = {
        description: 'Test',
        input_schema: {},
        output_schema: {},
      } as Capability;

      expect(() => registry.validateCapability(capability)).toThrow(
        'Capability must have a valid name'
      );
    });

    it('should throw error if description is missing', () => {
      const capability = {
        name: 'test',
        input_schema: {},
        output_schema: {},
      } as Capability;

      expect(() => registry.validateCapability(capability)).toThrow(
        'Capability test must have a description'
      );
    });

    it('should throw error if input_schema is missing', () => {
      const capability = {
        name: 'test',
        description: 'Test',
        output_schema: {},
      } as Capability;

      expect(() => registry.validateCapability(capability)).toThrow(
        'Capability test must have an input_schema'
      );
    });

    it('should throw error if output_schema is missing', () => {
      const capability = {
        name: 'test',
        description: 'Test',
        input_schema: {},
      } as Capability;

      expect(() => registry.validateCapability(capability)).toThrow(
        'Capability test must have an output_schema'
      );
    });
  });
});
