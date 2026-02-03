/**
 * LangChain Memory Generator
 *
 * Generates memory configuration for LangChain agents
 * Supports: ConversationBufferMemory, ConversationSummaryMemory, Redis, Postgres
 *
 * SOLID: Single Responsibility - Memory configuration only
 * DRY: Reusable memory templates
 */

import type { OssaAgent } from '../../../types/index.js';

export type MemoryBackend = 'buffer' | 'summary' | 'redis' | 'postgres';

export class MemoryGenerator {
  /**
   * Generate memory.py module
   */
  generate(manifest: OssaAgent, backend: MemoryBackend = 'buffer'): string {
    const memoryConfig = this.getMemoryConfig(manifest);

    switch (backend) {
      case 'redis':
        return this.generateRedisMemory(memoryConfig);
      case 'postgres':
        return this.generatePostgresMemory(memoryConfig);
      case 'summary':
        return this.generateSummaryMemory(memoryConfig);
      case 'buffer':
      default:
        return this.generateBufferMemory(memoryConfig);
    }
  }

  /**
   * Extract memory configuration from OSSA manifest
   */
  private getMemoryConfig(manifest: OssaAgent): {
    maxTokenLimit?: number;
    returnMessages?: boolean;
  } {
    // Check for memory configuration in spec
    const spec = manifest.spec as any;
    const memory = spec?.memory || spec?.state?.memory;

    return {
      maxTokenLimit: memory?.maxTokenLimit || 2000,
      returnMessages: memory?.returnMessages !== false,
    };
  }

  /**
   * Generate ConversationBufferMemory (in-memory)
   */
  private generateBufferMemory(config: {
    maxTokenLimit?: number;
    returnMessages?: boolean;
  }): string {
    return `"""
LangChain Memory - Buffer (In-Memory)

Simple conversation buffer memory.
Good for: Development, short conversations, stateless deployments
"""

from langchain.memory import ConversationBufferMemory
from typing import Optional


def get_memory() -> ConversationBufferMemory:
    """
    Create conversation buffer memory

    Returns:
        ConversationBufferMemory instance
    """
    return ConversationBufferMemory(
        memory_key="chat_history",
        return_messages=${String(config.returnMessages !== false)},
        output_key="output",
        input_key="input",
    )


def clear_memory(memory: ConversationBufferMemory) -> None:
    """
    Clear all conversation history

    Args:
        memory: Memory instance to clear
    """
    memory.clear()
`;
  }

  /**
   * Generate ConversationSummaryMemory
   */
  private generateSummaryMemory(config: {
    maxTokenLimit?: number;
    returnMessages?: boolean;
  }): string {
    return `"""
LangChain Memory - Summary

Conversation summary memory with token limits.
Good for: Long conversations, token efficiency
"""

from langchain.memory import ConversationSummaryMemory
from langchain_openai import ChatOpenAI
from typing import Optional
import os


def get_memory() -> ConversationSummaryMemory:
    """
    Create conversation summary memory

    Returns:
        ConversationSummaryMemory instance
    """
    llm = ChatOpenAI(
        model="gpt-3.5-turbo",
        temperature=0,
        api_key=os.getenv("OPENAI_API_KEY"),
    )

    return ConversationSummaryMemory(
        llm=llm,
        memory_key="chat_history",
        return_messages=${String(config.returnMessages !== false)},
        max_token_limit=${config.maxTokenLimit || 2000},
    )


def clear_memory(memory: ConversationSummaryMemory) -> None:
    """
    Clear conversation summary

    Args:
        memory: Memory instance to clear
    """
    memory.clear()
`;
  }

