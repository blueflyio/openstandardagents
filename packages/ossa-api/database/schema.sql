-- OSSA Database Schema
-- PostgreSQL 14+

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search
CREATE EXTENSION IF NOT EXISTS "ltree"; -- For hierarchical data

-- Create schema
CREATE SCHEMA IF NOT EXISTS ossa;
SET search_path TO ossa, public;

-- ==================== ENUMS ====================
CREATE TYPE conformance_level AS ENUM ('bronze', 'silver', 'gold', 'platinum');
CREATE TYPE agent_status AS ENUM ('draft', 'active', 'deprecated', 'archived');
CREATE TYPE initiative_status AS ENUM ('planned', 'in_progress', 'blocked', 'completed', 'cancelled');
CREATE TYPE priority_level AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done');
CREATE TYPE webhook_event AS ENUM (
  'agent.created',
  'agent.updated',
  'agent.deleted',
  'validation.failed',
  'conformance.changed',
  'roadmap.updated',
  'capability.added'
);

-- ==================== TABLES ====================

-- Users table for authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  api_key VARCHAR(255) UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_api_key ON users(api_key);

-- Agents table
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  description TEXT,
  author VARCHAR(255),
  license VARCHAR(100),
  conformance conformance_level DEFAULT 'bronze',
  status agent_status DEFAULT 'draft',
  manifest_data JSONB NOT NULL,
  openapi_data JSONB,
  monitoring_config JSONB,
  performance_config JSONB,
  bridge_config JSONB,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, version)
);

CREATE INDEX idx_agents_name ON agents(name);
CREATE INDEX idx_agents_version ON agents(version);
CREATE INDEX idx_agents_conformance ON agents(conformance);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_owner ON agents(owner_id);
CREATE INDEX idx_agents_created ON agents(created_at DESC);
CREATE INDEX idx_agents_manifest ON agents USING GIN (manifest_data);

-- Agent tags
CREATE TABLE agent_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  tag VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agent_id, tag)
);

CREATE INDEX idx_agent_tags_agent ON agent_tags(agent_id);
CREATE INDEX idx_agent_tags_tag ON agent_tags(tag);

-- Capabilities
CREATE TABLE capabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL,
  category VARCHAR(50),
  description TEXT,
  inputs_schema JSONB,
  outputs_schema JSONB,
  requirements JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_capabilities_name ON capabilities(name);
CREATE INDEX idx_capabilities_type ON capabilities(type);
CREATE INDEX idx_capabilities_category ON capabilities(category);

-- Agent capabilities junction
CREATE TABLE agent_capabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  capability_id UUID NOT NULL REFERENCES capabilities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agent_id, capability_id)
);

CREATE INDEX idx_agent_capabilities_agent ON agent_capabilities(agent_id);
CREATE INDEX idx_agent_capabilities_capability ON agent_capabilities(capability_id);

-- Validation results
CREATE TABLE validation_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  valid BOOLEAN NOT NULL,
  errors JSONB DEFAULT '[]',
  warnings JSONB DEFAULT '[]',
  info JSONB DEFAULT '[]',
  conformance_result JSONB,
  validated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_validation_agent ON validation_results(agent_id);
CREATE INDEX idx_validation_date ON validation_results(validated_at DESC);
CREATE INDEX idx_validation_valid ON validation_results(valid);

-- Roadmaps
CREATE TABLE roadmaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  description TEXT,
  owner VARCHAR(255),
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  spec JSONB NOT NULL,
  linear_config JSONB,
  gitlab_config JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, version)
);

CREATE INDEX idx_roadmaps_name ON roadmaps(name);
CREATE INDEX idx_roadmaps_owner ON roadmaps(owner_id);
CREATE INDEX idx_roadmaps_created ON roadmaps(created_at DESC);

-- Initiatives
CREATE TABLE initiatives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  identifier VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status initiative_status DEFAULT 'planned',
  priority priority_level DEFAULT 'medium',
  assignee VARCHAR(255),
  start_date DATE,
  end_date DATE,
  linear_issue_id VARCHAR(255),
  gitlab_issue_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(roadmap_id, identifier)
);

CREATE INDEX idx_initiatives_roadmap ON initiatives(roadmap_id);
CREATE INDEX idx_initiatives_status ON initiatives(status);
CREATE INDEX idx_initiatives_priority ON initiatives(priority);
CREATE INDEX idx_initiatives_dates ON initiatives(start_date, end_date);

