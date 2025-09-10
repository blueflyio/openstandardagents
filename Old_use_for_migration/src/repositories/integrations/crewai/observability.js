/**
 * CrewAI Observability Integration
 * Integrates CrewAI workflows with Traceloop/Langfuse observability
 */

import { trace, context, SpanStatusCode, SpanKind } from '@opentelemetry/api';
import { Langfuse } from 'langfuse';

export class CrewAIObservabilityIntegration {
  constructor(options = {}) {
    this.options = {
      tracingProvider: 'traceloop', // 'traceloop' | 'langfuse' | 'both'
      enableMetrics: true,
      enableLogs: true,
      samplingRate: 1.0,
      ...options
    };

    this.tracer = trace.getTracer('ossa-crewai-integration');
    this.initializeLangfuse();
  }

  /**
   * Initialize Langfuse client if configured
   */
  initializeLangfuse() {
    if (this.options.tracingProvider === 'langfuse' || this.options.tracingProvider === 'both') {
      if (process.env.LANGFUSE_SECRET_KEY && process.env.LANGFUSE_PUBLIC_KEY) {
        this.langfuse = new Langfuse({
          secretKey: process.env.LANGFUSE_SECRET_KEY,
          publicKey: process.env.LANGFUSE_PUBLIC_KEY,
          baseUrl: process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com',
          flushAt: 1,
          flushInterval: 1000
        });
      } else {
        console.warn('Langfuse keys not found in environment variables');
      }
    }
  }

  /**
   * Wrap CrewAI execution with observability
   */
  async wrapExecution(crew, task, executionOptions = {}) {
    const sessionId = executionOptions.sessionId || `crew-${Date.now()}`;
    const userId = executionOptions.userId || 'system';

    // Start Langfuse trace if enabled
    let langfuseTrace = null;
    if (this.langfuse) {
      langfuseTrace = this.langfuse.trace({
        name: 'CrewAI Workflow Execution',
        sessionId,
        userId,
        metadata: {
          crew: {
            agentCount: crew.agents.length,
            taskCount: crew.tasks.length,
            process: crew.process,
            ossaMetadata: crew._ossaMetadata
          },
          task: {
            description: task.description || 'CrewAI task execution',
            inputs: task.inputs || {}
          }
        }
      });
    }

    // Start OpenTelemetry span
    return this.tracer.startActiveSpan(
      'crew-execution',
      {
        kind: SpanKind.SERVER,
        attributes: {
          'crew.agent_count': crew.agents.length,
          'crew.task_count': crew.tasks.length,
          'crew.process': crew.process,
          'crew.session_id': sessionId,
          'crew.user_id': userId
        }
      },
      async (span) => {
        const startTime = Date.now();
        
        try {
          // Log execution start
          this.logExecutionStart(crew, task, sessionId);
          
          // Instrument agent activities
          const instrumentedCrew = this.instrumentCrew(crew, langfuseTrace, span);
          
          // Execute the crew with instrumentation
          const result = await this.executeWithInstrumentation(
            instrumentedCrew, 
            task, 
            langfuseTrace,
            span
          );
          
          // Record success metrics
          const executionTime = Date.now() - startTime;
          
          span.setAttributes({
            'crew.execution_time_ms': executionTime,
            'crew.success': true,
            'crew.result_length': JSON.stringify(result).length
          });
          
          span.setStatus({ code: SpanStatusCode.OK });
          
          // Log to Langfuse
          if (langfuseTrace) {
            langfuseTrace.update({
              output: result,
              metadata: {
                executionTime,
                success: true
              }
            });
          }
          
          // Log execution completion
          this.logExecutionComplete(crew, task, result, executionTime);
          
          return {
            success: true,
            result,
            observability: {
              sessionId,
              executionTime,
              tracingData: this.getTracingData(span, langfuseTrace)
            }
          };
          
        } catch (error) {
          const executionTime = Date.now() - startTime;
          
          // Record error metrics
          span.recordException(error);
          span.setAttributes({
            'crew.execution_time_ms': executionTime,
            'crew.success': false,
            'crew.error': error.message
          });
          
          span.setStatus({ 
            code: SpanStatusCode.ERROR, 
            message: error.message 
          });
          
          // Log to Langfuse
          if (langfuseTrace) {
            langfuseTrace.update({
              level: 'ERROR',
              output: { error: error.message, stack: error.stack },
              metadata: {
                executionTime,
                success: false
              }
            });
          }
          
          // Log execution error
          this.logExecutionError(crew, task, error, executionTime);
          
          return {
            success: false,
            error: error.message,
            observability: {
              sessionId,
              executionTime,
              tracingData: this.getTracingData(span, langfuseTrace)
            }
          };
          
        } finally {
          span.end();
          
          if (this.langfuse) {
            await this.langfuse.flushAsync();
          }
        }
      }
    );
  }

