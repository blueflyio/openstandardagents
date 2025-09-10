/**
 * OSSA Fastify Server Template with OpenAPI 3.1 Strict Compliance
 * Replaces Express.js architecture for enhanced performance and type safety
 */

import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import fastifyHelmet from '@fastify/helmet'
import fastifyCors from '@fastify/cors'
import fastifyCompress from '@fastify/compress'
import fastifyRateLimit from '@fastify/rate-limit'
import { Type, Static } from '@sinclair/typebox'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'

export interface OSSAFastifyServerConfig {
  host: string
  port: number
  environment: 'development' | 'production' | 'test'
  agentName: string
  ossaVersion: string
  openApiSpec: object
  corsOrigins?: string[]
  rateLimitMax?: number
  rateLimitWindow?: string
}

// OpenAPI 3.1 compliant schema with JSON Schema Draft 2020-12
const AgentCapabilitiesSchema = Type.Object({
  agentId: Type.String({ format: 'uuid' }),
  name: Type.String({ minLength: 3, maxLength: 50 }),
  version: Type.String({ pattern: '^\\d+\\.\\d+\\.\\d+$' }),
  capabilities: Type.Array(Type.String()),
  endpoints: Type.Array(Type.Object({
    path: Type.String(),
    method: Type.Union([
      Type.Literal('GET'),
      Type.Literal('POST'),
      Type.Literal('PUT'),
      Type.Literal('DELETE'),
      Type.Literal('PATCH')
    ]),
    description: Type.String()
  })),
  healthStatus: Type.Union([
    Type.Literal('healthy'),
    Type.Literal('degraded'),
    Type.Literal('unhealthy')
  ]),
  lastHealthCheck: Type.String({ format: 'date-time' }),
  metadata: Type.Object({
    conformanceTier: Type.Union([
      Type.Literal('bronze'),
      Type.Literal('silver'),
      Type.Literal('gold')
    ]),
    protocols: Type.Array(Type.String()),
    frameworks: Type.Array(Type.String())
  })
})

type AgentCapabilities = Static<typeof AgentCapabilitiesSchema>

export class OSSAFastifyServer {
  private fastify: FastifyInstance
  private config: OSSAFastifyServerConfig

  constructor(config: OSSAFastifyServerConfig) {
    this.config = config
    this.fastify = Fastify({
      logger: {
        level: config.environment === 'production' ? 'warn' : 'info'
      }
    }).withTypeProvider<TypeBoxTypeProvider>()
    
    this.setupMiddleware()
    this.setupOpenAPI()
    this.setupRoutes()
  }

