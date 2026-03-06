-- DUADP Node D1 Schema
-- Stores agents, skills, and federation peers

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  api_version TEXT NOT NULL DEFAULT 'ossa/v0.4',
  description TEXT,
  category TEXT,
  trust_tier TEXT DEFAULT 'community',
  uri TEXT,
  manifest JSON NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  api_version TEXT NOT NULL DEFAULT 'ossa/v0.4',
  description TEXT,
  category TEXT,
  trust_tier TEXT DEFAULT 'community',
  uri TEXT,
  manifest JSON NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS peers (
  url TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'healthy',
  last_synced TEXT,
  skill_count INTEGER DEFAULT 0,
  agent_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for search
CREATE INDEX IF NOT EXISTS idx_agents_name ON agents(name);
CREATE INDEX IF NOT EXISTS idx_agents_category ON agents(category);
CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_trust_tier ON skills(trust_tier);
