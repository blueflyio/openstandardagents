/**
 * LangChain Error Handling Generator
 *
 * Generates production-grade error handling for LangChain agents:
 * - Retry logic with exponential backoff
 * - Circuit breaker pattern
 * - Rate limiting
 * - Error classification and recovery strategies
 * - Fallback mechanisms
 *
 * SOLID: Single Responsibility - Error handling configuration
 * DRY: Reusable error handling patterns
 */

import type { OssaAgent } from '../../../types/index.js';

/**
 * Error handling configuration
 */
export interface ErrorHandlingConfig {
  /**
   * Enable retry logic
   */
  retry?: {
    enabled?: boolean;
    maxAttempts?: number;
    exponentialBackoff?: boolean;
    initialDelay?: number; // ms
    maxDelay?: number; // ms
    retryableErrors?: string[];
  };

  /**
   * Enable circuit breaker
   */
  circuitBreaker?: {
    enabled?: boolean;
    failureThreshold?: number;
    resetTimeout?: number; // seconds
    halfOpenMaxAttempts?: number;
  };

  /**
   * Rate limiting
   */
  rateLimit?: {
    enabled?: boolean;
    maxRequests?: number;
    windowSeconds?: number;
  };

  /**
   * Fallback strategies
   */
  fallback?: {
    enabled?: boolean;
    defaultResponse?: string;
    useCachedResponses?: boolean;
  };
}

/**
 * Error Handling Generator
 */
export class ErrorHandlingGenerator {
  /**
   * Generate error_handling.py with production error handling
   */
  generate(manifest: OssaAgent, config: ErrorHandlingConfig = {}): string {
    const sections: string[] = [];

    // Header
    sections.push(this.generateHeader());

    // Imports
    sections.push(this.generateImports(config));

    // Configuration
    sections.push(this.generateConfiguration(config));

    // Error classification
    sections.push(this.generateErrorClassification());

    // Retry decorator
    if (config.retry?.enabled !== false) {
      sections.push(this.generateRetryDecorator(config.retry));
    }

    // Circuit breaker
    if (config.circuitBreaker?.enabled) {
      sections.push(this.generateCircuitBreaker(config.circuitBreaker));
    }

    // Rate limiter
    if (config.rateLimit?.enabled) {
      sections.push(this.generateRateLimiter(config.rateLimit));
    }

    // Fallback handler
    if (config.fallback?.enabled) {
      sections.push(this.generateFallbackHandler(config.fallback));
    }

    // Error recovery
    sections.push(this.generateErrorRecovery());

    // Main error handler
    sections.push(this.generateMainErrorHandler());

    // Utilities
    sections.push(this.generateUtilities());

    return sections.join('\n\n');
  }

  private generateHeader(): string {
    return `"""
Production Error Handling for LangChain Agents

Features:
- Retry logic with exponential backoff
- Circuit breaker pattern
- Rate limiting
- Error classification and recovery
- Fallback mechanisms
- Comprehensive error logging
"""`;
  }

  private generateImports(config: ErrorHandlingConfig): string {
    const imports = [
      'import time',
      'import functools',
      'from typing import Any, Callable, Dict, Optional, TypeVar, cast',
      'from datetime import datetime, timedelta',
      'from enum import Enum',
      'import logging',
    ];

    if (config.circuitBreaker?.enabled || config.rateLimit?.enabled) {
      imports.push('from collections import deque');
    }

    if (config.fallback?.useCachedResponses) {
      imports.push('from cachetools import TTLCache');
    }

    return imports.join('\n');
  }

  private generateConfiguration(config: ErrorHandlingConfig): string {
    const retry = config.retry || {};
    const circuitBreaker = config.circuitBreaker || {};
    const rateLimit = config.rateLimit || {};

    return `# Error Handling Configuration
logger = logging.getLogger(__name__)

# Retry configuration
RETRY_ENABLED = ${retry.enabled !== false ? 'True' : 'False'}
MAX_RETRY_ATTEMPTS = ${retry.maxAttempts || 3}
EXPONENTIAL_BACKOFF = ${retry.exponentialBackoff !== false ? 'True' : 'False'}
INITIAL_RETRY_DELAY = ${retry.initialDelay || 1000}  # ms
MAX_RETRY_DELAY = ${retry.maxDelay || 30000}  # ms

# Circuit breaker configuration
CIRCUIT_BREAKER_ENABLED = ${circuitBreaker.enabled ? 'True' : 'False'}
FAILURE_THRESHOLD = ${circuitBreaker.failureThreshold || 5}
RESET_TIMEOUT = ${circuitBreaker.resetTimeout || 60}  # seconds
HALF_OPEN_MAX_ATTEMPTS = ${circuitBreaker.halfOpenMaxAttempts || 1}

# Rate limiting
RATE_LIMIT_ENABLED = ${rateLimit.enabled ? 'True' : 'False'}
MAX_REQUESTS = ${rateLimit.maxRequests || 100}
WINDOW_SECONDS = ${rateLimit.windowSeconds || 60}`;
  }

