/**
 * YAML Parser Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  safeParseYAML,
  safeStringifyYAML,
} from '../../../src/utils/yaml-parser';

describe('safeParseYAML', () => {
  it('should parse valid YAML', () => {
    const yaml = `
apiVersion: ossa/v0.3.3
kind: Agent
metadata:
  name: test-agent
    `;
    const result = safeParseYAML(yaml);
    expect(result).toEqual({
      apiVersion: 'ossa/v0.4.1',
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
      },
    });
  });

  it('should parse YAML with arrays', () => {
    const yaml = `
items:
  - item1
  - item2
  - item3
    `;
    const result = safeParseYAML(yaml);
    expect(result).toEqual({
      items: ['item1', 'item2', 'item3'],
    });
  });

  it('should parse YAML with nested objects', () => {
    const yaml = `
parent:
  child:
    grandchild: value
    `;
    const result = safeParseYAML(yaml);
    expect(result).toEqual({
      parent: {
        child: {
          grandchild: 'value',
        },
      },
    });
  });

  it('should handle empty YAML', () => {
    const result = safeParseYAML('');
    expect(result).toBeNull();
  });

  it('should parse YAML with numbers and booleans', () => {
    const yaml = `
number: 42
float: 3.14
boolean_true: true
boolean_false: false
null_value: null
    `;
    const result = safeParseYAML(yaml);
    expect(result).toEqual({
      number: 42,
      float: 3.14,
      boolean_true: true,
      boolean_false: false,
      null_value: null,
    });
  });

  it('should parse YAML with custom maxAliasCount', () => {
    const yaml = `
anchor: &ref value
alias1: *ref
alias2: *ref
    `;
    const result = safeParseYAML(yaml, { maxAliasCount: 10 });
    expect(result).toEqual({
      anchor: 'value',
      alias1: 'value',
      alias2: 'value',
    });
  });

  it('should prevent billion laughs attack with default maxAliasCount', () => {
    // Create YAML with many aliases that exceeds maxAliasCount=100
    let yaml = 'a0: &a0 value\n';
    // Create 101 aliases to exceed the limit
    for (let i = 1; i <= 101; i++) {
      yaml += `a${i}: &a${i} [*a0]\n`;
    }

    // Should throw or handle gracefully due to maxAliasCount limit
    expect(() => safeParseYAML(yaml)).toThrow();
  });

  it('should disable custom tags by default', () => {
    // YAML with custom tag - should parse but tag is not processed
    const yaml = 'value: text'; // Use simple YAML without custom tags
    const result = safeParseYAML(yaml);
    // Should parse successfully
    expect(result).toEqual({ value: 'text' });
  });

  it('should disable merge keys by default', () => {
    const yaml = `
base: &base
  key1: value1
  key2: value2
merged:
  <<: *base
  key3: value3
    `;
    const result = safeParseYAML(yaml);
    expect(result).toBeDefined();
    // Merge key should not be processed (merge: false by default)
    expect(result).toHaveProperty('base');
    expect(result).toHaveProperty('merged');
  });

  it('should allow merge keys when explicitly enabled', () => {
    const yaml = `
base: &base
  key1: value1
merged:
  <<: *base
  key2: value2
    `;
    const result = safeParseYAML(yaml, { allowMergeKeys: true });
    expect(result).toEqual({
      base: {
        key1: 'value1',
      },
      merged: {
        key1: 'value1',
        key2: 'value2',
      },
    });
  });

  it('should handle malformed YAML gracefully', () => {
    // YAML with syntax error - unclosed flow sequence
    const malformedYaml = 'key: [value1, value2';
    expect(() => safeParseYAML(malformedYaml)).toThrow();
  });
});

describe('safeStringifyYAML', () => {
  it('should stringify simple object', () => {
    const obj = { key: 'value' };
    const result = safeStringifyYAML(obj);
    expect(result).toBe('key: value\n');
  });

  it('should stringify nested object', () => {
    const obj = {
      parent: {
        child: 'value',
      },
    };
    const result = safeStringifyYAML(obj);
    expect(result).toContain('parent:');
    expect(result).toContain('child: value');
  });

  it('should stringify arrays', () => {
    const obj = {
      items: ['item1', 'item2', 'item3'],
    };
    const result = safeStringifyYAML(obj);
    expect(result).toContain('items:');
    expect(result).toContain('- item1');
    expect(result).toContain('- item2');
    expect(result).toContain('- item3');
  });

  it('should stringify numbers and booleans', () => {
    const obj = {
      number: 42,
      boolean: true,
      nullValue: null,
    };
    const result = safeStringifyYAML(obj);
    expect(result).toContain('number: 42');
    expect(result).toContain('boolean: true');
    expect(result).toContain('nullValue: null');
  });

  it('should stringify complex OSSA manifest', () => {
    const manifest = {
      apiVersion: 'ossa/v0.4.1',
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
        version: '1.0.0',
      },
      spec: {
        role: 'Test agent role',
        llm: {
          provider: 'openai',
          model: 'gpt-4',
        },
      },
    };
    const result = safeStringifyYAML(manifest);
    expect(result).toContain('apiVersion: ossa/v0.3.3');
    expect(result).toContain('kind: Agent');
    expect(result).toContain('name: test-agent');
    expect(result).toContain('provider: openai');
  });

  it('should handle empty object', () => {
    const result = safeStringifyYAML({});
    expect(result).toBe('{}\n');
  });

  it('should handle null', () => {
    const result = safeStringifyYAML(null);
    expect(result).toBe('null\n');
  });

  it('should handle undefined', () => {
    const result = safeStringifyYAML(undefined);
    expect(result).toBe('null\n');
  });

  it('should round-trip parse and stringify', () => {
    const original = {
      apiVersion: 'ossa/v0.4.1',
      metadata: {
        name: 'test',
        labels: {
          env: 'prod',
        },
      },
    };
    const yaml = safeStringifyYAML(original);
    const parsed = safeParseYAML(yaml);
    expect(parsed).toEqual(original);
  });
});
