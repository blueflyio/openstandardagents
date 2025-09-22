import { FastifyPluginAsync } from 'fastify';
import { Static, Type } from '@sinclair/typebox';
import { AgentSchema, AgentCreateSchema, AgentUpdateSchema } from '../schemas/agent';
import { AgentService } from '../services/agent-service';
import { PaginationSchema } from '../schemas/common';

const plugin: FastifyPluginAsync = async (fastify) => {
  const agentService = new AgentService(fastify.db);

  // GET /agents - List all agents with pagination
  fastify.get('/agents', {
    schema: {
      querystring: PaginationSchema,
      response: {
        200: Type.Object({
          data: Type.Array(AgentSchema),
          meta: Type.Object({
            total: Type.Number(),
            page: Type.Number(),
            limit: Type.Number()
          })
        })
      }
    }
  }, async (request, reply) => {
    const { page = 1, limit = 20, sort = 'created_at', order = 'desc' } = request.query as any;
    const agents = await agentService.list({ page, limit, sort, order });
    return reply.send(agents);
  });

  // POST /agents - Create new agent
  fastify.post('/agents', {
    schema: {
      body: AgentCreateSchema,
      response: {
        201: AgentSchema
      }
    }
  }, async (request, reply) => {
    const agent = await agentService.create(request.body as any);
    return reply.code(201).send(agent);
  });

  // GET /agents/:id - Get single agent
  fastify.get('/agents/:id', {
    schema: {
      params: Type.Object({
        id: Type.String({ format: 'uuid' })
      }),
      response: {
        200: AgentSchema,
        404: Type.Object({
          error: Type.String()
        })
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as any;
    const agent = await agentService.getById(id);

    if (!agent) {
      return reply.code(404).send({ error: 'Agent not found' });
    }

    return reply.send(agent);
  });

  // PUT /agents/:id - Update agent
  fastify.put('/agents/:id', {
    schema: {
      params: Type.Object({
        id: Type.String({ format: 'uuid' })
      }),
      body: AgentUpdateSchema,
      response: {
        200: AgentSchema,
        404: Type.Object({
          error: Type.String()
        })
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as any;
    const agent = await agentService.update(id, request.body as any);

    if (!agent) {
      return reply.code(404).send({ error: 'Agent not found' });
    }

    return reply.send(agent);
  });

  // DELETE /agents/:id - Delete agent
  fastify.delete('/agents/:id', {
    schema: {
      params: Type.Object({
        id: Type.String({ format: 'uuid' })
      }),
      response: {
        204: Type.Null(),
        404: Type.Object({
          error: Type.String()
        })
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as any;
    const deleted = await agentService.delete(id);

    if (!deleted) {
      return reply.code(404).send({ error: 'Agent not found' });
    }

    return reply.code(204).send();
  });

  // POST /agents/:id/validate - Validate agent configuration
  fastify.post('/agents/:id/validate', {
    schema: {
      params: Type.Object({
        id: Type.String({ format: 'uuid' })
      }),
      response: {
        200: Type.Object({
          valid: Type.Boolean(),
          errors: Type.Optional(Type.Array(Type.String())),
          warnings: Type.Optional(Type.Array(Type.String()))
        })
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as any;
    const validation = await agentService.validate(id);
    return reply.send(validation);
  });

  // POST /agents/:id/deploy - Deploy agent
  fastify.post('/agents/:id/deploy', {
    schema: {
      params: Type.Object({
        id: Type.String({ format: 'uuid' })
      }),
      body: Type.Object({
        environment: Type.String({ enum: ['development', 'staging', 'production'] })
      }),
      response: {
        200: Type.Object({
          deploymentId: Type.String(),
          status: Type.String(),
          url: Type.String()
        })
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { environment } = request.body as any;
    const deployment = await agentService.deploy(id, environment);
    return reply.send(deployment);
  });
};

export default plugin;