-- Initiative capabilities
CREATE TABLE initiative_capabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  capability_id UUID NOT NULL REFERENCES capabilities(id) ON DELETE CASCADE,
  UNIQUE(initiative_id, capability_id)
);

CREATE INDEX idx_initiative_capabilities_initiative ON initiative_capabilities(initiative_id);
CREATE INDEX idx_initiative_capabilities_capability ON initiative_capabilities(capability_id);

-- Initiative agents
CREATE TABLE initiative_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  UNIQUE(initiative_id, agent_id)
);

CREATE INDEX idx_initiative_agents_initiative ON initiative_agents(initiative_id);
CREATE INDEX idx_initiative_agents_agent ON initiative_agents(agent_id);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status task_status DEFAULT 'todo',
  assignee VARCHAR(255),
  estimate VARCHAR(20),
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_initiative ON tasks(initiative_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assignee ON tasks(assignee);

-- Milestones
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  deliverables TEXT[],
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_milestones_roadmap ON milestones(roadmap_id);
CREATE INDEX idx_milestones_date ON milestones(date);

-- Registry for discovery
CREATE TABLE registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_path TEXT NOT NULL,
  version VARCHAR(10) DEFAULT '1.0',
  protocol VARCHAR(50) DEFAULT 'uadp',
  conformance conformance_level,
  agents_data JSONB NOT NULL DEFAULT '[]',
  capabilities_index JSONB NOT NULL DEFAULT '{}',
  dependencies_graph JSONB NOT NULL DEFAULT '{}',
  last_scan_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_registry_workspace ON registry(workspace_path);
CREATE INDEX idx_registry_scan ON registry(last_scan_at DESC);

-- Webhooks
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret VARCHAR(255),
  events webhook_event[] NOT NULL,
  active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhooks_user ON webhooks(user_id);
CREATE INDEX idx_webhooks_active ON webhooks(active);
CREATE INDEX idx_webhooks_events ON webhooks USING GIN (events);

-- Webhook deliveries
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event webhook_event NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  delivered BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_event ON webhook_deliveries(event);
CREATE INDEX idx_webhook_deliveries_delivered ON webhook_deliveries(delivered);
CREATE INDEX idx_webhook_deliveries_created ON webhook_deliveries(created_at DESC);

-- Metrics storage
CREATE TABLE agent_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  metric_name VARCHAR(255) NOT NULL,
  metric_value NUMERIC NOT NULL,
  labels JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_metrics_agent ON agent_metrics(agent_id);
CREATE INDEX idx_metrics_name ON agent_metrics(metric_name);
CREATE INDEX idx_metrics_recorded ON agent_metrics(recorded_at DESC);
CREATE INDEX idx_metrics_labels ON agent_metrics USING GIN (labels);

-- Health checks
CREATE TABLE health_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  checks JSONB NOT NULL DEFAULT '[]',
  checked_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_health_agent ON health_checks(agent_id);
CREATE INDEX idx_health_status ON health_checks(status);
CREATE INDEX idx_health_checked ON health_checks(checked_at DESC);

-- Audit log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);