  private generateErrorClassification(): string {
    return `class ErrorType(Enum):
    """Error classification for recovery strategies"""
    RATE_LIMIT = "rate_limit"  # API rate limit hit
    TIMEOUT = "timeout"  # Request timeout
    NETWORK = "network"  # Network connectivity issue
    AUTHENTICATION = "authentication"  # Auth failure
    INVALID_INPUT = "invalid_input"  # Bad input data
    INTERNAL = "internal"  # Internal agent error
    UNKNOWN = "unknown"  # Unknown error


class RetryableError(Exception):
    """Error that can be retried"""
    def __init__(self, message: str, error_type: ErrorType, original_error: Optional[Exception] = None):
        super().__init__(message)
        self.error_type = error_type
        self.original_error = original_error


class NonRetryableError(Exception):
    """Error that should not be retried"""
    def __init__(self, message: str, error_type: ErrorType, original_error: Optional[Exception] = None):
        super().__init__(message)
        self.error_type = error_type
        self.original_error = original_error


def classify_error(error: Exception) -> ErrorType:
    """Classify error type for recovery strategy"""
    error_str = str(error).lower()

    if "rate limit" in error_str or "429" in error_str:
        return ErrorType.RATE_LIMIT
    elif "timeout" in error_str or "timed out" in error_str:
        return ErrorType.TIMEOUT
    elif "connection" in error_str or "network" in error_str:
        return ErrorType.NETWORK
    elif "authentication" in error_str or "unauthorized" in error_str or "401" in error_str:
        return ErrorType.AUTHENTICATION
    elif "invalid" in error_str or "validation" in error_str or "400" in error_str:
        return ErrorType.INVALID_INPUT
    else:
        return ErrorType.UNKNOWN


def is_retryable(error: Exception) -> bool:
    """Check if error is retryable"""
    if isinstance(error, NonRetryableError):
        return False

    error_type = classify_error(error)
    # Retry rate limits, timeouts, and network errors
    return error_type in [ErrorType.RATE_LIMIT, ErrorType.TIMEOUT, ErrorType.NETWORK]`;
  }

  private generateRetryDecorator(retry: NonNullable<ErrorHandlingConfig['retry']>): string {
    return `T = TypeVar('T')


def with_retry(
    max_attempts: int = MAX_RETRY_ATTEMPTS,
    initial_delay: float = INITIAL_RETRY_DELAY / 1000,
    max_delay: float = MAX_RETRY_DELAY / 1000,
    exponential_backoff: bool = EXPONENTIAL_BACKOFF,
) -> Callable[[Callable[..., T]], Callable[..., T]]:
    """
    Retry decorator with exponential backoff

    Args:
        max_attempts: Maximum number of retry attempts
        initial_delay: Initial delay in seconds
        max_delay: Maximum delay in seconds
        exponential_backoff: Use exponential backoff
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> T:
            if not RETRY_ENABLED:
                return func(*args, **kwargs)

            last_exception = None
            delay = initial_delay

            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e

                    # Don't retry non-retryable errors
                    if not is_retryable(e):
                        logger.warning(f"Non-retryable error: {e}")
                        raise

                    # Last attempt, don't wait
                    if attempt >= max_attempts - 1:
                        break

                    # Log retry
                    error_type = classify_error(e)
                    logger.warning(
                        f"Attempt {attempt + 1}/{max_attempts} failed ({error_type.value}): {e}. "
                        f"Retrying in {delay:.2f}s..."
                    )

                    # Wait before retry
                    time.sleep(delay)

                    # Exponential backoff
                    if exponential_backoff:
                        delay = min(delay * 2, max_delay)
                    else:
                        delay = min(delay + initial_delay, max_delay)

            # All retries exhausted
            logger.error(f"All {max_attempts} retry attempts failed")
            if last_exception:
                raise last_exception
            raise RuntimeError(f"Function {func.__name__} failed after {max_attempts} attempts")

        return wrapper
    return decorator`;
  }

