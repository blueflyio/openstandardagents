import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/services/gateway/src/app';
import { validAgentSpec, invalidAgentSpec } from '../fixtures/agent-specs';

describe('Agents API', () => {
  describe('GET /agents', () => {
    it('should return empty array initially', async () => {
      const response = await request(app)
        .get('/agents')
        .expect(200);

      expect(response.body).toMatchObject({
        agents: [],
        total: 0,
        limit: 20,
        offset: 0
      });
    });

    it('should respect limit parameter', async () => {
      // First register some test agents
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/agents')
          .set('X-API-Key', 'test-key')
          .send({
            ...validAgentSpec,
            name: `Test Agent ${i}`
          });
      }

      const response = await request(app)
        .get('/agents?limit=3')
        .expect(200);

      expect(response.body.agents).toHaveLength(3);
      expect(response.body.limit).toBe(3);
    });

    it('should filter by class parameter', async () => {
      await request(app)
        .post('/agents')
        .set('X-API-Key', 'test-key')
        .send({
          ...validAgentSpec,
          name: 'Specialist Agent',
          spec: { ...validAgentSpec.spec, class: 'specialist' }
        });

      await request(app)
        .post('/agents')
        .set('X-API-Key', 'test-key')
        .send({
          ...validAgentSpec,
          name: 'General Agent',
          spec: { ...validAgentSpec.spec, class: 'general' }
        });

      const response = await request(app)
        .get('/agents?class=specialist')
        .expect(200);

      expect(response.body.agents).toHaveLength(1);
      expect(response.body.agents[0].spec.class).toBe('specialist');
    });
  });

  describe('POST /agents', () => {
    it('should register a new agent', async () => {
      const response = await request(app)
        .post('/agents')
        .set('X-API-Key', 'test-key')
        .send(validAgentSpec)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: validAgentSpec.name,
        version: validAgentSpec.version,
        spec: validAgentSpec.spec,
        registered_at: expect.any(String)
      });
    });

    it('should reject invalid agent spec', async () => {
      const response = await request(app)
        .post('/agents')
        .set('X-API-Key', 'test-key')
        .send(invalidAgentSpec)
        .expect(400);

      expect(response.body.error).toContain('validation');
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/agents')
        .send(validAgentSpec)
        .expect(401);
    });

    it('should prevent duplicate agent registration', async () => {
      // Register first agent
      await request(app)
        .post('/agents')
        .set('X-API-Key', 'test-key')
        .send(validAgentSpec)
        .expect(201);

      // Attempt to register duplicate
      await request(app)
        .post('/agents')
        .set('X-API-Key', 'test-key')
        .send(validAgentSpec)
        .expect(409);
    });
  });

  describe('GET /agents/:id', () => {
    it('should return agent details', async () => {
      const createResponse = await request(app)
        .post('/agents')
        .set('X-API-Key', 'test-key')
        .send(validAgentSpec);

      const agentId = createResponse.body.id;

      const response = await request(app)
        .get(`/agents/${agentId}`)
        .expect(200);

      expect(response.body.id).toBe(agentId);
      expect(response.body.name).toBe(validAgentSpec.name);
    });

    it('should return 404 for non-existent agent', async () => {
      await request(app)
        .get('/agents/non-existent-id')
        .expect(404);
    });
  });

  describe('PUT /agents/:id', () => {
    it('should update agent', async () => {
      const createResponse = await request(app)
        .post('/agents')
        .set('X-API-Key', 'test-key')
        .send(validAgentSpec);

      const agentId = createResponse.body.id;
      const updateData = {
        version: '2.0.0',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/agents/${agentId}`)
        .set('X-API-Key', 'test-key')
        .send(updateData)
        .expect(200);

      expect(response.body.version).toBe('2.0.0');
      expect(response.body.description).toBe('Updated description');
    });

    it('should require authentication', async () => {
      await request(app)
        .put('/agents/some-id')
        .send({ version: '2.0.0' })
        .expect(401);
    });
  });

  describe('DELETE /agents/:id', () => {
    it('should unregister agent', async () => {
      const createResponse = await request(app)
        .post('/agents')
        .set('X-API-Key', 'test-key')
        .send(validAgentSpec);

      const agentId = createResponse.body.id;

      await request(app)
        .delete(`/agents/${agentId}`)
        .set('X-API-Key', 'test-key')
        .expect(204);

      // Verify agent is deleted
      await request(app)
        .get(`/agents/${agentId}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app)
        .delete('/agents/some-id')
        .expect(401);
    });
  });
});