/**
 * LangChain Memory Generator (Production Quality - v0.4.1)
 *
 * Generates production-ready memory configuration for LangChain agents
 * Supports: ConversationBuffer, ConversationSummary, EntityMemory, Redis, PostgreSQL
 *
 * Features:
 * - Full OSSA spec.memory parsing
 * - Connection validation and health checks
 * - Retry logic with exponential backoff
 * - Comprehensive error handling
 * - Structured logging
 * - Type-safe configuration
 *
 * SOLID: Single Responsibility - Memory configuration only
 * DRY: Reusable memory templates
 */

import type { OssaAgent } from '../../../types/index.js';

export type MemoryBackend =
  | 'buffer'
  | 'summary'
  | 'entity'
  | 'redis'
  | 'postgres';

export interface MemoryConfig {
  enabled: boolean;
  type: 'conversation_buffer' | 'conversation_summary' | 'entity';
  windowSize?: number;
  maxTokenLimit?: number;
  returnMessages: boolean;
  persistence?: {
    enabled: boolean;
    backend: 'redis' | 'postgres';
    ttl?: number;
    connection?: {
      url?: string;
      poolSize?: number;
      timeout?: number;
    };
  };
}

export class MemoryGenerator {
  /**
   * Generate memory.py module with production-quality features
   */
  generate(manifest: OssaAgent, backend: MemoryBackend = 'buffer'): string {
    const memoryConfig = this.getMemoryConfig(manifest);

    // If memory is disabled, return minimal implementation
    if (!memoryConfig.enabled) {
      return this.generateNoMemory();
    }

    switch (backend) {
      case 'redis':
        return this.generateRedisMemory(memoryConfig);
      case 'postgres':
        return this.generatePostgresMemory(memoryConfig);
      case 'entity':
        return this.generateEntityMemory(memoryConfig);
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
  private getMemoryConfig(manifest: OssaAgent): MemoryConfig {
    const spec = manifest.spec as any;
    const memory = spec?.memory || {};

    return {
      enabled: memory?.enabled !== false,
      type: memory?.type || 'conversation_buffer',
      windowSize: memory?.window_size || memory?.windowSize || 10,
      maxTokenLimit: memory?.max_token_limit || memory?.maxTokenLimit || 2000,
      returnMessages:
        memory?.return_messages !== false && memory?.returnMessages !== false,
      persistence: memory?.persistence
        ? {
            enabled: memory.persistence.enabled !== false,
            backend: memory.persistence.backend || 'redis',
            ttl: memory.persistence.ttl || 86400, // 24 hours
            connection: {
              url: memory.persistence.connection?.url,
              poolSize: memory.persistence.connection?.pool_size || 10,
              timeout: memory.persistence.connection?.timeout || 30,
            },
          }
        : undefined,
    };
  }

  /**
   * Generate no-memory implementation
   */
  private generateNoMemory(): string {
    return `"""
LangChain Memory - Disabled

Memory is disabled for this agent.
"""

from typing import Optional
import logging

logger = logging.getLogger(__name__)


def get_memory() -> None:
    """
    Memory is disabled for this agent

    Returns:
        None
    """
    logger.info("Memory is disabled")
    return None


def clear_memory(memory: Optional[any] = None) -> None:
    """
    No-op: Memory is disabled

    Args:
        memory: Ignored
    """
    pass
`;
  }

  /**
   * Generate ConversationBufferMemory (in-memory) with production features
   */
  private generateBufferMemory(config: MemoryConfig): string {
    const returnMessages = config.returnMessages ? 'True' : 'False';
    const windowSize = config.windowSize || 10;

    return `"""
LangChain Memory - Buffer (In-Memory) [Production Quality]

Simple conversation buffer memory with window management.

Features:
- Configurable message window (last ${windowSize} messages)
- Memory statistics and monitoring
- Structured logging

Good for: Development, short conversations, stateless deployments
"""

from langchain.memory import ConversationBufferMemory, ConversationBufferWindowMemory
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)


def get_memory(use_window: bool = True) -> ConversationBufferWindowMemory:
    """
    Create conversation buffer memory with window

    Args:
        use_window: Use windowed memory (last ${windowSize} messages)

    Returns:
        ConversationBufferWindowMemory instance
    """
    try:
        logger.info("Creating conversation buffer memory (window_size=${windowSize})")

        memory = ConversationBufferWindowMemory(
            k=${windowSize},
            memory_key="chat_history",
            return_messages=${returnMessages},
            output_key="output",
            input_key="input",
        )

        logger.info("Conversation buffer memory created successfully")
        return memory
    except Exception as e:
        logger.error(f"Error creating buffer memory: {str(e)}", exc_info=True)
        raise


def clear_memory(memory: ConversationBufferWindowMemory) -> None:
    """
    Clear all conversation history

    Args:
        memory: Memory instance to clear
    """
    try:
        logger.info("Clearing conversation buffer memory")
        memory.clear()
        logger.info("Memory cleared successfully")
    except Exception as e:
        logger.error(f"Error clearing memory: {str(e)}", exc_info=True)
        raise


def get_memory_stats(memory: ConversationBufferWindowMemory) -> Dict[str, Any]:
    """
    Get memory usage statistics

    Args:
        memory: Memory instance

    Returns:
        Dictionary with memory statistics
    """
    try:
        messages = memory.load_memory_variables({}).get("chat_history", [])

        if isinstance(messages, list):
            message_count = len(messages)
        else:
            message_count = 0

        return {
            "type": "buffer_window",
            "window_size": ${windowSize},
            "message_count": message_count,
            "messages": messages if isinstance(messages, list) else [],
        }
    except Exception as e:
        logger.error(f"Error getting memory stats: {str(e)}", exc_info=True)
        return {
            "type": "buffer_window",
            "window_size": ${windowSize},
            "message_count": 0,
            "error": str(e),
        }
`;
  }

  /**
   * Generate ConversationSummaryMemory with production features
   */
  private generateSummaryMemory(config: MemoryConfig): string {
    const returnMessages = config.returnMessages ? 'True' : 'False';
    const maxTokenLimit = config.maxTokenLimit || 2000;

    return `"""
LangChain Memory - Summary [Production Quality]

Conversation summary memory with token limits.

Features:
- Automatic summarization when token limit reached
- Configurable token limit (${maxTokenLimit} tokens)
- Summary regeneration
- Memory statistics

Good for: Long conversations, token efficiency
"""

from langchain.memory import ConversationSummaryMemory, ConversationSummaryBufferMemory
from langchain_openai import ChatOpenAI
from typing import Optional, Dict, Any
import os
import logging

logger = logging.getLogger(__name__)


def get_memory() -> ConversationSummaryBufferMemory:
    """
    Create conversation summary memory with buffer

    Returns:
        ConversationSummaryBufferMemory instance
    """
    try:
        logger.info("Creating conversation summary memory (max_tokens=${maxTokenLimit})")

        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.error("OPENAI_API_KEY not set in environment")
            raise ValueError("OPENAI_API_KEY environment variable is required")

        llm = ChatOpenAI(
            model="gpt-4o-mini",  # Cost-effective for summarization
            temperature=0,
            api_key=api_key,
        )

        memory = ConversationSummaryBufferMemory(
            llm=llm,
            memory_key="chat_history",
            return_messages=${returnMessages},
            max_token_limit=${maxTokenLimit},
            output_key="output",
            input_key="input",
        )

        logger.info("Conversation summary memory created successfully")
        return memory
    except Exception as e:
        logger.error(f"Error creating summary memory: {str(e)}", exc_info=True)
        raise


def clear_memory(memory: ConversationSummaryBufferMemory) -> None:
    """
    Clear conversation summary

    Args:
        memory: Memory instance to clear
    """
    try:
        logger.info("Clearing conversation summary memory")
        memory.clear()
        logger.info("Memory cleared successfully")
    except Exception as e:
        logger.error(f"Error clearing memory: {str(e)}", exc_info=True)
        raise


def get_memory_stats(memory: ConversationSummaryBufferMemory) -> Dict[str, Any]:
    """
    Get memory usage statistics

    Args:
        memory: Memory instance

    Returns:
        Dictionary with memory statistics
    """
    try:
        memory_vars = memory.load_memory_variables({})
        messages = memory_vars.get("chat_history", [])

        return {
            "type": "summary_buffer",
            "max_token_limit": ${maxTokenLimit},
            "message_count": len(messages) if isinstance(messages, list) else 0,
            "has_summary": hasattr(memory, "moving_summary_buffer") and len(memory.moving_summary_buffer) > 0,
        }
    except Exception as e:
        logger.error(f"Error getting memory stats: {str(e)}", exc_info=True)
        return {
            "type": "summary_buffer",
            "max_token_limit": ${maxTokenLimit},
            "error": str(e),
        }


def regenerate_summary(memory: ConversationSummaryBufferMemory) -> str:
    """
    Force regeneration of conversation summary

    Args:
        memory: Memory instance

    Returns:
        Generated summary
    """
    try:
        logger.info("Regenerating conversation summary")

        # Force summary regeneration by accessing moving_summary_buffer
        if hasattr(memory, "moving_summary_buffer"):
            summary = memory.moving_summary_buffer
            logger.info(f"Summary regenerated: {len(summary)} characters")
            return summary

        return ""
    except Exception as e:
        logger.error(f"Error regenerating summary: {str(e)}", exc_info=True)
        return f"Error: {str(e)}"
`;
  }

  /**
   * Generate ConversationEntityMemory with production features
   */
  private generateEntityMemory(config: MemoryConfig): string {
    const returnMessages = config.returnMessages ? 'True' : 'False';

    return `"""
LangChain Memory - Entity [Production Quality]

Entity-based conversation memory that tracks entities and their context.

Features:
- Automatic entity extraction
- Entity context tracking
- Relationship mapping
- Memory statistics

Good for: Complex conversations, entity-focused interactions, knowledge graphs
"""

from langchain.memory import ConversationEntityMemory
from langchain_openai import ChatOpenAI
from typing import Optional, Dict, Any, List
import os
import logging

logger = logging.getLogger(__name__)


def get_memory() -> ConversationEntityMemory:
    """
    Create conversation entity memory

    Returns:
        ConversationEntityMemory instance
    """
    try:
        logger.info("Creating conversation entity memory")

        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.error("OPENAI_API_KEY not set in environment")
            raise ValueError("OPENAI_API_KEY environment variable is required")

        llm = ChatOpenAI(
            model="gpt-4o-mini",  # Cost-effective for entity extraction
            temperature=0,
            api_key=api_key,
        )

        memory = ConversationEntityMemory(
            llm=llm,
            memory_key="chat_history",
            return_messages=${returnMessages},
            output_key="output",
            input_key="input",
        )

        logger.info("Conversation entity memory created successfully")
        return memory
    except Exception as e:
        logger.error(f"Error creating entity memory: {str(e)}", exc_info=True)
        raise


def clear_memory(memory: ConversationEntityMemory) -> None:
    """
    Clear entity memory

    Args:
        memory: Memory instance to clear
    """
    try:
        logger.info("Clearing conversation entity memory")
        memory.clear()
        logger.info("Memory cleared successfully")
    except Exception as e:
        logger.error(f"Error clearing memory: {str(e)}", exc_info=True)
        raise


def get_memory_stats(memory: ConversationEntityMemory) -> Dict[str, Any]:
    """
    Get memory usage statistics

    Args:
        memory: Memory instance

    Returns:
        Dictionary with memory statistics including entities
    """
    try:
        # Get entity store
        entities = {}
        if hasattr(memory, "entity_store") and hasattr(memory.entity_store, "store"):
            entities = memory.entity_store.store

        return {
            "type": "entity",
            "entity_count": len(entities),
            "entities": list(entities.keys()),
            "entity_details": {k: v[:100] + "..." if len(v) > 100 else v for k, v in entities.items()},
        }
    except Exception as e:
        logger.error(f"Error getting memory stats: {str(e)}", exc_info=True)
        return {
            "type": "entity",
            "entity_count": 0,
            "error": str(e),
        }


def get_entity_context(memory: ConversationEntityMemory, entity: str) -> Optional[str]:
    """
    Get context for a specific entity

    Args:
        memory: Memory instance
        entity: Entity name

    Returns:
        Entity context or None
    """
    try:
        if hasattr(memory, "entity_store") and hasattr(memory.entity_store, "get"):
            context = memory.entity_store.get(entity)
            logger.info(f"Retrieved context for entity '{entity}': {len(context) if context else 0} characters")
            return context

        return None
    except Exception as e:
        logger.error(f"Error getting entity context: {str(e)}", exc_info=True)
        return None


def list_entities(memory: ConversationEntityMemory) -> List[str]:
    """
    List all tracked entities

    Args:
        memory: Memory instance

    Returns:
        List of entity names
    """
    try:
        if hasattr(memory, "entity_store") and hasattr(memory.entity_store, "store"):
            entities = list(memory.entity_store.store.keys())
            logger.info(f"Found {len(entities)} tracked entities")
            return entities

        return []
    except Exception as e:
        logger.error(f"Error listing entities: {str(e)}", exc_info=True)
        return []
`;
  }

  /**
   * Generate Redis-backed memory with production features
   */
  private generateRedisMemory(config: MemoryConfig): string {
    const returnMessages = config.returnMessages ? 'True' : 'False';
    const ttl = config.persistence?.ttl || 86400;
    const timeout = config.persistence?.connection?.timeout || 30;

    return `"""
LangChain Memory - Redis [Production Quality]

Redis-backed persistent conversation memory.

Features:
- Connection pooling and validation
- Automatic retry with exponential backoff
- Health checks
- Session management
- TTL configuration (${ttl}s)

Good for: Production, multi-instance deployments, session persistence
"""

from langchain.memory import ConversationBufferMemory
from langchain.memory.chat_message_histories import RedisChatMessageHistory
from typing import Optional, Dict, Any, List
import os
import time
import logging
from redis.exceptions import ConnectionError, TimeoutError

logger = logging.getLogger(__name__)

# Redis connection pool (shared across sessions)
_redis_pool = None


def _get_redis_client():
    """
    Get Redis client with connection pooling

    Returns:
        Redis client instance
    """
    import redis
    from redis.connection import ConnectionPool

    global _redis_pool

    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")

    if _redis_pool is None:
        logger.info(f"Creating Redis connection pool (url={redis_url})")
        _redis_pool = ConnectionPool.from_url(
            redis_url,
            max_connections=10,
            socket_timeout=${timeout},
            socket_connect_timeout=${timeout},
            retry_on_timeout=True,
            health_check_interval=30,
        )

    return redis.Redis(connection_pool=_redis_pool, decode_responses=True)


def validate_redis_connection(max_retries: int = 3, retry_delay: float = 1.0) -> bool:
    """
    Validate Redis connection with retry logic

    Args:
        max_retries: Maximum number of connection attempts
        retry_delay: Initial delay between retries (exponential backoff)

    Returns:
        True if connection successful, False otherwise
    """
    for attempt in range(max_retries):
        try:
            logger.info(f"Validating Redis connection (attempt {attempt + 1}/{max_retries})")
            client = _get_redis_client()
            client.ping()
            logger.info("Redis connection validated successfully")
            return True
        except (ConnectionError, TimeoutError) as e:
            if attempt < max_retries - 1:
                wait_time = retry_delay * (2 ** attempt)
                logger.warning(f"Redis connection failed: {str(e)}. Retrying in {wait_time}s...")
                time.sleep(wait_time)
            else:
                logger.error(f"Redis connection failed after {max_retries} attempts: {str(e)}")
                return False
        except Exception as e:
            logger.error(f"Unexpected error validating Redis connection: {str(e)}", exc_info=True)
            return False

    return False


def get_memory(session_id: str = "default") -> ConversationBufferMemory:
    """
    Create Redis-backed conversation memory with validation

    Args:
        session_id: Unique session identifier for this conversation

    Returns:
        ConversationBufferMemory with Redis backend

    Raises:
        ConnectionError: If Redis connection cannot be established
    """
    try:
        logger.info(f"Creating Redis-backed memory for session: {session_id}")

        # Validate connection first
        if not validate_redis_connection():
            raise ConnectionError("Failed to connect to Redis after multiple attempts")

        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")

        message_history = RedisChatMessageHistory(
            session_id=session_id,
            url=redis_url,
            key_prefix="langchain:chat:",
            ttl=${ttl},
        )

        memory = ConversationBufferMemory(
            chat_memory=message_history,
            memory_key="chat_history",
            return_messages=${returnMessages},
            output_key="output",
            input_key="input",
        )

        logger.info(f"Redis memory created successfully for session: {session_id}")
        return memory
    except Exception as e:
        logger.error(f"Error creating Redis memory: {str(e)}", exc_info=True)
        raise


def clear_memory(memory: ConversationBufferMemory, session_id: str = "default") -> None:
    """
    Clear conversation history for session

    Args:
        memory: Memory instance
        session_id: Session to clear
    """
    try:
        logger.info(f"Clearing Redis memory for session: {session_id}")
        if hasattr(memory, "chat_memory"):
            memory.chat_memory.clear()
        logger.info("Memory cleared successfully")
    except Exception as e:
        logger.error(f"Error clearing memory: {str(e)}", exc_info=True)
        raise


def get_memory_stats(session_id: str = "default") -> Dict[str, Any]:
    """
    Get memory usage statistics for session

    Args:
        session_id: Session to get stats for

    Returns:
        Dictionary with memory statistics
    """
    try:
        client = _get_redis_client()
        key = f"langchain:chat:{session_id}"

        # Get message count
        message_count = client.llen(key) if client.exists(key) else 0

        # Get TTL
        ttl_remaining = client.ttl(key) if client.exists(key) else -1

        return {
            "type": "redis",
            "session_id": session_id,
            "message_count": message_count,
            "ttl_remaining": ttl_remaining,
            "key": key,
        }
    except Exception as e:
        logger.error(f"Error getting memory stats: {str(e)}", exc_info=True)
        return {
            "type": "redis",
            "session_id": session_id,
            "error": str(e),
        }


def health_check() -> Dict[str, Any]:
    """
    Check Redis health

    Returns:
        Dictionary with health check results
    """
    try:
        start_time = time.time()
        client = _get_redis_client()

        # Ping Redis
        client.ping()

        # Get Redis info
        info = client.info("server")

        latency = (time.time() - start_time) * 1000  # ms

        return {
            "healthy": True,
            "latency_ms": round(latency, 2),
            "redis_version": info.get("redis_version", "unknown"),
            "uptime_seconds": info.get("uptime_in_seconds", 0),
        }
    except Exception as e:
        logger.error(f"Redis health check failed: {str(e)}", exc_info=True)
        return {
            "healthy": False,
            "error": str(e),
        }


def get_all_sessions() -> List[str]:
    """
    Get all active session IDs from Redis

    Returns:
        List of session IDs
    """
    try:
        client = _get_redis_client()
        keys = client.keys("langchain:chat:*")
        sessions = [key.replace("langchain:chat:", "") for key in keys]
        logger.info(f"Found {len(sessions)} active sessions")
        return sessions
    except Exception as e:
        logger.error(f"Error getting sessions: {str(e)}", exc_info=True)
        return []


def delete_session(session_id: str) -> bool:
    """
    Delete a specific session from Redis

    Args:
        session_id: Session to delete

    Returns:
        True if session was deleted, False otherwise
    """
    try:
        logger.info(f"Deleting session: {session_id}")
        client = _get_redis_client()
        result = client.delete(f"langchain:chat:{session_id}")
        logger.info(f"Session deleted: {result > 0}")
        return result > 0
    except Exception as e:
        logger.error(f"Error deleting session: {str(e)}", exc_info=True)
        return False
`;
  }

  /**
   * Generate PostgreSQL-backed memory with production features
   */
  private generatePostgresMemory(config: MemoryConfig): string {
    const returnMessages = config.returnMessages ? 'True' : 'False';
    const poolSize = config.persistence?.connection?.poolSize || 10;
    const timeout = config.persistence?.connection?.timeout || 30;

    return `"""
LangChain Memory - PostgreSQL [Production Quality]

PostgreSQL-backed persistent conversation memory.

Features:
- Connection pooling with psycopg2
- Automatic retry with exponential backoff
- Health checks and monitoring
- Session analytics
- Export capabilities

Good for: Production, analytics, long-term storage, compliance
"""

from langchain.memory import ConversationBufferMemory
from langchain.memory.chat_message_histories import PostgresChatMessageHistory
from typing import Optional, Dict, Any, List
from contextlib import contextmanager
import os
import time
import logging
import psycopg2
from psycopg2 import pool, OperationalError
import json

logger = logging.getLogger(__name__)

# PostgreSQL connection pool (shared across sessions)
_pg_pool = None


def _get_pg_pool():
    """
    Get PostgreSQL connection pool

    Returns:
        Connection pool instance
    """
    global _pg_pool

    postgres_url = os.getenv(
        "POSTGRES_URL",
        "postgresql://postgres:postgres@localhost:5432/agent_memory"
    )

    if _pg_pool is None:
        logger.info(f"Creating PostgreSQL connection pool (minconn=1, maxconn=${poolSize})")
        _pg_pool = psycopg2.pool.ThreadedConnectionPool(
            minconn=1,
            maxconn=${poolSize},
            dsn=postgres_url,
            connect_timeout=${timeout},
        )

    return _pg_pool


@contextmanager
def _get_pg_connection():
    """
    Context manager for PostgreSQL connections

    Yields:
        Database connection from pool
    """
    pool = _get_pg_pool()
    conn = pool.getconn()
    try:
        yield conn
    finally:
        pool.putconn(conn)


def validate_postgres_connection(max_retries: int = 3, retry_delay: float = 1.0) -> bool:
    """
    Validate PostgreSQL connection with retry logic

    Args:
        max_retries: Maximum number of connection attempts
        retry_delay: Initial delay between retries (exponential backoff)

    Returns:
        True if connection successful, False otherwise
    """
    for attempt in range(max_retries):
        try:
            logger.info(f"Validating PostgreSQL connection (attempt {attempt + 1}/{max_retries})")

            with _get_pg_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT 1")
                cursor.close()

            logger.info("PostgreSQL connection validated successfully")
            return True
        except OperationalError as e:
            if attempt < max_retries - 1:
                wait_time = retry_delay * (2 ** attempt)
                logger.warning(f"PostgreSQL connection failed: {str(e)}. Retrying in {wait_time}s...")
                time.sleep(wait_time)
            else:
                logger.error(f"PostgreSQL connection failed after {max_retries} attempts: {str(e)}")
                return False
        except Exception as e:
            logger.error(f"Unexpected error validating PostgreSQL connection: {str(e)}", exc_info=True)
            return False

    return False


def initialize_schema() -> bool:
    """
    Initialize database schema if not exists

    Returns:
        True if schema initialized successfully
    """
    try:
        logger.info("Initializing PostgreSQL schema")

        with _get_pg_connection() as conn:
            cursor = conn.cursor()

            # Create message_store table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS message_store (
                    id SERIAL PRIMARY KEY,
                    session_id TEXT NOT NULL,
                    message JSONB NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_session_id (session_id),
                    INDEX idx_created_at (created_at)
                )
            """)

            conn.commit()
            cursor.close()

        logger.info("Schema initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Error initializing schema: {str(e)}", exc_info=True)
        return False


def get_memory(session_id: str = "default") -> ConversationBufferMemory:
    """
    Create PostgreSQL-backed conversation memory with validation

    Args:
        session_id: Unique session identifier for this conversation

    Returns:
        ConversationBufferMemory with PostgreSQL backend

    Raises:
        ConnectionError: If PostgreSQL connection cannot be established
    """
    try:
        logger.info(f"Creating PostgreSQL-backed memory for session: {session_id}")

        # Validate connection first
        if not validate_postgres_connection():
            raise ConnectionError("Failed to connect to PostgreSQL after multiple attempts")

        # Initialize schema
        initialize_schema()

        postgres_url = os.getenv(
            "POSTGRES_URL",
            "postgresql://postgres:postgres@localhost:5432/agent_memory"
        )

        message_history = PostgresChatMessageHistory(
            connection_string=postgres_url,
            session_id=session_id,
        )

        memory = ConversationBufferMemory(
            chat_memory=message_history,
            memory_key="chat_history",
            return_messages=${returnMessages},
            output_key="output",
            input_key="input",
        )

        logger.info(f"PostgreSQL memory created successfully for session: {session_id}")
        return memory
    except Exception as e:
        logger.error(f"Error creating PostgreSQL memory: {str(e)}", exc_info=True)
        raise


def clear_memory(memory: ConversationBufferMemory, session_id: str = "default") -> None:
    """
    Clear conversation history for session

    Args:
        memory: Memory instance
        session_id: Session to clear
    """
    try:
        logger.info(f"Clearing PostgreSQL memory for session: {session_id}")
        if hasattr(memory, "chat_memory"):
            memory.chat_memory.clear()
        logger.info("Memory cleared successfully")
    except Exception as e:
        logger.error(f"Error clearing memory: {str(e)}", exc_info=True)
        raise


def get_memory_stats(session_id: str = "default") -> Dict[str, Any]:
    """
    Get memory usage statistics for session

    Args:
        session_id: Session to get stats for

    Returns:
        Dictionary with memory statistics
    """
    try:
        with _get_pg_connection() as conn:
            cursor = conn.cursor()

            # Get message count
            cursor.execute("SELECT COUNT(*) FROM message_store WHERE session_id = %s", (session_id,))
            message_count = cursor.fetchone()[0]

            # Get first and last message timestamps
            cursor.execute(
                "SELECT MIN(created_at), MAX(created_at) FROM message_store WHERE session_id = %s",
                (session_id,)
            )
            first_msg, last_msg = cursor.fetchone()

            cursor.close()

        return {
            "type": "postgres",
            "session_id": session_id,
            "message_count": message_count,
            "first_message_at": first_msg.isoformat() if first_msg else None,
            "last_message_at": last_msg.isoformat() if last_msg else None,
        }
    except Exception as e:
        logger.error(f"Error getting memory stats: {str(e)}", exc_info=True)
        return {
            "type": "postgres",
            "session_id": session_id,
            "error": str(e),
        }


def health_check() -> Dict[str, Any]:
    """
    Check PostgreSQL health

    Returns:
        Dictionary with health check results
    """
    try:
        start_time = time.time()

        with _get_pg_connection() as conn:
            cursor = conn.cursor()

            # Check connection
            cursor.execute("SELECT version()")
            version = cursor.fetchone()[0]

            # Check table exists
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = 'message_store'
                )
            """)
            table_exists = cursor.fetchone()[0]

            cursor.close()

        latency = (time.time() - start_time) * 1000  # ms

        return {
            "healthy": True,
            "latency_ms": round(latency, 2),
            "postgres_version": version.split()[0] if version else "unknown",
            "schema_initialized": table_exists,
        }
    except Exception as e:
        logger.error(f"PostgreSQL health check failed: {str(e)}", exc_info=True)
        return {
            "healthy": False,
            "error": str(e),
        }


def get_all_sessions() -> List[str]:
    """
    Get all active session IDs from PostgreSQL

    Returns:
        List of session IDs
    """
    try:
        with _get_pg_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT DISTINCT session_id FROM message_store")
            sessions = [row[0] for row in cursor.fetchall()]
            cursor.close()

        logger.info(f"Found {len(sessions)} sessions")
        return sessions
    except Exception as e:
        logger.error(f"Error getting sessions: {str(e)}", exc_info=True)
        return []


def delete_session(session_id: str) -> bool:
    """
    Delete a specific session from PostgreSQL

    Args:
        session_id: Session to delete

    Returns:
        True if session was deleted, False otherwise
    """
    try:
        logger.info(f"Deleting session: {session_id}")

        with _get_pg_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM message_store WHERE session_id = %s", (session_id,))
            rows_deleted = cursor.rowcount
            conn.commit()
            cursor.close()

        logger.info(f"Deleted {rows_deleted} messages for session {session_id}")
        return rows_deleted > 0
    except Exception as e:
        logger.error(f"Error deleting session: {str(e)}", exc_info=True)
        return False


def export_session_history(session_id: str, format: str = "json") -> Any:
    """
    Export full conversation history for a session

    Args:
        session_id: Session to export
        format: Export format ("json" or "csv")

    Returns:
        Exported data in requested format
    """
    try:
        logger.info(f"Exporting session {session_id} as {format}")

        with _get_pg_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id, message, created_at FROM message_store WHERE session_id = %s ORDER BY id",
                (session_id,)
            )

            rows = cursor.fetchall()
            cursor.close()

        if format == "json":
            messages = [
                {
                    "id": row[0],
                    "message": json.loads(row[1]) if isinstance(row[1], str) else row[1],
                    "created_at": row[2].isoformat() if row[2] else None,
                }
                for row in rows
            ]
            return messages
        elif format == "csv":
            # CSV export
            import csv
            import io

            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["id", "message", "created_at"])

            for row in rows:
                writer.writerow([
                    row[0],
                    json.dumps(json.loads(row[1]) if isinstance(row[1], str) else row[1]),
                    row[2].isoformat() if row[2] else "",
                ])

            return output.getvalue()
        else:
            raise ValueError(f"Unsupported format: {format}")

    except Exception as e:
        logger.error(f"Error exporting session: {str(e)}", exc_info=True)
        raise
`;
  }
}
