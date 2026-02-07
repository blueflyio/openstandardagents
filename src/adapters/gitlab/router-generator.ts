/**
 * GitLab Duo Router Generator
 * Generates complex routing logic for multi-component flows
 *
 * Features:
 * - Conditional routing based on component outputs
 * - Multi-agent orchestration
 * - Error handling paths
 * - Retry logic
 * - Parallel execution branches
 */

import type { OssaAgent } from '../../types/index.js';
import type { FlowRouter } from './types.js';

export interface RouterCondition {
  input: string;
  routes: Record<string, string>;
  default?: string;
}

export interface ErrorRoute {
  from: string;
  to: string;
  on_error: {
    max_retries?: number;
    retry_delay?: number;
    fallback?: string;
  };
}

export interface ParallelRoute {
  from: string;
  parallel: string[];
  join_at: string;
  failure_mode?: 'fail_fast' | 'continue_on_error';
}

export type RouterConfig = FlowRouter | ErrorRoute | ParallelRoute;

export class GitLabDuoRouterGenerator {
  /**
   * Generate routers for multi-component flows
   */
  generateRouters(manifest: OssaAgent, components: string[]): FlowRouter[] {
    // Single component flow - simple routing
    if (components.length === 1) {
      return [
        {
          from: components[0],
          to: 'end',
        },
      ];
    }

    // Multi-component flow - analyze dependencies
    const spec = manifest.spec as Record<string, unknown>;
    const workflow = spec.workflow as
      | {
          steps?: Array<{
            name?: string;
            dependsOn?: string[];
            condition?: Record<string, unknown>;
            onError?: string;
          }>;
        }
      | undefined;

    const routers: FlowRouter[] = [];

    if (!workflow?.steps) {
      // No explicit workflow - create linear flow
      return this.generateLinearFlow(components);
    }

    // Build router graph from workflow steps
    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      const currentComponent = components[i] || `component_${i}`;
      const nextComponent = components[i + 1] || 'end';

      // Conditional routing
      if (step.condition) {
        routers.push(this.generateConditionalRouter(currentComponent, step.condition, components));
      }
      // Error handling
      else if (step.onError) {
        routers.push(this.generateErrorRouter(currentComponent, step.onError, nextComponent));
      }
      // Simple routing
      else {
        routers.push({
          from: currentComponent,
          to: nextComponent,
        });
      }
    }