  /**
   * Instrument crew with observability wrappers
   */
  instrumentCrew(crew, langfuseTrace, parentSpan) {
    // Create instrumented agents
    const instrumentedAgents = crew.agents.map((agent, index) => {
      return this.instrumentAgent(agent, index, langfuseTrace, parentSpan);
    });

    // Create instrumented tasks
    const instrumentedTasks = crew.tasks.map((task, index) => {
      return this.instrumentTask(task, index, langfuseTrace, parentSpan);
    });

    // Return crew with instrumented components
    return {
      ...crew,
      agents: instrumentedAgents,
      tasks: instrumentedTasks
    };
  }

  /**
   * Instrument individual agent
   */
  instrumentAgent(agent, index, langfuseTrace, parentSpan) {
    const originalExecute = agent.execute?.bind(agent);
    
    agent.execute = async (task, ...args) => {
      return this.tracer.startActiveSpan(
        `agent-${index}-execute`,
        {
          kind: SpanKind.INTERNAL,
          parent: parentSpan,
          attributes: {
            'agent.index': index,
            'agent.role': agent.role,
            'agent.name': agent._ossaMetadata?.name || `Agent ${index}`,
            'task.description': task.description || 'Unknown task'
          }
        },
        async (agentSpan) => {
          try {
            // Create Langfuse generation for this agent execution
            let generation = null;
            if (langfuseTrace) {
              generation = langfuseTrace.generation({
                name: `${agent.role} - Task Execution`,
                model: 'crewai-agent',
                input: {
                  task: task.description,
                  agent: agent.role,
                  tools: agent.tools?.map(t => t.name) || []
                },
                metadata: {
                  agentIndex: index,
                  capabilities: agent._ossaMetadata?.capabilities || []
                }
              });
            }

            const startTime = Date.now();
            const result = await originalExecute(task, ...args);
            const executionTime = Date.now() - startTime;

            // Record successful execution
            agentSpan.setAttributes({
              'agent.execution_time_ms': executionTime,
              'agent.success': true,
              'agent.result_length': JSON.stringify(result).length
            });

            agentSpan.setStatus({ code: SpanStatusCode.OK });

            // Update Langfuse generation
            if (generation) {
              generation.end({
                output: result,
                metadata: {
                  executionTime,
                  success: true
                }
              });
            }

            return result;

          } catch (error) {
            const executionTime = Date.now() - startTime;

            agentSpan.recordException(error);
            agentSpan.setAttributes({
              'agent.execution_time_ms': executionTime,
              'agent.success': false,
              'agent.error': error.message
            });

            agentSpan.setStatus({ 
              code: SpanStatusCode.ERROR, 
              message: error.message 
            });

            // Update Langfuse generation with error
            if (generation) {
              generation.end({
                level: 'ERROR',
                output: { error: error.message },
                metadata: {
                  executionTime,
                  success: false
                }
              });
            }

            throw error;
          } finally {
            agentSpan.end();
          }
        }
      );
    };

    return agent;
  }

