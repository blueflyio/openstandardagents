/**
 * LangChain Callbacks Generator
 *
 * Generates observability and callback handlers for LangChain agents:
 * - LangSmith tracing
 * - LangFuse observability
 * - OpenTelemetry integration
 * - Custom callback handlers
 *
 * SOLID: Single Responsibility - Callback configuration generation
 * DRY: Reusable callback patterns
 */

import type { OssaAgent } from '../../../types/index.js';

/**
 * Callback configuration options
 */
export interface CallbackConfig {
  /**
   * Enable LangSmith tracing
   */
  langsmith?: boolean;

  /**
   * Enable LangFuse observability
   */
  langfuse?: boolean;

  /**
   * Enable OpenTelemetry
   */
  opentelemetry?: boolean;

  /**
   * Custom callback handlers
   */
  custom?: {
    onStart?: boolean;
    onEnd?: boolean;
    onError?: boolean;
    onToken?: boolean;
  };

  /**
   * Log level
   */
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Callbacks Generator
 */
export class CallbacksGenerator {
  /**
   * Generate callbacks.py with observability integrations
   */
  generate(manifest: OssaAgent, config: CallbackConfig = {}): string {
    const agentName = manifest.metadata?.name || 'agent';
    const sections: string[] = [];

    // Header
    sections.push(this.generateHeader(agentName));

    // Imports
    sections.push(this.generateImports(config));

    // Configuration
    sections.push(this.generateConfiguration(config));

    // LangSmith integration
    if (config.langsmith !== false) {
      sections.push(this.generateLangSmithSetup());
    }

    // LangFuse integration
    if (config.langfuse) {
      sections.push(this.generateLangFuseHandler());
    }

    // OpenTelemetry integration
    if (config.opentelemetry) {
      sections.push(this.generateOpenTelemetryHandler());
    }

    // Custom handlers
    if (config.custom) {
      sections.push(this.generateCustomHandlers(config.custom));
    }

    // Cost tracking handler
    sections.push(this.generateCostTrackingHandler());

    // Main callback manager
    sections.push(this.generateCallbackManager(config));

    // Helper functions
    sections.push(this.generateHelpers());

    return sections.join('\n\n');
  }

  private generateHeader(agentName: string): string {
    return `"""
Callbacks and Observability for ${agentName}

Provides comprehensive callback handlers for:
- LangSmith tracing (production-ready)
- LangFuse observability
- OpenTelemetry instrumentation
- Cost tracking and token usage
- Custom event handlers
"""`;
  }

  private generateImports(config: CallbackConfig): string {
    const imports = [
      'import os',
      'import time',
      'from typing import Any, Dict, List, Optional, Union',
      'from datetime import datetime',
      'from langchain.callbacks.base import BaseCallbackHandler',
      'from langchain.callbacks.manager import CallbackManager',
      'from langchain.schema import AgentAction, AgentFinish, LLMResult',
    ];

    if (config.langsmith !== false) {
      imports.push('from langchain.callbacks.tracers import LangChainTracer');
    }

    if (config.langfuse) {
      imports.push(
        'from langfuse.callback import CallbackHandler as LangfuseHandler'
      );
    }

    if (config.opentelemetry) {
      imports.push(
        'from opentelemetry import trace',
        'from opentelemetry.sdk.trace import TracerProvider',
        'from opentelemetry.sdk.trace.export import BatchSpanProcessor',
        'from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter'
      );
    }

    return imports.join('\n');
  }

  private generateConfiguration(config: CallbackConfig): string {
    return `# Callback Configuration
LOG_LEVEL = os.getenv("CALLBACK_LOG_LEVEL", "${config.logLevel || 'info'}").lower()
LANGSMITH_ENABLED = os.getenv("LANGSMITH_ENABLED", "${config.langsmith !== false ? 'true' : 'false'}").lower() == "true"
LANGFUSE_ENABLED = os.getenv("LANGFUSE_ENABLED", "${config.langfuse ? 'true' : 'false'}").lower() == "true"
OTEL_ENABLED = os.getenv("OTEL_ENABLED", "${config.opentelemetry ? 'true' : 'false'}").lower() == "true"`;
  }

  private generateLangSmithSetup(): string {
    return `def setup_langsmith() -> Optional[LangChainTracer]:
    """
    Setup LangSmith tracing

    Environment variables:
    - LANGCHAIN_API_KEY: LangSmith API key
    - LANGCHAIN_PROJECT: Project name
    - LANGCHAIN_ENDPOINT: API endpoint (optional)
    """
    if not LANGSMITH_ENABLED:
        return None

    api_key = os.getenv("LANGCHAIN_API_KEY")
    if not api_key:
        print("Warning: LANGCHAIN_API_KEY not set, LangSmith tracing disabled")
        return None

    project = os.getenv("LANGCHAIN_PROJECT", "default")
    endpoint = os.getenv("LANGCHAIN_ENDPOINT", "https://api.smith.langchain.com")

    try:
        tracer = LangChainTracer(
            project_name=project,
            client=None,  # Will use env vars
        )
        print(f"✓ LangSmith tracing enabled: project={project}")
        return tracer
    except Exception as e:
        print(f"Warning: Failed to setup LangSmith: {e}")
        return None`;
  }

