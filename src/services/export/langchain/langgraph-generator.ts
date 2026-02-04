/**
 * LangGraph Generator for Multi-Agent Workflows
 *
 * Generates LangGraph code for complex multi-agent workflows from OSSA manifests
 * with support for:
 * - Multi-agent coordination
 * - State management
 * - Conditional edges
 * - Human-in-the-loop patterns
 * - Subgraphs and nested workflows
 *
 * SOLID: Single Responsibility - LangGraph workflow code generation
 * DRY: Reusable templates for workflow patterns
 */

import type { OssaAgent } from '../../../types/index.js';

/**
 * Workflow pattern types supported by LangGraph
 */
export type WorkflowPattern =
  | 'sequential'
  | 'parallel'
  | 'conditional'
  | 'supervisor'
  | 'hierarchical'
  | 'human-in-the-loop';

/**
 * Detected workflow structure
 */
export interface WorkflowStructure {
  pattern: WorkflowPattern;
  agents: AgentNode[];
  stateFields: string[];
  hasConditionalLogic: boolean;
  hasHumanApproval: boolean;
  hasSubworkflows: boolean;
}

/**
 * Agent node in workflow graph
 */
export interface AgentNode {
  id: string;
  name: string;
  role: string;
  dependencies: string[];
  isConditional: boolean;
}

/**
 * LangGraph Generator
 */
export class LangGraphGenerator {
  /**
   * Detect if manifest requires LangGraph (multi-agent workflow)
   */
  shouldUseLangGraph(manifest: OssaAgent): boolean {
    // Check for workflow structure
    if (manifest.spec?.workflow?.steps && manifest.spec.workflow.steps.length > 0) {
      return true;
    }

    // Check for agent dependencies
    if (manifest.spec?.dependencies?.agents && manifest.spec.dependencies.agents.length > 0) {
      return true;
    }

    // Check for multiple tools that could represent sub-agents
    const tools = manifest.spec?.tools || [];
    const hasMultipleAgentTools = tools.filter(
      (tool: any) => tool.type === 'agent' || tool.namespace === 'agents'
    ).length > 1;

    if (hasMultipleAgentTools) {
      return true;
    }

    // Check for conditional autonomy rules
    if (manifest.spec?.autonomy?.approval_required) {
      return true;
    }

    return false;
  }

  /**
   * Analyze manifest to extract workflow structure
   */
  analyzeWorkflow(manifest: OssaAgent): WorkflowStructure {
    const agents: AgentNode[] = [];
    const stateFields = new Set<string>(['messages', 'next']);
    let hasConditionalLogic = false;
    let hasHumanApproval = false;
    let hasSubworkflows = false;

    // Analyze workflow steps
    if (manifest.spec?.workflow?.steps) {
      for (const step of manifest.spec.workflow.steps) {
        const stepData = step as any;
        agents.push({
          id: stepData.id || stepData.name,
          name: stepData.name || stepData.id,
          role: stepData.description || 'Agent',
          dependencies: stepData.depends_on || [],
          isConditional: Boolean(stepData.condition),
        });

        if (stepData.condition) {
          hasConditionalLogic = true;
        }

        if (stepData.kind === 'Agent' || stepData.kind === 'Task') {
          stateFields.add(`${stepData.id}_output`);
        }

        if (stepData.steps && stepData.steps.length > 0) {
          hasSubworkflows = true;
        }
      }
    }

    // Analyze dependencies
    if (manifest.spec?.dependencies?.agents) {
      for (const dep of manifest.spec.dependencies.agents) {
        if (!agents.find(a => a.id === dep.name)) {
          agents.push({
            id: dep.name,
            name: dep.name,
            role: 'Dependency Agent',
            dependencies: [],
            isConditional: false,
          });
          stateFields.add(`${dep.name}_output`);
        }
      }
    }

    // Check for human approval requirements
    if (manifest.spec?.autonomy?.approval_required) {
      hasHumanApproval = true;
      stateFields.add('approval_status');
      stateFields.add('human_feedback');
    }

    // Determine workflow pattern
    let pattern: WorkflowPattern = 'sequential';
    if (hasHumanApproval) {
      pattern = 'human-in-the-loop';
    } else if (hasSubworkflows) {
      pattern = 'hierarchical';
    } else if (agents.some(a => a.dependencies.length > 1)) {
      pattern = 'supervisor';
    } else if (hasConditionalLogic) {
      pattern = 'conditional';
    } else if (agents.some(a => a.dependencies.length === 0) && agents.length > 1) {
      pattern = 'parallel';
    }

    return {
      pattern,
      agents,
      stateFields: Array.from(stateFields),
      hasConditionalLogic,
      hasHumanApproval,
      hasSubworkflows,
    };
  }

