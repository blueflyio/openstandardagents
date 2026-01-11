/**
 * LangChain Runtime Bridge
 * 
 * Executes OSSA agents via LangChain.
 * SOLID: Single Responsibility - LangChain execution only
 * DRY: Reuses LangChainAdapter for format conversion
 */

import { z } from 'zod';
import type { OssaAgent } from '../types/index.js';
import { LangChainAdapter } from '../adapters/langchain-adapter.js';

export interface LangChainRuntimeConfig {
  python_path?: string;
  working_directory?: string;
}

export class LangChainRuntime {
  private config: LangChainRuntimeConfig;
  private adapter: LangChainAdapter;

  constructor(config: LangChainRuntimeConfig = {}) {
    this.config = config;
    this.adapter = new LangChainAdapter();
  }

  /**
   * Execute OSSA agent via LangChain
   * CRUD: Create operation (executes agent)
   * 
   * This generates Python code and executes it via subprocess
   */
  async execute(manifest: OssaAgent, inputs: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Convert OSSA manifest to LangChain Python code
    const pythonCode = LangChainAdapter.toPythonCode(manifest);

    // Add execution wrapper
    const executionCode = this.wrapExecutionCode(pythonCode, inputs);

    // Execute via Python subprocess
    const { execSync } = await import('child_process');
    const pythonPath = this.config.python_path || 'python3';
    const workingDir = this.config.working_directory || process.cwd();

    try {
      const result = execSync(
        `${pythonPath} -c ${JSON.stringify(executionCode)}`,
        {
          cwd: workingDir,
          encoding: 'utf-8',
          timeout: 300000, // 5 minutes
        }
      );

      // Parse result
      return this.parseExecutionResult(result);
    } catch (error) {
      throw new Error(`LangChain execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Wrap Python code with execution logic
   */
  private wrapExecutionCode(code: string, inputs: Record<string, unknown>): string {
    const inputJson = JSON.stringify(inputs);
    return `
${code}

# Execute with inputs
import json
inputs = json.loads(${JSON.stringify(inputJson)})
result = agent.run(inputs.get('message', inputs.get('query', str(inputs))))
print(json.dumps({"output": result}))
`;
  }

  /**
   * Parse execution result
   */
  private parseExecutionResult(output: string): Record<string, unknown> {
    try {
      // Try to find JSON in output
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      // Fallback: return raw output
      return { output: output.trim() };
    } catch (error) {
      return { output: output.trim() };
    }
  }
}
