/**
 * ADK Orchestration Patterns for OSSA
 * Implements SequentialAgent, LoopAgent, ConditionalAgent patterns
 */

import { ADKAgent } from '../agents/index.js';
import { ADKSession, sessionManager } from '../state/index.js';

export type OrchestrationPattern = 'sequential' | 'loop' | 'conditional' | 'parallel' | 'coordinator' | 'dispatcher';

/**
 * Base orchestration configuration
 */
export interface OrchestrationConfig {
  pattern: OrchestrationPattern;
  agents: ADKAgent[];
  session?: ADKSession;
  options?: any;
}

/**
 * OSSA Orchestration Engine with ADK patterns
 */
export class OSSAOrchestrationEngine {
  /**
   * Execute orchestration pattern
   */
  async execute(config: OrchestrationConfig): Promise<any> {
    const session = config.session || sessionManager.createSession();
    
    switch (config.pattern) {
      case 'sequential':
        return this.executeSequential(config.agents, session, config.options);
      
      case 'loop':
        return this.executeLoop(config.agents, session, config.options);
      
      case 'conditional':
        return this.executeConditional(config.agents, session, config.options);
      
      case 'parallel':
        return this.executeParallel(config.agents, session, config.options);
      
      case 'coordinator':
        return this.executeCoordinator(config.agents, session, config.options);
      
      case 'dispatcher':
        return this.executeDispatcher(config.agents, session, config.options);
      
      default:
        throw new Error(`Unknown orchestration pattern: ${config.pattern}`);
    }
  }

  /**
   * Sequential execution pattern (ADK SequentialAgent)
   */
  private async executeSequential(
    agents: ADKAgent[],
    session: ADKSession,
    options?: any
  ): Promise<any> {
    const results: any[] = [];
    let lastOutput: any = options?.initialInput || {};
    
    for (const agent of agents) {
      sessionManager.addAgentTrace(session.id, agent.config.name);
      
      // Execute agent with last output as input
      const result = await this.invokeAgent(agent, lastOutput, session);
      results.push(result);
      
      // Update last output for chaining
      lastOutput = result;
      
      // Clear temp state between agents
      sessionManager.clearTempState(session.id);
    }
    
    return {
      pattern: 'sequential',
      session_id: session.id,
      results,
      final_output: lastOutput,
      agent_trace: session.metadata.agent_trace
    };
  }

  /**
   * Loop execution pattern (ADK LoopAgent)
   */
  private async executeLoop(
    agents: ADKAgent[],
    session: ADKSession,
    options?: any
  ): Promise<any> {
    const maxIterations = options?.maxIterations || 10;
    const condition = options?.condition || (() => true);
    const results: any[] = [];
    let iteration = 0;
    let lastOutput: any = options?.initialInput || {};
    
    while (iteration < maxIterations && condition(session.state, iteration)) {
      for (const agent of agents) {
        sessionManager.addAgentTrace(session.id, `${agent.config.name}_iter${iteration}`);
        
        const result = await this.invokeAgent(agent, lastOutput, session);
        results.push({
          iteration,
          agent: agent.config.name,
          result
        });
        
        lastOutput = result;
        
        // Check break condition
        if (options?.breakCondition && options.breakCondition(result, session.state)) {
          return {
            pattern: 'loop',
            session_id: session.id,
            iterations: iteration + 1,
            results,
            final_output: lastOutput,
            break_reason: 'condition_met'
          };
        }
      }
      
      iteration++;
      sessionManager.clearTempState(session.id);
    }
    
    return {
      pattern: 'loop',
      session_id: session.id,
      iterations: iteration,
      results,
      final_output: lastOutput,
      break_reason: iteration >= maxIterations ? 'max_iterations' : 'condition_false'
    };
  }

  /**
   * Conditional execution pattern (ADK ConditionalAgent)
   */
  private async executeConditional(
    agents: ADKAgent[],
    session: ADKSession,
    options?: any
  ): Promise<any> {
    const conditions = options?.conditions || [];
    const results: any[] = [];
    const input = options?.initialInput || {};
    
    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      const condition = conditions[i] || (() => true);
      
      // Check if agent should execute
      if (condition(session.state, input)) {
        sessionManager.addAgentTrace(session.id, agent.config.name);
        
        const result = await this.invokeAgent(agent, input, session);
        results.push({
          agent: agent.config.name,
          executed: true,
          result
        });
      } else {
        results.push({
          agent: agent.config.name,
          executed: false,
          reason: 'condition_not_met'
        });
      }
    }
    