  /**
   * Generate complete LangGraph workflow code
   */
  generate(manifest: OssaAgent): string {
    if (!this.shouldUseLangGraph(manifest)) {
      return ''; // Not a multi-agent workflow
    }

    const structure = this.analyzeWorkflow(manifest);
    const agentName = manifest.metadata?.name || 'workflow';

    return `"""
${agentName} - LangGraph Multi-Agent Workflow
Generated from OSSA manifest

Pattern: ${structure.pattern}
Agents: ${structure.agents.length}
"""

from typing import TypedDict, Annotated, Sequence, Literal
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
import operator
from datetime import datetime

${this.generateStateClass(structure)}

${this.generateAgentFunctions(structure, manifest)}

${this.generateRouterFunction(structure)}

${this.generateWorkflowBuilder(structure, manifest)}

${this.generateExecutionFunction()}
`;
  }

  /**
   * Generate TypedDict state class
   */
  private generateStateClass(structure: WorkflowStructure): string {
    const fields = structure.stateFields
      .map(field => {
        if (field === 'messages') {
          return '    messages: Annotated[Sequence[BaseMessage], operator.add]';
        } else if (field === 'next') {
          return '    next: str';
        } else {
          return `    ${field}: str`;
        }
      })
      .join('\n');

    return `class AgentState(TypedDict):
    """
    Shared state for multi-agent workflow

    State fields are automatically synchronized across agents.
    """
${fields}
`;
  }

  /**
   * Generate agent node functions
   */
  private generateAgentFunctions(structure: WorkflowStructure, manifest: OssaAgent): string {
    const functions: string[] = [];

    for (const agent of structure.agents) {
      const functionName = this.sanitizeFunctionName(agent.id);
      const role = agent.role || 'Assistant';

      functions.push(`
def ${functionName}_agent(state: AgentState) -> AgentState:
    """
    ${agent.name} - ${role}
    ${agent.dependencies.length > 0 ? `Depends on: ${agent.dependencies.join(', ')}` : 'No dependencies'}
    """
    messages = state["messages"]

    # Get context from previous agents
    context = []
${agent.dependencies.map(dep => `    if "${dep}_output" in state:
        context.append(f"${dep} output: {state['${dep}_output']}")`).join('\n')}

    # Build prompt with role and context
    system_prompt = """${role}

${agent.dependencies.length > 0 ? 'Previous results:\\n" + "\\n".join(context) + "' : ''}"""

    # Create agent executor for this node
    from agent import create_llm
    from tools import get_tools
    from langchain.agents import AgentExecutor, create_openai_tools_agent
    from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder

    llm = create_llm()
    tools = get_tools()

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        MessagesPlaceholder(variable_name="messages"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ])

    agent = create_openai_tools_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

    # Execute agent
    result = agent_executor.invoke({"messages": messages})

    # Update state
    response = AIMessage(content=result["output"], name="${agent.id}")

    return {
        "messages": [response],
        "${agent.id}_output": result["output"],
    }
`);
    }

    // Add human-in-the-loop node if needed
    if (structure.hasHumanApproval) {
      functions.push(`
def human_approval_node(state: AgentState) -> AgentState:
    """
    Human-in-the-loop approval checkpoint

    Pauses workflow for human review and approval.
    """
    messages = state["messages"]

    # Create approval request message
    approval_request = f"""
Please review the workflow progress and provide approval:

Messages: {len(messages)}
Latest output: {messages[-1].content if messages else 'None'}

Approve? (yes/no): """

    # In production, this would integrate with a human approval system
    # For now, we'll use input() for demonstration
    print(approval_request)
    approval = input().strip().lower()

    state["approval_status"] = "approved" if approval == "yes" else "rejected"

    if approval != "yes":
        feedback = input("Please provide feedback: ").strip()
        state["human_feedback"] = feedback

    return state
`);
    }

    return functions.join('\n');
  }

  /**
   * Generate router function for conditional edges
   */
  private generateRouterFunction(structure: WorkflowStructure): string {
    if (!structure.hasConditionalLogic && !structure.hasHumanApproval) {
      return '# No router needed for sequential workflow';
    }

    const conditionalAgents = structure.agents.filter(a => a.isConditional);
    const routingLogic = conditionalAgents.map(agent => {
      return `    # Conditional routing for ${agent.name}
    if should_route_to_${this.sanitizeFunctionName(agent.id)}(state):
        return "${agent.id}"`;
    }).join('\n');

    return `
def router(state: AgentState) -> Literal[${structure.agents.map(a => `"${a.id}"`).join(', ')}, "end"]:
    """
    Route to next agent based on state and conditions
    """
    messages = state["messages"]
    next_agent = state.get("next", "end")

${structure.hasHumanApproval ? `    # Check approval status
    if state.get("approval_status") == "rejected":
        return "end"
` : ''}
${routingLogic}

    # Default routing
    if next_agent in [${structure.agents.map(a => `"${a.id}"`).join(', ')}]:
        return next_agent

    return "end"

${conditionalAgents.map(agent => `
def should_route_to_${this.sanitizeFunctionName(agent.id)}(state: AgentState) -> bool:
    """
    Determine if workflow should route to ${agent.name}
    """
    # TODO: Implement conditional logic based on state
    # For now, default to True
    return True
`).join('\n')}
`;
  }