  private generateLangFuseHandler(): string {
    return `def setup_langfuse() -> Optional[LangfuseHandler]:
    """
    Setup LangFuse observability

    Environment variables:
    - LANGFUSE_PUBLIC_KEY: Public key
    - LANGFUSE_SECRET_KEY: Secret key
    - LANGFUSE_HOST: Host URL (optional)
    """
    if not LANGFUSE_ENABLED:
        return None

    public_key = os.getenv("LANGFUSE_PUBLIC_KEY")
    secret_key = os.getenv("LANGFUSE_SECRET_KEY")

    if not public_key or not secret_key:
        print("Warning: LangFuse credentials not set, observability disabled")
        return None

    try:
        handler = LangfuseHandler(
            public_key=public_key,
            secret_key=secret_key,
            host=os.getenv("LANGFUSE_HOST"),
        )
        print("✓ LangFuse observability enabled")
        return handler
    except Exception as e:
        print(f"Warning: Failed to setup LangFuse: {e}")
        return None`;
  }

  private generateOpenTelemetryHandler(): string {
    return `def setup_opentelemetry():
    """
    Setup OpenTelemetry tracing

    Environment variables:
    - OTEL_EXPORTER_OTLP_ENDPOINT: OTLP endpoint
    - OTEL_SERVICE_NAME: Service name
    """
    if not OTEL_ENABLED:
        return

    endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
    if not endpoint:
        print("Warning: OTEL_EXPORTER_OTLP_ENDPOINT not set, OpenTelemetry disabled")
        return

    try:
        provider = TracerProvider()
        processor = BatchSpanProcessor(OTLPSpanExporter(endpoint=endpoint))
        provider.add_span_processor(processor)
        trace.set_tracer_provider(provider)

        service_name = os.getenv("OTEL_SERVICE_NAME", "langchain-agent")
        print(f"✓ OpenTelemetry enabled: service={service_name}")
    except Exception as e:
        print(f"Warning: Failed to setup OpenTelemetry: {e}")


class OpenTelemetryCallbackHandler(BaseCallbackHandler):
    """OpenTelemetry callback handler"""

    def __init__(self):
        super().__init__()
        self.tracer = trace.get_tracer(__name__)
        self.spans = {}

    def on_llm_start(self, serialized: Dict[str, Any], prompts: List[str], **kwargs):
        """Start LLM span"""
        run_id = kwargs.get("run_id")
        span = self.tracer.start_span(f"llm.{serialized.get('name', 'unknown')}")
        span.set_attribute("prompts.count", len(prompts))
        self.spans[str(run_id)] = span

    def on_llm_end(self, response: LLMResult, **kwargs):
        """End LLM span"""
        run_id = kwargs.get("run_id")
        span = self.spans.pop(str(run_id), None)
        if span:
            span.set_attribute("generations.count", len(response.generations))
            span.end()

    def on_llm_error(self, error: Exception, **kwargs):
        """Record LLM error"""
        run_id = kwargs.get("run_id")
        span = self.spans.pop(str(run_id), None)
        if span:
            span.record_exception(error)
            span.end()`;
  }

  private generateCustomHandlers(
    custom: NonNullable<CallbackConfig['custom']>
  ): string {
    return `class CustomCallbackHandler(BaseCallbackHandler):
    """Custom callback handler with event hooks"""

    def __init__(self, log_level: str = "info"):
        super().__init__()
        self.log_level = log_level
        self.start_time = None
        self.events = []

    ${
      custom.onStart
        ? `def on_chain_start(self, serialized: Dict[str, Any], inputs: Dict[str, Any], **kwargs):
        """Called when chain starts"""
        self.start_time = time.time()
        if self.log_level in ["debug", "info"]:
            print(f"▶ Chain started: {serialized.get('name', 'unknown')}")
            if self.log_level == "debug":
                print(f"  Inputs: {inputs}")

    def on_agent_action(self, action: AgentAction, **kwargs):
        """Called when agent takes action"""
        if self.log_level in ["debug", "info"]:
            print(f"  → Action: {action.tool} - {action.tool_input}")`
        : ''
    }

    ${
      custom.onEnd
        ? `def on_chain_end(self, outputs: Dict[str, Any], **kwargs):
        """Called when chain ends"""
        duration = time.time() - self.start_time if self.start_time else 0
        if self.log_level in ["debug", "info"]:
            print(f"✓ Chain completed: {duration:.2f}s")
            if self.log_level == "debug":
                print(f"  Outputs: {outputs}")`
        : ''
    }

    ${
      custom.onError
        ? `def on_chain_error(self, error: Exception, **kwargs):
        """Called when chain errors"""
        print(f"✗ Chain error: {error}")
        if self.log_level == "debug":
            import traceback
            traceback.print_exc()`
        : ''
    }

    ${
      custom.onToken
        ? `def on_llm_new_token(self, token: str, **kwargs):
        """Called when new token is generated"""
        if self.log_level == "debug":
            print(token, end="", flush=True)`
        : ''
    }`;
  }

