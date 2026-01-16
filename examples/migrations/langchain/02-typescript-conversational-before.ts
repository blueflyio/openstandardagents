/**
 * LangChain Conversational Agent with Memory
 * This agent maintains conversation context and can use multiple tools
 */

import { ChatOpenAI } from "langchain/chat_models/openai";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { DynamicStructuredTool } from "langchain/tools";
import { BufferMemory } from "langchain/memory";
import { z } from "zod";

// Initialize LLM
const llm = new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0.5,
  maxTokens: 1500,
});

// Define tools
const emailTool = new DynamicStructuredTool({
  name: "send_email",
  description: "Send an email to a recipient. Use this when asked to send emails.",
  schema: z.object({
    to: z.string().describe("Email recipient"),
    subject: z.string().describe("Email subject"),
    body: z.string().describe("Email body"),
  }),
  func: async ({ to, subject, body }) => {
    console.log(`Sending email to ${to}: ${subject}`);
    return `Email sent successfully to ${to}`;
  },
});

const calendarTool = new DynamicStructuredTool({
  name: "check_calendar",
  description: "Check calendar for available time slots. Use this when scheduling meetings.",
  schema: z.object({
    date: z.string().describe("Date to check (YYYY-MM-DD)"),
  }),
  func: async ({ date }) => {
    return `Available slots on ${date}: 9:00 AM, 2:00 PM, 4:00 PM`;
  },
});

const knowledgeBaseTool = new DynamicStructuredTool({
  name: "search_knowledge_base",
  description: "Search internal knowledge base for information. Use this for company policies, procedures, or documentation.",
  schema: z.object({
    query: z.string().describe("Search query"),
  }),
  func: async ({ query }) => {
    return `Knowledge base results for "${query}": Found 5 relevant documents...`;
  },
});

const tools = [emailTool, calendarTool, knowledgeBaseTool];

// Initialize memory
const memory = new BufferMemory({
  returnMessages: true,
  memoryKey: "chat_history",
  inputKey: "input",
  outputKey: "output",
});

// Create conversational agent
const executor = await initializeAgentExecutorWithOptions(tools, llm, {
  agentType: "openai-functions",
  memory,
  verbose: true,
  maxIterations: 5,
});

// Example usage
const result = await executor.call({
  input: "Can you check my calendar for tomorrow and schedule a meeting at 2 PM?",
});

console.log(result.output);