  /**
   * Generate workflow builder function
   */
  private generateWorkflowBuilder(structure: WorkflowStructure, manifest: OssaAgent): string {
    const workflowName = manifest.metadata?.name || 'workflow';

    // Build node additions
    const nodeAdditions = structure.agents
      .map(agent => `    workflow.add_node("${agent.id}", ${this.sanitizeFunctionName(agent.id)}_agent)`)
      .join('\n');

    // Add human approval node if needed
    const humanNode = structure.hasHumanApproval
      ? '\n    workflow.add_node("human_approval", human_approval_node)'
      : '';

    // Build edges
    const edges = this.generateEdges(structure);

    return `
def create_${workflowName}_workflow():
    """
    Create and compile the ${workflowName} multi-agent workflow

    Workflow pattern: ${structure.pattern}
    State persistence: MemorySaver checkpoint
    """
    workflow = StateGraph(AgentState)

    # Add agent nodes
${nodeAdditions}${humanNode}

    # Define workflow edges
${edges}

    # Set entry point
    workflow.set_entry_point("${structure.agents[0]?.id || 'start'}")

    # Compile with checkpointing for state persistence
    memory = MemorySaver()
    app = workflow.compile(checkpointer=memory)

    return app
`;
  }

  /**
   * Generate workflow edges based on structure
   */
  private generateEdges(structure: WorkflowStructure): string {
    const edges: string[] = [];

    if (structure.pattern === 'sequential') {
      // Sequential: A -> B -> C -> END
      for (let i = 0; i < structure.agents.length; i++) {
        const current = structure.agents[i];
        const next = structure.agents[i + 1];

        if (next) {
          edges.push(`    workflow.add_edge("${current.id}", "${next.id}")`);
        } else {
          edges.push(`    workflow.add_edge("${current.id}", END)`);
        }
      }
    } else if (structure.pattern === 'parallel') {
      // Parallel: Fan-out from first agent
      const first = structure.agents[0];
      const parallel = structure.agents.slice(1);

      for (const agent of parallel) {
        edges.push(`    workflow.add_edge("${first.id}", "${agent.id}")`);
        edges.push(`    workflow.add_edge("${agent.id}", END)`);
      }
    } else if (structure.hasConditionalLogic) {
      // Conditional: Use router function
      edges.push(`    workflow.add_conditional_edges(
        "${structure.agents[0].id}",
        router,
        {
${structure.agents.slice(1).map(a => `            "${a.id}": "${a.id}"`).join(',\n')},
            "end": END
        }
    )`);

      // Add edges from other agents
      for (const agent of structure.agents.slice(1)) {
        edges.push(`    workflow.add_edge("${agent.id}", END)`);
      }
    } else {
      // Default: Chain based on dependencies
      for (const agent of structure.agents) {
        if (agent.dependencies.length === 0) {
          // No dependencies - goes to END or next agent
          const dependents = structure.agents.filter(a =>
            a.dependencies.includes(agent.id)
          );

          if (dependents.length > 0) {
            edges.push(`    workflow.add_edge("${agent.id}", "${dependents[0].id}")`);
          } else {
            edges.push(`    workflow.add_edge("${agent.id}", END)`);
          }
        }
      }
    }

    // Add human approval edges if needed
    if (structure.hasHumanApproval) {
      const lastAgentBeforeApproval = structure.agents[structure.agents.length - 2];
      edges.push(`    workflow.add_edge("${lastAgentBeforeApproval?.id}", "human_approval")`);
      edges.push(`    workflow.add_edge("human_approval", END)`);
    }

    return edges.join('\n');
  }

  /**
   * Generate execution function
   */
  private generateExecutionFunction(): string {
    return `
def run_workflow(input_text: str, config: dict = None):
    """
    Execute the multi-agent workflow

    Args:
        input_text: Initial user input
        config: Optional configuration including thread_id for state persistence

    Returns:
        Final workflow state with all agent outputs
    """
    app = create_workflow()

    initial_state = {
        "messages": [HumanMessage(content=input_text)],
    }

    # Use config for checkpointing (allows resuming workflows)
    config = config or {"configurable": {"thread_id": "default"}}

    # Execute workflow
    result = app.invoke(initial_state, config=config)

    return result


if __name__ == "__main__":
    # Example usage
    result = run_workflow("Analyze this workflow request")
    print("\\nWorkflow completed!")
    print(f"Final messages: {len(result['messages'])}")
    print(f"Final output: {result['messages'][-1].content if result['messages'] else 'None'}")
`;
  }

  /**
   * Sanitize agent ID to valid Python function name
   */
  private sanitizeFunctionName(id: string): string {
    return id
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/^[0-9]/, '_$&');
  }
}