    return routers;
  }

  /**
   * Generate linear flow (A → B → C → end)
   */
  private generateLinearFlow(components: string[]): FlowRouter[] {
    const routers: FlowRouter[] = [];

    for (let i = 0; i < components.length; i++) {
      const current = components[i];
      const next = components[i + 1] || 'end';

      routers.push({
        from: current,
        to: next,
      });
    }

    return routers;
  }

  /**
   * Generate conditional router (branch based on output)
   */
  private generateConditionalRouter(
    from: string,
    condition: Record<string, unknown>,
    components: string[]
  ): FlowRouter {
    const input = condition.input as string || `${from}_output`;
    const routes: Record<string, string> = {};

    // Parse condition routes
    const conditionRoutes = condition.routes as Record<string, string> | undefined;
    if (conditionRoutes) {
      for (const [value, target] of Object.entries(conditionRoutes)) {
        // Find matching component or use as-is
        const matchingComponent = components.find((c) => c.includes(target));
        routes[value] = matchingComponent || target;
      }
    }

    return {
      from,
      condition: {
        input,
        routes,
      },
    };
  }

  /**
   * Generate error handling router
   */
  private generateErrorRouter(from: string, errorHandler: string, defaultNext: string): FlowRouter {
    // For now, fallback to simple routing
    // Full error handling requires extended router types
    return {
      from,
      to: defaultNext,
    };
  }

  /**
   * Generate parallel execution router
   */
  generateParallelRouter(from: string, branches: string[], joinAt: string): ParallelRoute {
    return {
      from,
      parallel: branches,
      join_at: joinAt,
      failure_mode: 'continue_on_error',
    };
  }

  /**
   * Generate retry router (with exponential backoff)
   */
  generateRetryRouter(
    from: string,
    to: string,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): ErrorRoute {
    return {
      from,
      to,
      on_error: {
        max_retries: maxRetries,
        retry_delay: retryDelay,
        fallback: 'error_handler',
      },
    };
  }

  /**
   * Generate orchestration flow for multi-agent workflows
   */
  generateOrchestrationFlow(
    manifest: OssaAgent,
    agentComponents: string[]
  ): FlowRouter[] {
    const routers: FlowRouter[] = [];

    // Entry point: coordinator agent
    const coordinator = 'coordinator';
    routers.push({
      from: 'entry',
      to: coordinator,
    });

    // Coordinator branches to specialized agents
    routers.push({
      from: coordinator,
      condition: {
        input: 'coordinator_decision',
        routes: agentComponents.reduce(
          (acc, agent, idx) => {
            acc[`task_${idx}`] = agent;
            return acc;
          },
          {} as Record<string, string>
        ),
      },
    });

    // All agents route back to aggregator
    const aggregator = 'aggregator';
    for (const agent of agentComponents) {
      routers.push({
        from: agent,
        to: aggregator,
      });
    }

    // Aggregator routes to end
    routers.push({
      from: aggregator,
      to: 'end',
    });

    return routers;
  }

  /**
   * Generate error handling flow
   */
  generateErrorHandlingFlow(primaryFlow: string[], errorComponent: string): FlowRouter[] {
    const routers: FlowRouter[] = [];

    // Add error routes for each component in primary flow
    for (const component of primaryFlow) {
      routers.push(
        {
          from: component,
          to: errorComponent,
        },
        {
          from: errorComponent,
          to: 'end',
        }
      );
    }

    return routers;
  }

  /**
   * Generate validation and approval flow
   */
  generateApprovalFlow(components: string[]): FlowRouter[] {
    const routers: FlowRouter[] = [];

    for (let i = 0; i < components.length; i++) {
      const component = components[i];
      const validator = `${component}_validator`;
      const next = components[i + 1] || 'end';

      // Component → Validator
      routers.push({
        from: component,
        to: validator,
      });

      // Validator → Next (conditional)
      routers.push({
        from: validator,
        condition: {
          input: `${validator}_result`,
          routes: {
            approved: next,
            rejected: 'error_handler',
            retry: component,
          },
        },
      });
    }

    return routers;
  }

  /**
   * Generate circuit breaker router
   */
  generateCircuitBreakerRouter(
    from: string,
    to: string,
    failureThreshold: number = 5
  ): FlowRouter {
    // Circuit breaker logic would be handled by component itself
    // Router just defines the path
    return {
      from,
      to,
    };
  }

  /**
   * Generate fan-out/fan-in pattern
   */
  generateFanOutFanIn(
    splitter: string,
    workers: string[],
    merger: string
  ): FlowRouter[] {
    const routers: FlowRouter[] = [];

    // Entry → Splitter
    routers.push({
      from: 'entry',
      to: splitter,
    });

    // Splitter → Workers (conditional routing)
    routers.push({
      from: splitter,
      condition: {
        input: 'work_items',
        routes: workers.reduce((acc, worker, idx) => {
          acc[`item_${idx}`] = worker;
          return acc;
        }, {} as Record<string, string>),
      },
    });

    // Workers → Merger
    for (const worker of workers) {
      routers.push({
        from: worker,
        to: merger,
      });
    }

    // Merger → End
    routers.push({
      from: merger,
      to: 'end',
    });

    return routers;
  }

  /**
   * Generate state machine router
   */
  generateStateMachine(
    states: string[],
    transitions: Record<string, Record<string, string>>
  ): FlowRouter[] {
    const routers: FlowRouter[] = [];

    for (const state of states) {
      const stateTransitions = transitions[state];
      if (!stateTransitions) continue;

      routers.push({
        from: state,
        condition: {
          input: `${state}_event`,
          routes: stateTransitions,
        },
      });
    }

    return routers;
  }

  /**
   * Validate router graph for cycles and dead ends
   */
  validateRouterGraph(routers: FlowRouter[]): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const nodes = new Set<string>();
    const edges = new Map<string, Set<string>>();

    // Build graph
    for (const router of routers) {
      nodes.add(router.from);
      if (router.to) {
        nodes.add(router.to);
        if (!edges.has(router.from)) {
          edges.set(router.from, new Set());
        }
        edges.get(router.from)?.add(router.to);
      }
      if (router.condition) {
        for (const target of Object.values(router.condition.routes)) {
          nodes.add(target);
          if (!edges.has(router.from)) {
            edges.set(router.from, new Set());
          }
          edges.get(router.from)?.add(target);
        }
      }
    }

    // Check for dead ends (nodes with no outgoing edges except 'end')
    for (const node of nodes) {
      if (node === 'end') continue;
      if (!edges.has(node)) {
        errors.push(`Dead end: ${node} has no outgoing routes`);
      }
    }

    // Check for cycles (simple DFS check)
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (node: string): boolean => {
      if (!visited.has(node)) {
        visited.add(node);
        recursionStack.add(node);

        const neighbors = edges.get(node) || new Set();
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor) && hasCycle(neighbor)) {
            return true;
          } else if (recursionStack.has(neighbor)) {
            errors.push(`Cycle detected: ${node} → ${neighbor}`);
            return true;
          }
        }
      }
      recursionStack.delete(node);
      return false;
    };

    // Check all nodes for cycles
    for (const node of nodes) {
      if (!visited.has(node)) {
        hasCycle(node);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