-- ==================== FUNCTIONS ====================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Audit log function
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (
    action,
    resource_type,
    resource_id,
    changes
  ) VALUES (
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Full text search function
CREATE OR REPLACE FUNCTION search_agents(query TEXT)
RETURNS TABLE(id UUID, name VARCHAR, version VARCHAR, description TEXT, rank REAL) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.name,
    a.version,
    a.description,
    ts_rank(
      to_tsvector('english', COALESCE(a.name, '') || ' ' || COALESCE(a.description, '')),
      plainto_tsquery('english', query)
    ) AS rank
  FROM agents a
  WHERE
    to_tsvector('english', COALESCE(a.name, '') || ' ' || COALESCE(a.description, ''))
    @@ plainto_tsquery('english', query)
  ORDER BY rank DESC;
END;
$$ LANGUAGE plpgsql;

-- ==================== TRIGGERS ====================

-- Update timestamp triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_capabilities_updated_at BEFORE UPDATE ON capabilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_roadmaps_updated_at BEFORE UPDATE ON roadmaps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_initiatives_updated_at BEFORE UPDATE ON initiatives
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON webhooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_registry_updated_at BEFORE UPDATE ON registry
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Audit triggers for important tables
CREATE TRIGGER audit_agents AFTER INSERT OR UPDATE OR DELETE ON agents
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_roadmaps AFTER INSERT OR UPDATE OR DELETE ON roadmaps
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_webhooks AFTER INSERT OR UPDATE OR DELETE ON webhooks
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- ==================== VIEWS ====================

-- Agent summary view
CREATE OR REPLACE VIEW agent_summary AS
SELECT
  a.id,
  a.name,
  a.version,
  a.description,
  a.conformance,
  a.status,
  a.created_at,
  a.updated_at,
  COALESCE(array_agg(DISTINCT at.tag) FILTER (WHERE at.tag IS NOT NULL), '{}') AS tags,
  COALESCE(array_agg(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL), '{}') AS capabilities,
  u.name AS owner_name,
  u.email AS owner_email
FROM agents a
LEFT JOIN agent_tags at ON a.id = at.agent_id
LEFT JOIN agent_capabilities ac ON a.id = ac.agent_id
LEFT JOIN capabilities c ON ac.capability_id = c.id
LEFT JOIN users u ON a.owner_id = u.id
GROUP BY a.id, a.name, a.version, a.description, a.conformance, a.status,
         a.created_at, a.updated_at, u.name, u.email;

-- Capability usage view
CREATE OR REPLACE VIEW capability_usage AS
SELECT
  c.id,
  c.name,
  c.type,
  c.category,
  c.description,
  COUNT(DISTINCT ac.agent_id) AS agent_count,
  array_agg(DISTINCT a.name || '@' || a.version) AS agents
FROM capabilities c
LEFT JOIN agent_capabilities ac ON c.id = ac.capability_id
LEFT JOIN agents a ON ac.agent_id = a.id
GROUP BY c.id, c.name, c.type, c.category, c.description;

-- ==================== INDEXES FOR PERFORMANCE ====================

-- Full text search indexes
CREATE INDEX idx_agents_search ON agents
  USING GIN (to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, '')));

CREATE INDEX idx_capabilities_search ON capabilities
  USING GIN (to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, '')));

-- JSONB indexes for complex queries
CREATE INDEX idx_agents_manifest_capabilities ON agents
  USING GIN ((manifest_data->'capabilities'));

CREATE INDEX idx_agents_bridge_types ON agents
  USING GIN ((bridge_config));

-- ==================== INITIAL DATA ====================

-- Insert default capabilities
INSERT INTO capabilities (name, type, category, description) VALUES
  ('text_generation', 'generation', 'nlp', 'Generate text content'),
  ('text_analysis', 'analysis', 'nlp', 'Analyze text content'),
  ('sentiment_analysis', 'analysis', 'nlp', 'Analyze text sentiment'),
  ('entity_recognition', 'analysis', 'nlp', 'Extract named entities'),
  ('summarization', 'transform', 'nlp', 'Summarize text content'),
  ('translation', 'transform', 'nlp', 'Translate between languages'),
  ('code_generation', 'generation', 'data', 'Generate code'),
  ('code_review', 'analysis', 'data', 'Review and analyze code'),
  ('image_generation', 'generation', 'vision', 'Generate images'),
  ('image_analysis', 'analysis', 'vision', 'Analyze images'),
  ('workflow_orchestration', 'orchestration', 'workflow', 'Orchestrate workflows'),
  ('agent_coordination', 'orchestration', 'workflow', 'Coordinate agents')
ON CONFLICT (name) DO NOTHING;

-- Create admin user (password: admin123 - CHANGE IN PRODUCTION!)
INSERT INTO users (email, password_hash, name, role, api_key) VALUES
  ('admin@ossa.ai', crypt('admin123', gen_salt('bf')), 'Admin', 'admin', 'ossa-admin-key-change-me')
ON CONFLICT (email) DO NOTHING;

-- ==================== PERMISSIONS ====================

-- Create read-only role
CREATE ROLE ossa_reader;
GRANT USAGE ON SCHEMA ossa TO ossa_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA ossa TO ossa_reader;

-- Create read-write role
CREATE ROLE ossa_writer;
GRANT USAGE ON SCHEMA ossa TO ossa_writer;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ossa TO ossa_writer;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA ossa TO ossa_writer;

-- Create admin role
CREATE ROLE ossa_admin;
GRANT ALL PRIVILEGES ON SCHEMA ossa TO ossa_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ossa TO ossa_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ossa TO ossa_admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA ossa TO ossa_admin;