/**
 * LangChain Migration Service Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { LangChainMigrationService } from '../../../../src/services/migration/langchain-migration.service.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { tmpdir } from 'os';
import { API_VERSION } from '../../../../src/version.js';

// Use temp directory for test files instead of test directory
const testTempDir = tmpdir();

describe.skip('LangChainMigrationService', () => {
  let service: LangChainMigrationService;

  beforeEach(() => {
    service = new LangChainMigrationService();
  });

  describe('Python LangChain Parser', () => {
    it('should parse ReAct agent with tools', async () => {
      const pythonCode = `
from langchain.agents import initialize_agent, AgentType, Tool
from langchain.chat_models import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain.tools import tool

llm = ChatOpenAI(model_name="gpt-4", temperature=0.7, max_tokens=2000)

@tool
def search_web(query: str) -> str:
    """Search the web for information."""
    return f"Results for: {query}"

@tool
def calculate(expression: str) -> str:
    """Calculate mathematical expressions."""
    return str(eval(expression))

tools = [search_web, calculate]
memory = ConversationBufferMemory(memory_key="chat_history")

agent = initialize_agent(
    tools=tools,
    llm=llm,
    agent=AgentType.CHAT_ZERO_SHOT_REACT_DESCRIPTION,
    memory=memory
)
`;

      const tempFile = path.join(testTempDir, 'test-react-agent.py');
      await fs.writeFile(tempFile, pythonCode);

      try {
        const { manifest, report } = await service.migrate(tempFile);

        expect(manifest.kind).toBe('Agent');
        expect(manifest.spec?.role).toContain('ReAct');
        expect(manifest.spec?.llm).toBeDefined();
        expect(manifest.spec?.llm?.provider).toBe('openai');
        expect(manifest.spec?.llm?.model).toBe('gpt-4');
        expect(manifest.spec?.llm?.temperature).toBe(0.7);
        expect(manifest.spec?.llm?.maxTokens).toBe(2000);

        const spec = manifest.spec as Record<string, unknown>;
        expect(spec.tools).toBeDefined();
        expect(Array.isArray(spec.tools)).toBe(true);
        expect((spec.tools as Array<unknown>).length).toBe(2);

        const extensions = spec.extensions as Record<string, unknown>;
        expect(extensions?.langchain).toBeDefined();
        expect(
          (extensions.langchain as Record<string, unknown>).memory_type
        ).toContain('Memory');

        expect(report.sourceFormat).toBe('python');
        expect(report.components.detected.length).toBeGreaterThan(0);
        expect(report.components.mapped.length).toBeGreaterThan(0);
        expect(report.confidence).toBeGreaterThan(50);
      } finally {
        await fs.unlink(tempFile).catch(() => {});
      }
    });

    it('should parse sequential chain', async () => {
      const pythonCode = `
from langchain.chains import LLMChain, SequentialChain
from langchain.chat_models import ChatAnthropic
from langchain.prompts import PromptTemplate

llm = ChatAnthropic(model="claude-3-sonnet-20240229", temperature=0.3)

chain1 = LLMChain(llm=llm, prompt=PromptTemplate(...))
chain2 = LLMChain(llm=llm, prompt=PromptTemplate(...))

overall_chain = SequentialChain(chains=[chain1, chain2])
`;

      const tempFile = path.join(testTempDir, 'test-sequential-chain.py');
      await fs.writeFile(tempFile, pythonCode);

      try {
        const { manifest, report } = await service.migrate(tempFile);

        expect(manifest.kind).toBe('Workflow');
        expect(manifest.spec?.llm?.provider).toBe('anthropic');
        expect(manifest.spec?.llm?.model).toBe('claude-3-sonnet-20240229');
        expect(report.components.detected.some((c) => c.type === 'chain')).toBe(
          true
        );
      } finally {
        await fs.unlink(tempFile).catch(() => {});
      }
    });
  });

  describe('TypeScript LangChain Parser', () => {
    it('should parse conversational agent with tools', async () => {
      const tsCode = `
import { ChatOpenAI } from "langchain/chat_models/openai";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { DynamicStructuredTool } from "langchain/tools";
import { BufferMemory } from "langchain/memory";

const llm = new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0.5,
  maxTokens: 1500,
});

const emailTool = new DynamicStructuredTool({
  name: "send_email",
  description: "Send an email",
});

const tools = [emailTool];
const memory = new BufferMemory();

const executor = await initializeAgentExecutorWithOptions(tools, llm, {
  agentType: "openai-functions",
  memory,
});
`;

      const tempFile = path.join(testTempDir, 'test-conversational-agent.ts');
      await fs.writeFile(tempFile, tsCode);

      try {
        const { manifest, report } = await service.migrate(tempFile);

        expect(manifest.kind).toBe('Agent');
        expect(manifest.spec?.llm?.provider).toBe('openai');
        expect(manifest.spec?.llm?.model).toBe('gpt-4');
        expect(manifest.spec?.llm?.temperature).toBe(0.5);

        const spec = manifest.spec as Record<string, unknown>;
        expect(spec.tools).toBeDefined();
        expect(Array.isArray(spec.tools)).toBe(true);

        const extensions = spec.extensions as Record<string, unknown>;
        expect(extensions?.langchain).toBeDefined();

        expect(report.sourceFormat).toBe('typescript');
      } finally {
        await fs.unlink(tempFile).catch(() => {});
      }
    });
  });

  describe('JSON/YAML Config Parser', () => {
    it('should parse JSON configuration', async () => {
      const jsonConfig = {
        agent: {
          name: 'test-agent',
          type: 'react',
        },
        llm: {
          provider: 'openai',
          model: 'gpt-4',
          temperature: 0.7,
          max_tokens: 2000,
        },
        tools: [
          { name: 'search', type: 'function', description: 'Search tool' },
          { name: 'calculate', type: 'function', description: 'Calculator' },
        ],
        memory: {
          type: 'ConversationBufferMemory',
        },
      };

      const tempFile = path.join(testTempDir, 'test-config.json');
      await fs.writeFile(tempFile, JSON.stringify(jsonConfig, null, 2));

      try {
        const { manifest, report } = await service.migrate(tempFile);

        expect(manifest.kind).toBe('Agent');
        expect(manifest.spec?.llm?.provider).toBe('openai');
        expect(manifest.spec?.llm?.model).toBe('gpt-4');

        const spec = manifest.spec as Record<string, unknown>;
        expect(spec.tools).toBeDefined();
        expect((spec.tools as Array<unknown>).length).toBe(2);

        expect(report.sourceFormat).toBe('json');
      } finally {
        await fs.unlink(tempFile).catch(() => {});
      }
    });

    it('should parse YAML configuration', async () => {
      const yamlConfig = `
agent:
  name: test-agent
  type: conversational

llm:
  provider: anthropic
  model: claude-3-opus-20240229
  temperature: 0.4

tools:
  - name: get_weather
    type: function
  - name: send_notification
    type: http

memory:
  type: ConversationBufferMemory
`;

      const tempFile = path.join(testTempDir, 'test-config.yaml');
      await fs.writeFile(tempFile, yamlConfig);

      try {
        const { manifest, report } = await service.migrate(tempFile);

        expect(manifest.kind).toBe('Agent');
        expect(manifest.spec?.llm?.provider).toBe('anthropic');
        expect(manifest.spec?.llm?.model).toBe('claude-3-opus-20240229');

        expect(report.sourceFormat).toBe('yaml');
      } finally {
        await fs.unlink(tempFile).catch(() => {});
      }
    });
  });

  describe('Migration Report', () => {
    it('should generate comprehensive report with high confidence', async () => {
      const pythonCode = `
from langchain.agents import initialize_agent, AgentType
from langchain.chat_models import ChatOpenAI
from langchain.tools import tool

llm = ChatOpenAI(model_name="gpt-4", temperature=0.7)

@tool
def search(query: str) -> str:
    return "results"

agent = initialize_agent([search], llm, agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION)
`;

      const tempFile = path.join(testTempDir, 'test-report.py');
      await fs.writeFile(tempFile, pythonCode);

      try {
        const { report } = await service.migrate(tempFile);

        expect(report.sourceFile).toBe(tempFile);
        expect(report.sourceFormat).toBe('python');
        expect(report.components.detected).toBeDefined();
        expect(report.components.mapped).toBeDefined();
        expect(report.components.unmapped).toBeDefined();
        expect(report.warnings).toBeDefined();
        expect(report.recommendations).toBeDefined();
        expect(report.confidence).toBeGreaterThanOrEqual(0);
        expect(report.confidence).toBeLessThanOrEqual(100);
        expect(report.timestamp).toBeDefined();

        // Should have high confidence for complete agent
        expect(report.confidence).toBeGreaterThan(70);

        // Should have mappings
        expect(report.components.mapped.length).toBeGreaterThan(0);

        // Should have recommendations
        expect(report.recommendations.length).toBeGreaterThan(0);
      } finally {
        await fs.unlink(tempFile).catch(() => {});
      }
    });

    it('should warn about missing LLM config', async () => {
      const pythonCode = `
from langchain.agents import initialize_agent
from langchain.tools import tool

@tool
def search(query: str) -> str:
    return "results"

# No LLM configured
`;

      const tempFile = path.join(testTempDir, 'test-no-llm.py');
      await fs.writeFile(tempFile, pythonCode);

      try {
        const { report } = await service.migrate(tempFile);

        expect(report.warnings.some((w) => w.includes('LLM'))).toBe(true);
      } finally {
        await fs.unlink(tempFile).catch(() => {});
      }
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unsupported file format', async () => {
      const tempFile = path.join(testTempDir, 'test.txt');
      await fs.writeFile(tempFile, 'invalid content');

      try {
        await expect(service.migrate(tempFile)).rejects.toThrow(
          'Unsupported file format'
        );
      } finally {
        await fs.unlink(tempFile).catch(() => {});
      }
    });

    it('should handle malformed JSON', async () => {
      const tempFile = path.join(testTempDir, 'test-malformed.json');
      await fs.writeFile(tempFile, '{ invalid json }');

      try {
        await expect(service.migrate(tempFile)).rejects.toThrow();
      } finally {
        await fs.unlink(tempFile).catch(() => {});
      }
    });
  });

  describe('Agent Type Mapping', () => {
    it('should map ReAct agent to autonomous autonomy level', async () => {
      const pythonCode = `
from langchain.agents import initialize_agent, AgentType
from langchain.chat_models import ChatOpenAI

llm = ChatOpenAI(model_name="gpt-4")
agent = initialize_agent([], llm, agent=AgentType.CHAT_ZERO_SHOT_REACT_DESCRIPTION)
`;

      const tempFile = path.join(testTempDir, 'test-react-autonomy.py');
      await fs.writeFile(tempFile, pythonCode);

      try {
        const { manifest } = await service.migrate(tempFile);

        const spec = manifest.spec as Record<string, unknown>;
        const autonomy = spec.autonomy as Record<string, unknown>;
        expect(autonomy?.level).toBe('autonomous');
      } finally {
        await fs.unlink(tempFile).catch(() => {});
      }
    });

    it('should map conversational agent to assisted autonomy level', async () => {
      const tsCode = `
import { ChatOpenAI } from "langchain/chat_models/openai";
import { initializeAgentExecutorWithOptions } from "langchain/agents";

const llm = new ChatOpenAI({ modelName: "gpt-4" });
const executor = await initializeAgentExecutorWithOptions([], llm, {
  agentType: "openai-functions"
});
`;

      const tempFile = path.join(
        testTempDir,
        'test-conversational-autonomy.ts'
      );
      await fs.writeFile(tempFile, tsCode);

      try {
        const { manifest } = await service.migrate(tempFile);

        const spec = manifest.spec as Record<string, unknown>;
        const autonomy = spec.autonomy as Record<string, unknown>;
        expect(autonomy?.level).toBe('assisted');
      } finally {
        await fs.unlink(tempFile).catch(() => {});
      }
    });
  });
});
