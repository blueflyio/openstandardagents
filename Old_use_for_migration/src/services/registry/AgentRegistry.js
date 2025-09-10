/**
 * Agent Registry - Stub implementation for testing
 */

export class AgentRegistry {
  constructor(config) {
    this.config = config;
    this.agents = new Map();
  }

  async updateAgents(agents) {
    agents.forEach(agent => {
      this.agents.set(agent.id, agent);
    });
    return agents;
  }

  async getAgent(agentId) {
    return this.agents.get(agentId);
  }

  async getAllAgents() {
    return Array.from(this.agents.values());
  }
}