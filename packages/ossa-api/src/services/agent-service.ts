import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export interface Agent {
  id: string;
  name: string;
  description?: string;
  version: string;
  ossa_version: string;
  status: 'draft' | 'active' | 'deprecated';
  manifest: Record<string, any>;
  openapi_spec?: Record<string, any>;
  capabilities: string[];
  tags: string[];
  created_at: Date;
  updated_at: Date;
}

export interface CreateAgentDto {
  name: string;
  description?: string;
  version: string;
  manifest: Record<string, any>;
  openapi_spec?: Record<string, any>;
  capabilities?: string[];
  tags?: string[];
}

export interface UpdateAgentDto {
  name?: string;
  description?: string;
  version?: string;
  status?: 'draft' | 'active' | 'deprecated';
  manifest?: Record<string, any>;
  openapi_spec?: Record<string, any>;
  capabilities?: string[];
  tags?: string[];
}

export interface ListOptions {
  page: number;
  limit: number;
  sort: string;
  order: 'asc' | 'desc';
  filter?: {
    status?: string;
    tags?: string[];
    capabilities?: string[];
  };
}

export class AgentService {
  constructor(private db: Knex) {}

  async list(options: ListOptions) {
    const { page, limit, sort, order, filter } = options;
    const offset = (page - 1) * limit;

    let query = this.db('agents');

    // Apply filters
    if (filter?.status) {
      query = query.where('status', filter.status);
    }

    if (filter?.tags?.length) {
      query = query.whereRaw('tags && ?', [filter.tags]);
    }

    if (filter?.capabilities?.length) {
      query = query.whereRaw('capabilities && ?', [filter.capabilities]);
    }

    // Get total count
    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('* as count');

    // Apply pagination and sorting
    const agents = await query
      .orderBy(sort, order)
      .limit(limit)
      .offset(offset);

    return {
      data: agents,
      meta: {
        total: Number(count),
        page,
        limit
      }
    };
  }

  async getById(id: string): Promise<Agent | null> {
    const agent = await this.db('agents')
      .where('id', id)
      .first();

    return agent || null;
  }

  async create(data: CreateAgentDto): Promise<Agent> {
    const agent: Agent = {
      id: uuidv4(),
      name: data.name,
      description: data.description,
      version: data.version,
      ossa_version: '1.0',
      status: 'draft',
      manifest: data.manifest,
      openapi_spec: data.openapi_spec,
      capabilities: data.capabilities || [],
      tags: data.tags || [],
      created_at: new Date(),
      updated_at: new Date()
    };

    await this.db('agents').insert(agent);

    // Log activity
    await this.logActivity('create', agent.id, null, agent);

    return agent;
  }

  async update(id: string, data: UpdateAgentDto): Promise<Agent | null> {
    const existing = await this.getById(id);
    if (!existing) {
      return null;
    }

    const updated = {
      ...data,
      updated_at: new Date()
    };

    await this.db('agents')
      .where('id', id)
      .update(updated);

    const agent = await this.getById(id);

    // Log activity
    await this.logActivity('update', id, existing, agent);

    return agent;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) {
      return false;
    }

    await this.db('agents')
      .where('id', id)
      .delete();

    // Log activity
    await this.logActivity('delete', id, existing, null);

    return true;
  }

  async validate(id: string) {
    const agent = await this.getById(id);
    if (!agent) {
      return {
        valid: false,
        errors: ['Agent not found']
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!agent.name) {
      errors.push('Agent name is required');
    }

    if (!agent.version) {
      errors.push('Agent version is required');
    }

    if (!agent.manifest || Object.keys(agent.manifest).length === 0) {
      errors.push('Agent manifest is required');
    }

    // Validate manifest structure
    if (agent.manifest) {
      if (!agent.manifest.ossa) {
        errors.push('OSSA version not specified in manifest');
      }

      if (!agent.manifest.agent?.name) {
        errors.push('Agent name not specified in manifest');
      }

      if (agent.manifest.agent?.name !== agent.name) {
        warnings.push('Agent name mismatch between database and manifest');
      }
    }

    // Check OpenAPI spec if provided
    if (agent.openapi_spec) {
      if (!agent.openapi_spec.openapi) {
        warnings.push('OpenAPI version not specified');
      }

      if (!agent.openapi_spec.info) {
        warnings.push('OpenAPI info section missing');
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  async deploy(id: string, environment: string) {
    const agent = await this.getById(id);
    if (!agent) {
      throw new Error('Agent not found');
    }

    // Validate before deployment
    const validation = await this.validate(id);
    if (!validation.valid) {
      throw new Error(`Agent validation failed: ${validation.errors?.join(', ')}`);
    }

    // Create deployment record
    const deploymentId = uuidv4();
    await this.db('deployments').insert({
      id: deploymentId,
      agent_id: id,
      environment,
      status: 'pending',
      deployed_at: new Date()
    });

    // In production, this would trigger actual deployment
    // For now, we'll simulate deployment
    const url = `https://${environment}.ossa.ai/agents/${agent.name}`;

    await this.db('deployments')
      .where('id', deploymentId)
      .update({
        status: 'deployed',
        url
      });

    return {
      deploymentId,
      status: 'deployed',
      url
    };
  }

  private async logActivity(
    action: string,
    agentId: string,
    before: any,
    after: any
  ) {
    await this.db('audit_logs').insert({
      id: uuidv4(),
      entity_type: 'agent',
      entity_id: agentId,
      action,
      before: before ? JSON.stringify(before) : null,
      after: after ? JSON.stringify(after) : null,
      created_at: new Date()
    });
  }
}