  private setupMiddleware(): void {
    // Security headers
    this.fastify.register(fastifyHelmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"]
        }
      }
    })

    // CORS configuration
    this.fastify.register(fastifyCors, {
      origin: this.config.corsOrigins || ['http://localhost:3000'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Agent-ID']
    })

    // Compression
    this.fastify.register(fastifyCompress, {
      global: true
    })

    // Rate limiting
    this.fastify.register(fastifyRateLimit, {
      max: this.config.rateLimitMax || 100,
      timeWindow: this.config.rateLimitWindow || '1 minute'
    })
  }

  private setupOpenAPI(): void {
    // OpenAPI 3.1 specification with JSON Schema Draft 2020-12
    this.fastify.register(fastifySwagger, {
      openapi: {
        openapi: '3.1.0',
        info: {
          title: `OSSA Agent: ${this.config.agentName}`,
          description: `OSSA compliant agent server with OpenAPI 3.1 strict compliance`,
          version: this.config.ossaVersion,
          contact: {
            name: 'OSSA Community',
            url: 'https://ossa-standard.org'
          },
          license: {
            name: 'Apache-2.0',
            identifier: 'Apache-2.0'
          }
        },
        servers: [{
          url: `http://${this.config.host}:${this.config.port}`,
          description: `${this.config.environment} server`
        }],
        components: {
          securitySchemes: {
            ApiKeyAuth: {
              type: 'apiKey',
              in: 'header',
              name: 'X-API-Key'
            },
            BearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT'
            }
          }
        },
        security: [
          { ApiKeyAuth: [] },
          { BearerAuth: [] }
        ]
      }
    })

    // Swagger UI
    this.fastify.register(fastifySwaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'full',
        deepLinking: false
      },
      staticCSP: true,
      transformStaticCSP: (header) => header,
      transformSpecification: (swaggerObject) => {
        return swaggerObject
      },
      transformSpecificationClone: true
    })
  }

  private setupRoutes(): void {
    // Health check endpoint - OSSA compliant
    this.fastify.get('/health', {
      schema: {
        description: 'Health check endpoint',
        tags: ['Health'],
        response: {
          200: Type.Object({
            status: Type.Literal('healthy'),
            timestamp: Type.String({ format: 'date-time' }),
            version: Type.String(),
            agent: Type.String()
          })
        }
      }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      return {
        status: 'healthy' as const,
        timestamp: new Date().toISOString(),
        version: this.config.ossaVersion,
        agent: this.config.agentName
      }
    })

    // Capabilities endpoint - OSSA Discovery Protocol
    this.fastify.get('/capabilities', {
      schema: {
        description: 'Get agent capabilities',
        tags: ['Discovery'],
        response: {
          200: AgentCapabilitiesSchema
        }
      }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      return this.getAgentCapabilities()
    })

    // UADP Discovery endpoint
    this.fastify.get('/discover', {
      schema: {
        description: 'UADP discovery endpoint',
        tags: ['Discovery'],
        querystring: Type.Object({
          protocol: Type.Optional(Type.String()),
          capability: Type.Optional(Type.String()),
          tier: Type.Optional(Type.Union([
            Type.Literal('bronze'),
            Type.Literal('silver'),
            Type.Literal('gold')
          ]))
        }),
        response: {
          200: Type.Object({
            agents: Type.Array(AgentCapabilitiesSchema),
            discoveryMetadata: Type.Object({
              totalAgents: Type.Number(),
              protocolsSupported: Type.Array(Type.String()),
              discoveryTimestamp: Type.String({ format: 'date-time' })
            })
          })
        }
      }
    }, async (request: FastifyRequest<{
      Querystring: {
        protocol?: string
        capability?: string
        tier?: 'bronze' | 'silver' | 'gold'
      }
    }>, reply: FastifyReply) => {
      // Discovery logic would be implemented here
      return {
        agents: [this.getAgentCapabilities()],
        discoveryMetadata: {
          totalAgents: 1,
          protocolsSupported: ['openapi', 'mcp', 'uadp'],
          discoveryTimestamp: new Date().toISOString()
        }
      }
    })

    // OpenAPI spec endpoint
    this.fastify.get('/openapi.json', {
      schema: {
        hide: true
      }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      return this.fastify.swagger()
    })
  }

  private getAgentCapabilities(): AgentCapabilities {
    return {
      agentId: crypto.randomUUID(),
      name: this.config.agentName,
      version: this.config.ossaVersion,
      capabilities: [
        'health_monitoring',
        'capability_discovery',
        'openapi_specification',
        'uadp_discovery'
      ],
      endpoints: [
        { path: '/health', method: 'GET', description: 'Health check' },
        { path: '/capabilities', method: 'GET', description: 'Agent capabilities' },
        { path: '/discover', method: 'GET', description: 'UADP discovery' }
      ],
      healthStatus: 'healthy',
      lastHealthCheck: new Date().toISOString(),
      metadata: {
        conformanceTier: 'gold',
        protocols: ['openapi', 'mcp', 'uadp'],
        frameworks: ['fastify', 'typebox']
      }
    }
  }

  async start(): Promise<void> {
    try {
      await this.fastify.listen({
        host: this.config.host,
        port: this.config.port
      })
      
      console.log(`🚀 OSSA Agent "${this.config.agentName}" started`)
      console.log(`📖 OpenAPI docs: http://${this.config.host}:${this.config.port}/docs`)
      console.log(`🔍 Discovery: http://${this.config.host}:${this.config.port}/discover`)
    } catch (err) {
      this.fastify.log.error(err)
      process.exit(1)
    }
  }

  async stop(): Promise<void> {
    try {
      await this.fastify.close()
      console.log(`🛑 OSSA Agent "${this.config.agentName}" stopped`)
    } catch (err) {
      this.fastify.log.error(err)
      throw err
    }
  }

  getFastifyInstance(): FastifyInstance {
    return this.fastify
  }
}

export default OSSAFastifyServer