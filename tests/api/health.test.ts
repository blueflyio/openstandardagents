import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../services/gateway/src/app';

describe('Health API', () => {
  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        version: expect.any(String),
        ossa_version: '0.1.8',
        timestamp: expect.any(String),
        services: expect.any(Object)
      });
    });

    it('should include service status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.services).toHaveProperty('agent_registry');
      expect(response.body.services).toHaveProperty('discovery_engine');
      expect(response.body.services).toHaveProperty('graphql_api');
    });

    it('should have uptime metric', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
      expect(response.body.uptime).toBeLessThanOrEqual(100);
    });
  });

  describe('GET /version', () => {
    it('should return version information', async () => {
      const response = await request(app)
        .get('/version')
        .expect(200);

      expect(response.body).toMatchObject({
        api: expect.any(String),
        ossa: '0.1.8',
        platform: expect.any(String)
      });
    });
  });
});