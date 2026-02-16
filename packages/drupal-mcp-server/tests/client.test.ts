/**
 * Drupal Client Tests
 */

import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { DrupalClient } from '../src/client/drupal-client';
import { AuthConfig } from '../src/types/drupal';

describe('DrupalClient', () => {
  let authConfig: AuthConfig;

  beforeEach(() => {
    authConfig = {
      type: 'oauth2',
      baseUrl: 'https://test.drupal.com',
      credentials: {
        clientId: 'test-client',
        clientSecret: 'test-secret',
      },
    };
  });

  test('should create client with OAuth2 auth', () => {
    expect(() => new DrupalClient(authConfig)).not.toThrow();
  });

  test('should create client with API key auth', () => {
    const apiKeyConfig: AuthConfig = {
      type: 'api-key',
      baseUrl: 'https://test.drupal.com',
      credentials: {
        apiKey: 'test-key',
      },
    };

    expect(() => new DrupalClient(apiKeyConfig)).not.toThrow();
  });

  test('should create client with JWT auth', () => {
    const jwtConfig: AuthConfig = {
      type: 'jwt',
      baseUrl: 'https://test.drupal.com',
      credentials: {
        token: 'test-token',
      },
    };

    expect(() => new DrupalClient(jwtConfig)).not.toThrow();
  });

  test('should throw error for invalid auth type', () => {
    const invalidConfig = {
      type: 'invalid' as any,
      baseUrl: 'https://test.drupal.com',
      credentials: {},
    };

    expect(() => new DrupalClient(invalidConfig)).toThrow('Unsupported auth type');
  });

  test('should build JSON:API query params', () => {
    const client = new DrupalClient(authConfig);

    const query = client.buildJsonApiQuery({
      filter: { status: true, type: 'article' },
      sort: { created: 'DESC' },
      page: { limit: 10, offset: 0 },
      include: ['uid', 'field_image'],
    });

    expect(query['filter[status]']).toBe(true);
    expect(query['filter[type]']).toBe('article');
    expect(query.sort).toBe('-created');
    expect(query['page[limit]']).toBe(10);
    // Note: offset of 0 is not included in query params (falsy value)
    expect(query.include).toBe('uid,field_image');
  });
});
