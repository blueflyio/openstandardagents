/**
 * OSSA-to-CrewAI Integration Library
 * Converts OSSA agent specifications into CrewAI team definitions
 * Supports multi-agent coordination patterns with observability
 */

import { OSSAToCrewAIConverter } from './converter.js';
import { CrewAITeamOrchestrator } from './orchestrator.js';
import { CrewAIObservabilityIntegration } from './observability.js';
import { RoleBasedCoordination } from './coordination.js';

export class CrewAIIntegration {
  constructor(options = {}) {
    this.options = {
      observabilityEnabled: true,
      tracingProvider: 'traceloop', // 'traceloop' | 'langfuse'
      ...options
    };

    this.converter = new OSSAToCrewAIConverter(this.options);
    this.orchestrator = new CrewAITeamOrchestrator(this.options);
    this.observability = new CrewAIObservabilityIntegration(this.options);
    this.coordination = new RoleBasedCoordination(this.options);
  }

  /**
   * Convert OSSA agent specification to CrewAI team definition
   * @param {Object} ossaSpec - OSSA agent specification
   * @returns {Object} CrewAI team configuration
   */
  async convertToCrewAI(ossaSpec) {
    return this.converter.convert(ossaSpec);
  }

  /**
   * Create a multi-agent CrewAI team from OSSA definitions
   * @param {Object[]} ossaAgents - Array of OSSA agent specifications
   * @param {Object} teamConfig - Team configuration options
   * @returns {Object} Configured CrewAI crew
   */
  async createTeam(ossaAgents, teamConfig = {}) {
    const agents = await Promise.all(
      ossaAgents.map(spec => this.converter.convert(spec))
    );
    
    return this.orchestrator.createCrew(agents, teamConfig);
  }

  /**
   * Execute a multi-agent workflow using CrewAI
   * @param {Object} crew - CrewAI crew configuration
   * @param {Object} task - Task to execute
   * @returns {Object} Execution result with observability data
   */
  async executeWorkflow(crew, task) {
    if (this.options.observabilityEnabled) {
      return this.observability.wrapExecution(crew, task);
    }
    
    return crew.kickoff(task);
  }

  /**
   * Get role-based coordination patterns for team setup
   * @param {string} pattern - Coordination pattern ('sequential', 'parallel', 'hierarchical')
   * @returns {Object} Coordination configuration
   */
  getCoordinationPattern(pattern) {
    return this.coordination.getPattern(pattern);
  }
}

export default CrewAIIntegration;