  private generateCostTrackingHandler(): string {
    return `class CostTrackingHandler(BaseCallbackHandler):
    """Track token usage and costs"""

    # Pricing per 1M tokens (as of 2026)
    PRICING = {
        "gpt-4": {"input": 30.0, "output": 60.0},
        "gpt-4-turbo": {"input": 10.0, "output": 30.0},
        "gpt-3.5-turbo": {"input": 0.5, "output": 1.5},
        "claude-3-opus": {"input": 15.0, "output": 75.0},
        "claude-3-sonnet": {"input": 3.0, "output": 15.0},
        "claude-3-haiku": {"input": 0.25, "output": 1.25},
        "claude-sonnet-4": {"input": 3.0, "output": 15.0},
    }

    def __init__(self):
        super().__init__()
        self.total_tokens = 0
        self.prompt_tokens = 0
        self.completion_tokens = 0
        self.total_cost = 0.0
        self.model_name = None

    def on_llm_start(self, serialized: Dict[str, Any], prompts: List[str], **kwargs):
        """Capture model name"""
        self.model_name = serialized.get("name", "unknown")

    def on_llm_end(self, response: LLMResult, **kwargs):
        """Track token usage"""
        if not response.llm_output:
            return

        token_usage = response.llm_output.get("token_usage", {})
        prompt_tokens = token_usage.get("prompt_tokens", 0)
        completion_tokens = token_usage.get("completion_tokens", 0)
        total = prompt_tokens + completion_tokens

        self.prompt_tokens += prompt_tokens
        self.completion_tokens += completion_tokens
        self.total_tokens += total

        # Calculate cost
        model_key = self._normalize_model_name(self.model_name or "")
        pricing = self.PRICING.get(model_key, {"input": 0, "output": 0})

        input_cost = (prompt_tokens / 1_000_000) * pricing["input"]
        output_cost = (completion_tokens / 1_000_000) * pricing["output"]
        self.total_cost += input_cost + output_cost

        if LOG_LEVEL in ["debug", "info"]:
            print(f"  Tokens: {prompt_tokens} in, {completion_tokens} out = \${input_cost + output_cost:.6f}")

    def _normalize_model_name(self, model: str) -> str:
        """Normalize model name for pricing lookup"""
        model = model.lower()
        for key in self.PRICING.keys():
            if key in model:
                return key
        return "unknown"

    def get_summary(self) -> Dict[str, Any]:
        """Get cost tracking summary"""
        return {
            "total_tokens": self.total_tokens,
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
            "total_cost": round(self.total_cost, 6),
            "model": self.model_name,
        }

    def reset(self):
        """Reset tracking counters"""
        self.total_tokens = 0
        self.prompt_tokens = 0
        self.completion_tokens = 0
        self.total_cost = 0.0`;
  }

  private generateCallbackManager(config: CallbackConfig): string {
    return `def get_callbacks() -> CallbackManager:
    """
    Get configured callback manager with all enabled handlers
    """
    handlers = []

    # LangSmith tracing
    if LANGSMITH_ENABLED:
        langsmith = setup_langsmith()
        if langsmith:
            handlers.append(langsmith)

    # LangFuse observability
    if LANGFUSE_ENABLED:
        langfuse = setup_langfuse()
        if langfuse:
            handlers.append(langfuse)

    # OpenTelemetry
    if OTEL_ENABLED:
        setup_opentelemetry()
        handlers.append(OpenTelemetryCallbackHandler())

    # Custom handlers
    ${config.custom ? 'handlers.append(CustomCallbackHandler(log_level=LOG_LEVEL))' : ''}

    # Cost tracking (always enabled)
    cost_tracker = CostTrackingHandler()
    handlers.append(cost_tracker)

    manager = CallbackManager(handlers=handlers)

    if LOG_LEVEL in ["debug", "info"]:
        print(f"✓ Callbacks initialized: {len(handlers)} handlers")

    return manager


# Global cost tracker for access
_cost_tracker = CostTrackingHandler()


def get_cost_tracker() -> CostTrackingHandler:
    """Get global cost tracker instance"""
    return _cost_tracker`;
  }

  private generateHelpers(): string {
    return `def print_cost_summary(tracker: Optional[CostTrackingHandler] = None):
    """Print cost tracking summary"""
    tracker = tracker or _cost_tracker
    summary = tracker.get_summary()

    print("\\n" + "=" * 50)
    print("Cost Summary")
    print("=" * 50)
    print(f"Model: {summary['model']}")
    print(f"Total Tokens: {summary['total_tokens']:,}")
    print(f"  Prompt: {summary['prompt_tokens']:,}")
    print(f"  Completion: {summary['completion_tokens']:,}")
    print(f"Total Cost: \${summary['total_cost']:.6f}")
    print("=" * 50)


def reset_cost_tracking(tracker: Optional[CostTrackingHandler] = None):
    """Reset cost tracking counters"""
    tracker = tracker or _cost_tracker
    tracker.reset()
    print("✓ Cost tracking reset")`;
  }
}