  private generateCircuitBreaker(circuitBreaker: NonNullable<ErrorHandlingConfig['circuitBreaker']>): string {
    return `class CircuitBreakerState(Enum):
    """Circuit breaker states"""
    CLOSED = "closed"  # Normal operation
    OPEN = "open"  # Failing, reject requests
    HALF_OPEN = "half_open"  # Testing if recovered


class CircuitBreaker:
    """Circuit breaker pattern implementation"""

    def __init__(
        self,
        failure_threshold: int = FAILURE_THRESHOLD,
        reset_timeout: int = RESET_TIMEOUT,
        half_open_max_attempts: int = HALF_OPEN_MAX_ATTEMPTS,
    ):
        self.failure_threshold = failure_threshold
        self.reset_timeout = reset_timeout
        self.half_open_max_attempts = half_open_max_attempts

        self.state = CircuitBreakerState.CLOSED
        self.failure_count = 0
        self.last_failure_time: Optional[datetime] = None
        self.half_open_attempts = 0

    def call(self, func: Callable[..., T], *args, **kwargs) -> T:
        """Execute function with circuit breaker protection"""
        if not CIRCUIT_BREAKER_ENABLED:
            return func(*args, **kwargs)

        # Check if circuit should transition to HALF_OPEN
        if self.state == CircuitBreakerState.OPEN:
            if self._should_attempt_reset():
                self.state = CircuitBreakerState.HALF_OPEN
                self.half_open_attempts = 0
                logger.info("Circuit breaker: OPEN -> HALF_OPEN")
            else:
                raise RuntimeError("Circuit breaker is OPEN, rejecting request")

        # Limit attempts in HALF_OPEN state
        if self.state == CircuitBreakerState.HALF_OPEN:
            if self.half_open_attempts >= self.half_open_max_attempts:
                raise RuntimeError("Circuit breaker HALF_OPEN, max attempts reached")
            self.half_open_attempts += 1

        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise

    def _should_attempt_reset(self) -> bool:
        """Check if enough time has passed to attempt reset"""
        if not self.last_failure_time:
            return False
        elapsed = (datetime.now() - self.last_failure_time).total_seconds()
        return elapsed >= self.reset_timeout

    def _on_success(self):
        """Handle successful call"""
        if self.state == CircuitBreakerState.HALF_OPEN:
            self.state = CircuitBreakerState.CLOSED
            self.failure_count = 0
            logger.info("Circuit breaker: HALF_OPEN -> CLOSED (recovered)")
        self.failure_count = max(0, self.failure_count - 1)

    def _on_failure(self):
        """Handle failed call"""
        self.failure_count += 1
        self.last_failure_time = datetime.now()

        if self.state == CircuitBreakerState.HALF_OPEN:
            self.state = CircuitBreakerState.OPEN
            logger.warning("Circuit breaker: HALF_OPEN -> OPEN (still failing)")
        elif self.failure_count >= self.failure_threshold:
            self.state = CircuitBreakerState.OPEN
            logger.warning(f"Circuit breaker: CLOSED -> OPEN (threshold {self.failure_threshold} reached)")

    def reset(self):
        """Manually reset circuit breaker"""
        self.state = CircuitBreakerState.CLOSED
        self.failure_count = 0
        self.last_failure_time = None
        logger.info("Circuit breaker manually reset")


# Global circuit breaker instance
_circuit_breaker = CircuitBreaker()


def get_circuit_breaker() -> CircuitBreaker:
    """Get global circuit breaker instance"""
    return _circuit_breaker`;
  }

  private generateRateLimiter(rateLimit: NonNullable<ErrorHandlingConfig['rateLimit']>): string {
    return `class RateLimiter:
    """Token bucket rate limiter"""

    def __init__(self, max_requests: int = MAX_REQUESTS, window_seconds: int = WINDOW_SECONDS):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = deque()

    def acquire(self) -> bool:
        """Try to acquire a request slot"""
        if not RATE_LIMIT_ENABLED:
            return True

        now = datetime.now()
        cutoff = now - timedelta(seconds=self.window_seconds)

        # Remove old requests outside window
        while self.requests and self.requests[0] < cutoff:
            self.requests.popleft()

        # Check if we can make a request
        if len(self.requests) >= self.max_requests:
            oldest = self.requests[0]
            wait_time = (oldest + timedelta(seconds=self.window_seconds) - now).total_seconds()
            logger.warning(f"Rate limit reached. Wait {wait_time:.2f}s before retrying")
            return False

        self.requests.append(now)
        return True

    def wait_if_needed(self):
        """Block until a slot is available"""
        while not self.acquire():
            time.sleep(1)


# Global rate limiter
_rate_limiter = RateLimiter()


def get_rate_limiter() -> RateLimiter:
    """Get global rate limiter instance"""
    return _rate_limiter`;
  }

