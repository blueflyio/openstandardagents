/**
 * CrewAI Translator
 * Translates CrewAI agents, crews, and tasks to OAAS format without modification
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import * as yaml from 'js-yaml';

export interface CrewAIAgent {
  role: string;
  goal: string;
  backstory: string;
  tools?: string[];
  max_iter?: number;
  max_execution_time?: number;
  verbose?: boolean;
  allow_delegation?: boolean;
  step_callback?: string;
  callbacks?: string[];
}

export interface CrewAITask {
  description: string;
  expected_output: string;
  agent?: string;
  tools?: string[];
  async_execution?: boolean;
  context?: string[];
  output_json?: any;
  output_pydantic?: string;
  output_file?: string;
  callback?: string;
}

export interface CrewAICrew {
  name?: string;
  agents: CrewAIAgent[];
  tasks: CrewAITask[];
  process?: 'sequential' | 'hierarchical';
  verbose?: boolean;
  memory?: boolean;
  cache?: boolean;
  max_rpm?: number;
  language?: string;
  full_output?: boolean;
  step_callback?: string;
  task_callback?: string;
  manager_llm?: string;
  manager_agent?: CrewAIAgent;
  function_calling_llm?: string;
}

export interface CrewAIImplementation {
  file_path: string;
  language: 'python' | 'yaml';
  crews: CrewAICrew[];
  standalone_agents: CrewAIAgent[];
  standalone_tasks: CrewAITask[];
  tools: string[];
  imports: string[];
}

export class CrewAITranslator {

  /**
   * Discover CrewAI implementations across the project
   */
  async discoverCrewAIImplementations(projectRoot: string): Promise<CrewAIImplementation[]> {
    console.log('🔍 Discovering CrewAI implementations...');
    
    const implementations: CrewAIImplementation[] = [];
    
    try {
      // Find Python files with CrewAI code
      const pythonFiles = await glob('**/*.py', {
        cwd: projectRoot,
        absolute: true,
        ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/__pycache__/**']
      });

      for (const filePath of pythonFiles) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          
          if (this.isCrewAIFile(content)) {
            const implementation = await this.analyzeCrewAIPythonFile(filePath, content);
            if (this.hasCrewAIContent(implementation)) {
              implementations.push(implementation);
            }
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }

      // Find YAML configuration files
      const yamlFiles = await glob('**/{crew,agents,tasks}*.{yml,yaml}', {
        cwd: projectRoot,
        absolute: true,
        ignore: ['**/node_modules/**', '**/.git/**']
      });

      for (const filePath of yamlFiles) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const implementation = await this.analyzeCrewAIYamlFile(filePath, content);
          if (this.hasCrewAIContent(implementation)) {
            implementations.push(implementation);
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }
    } catch (error) {
      console.warn('⚠️  CrewAI discovery failed:', error.message);
    }
    
    console.log(`✅ Found ${implementations.length} CrewAI implementations`);
    return implementations;
  }

  /**
   * Check if file contains CrewAI code
   */
  private isCrewAIFile(content: string): boolean {
    const crewaiPatterns = [
      /from\s+crewai\s+import/,
      /import.*crewai/,
      /Agent\(/,
      /Task\(/,
      /Crew\(/,
      /CrewAI/,
      /@agent/,
      /@task/,
      /@crew/
    ];

    return crewaiPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Check if implementation has CrewAI content
   */
  private hasCrewAIContent(implementation: CrewAIImplementation): boolean {
    return implementation.crews.length > 0 || 
           implementation.standalone_agents.length > 0 || 
           implementation.standalone_tasks.length > 0;
  }

  /**
   * Analyze Python file with CrewAI code
   */
  private async analyzeCrewAIPythonFile(filePath: string, content: string): Promise<CrewAIImplementation> {
    return {
      file_path: filePath,
      language: 'python',
      crews: this.extractCrews(content),
      standalone_agents: this.extractStandaloneAgents(content),
      standalone_tasks: this.extractStandaloneTasks(content),
      tools: this.extractTools(content),
      imports: this.extractImports(content)
    };
  }

  /**
   * Analyze YAML file with CrewAI configuration
   */
  private async analyzeCrewAIYamlFile(filePath: string, content: string): Promise<CrewAIImplementation> {
    try {
      const yamlData = yaml.load(content) as any;
      
      const crews: CrewAICrew[] = [];
      const agents: CrewAIAgent[] = [];
      const tasks: CrewAITask[] = [];
      
      if (yamlData.crews) {
        crews.push(...this.parseYamlCrews(yamlData.crews));
      }
      
      if (yamlData.agents) {
        agents.push(...this.parseYamlAgents(yamlData.agents));
      }
      
      if (yamlData.tasks) {
        tasks.push(...this.parseYamlTasks(yamlData.tasks));
      }
      
      // Handle single crew/agent/task definitions
      if (yamlData.crew && !yamlData.crews) {
        crews.push(this.parseYamlCrew(yamlData.crew));
      }
      
      if (yamlData.agent && !yamlData.agents) {
        agents.push(this.parseYamlAgent(yamlData.agent));
      }
      
      if (yamlData.task && !yamlData.tasks) {
        tasks.push(this.parseYamlTask(yamlData.task));
      }
      
      return {
        file_path: filePath,
        language: 'yaml',
        crews,
        standalone_agents: agents,
        standalone_tasks: tasks,
        tools: yamlData.tools || [],
        imports: []
      };
    } catch (error) {
      console.warn(`⚠️  Failed to parse YAML file ${filePath}:`, error.message);
      return {
        file_path: filePath,
        language: 'yaml',
        crews: [],
        standalone_agents: [],
        standalone_tasks: [],
        tools: [],
        imports: []
      };
    }
  }

  /**
   * Extract CrewAI crews from Python code
   */
  private extractCrews(content: string): CrewAICrew[] {
    const crews: CrewAICrew[] = [];
    
    // Look for Crew() instantiations
    const crewMatches = content.matchAll(/Crew\s*\(\s*([^)]+(?:\([^)]*\)[^)]*)*)\s*\)/gs);
    
    for (const match of crewMatches) {
      const crewConfig = match[1];
      const crew = this.parseCrewConfig(crewConfig);
      if (crew) {
        crews.push(crew);
      }
    }
    
    // Look for @crew decorated functions
    const crewDecoratorMatches = content.matchAll(/@crew\s*(?:\([^)]*\))?\s*def\s+(\w+)/g);
    for (const match of crewDecoratorMatches) {
      const crewName = match[1];
      const crew = this.extractCrewFromFunction(content, crewName);
      if (crew) {
        crews.push(crew);
      }
    }
    
    return crews;
  }

  /**
   * Extract standalone CrewAI agents from Python code
   */
  private extractStandaloneAgents(content: string): CrewAIAgent[] {
    const agents: CrewAIAgent[] = [];
    
    // Look for Agent() instantiations
    const agentMatches = content.matchAll(/Agent\s*\(\s*([^)]+(?:\([^)]*\)[^)]*)*)\s*\)/gs);
    
    for (const match of agentMatches) {
      const agentConfig = match[1];
      const agent = this.parseAgentConfig(agentConfig);
      if (agent) {
        agents.push(agent);
      }
    }
    
    // Look for @agent decorated functions
    const agentDecoratorMatches = content.matchAll(/@agent\s*(?:\([^)]*\))?\s*def\s+(\w+)/g);
    for (const match of agentDecoratorMatches) {
      const agentName = match[1];
      const agent = this.extractAgentFromFunction(content, agentName);
      if (agent) {
        agents.push(agent);
      }
    }
    
    return agents;
  }

  /**
   * Extract standalone CrewAI tasks from Python code
   */
  private extractStandaloneTasks(content: string): CrewAITask[] {
    const tasks: CrewAITask[] = [];
    
    // Look for Task() instantiations
    const taskMatches = content.matchAll(/Task\s*\(\s*([^)]+(?:\([^)]*\)[^)]*)*)\s*\)/gs);
    
    for (const match of taskMatches) {
      const taskConfig = match[1];
      const task = this.parseTaskConfig(taskConfig);
      if (task) {
        tasks.push(task);
      }
    }
    
    // Look for @task decorated functions
    const taskDecoratorMatches = content.matchAll(/@task\s*(?:\([^)]*\))?\s*def\s+(\w+)/g);
    for (const match of taskDecoratorMatches) {
      const taskName = match[1];
      const task = this.extractTaskFromFunction(content, taskName);
      if (task) {
        tasks.push(task);
      }
    }
    
    return tasks;
  }

  /**
   * Extract tools from Python code
   */
  private extractTools(content: string): string[] {
    const tools: string[] = [];
    
    // Look for tools array definitions
    const toolsMatches = content.matchAll(/tools\s*=\s*\[([^\]]+)\]/g);
    for (const match of toolsMatches) {
      const toolsList = match[1].split(',');
      toolsList.forEach(tool => {
        const cleanTool = tool.trim().replace(/['"]/g, '');
        if (cleanTool && !tools.includes(cleanTool)) {
          tools.push(cleanTool);
        }
      });
    }
    
    // Look for individual tool imports
    const toolImportMatches = content.matchAll(/from\s+[\w.]+\s+import\s+(\w*Tool\w*)/g);
    for (const match of toolImportMatches) {
      const tool = match[1];
      if (!tools.includes(tool)) {
        tools.push(tool);
      }
    }
    
    return tools;
  }

  /**
   * Extract imports from Python code
   */
  private extractImports(content: string): string[] {
    const imports: string[] = [];
    
    const importMatches = content.matchAll(/from\s+crewai[.\w]*\s+import\s+([^\n]+)/g);
    for (const match of importMatches) {
      imports.push(match[1].trim());
    }
    
    return imports;
  }

  // Parsing helper methods

  private parseCrewConfig(configString: string): CrewAICrew | null {
    try {
      const crew: CrewAICrew = {
        agents: [],
        tasks: []
      };
      
      // Extract agents
      const agentsMatch = configString.match(/agents\s*=\s*\[([^\]]+)\]/);
      if (agentsMatch) {
        // This is a simplified extraction - in practice would need more sophisticated parsing
        crew.agents = [];
      }
      
      // Extract tasks
      const tasksMatch = configString.match(/tasks\s*=\s*\[([^\]]+)\]/);
      if (tasksMatch) {
        crew.tasks = [];
      }
      
      // Extract process
      const processMatch = configString.match(/process\s*=\s*Process\.(\w+)/);
      if (processMatch) {
        crew.process = processMatch[1].toLowerCase() as any;
      }
      
      // Extract verbose
      const verboseMatch = configString.match(/verbose\s*=\s*(True|False)/);
      if (verboseMatch) {
        crew.verbose = verboseMatch[1] === 'True';
      }
      
      return crew;
    } catch (error) {
      return null;
    }
  }

  private parseAgentConfig(configString: string): CrewAIAgent | null {
    try {
      const agent: Partial<CrewAIAgent> = {};
      
      // Extract role
      const roleMatch = configString.match(/role\s*=\s*['"]([^'"]+)['"]/);
      if (roleMatch) {
        agent.role = roleMatch[1];
      }
      
      // Extract goal
      const goalMatch = configString.match(/goal\s*=\s*['"]([^'"]+)['"]/);
      if (goalMatch) {
        agent.goal = goalMatch[1];
      }
      
      // Extract backstory
      const backstoryMatch = configString.match(/backstory\s*=\s*['"]([^'"]+)['"]/);
      if (backstoryMatch) {
        agent.backstory = backstoryMatch[1];
      }
      
      // Extract tools
      const toolsMatch = configString.match(/tools\s*=\s*\[([^\]]+)\]/);
      if (toolsMatch) {
        agent.tools = toolsMatch[1].split(',').map(tool => tool.trim().replace(/['"]/g, ''));
      }
      
      if (agent.role && agent.goal && agent.backstory) {
        return agent as CrewAIAgent;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  private parseTaskConfig(configString: string): CrewAITask | null {
    try {
      const task: Partial<CrewAITask> = {};
      
      // Extract description
      const descMatch = configString.match(/description\s*=\s*['"]([^'"]+)['"]/);
      if (descMatch) {
        task.description = descMatch[1];
      }
      
      // Extract expected_output
      const outputMatch = configString.match(/expected_output\s*=\s*['"]([^'"]+)['"]/);
      if (outputMatch) {
        task.expected_output = outputMatch[1];
      }
      
      // Extract agent
      const agentMatch = configString.match(/agent\s*=\s*(\w+)/);
      if (agentMatch) {
        task.agent = agentMatch[1];
      }
      
      if (task.description && task.expected_output) {
        return task as CrewAITask;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  private extractCrewFromFunction(content: string, functionName: string): CrewAICrew | null {
    // Extract crew definition from decorated function
    const funcPattern = new RegExp(`@crew\\s*(?:\\([^)]*\\))?\\s*def\\s+${functionName}[^{]*\\{([^}]+)\\}`, 's');
    const match = content.match(funcPattern);
    
    if (match) {
      return {
        name: functionName,
        agents: [],
        tasks: []
      };
    }
    
    return null;
  }

  private extractAgentFromFunction(content: string, functionName: string): CrewAIAgent | null {
    return {
      role: functionName,
      goal: `Goal for ${functionName}`,
      backstory: `Backstory for ${functionName}`
    };
  }

  private extractTaskFromFunction(content: string, functionName: string): CrewAITask | null {
    return {
      description: `Task: ${functionName}`,
      expected_output: `Output from ${functionName}`
    };
  }

  // YAML parsing methods

  private parseYamlCrews(crewsData: any): CrewAICrew[] {
    const crews: CrewAICrew[] = [];
    
    if (Array.isArray(crewsData)) {
      crewsData.forEach(crewData => {
        const crew = this.parseYamlCrew(crewData);
        if (crew) {
          crews.push(crew);
        }
      });
    } else if (typeof crewsData === 'object') {
      Object.entries(crewsData).forEach(([name, crewData]) => {
        const crew = this.parseYamlCrew(crewData);
        if (crew) {
          crew.name = name;
          crews.push(crew);
        }
      });
    }
    
    return crews;
  }

  private parseYamlCrew(crewData: any): CrewAICrew | null {
    if (!crewData || typeof crewData !== 'object') {
      return null;
    }
    
    const crew: CrewAICrew = {
      agents: [],
      tasks: []
    };
    
    if (crewData.agents) {
      crew.agents = this.parseYamlAgents(crewData.agents);
    }
    
    if (crewData.tasks) {
      crew.tasks = this.parseYamlTasks(crewData.tasks);
    }
    
    if (crewData.process) {
      crew.process = crewData.process;
    }
    
    if (crewData.verbose !== undefined) {
      crew.verbose = crewData.verbose;
    }
    
    return crew;
  }

  private parseYamlAgents(agentsData: any): CrewAIAgent[] {
    const agents: CrewAIAgent[] = [];
    
    if (Array.isArray(agentsData)) {
      agentsData.forEach(agentData => {
        const agent = this.parseYamlAgent(agentData);
        if (agent) {
          agents.push(agent);
        }
      });
    } else if (typeof agentsData === 'object') {
      Object.values(agentsData).forEach(agentData => {
        const agent = this.parseYamlAgent(agentData);
        if (agent) {
          agents.push(agent);
        }
      });
    }
    
    return agents;
  }

  private parseYamlAgent(agentData: any): CrewAIAgent | null {
    if (!agentData || typeof agentData !== 'object' || !agentData.role) {
      return null;
    }
    
    return {
      role: agentData.role,
      goal: agentData.goal || `Goal for ${agentData.role}`,
      backstory: agentData.backstory || `Backstory for ${agentData.role}`,
      tools: agentData.tools || [],
      max_iter: agentData.max_iter,
      max_execution_time: agentData.max_execution_time,
      verbose: agentData.verbose,
      allow_delegation: agentData.allow_delegation
    };
  }

  private parseYamlTasks(tasksData: any): CrewAITask[] {
    const tasks: CrewAITask[] = [];
    
    if (Array.isArray(tasksData)) {
      tasksData.forEach(taskData => {
        const task = this.parseYamlTask(taskData);
        if (task) {
          tasks.push(task);
        }
      });
    } else if (typeof tasksData === 'object') {
      Object.values(tasksData).forEach(taskData => {
        const task = this.parseYamlTask(taskData);
        if (task) {
          tasks.push(task);
        }
      });
    }
    
    return tasks;
  }

  private parseYamlTask(taskData: any): CrewAITask | null {
    if (!taskData || typeof taskData !== 'object' || !taskData.description) {
      return null;
    }
    
    return {
      description: taskData.description,
      expected_output: taskData.expected_output || 'Task completion result',
      agent: taskData.agent,
      tools: taskData.tools,
      async_execution: taskData.async_execution,
      context: taskData.context,
      output_json: taskData.output_json,
      output_pydantic: taskData.output_pydantic,
      output_file: taskData.output_file
    };
  }

  /**
   * Translate CrewAI implementation to OAAS format
   */
  async translateToOAAS(implementation: CrewAIImplementation): Promise<any> {
    const fileName = path.basename(implementation.file_path, path.extname(implementation.file_path));
    
    // Generate capabilities from crews, agents, and tasks
    const capabilities = [
      ...implementation.crews.flatMap(crew => [
        {
          name: `execute_crew_${crew.name || 'default'}`,
          description: `Execute CrewAI crew with ${crew.agents.length} agents and ${crew.tasks.length} tasks`,
          input_schema: {
            type: 'object',
            properties: {
              input: { type: 'string', description: 'Crew execution input' },
              context: { type: 'object', description: 'Additional context for crew execution' }
            },
            required: ['input']
          },
          output_schema: {
            type: 'object',
            properties: {
              result: { type: 'string', description: 'Crew execution result' },
              agents_output: { type: 'array', description: 'Individual agent outputs' },
              tasks_completed: { type: 'integer', description: 'Number of tasks completed' }
            }
          },
          frameworks: ['crewai', 'langchain'],
          compliance: ['crewai-crews']
        },
        ...crew.agents.map(agent => ({
          name: `agent_${agent.role.toLowerCase().replace(/\s+/g, '_')}`,
          description: `${agent.role}: ${agent.goal}`,
          input_schema: {
            type: 'object',
            properties: {
              task: { type: 'string', description: 'Task for the agent' },
              context: { type: 'string', description: 'Additional context' }
            },
            required: ['task']
          },
          output_schema: {
            type: 'object',
            properties: {
              result: { type: 'string', description: 'Agent response' },
              tools_used: { type: 'array', description: 'Tools utilized' }
            }
          },
          frameworks: ['crewai'],
          compliance: ['crewai-agents']
        })),
        ...crew.tasks.map((task, index) => ({
          name: `task_${index + 1}`,
          description: task.description,
          input_schema: {
            type: 'object',
            properties: {
              context: { type: 'object', description: 'Task execution context' }
            }
          },
          output_schema: {
            type: 'object',
            properties: {
              result: { type: 'string', description: task.expected_output }
            }
          },
          frameworks: ['crewai'],
          compliance: ['crewai-tasks']
        }))
      ]),
      ...implementation.standalone_agents.map(agent => ({
        name: `standalone_agent_${agent.role.toLowerCase().replace(/\s+/g, '_')}`,
        description: `Standalone ${agent.role}: ${agent.goal}`,
        input_schema: {
          type: 'object',
          properties: {
            task: { type: 'string', description: 'Task for the agent' }
          },
          required: ['task']
        },
        output_schema: {
          type: 'object',
          properties: {
            result: { type: 'string', description: 'Agent response' }
          }
        },
        frameworks: ['crewai'],
        compliance: ['crewai-agents']
      })),
      ...implementation.standalone_tasks.map((task, index) => ({
        name: `standalone_task_${index + 1}`,
        description: task.description,
        input_schema: {
          type: 'object',
          properties: {
            input: { type: 'string', description: 'Task input' }
          }
        },
        output_schema: {
          type: 'object',
          properties: {
            result: { type: 'string', description: task.expected_output }
          }
        },
        frameworks: ['crewai'],
        compliance: ['crewai-tasks']
      }))
    ];

    const totalAgents = implementation.crews.reduce((sum, crew) => sum + crew.agents.length, 0) + implementation.standalone_agents.length;
    const totalTasks = implementation.crews.reduce((sum, crew) => sum + crew.tasks.length, 0) + implementation.standalone_tasks.length;

    const oaasSpec = {
      apiVersion: "openapi-ai-agents/v0.1.1",
      kind: "Agent",
      metadata: {
        name: `crewai-${fileName}`,
        version: "1.0.0",
        created: new Date().toISOString().split('T')[0],
        description: `CrewAI implementation: ${fileName}`,
        annotations: {
          "oaas/compliance-level": "gold",
          "oaas/framework-support": "crewai,langchain,mcp",
          "crewai/language": implementation.language,
          "crewai/file-path": implementation.file_path,
          "crewai/crews-count": implementation.crews.length,
          "crewai/agents-count": totalAgents,
          "crewai/tasks-count": totalTasks,
          "crewai/tools-count": implementation.tools.length
        },
        labels: {
          domain: "crewai",
          category: "multi-agent",
          framework: "crewai",
          language: implementation.language
        }
      },
      spec: {
        agent: {
          name: fileName,
          expertise: `CrewAI ${implementation.language} implementation with ${implementation.crews.length} crews, ${totalAgents} agents, and ${totalTasks} tasks`
        },
        capabilities,
        protocols: {
          supported: ['crewai', 'openapi', 'langchain'],
          primary: 'crewai',
          crewai: {
            enabled: true,
            language: implementation.language,
            crews: implementation.crews.map(crew => ({
              name: crew.name,
              agents_count: crew.agents.length,
              tasks_count: crew.tasks.length,
              process: crew.process
            })),
            tools: implementation.tools
          }
        },
        frameworks: {
          crewai: {
            enabled: true,
            language: implementation.language,
            integration_method: 'direct_import',
            multi_agent_support: true
          },
          langchain: {
            enabled: true,
            bridge_type: 'crewai_to_langchain',
            tools_supported: true
          }
        },
        data: {
          source_file: implementation.file_path,
          language: implementation.language,
          components: {
            crews: implementation.crews.length,
            agents: totalAgents,
            tasks: totalTasks,
            tools: implementation.tools.length
          },
          crew_details: implementation.crews.map(crew => ({
            name: crew.name,
            process: crew.process,
            agents: crew.agents.map(a => ({ role: a.role, tools: a.tools })),
            tasks: crew.tasks.map(t => ({ description: t.description.substring(0, 100) }))
          }))
        }
      }
    };

    return oaasSpec;
  }
}