-- OSSA v0.1.8 Federation Schema
-- Cross-organization agent discovery and coordination

-- Federation organizations
CREATE TABLE IF NOT EXISTS ossa_fed_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    trust_level INTEGER DEFAULT 0, -- 0-100 trust score
    api_endpoint VARCHAR(500),
    public_key TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, active, suspended, revoked
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cross-organization agent registry
CREATE TABLE IF NOT EXISTS ossa_fed_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(255) NOT NULL,
    org_id VARCHAR(255) REFERENCES ossa_fed_organizations(org_id),
    capabilities JSONB DEFAULT '{}',
    availability_schedule JSONB DEFAULT '{}',
    trust_score INTEGER DEFAULT 50,
    last_seen TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agent_id, org_id)
);

-- Federation policies
CREATE TABLE IF NOT EXISTS ossa_fed_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id VARCHAR(255) UNIQUE NOT NULL,
    org_id VARCHAR(255) REFERENCES ossa_fed_organizations(org_id),
    policy_type VARCHAR(100) NOT NULL, -- access, routing, security, budget
    policy_data JSONB NOT NULL,
    priority INTEGER DEFAULT 100,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cross-org task coordination
CREATE TABLE IF NOT EXISTS ossa_fed_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id VARCHAR(255) NOT NULL,
    requesting_org VARCHAR(255) REFERENCES ossa_fed_organizations(org_id),
    executing_org VARCHAR(255) REFERENCES ossa_fed_organizations(org_id),
    agent_id VARCHAR(255),
    task_data JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'pending',
    priority INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Federation metrics and monitoring
CREATE TABLE IF NOT EXISTS ossa_fed_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type VARCHAR(100) NOT NULL,
    org_id VARCHAR(255) REFERENCES ossa_fed_organizations(org_id),
    agent_id VARCHAR(255),
    metric_data JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for federation performance
CREATE INDEX IF NOT EXISTS idx_fed_org_status ON ossa_fed_organizations(status);
CREATE INDEX IF NOT EXISTS idx_fed_agents_org ON ossa_fed_agents(org_id);
CREATE INDEX IF NOT EXISTS idx_fed_agents_trust ON ossa_fed_agents(trust_score);
CREATE INDEX IF NOT EXISTS idx_fed_policies_org ON ossa_fed_policies(org_id, policy_type);
CREATE INDEX IF NOT EXISTS idx_fed_tasks_orgs ON ossa_fed_tasks(requesting_org, executing_org);
CREATE INDEX IF NOT EXISTS idx_fed_metrics_timestamp ON ossa_fed_metrics(timestamp);

-- Update triggers for federation tables
CREATE TRIGGER update_fed_orgs_updated_at BEFORE UPDATE ON ossa_fed_organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fed_policies_updated_at BEFORE UPDATE ON ossa_fed_policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Initial federation setup
INSERT INTO ossa_fed_organizations (org_id, name, trust_level, status) 
VALUES ('ossa-local', 'Local OSSA Instance', 100, 'active')
ON CONFLICT (org_id) DO NOTHING;