  private generateFallbackHandler(fallback: NonNullable<ErrorHandlingConfig['fallback']>): string {
    return `class FallbackHandler:
    """Fallback response handler"""

    def __init__(self):
        self.default_response = "${fallback.defaultResponse || 'I apologize, but I encountered an error processing your request. Please try again.'}"
        ${fallback.useCachedResponses ? 'self.cache = TTLCache(maxsize=100, ttl=300)  # 5 minute TTL' : ''}

    def get_fallback_response(self, input_text: str, error: Exception) -> str:
        """Get fallback response for failed request"""
        error_type = classify_error(error)

        ${fallback.useCachedResponses ? `# Try cached response
        cache_key = hash(input_text)
        if cache_key in self.cache:
            logger.info("Using cached fallback response")
            return self.cache[cache_key]` : ''}

        # Generate contextual fallback
        if error_type == ErrorType.RATE_LIMIT:
            return "I'm experiencing high demand right now. Please try again in a moment."
        elif error_type == ErrorType.TIMEOUT:
            return "Your request is taking longer than expected. Please try again or simplify your query."
        elif error_type == ErrorType.AUTHENTICATION:
            return "There's an authentication issue. Please check your credentials."
        else:
            return self.default_response

    ${fallback.useCachedResponses ? `def cache_response(self, input_text: str, response: str):
        """Cache successful response"""
        cache_key = hash(input_text)
        self.cache[cache_key] = response` : ''}


# Global fallback handler
_fallback_handler = FallbackHandler()


def get_fallback_handler() -> FallbackHandler:
    """Get global fallback handler"""
    return _fallback_handler`;
  }

  private generateErrorRecovery(): string {
    return `def handle_agent_error(func: Callable[..., T]) -> Callable[..., T]:
    """
    Comprehensive error handler for agent execution

    Combines retry, circuit breaker, rate limiting, and fallback
    """
    @functools.wraps(func)
    def wrapper(*args, **kwargs) -> T:
        # Rate limiting
        rate_limiter = get_rate_limiter()
        rate_limiter.wait_if_needed()

        # Circuit breaker
        circuit_breaker = get_circuit_breaker()

        # Execute with all protections
        try:
            return circuit_breaker.call(with_retry()(func), *args, **kwargs)
        except Exception as e:
            logger.error(f"Agent execution failed: {e}", exc_info=True)

            # Try fallback if available
            fallback = get_fallback_handler()
            if hasattr(fallback, 'get_fallback_response'):
                # Extract input from args/kwargs
                input_text = kwargs.get('input', args[0] if args else '')
                fallback_response = fallback.get_fallback_response(input_text, e)
                logger.info("Using fallback response")
                return {"output": fallback_response, "success": False, "fallback": True}

            raise

    return wrapper`;
  }

  private generateMainErrorHandler(): string {
    return `def safe_agent_invoke(agent, input_text: str, **kwargs) -> Dict[str, Any]:
    """
    Safely invoke agent with full error handling

    Args:
        agent: LangChain agent executor
        input_text: User input
        **kwargs: Additional invoke arguments

    Returns:
        Agent response with error handling
    """
    @handle_agent_error
    def invoke():
        return agent.invoke({"input": input_text, **kwargs})

    try:
        result = invoke()
        return {
            "output": result.get("output", ""),
            "success": True,
            "fallback": False,
        }
    except Exception as e:
        logger.error(f"Agent invocation failed: {e}")
        return {
            "output": str(e),
            "success": False,
            "error": str(e),
            "fallback": False,
        }`;
  }

  private generateUtilities(): string {
    return `def reset_error_handling():
    """Reset all error handling state"""
    get_circuit_breaker().reset()
    logger.info("Error handling state reset")


def get_error_stats() -> Dict[str, Any]:
    """Get error handling statistics"""
    circuit_breaker = get_circuit_breaker()
    return {
        "circuit_breaker": {
            "state": circuit_breaker.state.value,
            "failure_count": circuit_breaker.failure_count,
            "last_failure": circuit_breaker.last_failure_time.isoformat() if circuit_breaker.last_failure_time else None,
        },
        "retry": {
            "enabled": RETRY_ENABLED,
            "max_attempts": MAX_RETRY_ATTEMPTS,
        },
    }


def log_error_context(error: Exception, context: Dict[str, Any]):
    """Log error with full context"""
    error_type = classify_error(error)
    logger.error(
        f"Error ({error_type.value}): {error}",
        extra={
            "error_type": error_type.value,
            "error_message": str(error),
            "context": context,
        },
        exc_info=True,
    )`;
  }
}