  /**
   * Instrument individual task
   */
  instrumentTask(task, index, langfuseTrace, parentSpan) {
    const originalExecute = task.execute?.bind(task);
    
    if (originalExecute) {
      task.execute = async (...args) => {
        return this.tracer.startActiveSpan(
          `task-${index}-execute`,
          {
            kind: SpanKind.INTERNAL,
            parent: parentSpan,
            attributes: {
              'task.index': index,
              'task.description': task.description || 'Unknown task',
              'task.agent': task.agent?.role || 'Unknown agent'
            }
          },
          async (taskSpan) => {
            try {
              const startTime = Date.now();
              const result = await originalExecute(...args);
              const executionTime = Date.now() - startTime;

              taskSpan.setAttributes({
                'task.execution_time_ms': executionTime,
                'task.success': true
              });

              taskSpan.setStatus({ code: SpanStatusCode.OK });

              return result;

            } catch (error) {
              const executionTime = Date.now() - startTime;

              taskSpan.recordException(error);
              taskSpan.setAttributes({
                'task.execution_time_ms': executionTime,
                'task.success': false,
                'task.error': error.message
              });

              taskSpan.setStatus({ 
                code: SpanStatusCode.ERROR, 
                message: error.message 
              });

              throw error;
            } finally {
              taskSpan.end();
            }
          }
        );
      };
    }

    return task;
  }

  /**
   * Execute crew with comprehensive instrumentation
   */
  async executeWithInstrumentation(crew, task, langfuseTrace, parentSpan) {
    // Record task start event
    if (langfuseTrace) {
      langfuseTrace.event({
        name: 'crew_execution_started',
        metadata: {
          agentCount: crew.agents.length,
          taskCount: crew.tasks.length,
          process: crew.process
        }
      });
    }

    // Execute the crew
    const result = await crew.kickoff(task);

    // Record task completion event
    if (langfuseTrace) {
      langfuseTrace.event({
        name: 'crew_execution_completed',
        metadata: {
          resultLength: JSON.stringify(result).length
        }
      });
    }

    return result;
  }

  /**
   * Get tracing data for response
   */
  getTracingData(span, langfuseTrace) {
    const data = {
      spanId: span?.spanContext()?.spanId,
      traceId: span?.spanContext()?.traceId
    };

    if (langfuseTrace) {
      data.langfuseTraceId = langfuseTrace.id;
    }

    return data;
  }

  /**
   * Log execution start
   */
  logExecutionStart(crew, task, sessionId) {
    if (this.options.enableLogs) {
      console.log(`[OSSA-CrewAI] Starting execution - Session: ${sessionId}`, {
        agentCount: crew.agents.length,
        taskCount: crew.tasks.length,
        process: crew.process,
        taskDescription: task.description
      });
    }
  }

  /**
   * Log execution completion
   */
  logExecutionComplete(crew, task, result, executionTime) {
    if (this.options.enableLogs) {
      console.log(`[OSSA-CrewAI] Execution completed in ${executionTime}ms`, {
        agentCount: crew.agents.length,
        taskCount: crew.tasks.length,
        resultLength: JSON.stringify(result).length
      });
    }
  }

  /**
   * Log execution error
   */
  logExecutionError(crew, task, error, executionTime) {
    if (this.options.enableLogs) {
      console.error(`[OSSA-CrewAI] Execution failed after ${executionTime}ms`, {
        error: error.message,
        agentCount: crew.agents.length,
        taskCount: crew.tasks.length,
        stack: error.stack
      });
    }
  }

  /**
   * Create span for custom operations
   */
  async withSpan(name, operation, attributes = {}) {
    return this.tracer.startActiveSpan(name, { attributes }, async (span) => {
      try {
        const result = await operation(span);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Record custom metrics
   */
  recordMetric(name, value, attributes = {}) {
    if (this.options.enableMetrics) {
      // In a real implementation, you would use OpenTelemetry metrics
      // For now, we'll just log the metric
      console.log(`[METRIC] ${name}: ${value}`, attributes);
    }
  }

  /**
   * Flush all pending traces
   */
  async flush() {
    if (this.langfuse) {
      await this.langfuse.flushAsync();
    }
  }
}

export default CrewAIObservabilityIntegration;