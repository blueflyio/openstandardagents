/**
 * Tool Tests
 */

import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { contentToolDefinitions } from '../src/tools/content';
import { entityToolDefinitions } from '../src/tools/entities';
import { viewsToolDefinitions } from '../src/tools/views';
import { userToolDefinitions } from '../src/tools/users';
import { configToolDefinitions } from '../src/tools/config';
import { moduleToolDefinitions } from '../src/tools/modules';
import { cacheToolDefinitions } from '../src/tools/cache';

describe('Tool Definitions', () => {
  test('should have 5 content tools', () => {
    expect(contentToolDefinitions).toHaveLength(5);
    expect(contentToolDefinitions.map((t) => t.name)).toEqual([
      'drupal_create_node',
      'drupal_update_node',
      'drupal_delete_node',
      'drupal_get_node',
      'drupal_search_content',
    ]);
  });

  test('should have 4 entity tools', () => {
    expect(entityToolDefinitions).toHaveLength(4);
    expect(entityToolDefinitions.map((t) => t.name)).toEqual([
      'drupal_create_entity',
      'drupal_update_entity',
      'drupal_delete_entity',
      'drupal_query_entities',
    ]);
  });

  test('should have 2 views tools', () => {
    expect(viewsToolDefinitions).toHaveLength(2);
    expect(viewsToolDefinitions.map((t) => t.name)).toEqual([
      'drupal_execute_view',
      'drupal_get_view_results',
    ]);
  });

  test('should have 3 user tools', () => {
    expect(userToolDefinitions).toHaveLength(3);
    expect(userToolDefinitions.map((t) => t.name)).toEqual([
      'drupal_create_user',
      'drupal_update_user',
      'drupal_get_user',
    ]);
  });

  test('should have 2 config tools', () => {
    expect(configToolDefinitions).toHaveLength(2);
    expect(configToolDefinitions.map((t) => t.name)).toEqual([
      'drupal_get_config',
      'drupal_set_config',
    ]);
  });

  test('should have 3 module tools', () => {
    expect(moduleToolDefinitions).toHaveLength(3);
    expect(moduleToolDefinitions.map((t) => t.name)).toEqual([
      'drupal_list_modules',
      'drupal_enable_module',
      'drupal_disable_module',
    ]);
  });

  test('should have 2 cache tools', () => {
    expect(cacheToolDefinitions).toHaveLength(2);
    expect(cacheToolDefinitions.map((t) => t.name)).toEqual([
      'drupal_clear_cache',
      'drupal_rebuild_cache',
    ]);
  });

  test('should have 21 total tools', () => {
    const allTools = [
      ...contentToolDefinitions,
      ...entityToolDefinitions,
      ...viewsToolDefinitions,
      ...userToolDefinitions,
      ...configToolDefinitions,
      ...moduleToolDefinitions,
      ...cacheToolDefinitions,
    ];

    expect(allTools).toHaveLength(21);
  });

  test('all tools should have required properties', () => {
    const allTools = [
      ...contentToolDefinitions,
      ...entityToolDefinitions,
      ...viewsToolDefinitions,
      ...userToolDefinitions,
      ...configToolDefinitions,
      ...moduleToolDefinitions,
      ...cacheToolDefinitions,
    ];

    allTools.forEach((tool) => {
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('description');
      expect(tool).toHaveProperty('inputSchema');
      expect(tool.inputSchema).toHaveProperty('type');
      expect(tool.inputSchema).toHaveProperty('properties');
    });
  });

  test('all tool names should be unique', () => {
    const allTools = [
      ...contentToolDefinitions,
      ...entityToolDefinitions,
      ...viewsToolDefinitions,
      ...userToolDefinitions,
      ...configToolDefinitions,
      ...moduleToolDefinitions,
      ...cacheToolDefinitions,
    ];

    const names = allTools.map((t) => t.name);
    const uniqueNames = new Set(names);

    expect(names.length).toBe(uniqueNames.size);
  });
});