    return {
      pattern: 'conditional',
      session_id: session.id,
      results,
      executed_count: results.filter(r => r.executed).length
    };
  }

  /**
   * Parallel execution pattern
   */
  private async executeParallel(
    agents: ADKAgent[],
    session: ADKSession,
    options?: any
  ): Promise<any> {
    const input = options?.initialInput || {};
    
    // Clone sessions for parallel execution
    const clonedSessions = agents.map(() => sessionManager.cloneSession(session.id));
    
    // Execute all agents in parallel
    const promises = agents.map((agent, i) => {
      sessionManager.addAgentTrace(clonedSessions[i].id, agent.config.name);
      return this.invokeAgent(agent, input, clonedSessions[i]);
    });
    
    const results = await Promise.all(promises);
    
    // Merge session states
    sessionManager.mergeSessions(session.id, clonedSessions.map(s => s.id));
    
    return {
      pattern: 'parallel',
      session_id: session.id,
      results: agents.map((agent, i) => ({
        agent: agent.config.name,
        result: results[i]
      })),
      completed_count: results.length
    };
  }

  /**
   * Coordinator pattern (ADK multi-agent coordinator)
   */
  private async executeCoordinator(
    agents: ADKAgent[],
    session: ADKSession,
    options?: any
  ): Promise<any> {
    const coordinator = agents[0];  // First agent acts as coordinator
    const workers = agents.slice(1);
    const input = options?.initialInput || {};
    
    sessionManager.addAgentTrace(session.id, `${coordinator.config.name}_coordination`);
    
    // Coordinator determines task delegation
    const coordinationPlan = await this.invokeAgent(coordinator, {
      task: input,
      available_agents: workers.map(a => ({
        name: a.config.name,
        description: a.config.description,
        type: a.type
      }))
    }, session);
    
    // Execute delegated tasks
    const delegationResults: any[] = [];
    
    for (const worker of workers) {
      // Check if coordinator selected this worker
      if (this.shouldDelegate(coordinationPlan, worker.config.name)) {
        sessionManager.addAgentTrace(session.id, worker.config.name);
        const result = await this.invokeAgent(worker, input, session);
        delegationResults.push({
          agent: worker.config.name,
          result
        });
      }
    }
    
    // Coordinator aggregates results
    const finalResult = await this.invokeAgent(coordinator, {
      task: 'aggregate',
      results: delegationResults
    }, session);
    
    return {
      pattern: 'coordinator',
      session_id: session.id,
      coordinator: coordinator.config.name,
      coordination_plan: coordinationPlan,
      delegation_results: delegationResults,
      final_result: finalResult
    };
  }

  /**
   * Dispatcher pattern (routing based on input)
   */
  private async executeDispatcher(
    agents: ADKAgent[],
    session: ADKSession,
    options?: any
  ): Promise<any> {
    const router = options?.router || this.defaultRouter;
    const input = options?.initialInput || {};
    
    // Determine which agent to dispatch to
    const selectedAgent = router(input, agents, session.state);
    
    if (!selectedAgent) {
      return {
        pattern: 'dispatcher',
        session_id: session.id,
        error: 'No suitable agent found for input'
      };
    }
    
    sessionManager.addAgentTrace(session.id, selectedAgent.config.name);
    
    const result = await this.invokeAgent(selectedAgent, input, session);
    
    return {
      pattern: 'dispatcher',
      session_id: session.id,
      dispatched_to: selectedAgent.config.name,
      result
    };
  }

  /**
   * Invoke an agent (placeholder for actual execution)
   */
  private async invokeAgent(agent: ADKAgent, input: any, session: ADKSession): Promise<any> {
    // TODO: Implement actual agent invocation
    console.log(`Invoking ${agent.config.name} with input:`, input);
    
    // Simulate agent execution
    const result = {
      agent: agent.config.name,
      type: agent.type,
      input,
      output: `Processed by ${agent.config.name}`,
      timestamp: new Date().toISOString()
    };
    
    // Update session state if output_key is specified
    if (agent.config.output_key) {
      sessionManager.updateState(session.id, agent.config.output_key, result.output);
    }
    
    return result;
  }

  /**
   * Check if coordinator selected a worker
   */
  private shouldDelegate(coordinationPlan: any, workerName: string): boolean {
    // Simple check - in real implementation would parse coordinator's plan
    return true;  // Delegate to all workers for now
  }

  /**
   * Default router for dispatcher pattern
   */
  private defaultRouter(input: any, agents: ADKAgent[], state: any): ADKAgent | null {
    // Simple routing - select first matching agent
    // In real implementation would use more sophisticated routing
    return agents[0] || null;
  }
}

export const orchestrationEngine = new OSSAOrchestrationEngine();