  /**
   * Generate Redis-backed memory
   */
  private generateRedisMemory(config: {
    maxTokenLimit?: number;
    returnMessages?: boolean;
  }): string {
    return `"""
LangChain Memory - Redis

Redis-backed persistent conversation memory.
Good for: Production, multi-instance deployments, session persistence
"""

from langchain.memory import ConversationBufferMemory
from langchain.memory.chat_message_histories import RedisChatMessageHistory
from typing import Optional
import os


def get_memory(session_id: str = "default") -> ConversationBufferMemory:
    """
    Create Redis-backed conversation memory

    Args:
        session_id: Unique session identifier for this conversation

    Returns:
        ConversationBufferMemory with Redis backend
    """
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")

    message_history = RedisChatMessageHistory(
        session_id=session_id,
        url=redis_url,
        key_prefix="langchain:chat:",
        ttl=86400,  # 24 hours
    )

    return ConversationBufferMemory(
        chat_memory=message_history,
        memory_key="chat_history",
        return_messages=${String(config.returnMessages !== false)},
        output_key="output",
        input_key="input",
    )


def clear_memory(memory: ConversationBufferMemory, session_id: str = "default") -> None:
    """
    Clear conversation history for session

    Args:
        memory: Memory instance
        session_id: Session to clear
    """
    if hasattr(memory, "chat_memory"):
        memory.chat_memory.clear()


def get_all_sessions() -> list[str]:
    """
    Get all active session IDs from Redis

    Returns:
        List of session IDs
    """
    import redis

    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    r = redis.from_url(redis_url)

    keys = r.keys("langchain:chat:*")
    return [key.decode("utf-8").replace("langchain:chat:", "") for key in keys]


def delete_session(session_id: str) -> None:
    """
    Delete a specific session from Redis

    Args:
        session_id: Session to delete
    """
    import redis

    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    r = redis.from_url(redis_url)

    r.delete(f"langchain:chat:{session_id}")
`;
  }

  /**
   * Generate Postgres-backed memory
   */
  private generatePostgresMemory(config: {
    maxTokenLimit?: number;
    returnMessages?: boolean;
  }): string {
    return `"""
LangChain Memory - PostgreSQL

PostgreSQL-backed persistent conversation memory.
Good for: Production, analytics, long-term storage
"""

from langchain.memory import ConversationBufferMemory
from langchain.memory.chat_message_histories import PostgresChatMessageHistory
from typing import Optional
import os


def get_memory(session_id: str = "default") -> ConversationBufferMemory:
    """
    Create PostgreSQL-backed conversation memory

    Args:
        session_id: Unique session identifier for this conversation

    Returns:
        ConversationBufferMemory with PostgreSQL backend
    """
    postgres_url = os.getenv(
        "POSTGRES_URL",
        "postgresql://postgres:postgres@localhost:5432/agent_memory"
    )

    message_history = PostgresChatMessageHistory(
        connection_string=postgres_url,
        session_id=session_id,
    )

    # Initialize database schema
    message_history.create_tables()

    return ConversationBufferMemory(
        chat_memory=message_history,
        memory_key="chat_history",
        return_messages=${String(config.returnMessages !== false)},
        output_key="output",
        input_key="input",
    )


def clear_memory(memory: ConversationBufferMemory, session_id: str = "default") -> None:
    """
    Clear conversation history for session

    Args:
        memory: Memory instance
        session_id: Session to clear
    """
    if hasattr(memory, "chat_memory"):
        memory.chat_memory.clear()


def get_all_sessions() -> list[str]:
    """
    Get all active session IDs from PostgreSQL

    Returns:
        List of session IDs
    """
    import psycopg2

    postgres_url = os.getenv(
        "POSTGRES_URL",
        "postgresql://postgres:postgres@localhost:5432/agent_memory"
    )

    conn = psycopg2.connect(postgres_url)
    cursor = conn.cursor()

    cursor.execute("SELECT DISTINCT session_id FROM message_store")
    sessions = [row[0] for row in cursor.fetchall()]

    cursor.close()
    conn.close()

    return sessions


def delete_session(session_id: str) -> None:
    """
    Delete a specific session from PostgreSQL

    Args:
        session_id: Session to delete
    """
    import psycopg2

    postgres_url = os.getenv(
        "POSTGRES_URL",
        "postgresql://postgres:postgres@localhost:5432/agent_memory"
    )

    conn = psycopg2.connect(postgres_url)
    cursor = conn.cursor()

    cursor.execute("DELETE FROM message_store WHERE session_id = %s", (session_id,))
    conn.commit()

    cursor.close()
    conn.close()


def export_session_history(session_id: str) -> list[dict]:
    """
    Export full conversation history for a session

    Args:
        session_id: Session to export

    Returns:
        List of message dictionaries
    """
    import psycopg2
    import json

    postgres_url = os.getenv(
        "POSTGRES_URL",
        "postgresql://postgres:postgres@localhost:5432/agent_memory"
    )

    conn = psycopg2.connect(postgres_url)
    cursor = conn.cursor()

    cursor.execute(
        "SELECT message FROM message_store WHERE session_id = %s ORDER BY id",
        (session_id,)
    )

    messages = [json.loads(row[0]) for row in cursor.fetchall()]

    cursor.close()
    conn.close()

    return messages
`;
  }
}
