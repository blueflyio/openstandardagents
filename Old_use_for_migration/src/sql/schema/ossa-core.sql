-- OSSA v0.1.8 Core Database Schema
-- PostgreSQL compatible schema for OSSA agent orchestration

-- Agent registry table
CREATE TABLE IF NOT EXISTS ossa_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(255) UNIQUE NOT NULL,
    agent_type VARCHAR(100) NOT NULL,
    agent_subtype VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    capabilities JSONB DEFAULT '{}',
    protocols JSONB DEFAULT '{}',
    performance JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'inactive',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_heartbeat TIMESTAMP WITH TIME ZONE
);

-- Workspace configuration table
CREATE TABLE IF NOT EXISTS ossa_workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    tier VARCHAR(50) DEFAULT 'development',
    configuration JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task execution tracking
CREATE TABLE IF NOT EXISTS ossa_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id VARCHAR(255) UNIQUE NOT NULL,
    agent_id VARCHAR(255) REFERENCES ossa_agents(agent_id),
    workspace_id UUID REFERENCES ossa_workspaces(id),
    task_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    tokens_used INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback loop tracking
CREATE TABLE IF NOT EXISTS ossa_feedback_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cycle_id VARCHAR(255) UNIQUE NOT NULL,
    task_id VARCHAR(255) REFERENCES ossa_tasks(task_id),
    phase VARCHAR(50) NOT NULL, -- plan, execute, review, judge, learn, govern
    agent_id VARCHAR(255) REFERENCES ossa_agents(agent_id),
    phase_data JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log for compliance
CREATE TABLE IF NOT EXISTS ossa_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    agent_id VARCHAR(255),
    event_data JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id VARCHAR(255),
    ip_address INET
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agents_type ON ossa_agents(agent_type);
CREATE INDEX IF NOT EXISTS idx_agents_status ON ossa_agents(status);
CREATE INDEX IF NOT EXISTS idx_tasks_agent ON ossa_tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON ossa_tasks(status);
CREATE INDEX IF NOT EXISTS idx_feedback_task ON ossa_feedback_cycles(task_id);
CREATE INDEX IF NOT EXISTS idx_feedback_phase ON ossa_feedback_cycles(phase);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON ossa_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON ossa_audit_log(entity_type, entity_id);

-- Update trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON ossa_agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON ossa_workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();