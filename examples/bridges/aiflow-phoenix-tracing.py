"""
Phoenix Tracing Integration for AIFlow FastAPI Bridge

This module adds OpenTelemetry/Phoenix tracing to the AIFlow FastAPI bridge.
Traces all API calls, LLM interactions, and agent tasks.

Usage:
    from aiflow_phoenix_tracing import init_phoenix_tracing, trace_agent_task

    # Initialize at startup
    init_phoenix_tracing(
        service_name="social-agent-aiflow",
        phoenix_endpoint="http://otel.agent-buildkit.orb.local:4318",
        phoenix_project="aiflow-social-agents"
    )

    # Trace agent tasks
    @trace_agent_task("generate_post")
    async def generate_post(request):
        # Your code here
        pass
"""

import os
import time
from typing import Optional, Dict, Any, Callable
from functools import wraps

# OpenTelemetry imports
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.resources import Resource
from opentelemetry.semconv.resource import ResourceAttributes
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentation
from opentelemetry.instrumentation.requests import RequestsInstrumentation
from opentelemetry.trace import Status, StatusCode, SpanKind


# Global tracer
_tracer: Optional[trace.Tracer] = None
_phoenix_config: Dict[str, Any] = {}


def init_phoenix_tracing(
    service_name: str,
    phoenix_endpoint: Optional[str] = None,
    phoenix_project: Optional[str] = None,
    enable_console_export: bool = False,
):
    """
    Initialize Phoenix tracing for the AIFlow agent.
    
    Args:
        service_name: Name of the service (e.g., 'social-agent-aiflow')
        phoenix_endpoint: Phoenix OTLP endpoint (default: env PHOENIX_ENDPOINT)
        phoenix_project: Phoenix project name (default: env PHOENIX_PROJECT)
        enable_console_export: Export traces to console for debugging
    """
    global _tracer, _phoenix_config
    
    # Get config from environment if not provided
    phoenix_endpoint = phoenix_endpoint or os.getenv(
        'PHOENIX_ENDPOINT',
        'http://otel.agent-buildkit.orb.local:4318'
    )
    phoenix_project = phoenix_project or os.getenv(
        'PHOENIX_PROJECT',
        'aiflow-social-agents'
    )
    
    # Store config
    _phoenix_config = {
        'service_name': service_name,
        'phoenix_endpoint': phoenix_endpoint,
        'phoenix_project': phoenix_project,
    }
    
    # Create resource
    resource = Resource.create({
        ResourceAttributes.SERVICE_NAME: service_name,
        ResourceAttributes.SERVICE_VERSION: os.getenv('SERVICE_VERSION', '1.0.0'),
        ResourceAttributes.DEPLOYMENT_ENVIRONMENT: os.getenv('NODE_ENV', 'development'),
        'phoenix.project': phoenix_project,
        'agent.type': 'aiflow',
        'agent.framework': 'fastapi',
    })
    
    # Create tracer provider
    provider = TracerProvider(resource=resource)
    
    # Add OTLP exporter
    otlp_exporter = OTLPSpanExporter(
        endpoint=f"{phoenix_endpoint}/v1/traces",
        headers={
            'x-phoenix-project': phoenix_project,
        },
    )
    
    provider.add_span_processor(
        BatchSpanProcessor(
            otlp_exporter,
            max_queue_size=1000,
            max_export_batch_size=100,
            schedule_delay_millis=1000,
        )
    )
    
    # Set as global tracer provider
    trace.set_tracer_provider(provider)
    
    # Get tracer
    _tracer = trace.get_tracer(service_name)
    
    # Auto-instrument FastAPI and Requests
    FastAPIInstrumentation().instrument()
    RequestsInstrumentation().instrument()
    
    print(f"✅ Phoenix tracing initialized")
    print(f"   Service: {service_name}")
    print(f"   Project: {phoenix_project}")
    print(f"   Endpoint: {phoenix_endpoint}")
    print(f"   View traces: http://phoenix.agent-buildkit.orb.local:6006/projects/{phoenix_project}")


def get_tracer() -> trace.Tracer:
    """Get the global tracer instance."""
    if _tracer is None:
        raise RuntimeError("Phoenix tracing not initialized. Call init_phoenix_tracing() first.")
    return _tracer


def trace_agent_task(task_name: str):
    """
    Decorator to trace agent tasks.
    
    Usage:
        @trace_agent_task("generate_post")
        async def generate_post(request):
            # Your code here
            pass
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            tracer = get_tracer()
            
            with tracer.start_as_current_span(
                f"agent.task.{task_name}",
                kind=SpanKind.INTERNAL,
                attributes={
                    'agent.task': task_name,
                    'agent.type': 'aiflow',
                    'agent.service': _phoenix_config.get('service_name', 'unknown'),
                }
            ) as span:
                try:
                    start_time = time.time()
                    result = await func(*args, **kwargs)
                    duration_ms = (time.time() - start_time) * 1000
                    
                    # Add success attributes
                    span.set_attribute('agent.task.duration_ms', duration_ms)
                    span.set_attribute('agent.task.status', 'success')
                    span.set_status(Status(StatusCode.OK))
                    
                    return result
                    
                except Exception as e:
                    # Add error attributes
                    span.set_attribute('agent.task.status', 'error')
                    span.set_attribute('agent.task.error', str(e))
                    span.set_status(Status(StatusCode.ERROR, str(e)))
                    span.record_exception(e)
                    raise
        
        return wrapper
    return decorator


def trace_llm_call(
    provider: str,
    model: str,
    prompt: str,
    response: Optional[str] = None,
    input_tokens: Optional[int] = None,
    output_tokens: Optional[int] = None,
    cost: Optional[float] = None,
):
    """
    Add LLM-specific attributes to current span.
    
    Args:
        provider: LLM provider (e.g., 'anthropic', 'openai')
        model: Model name (e.g., 'claude-3-sonnet')
        prompt: Input prompt
        response: Generated response
        input_tokens: Number of input tokens
        output_tokens: Number of output tokens
        cost: Estimated cost in USD
    """
    span = trace.get_current_span()
    if span.is_recording():
        span.set_attribute('llm.provider', provider)
        span.set_attribute('llm.model', model)
        span.set_attribute('llm.prompt', prompt[:500])  # Truncate long prompts
        
        if response:
            span.set_attribute('llm.response', response[:500])
        
        if input_tokens is not None:
            span.set_attribute('llm.tokens.input', input_tokens)
        
        if output_tokens is not None:
            span.set_attribute('llm.tokens.output', output_tokens)
        
        if input_tokens and output_tokens:
            span.set_attribute('llm.tokens.total', input_tokens + output_tokens)
        
        if cost is not None:
            span.set_attribute('llm.cost', cost)


def trace_character_interaction(
    character_name: str,
    interaction_type: str,
    platform: Optional[str] = None,
    mood: Optional[str] = None,
):
    """
    Add AIFlow character-specific attributes to current span.
    
    Args:
        character_name: Name of the AIFlow character
        interaction_type: Type of interaction ('post', 'response', 'conversation')
        platform: Social platform ('twitter', 'telegram', etc.)
        mood: Character's current mood
    """
    span = trace.get_current_span()
    if span.is_recording():
        span.set_attribute('aiflow.character', character_name)
        span.set_attribute('aiflow.interaction_type', interaction_type)
        
        if platform:
            span.set_attribute('aiflow.platform', platform)
        
        if mood:
            span.set_attribute('aiflow.mood', mood)


def create_span(span_name: str, attributes: Optional[Dict[str, Any]] = None) -> trace.Span:
    """
    Create a new span for manual instrumentation.
    
    Args:
        span_name: Name of the span
        attributes: Optional attributes to add to the span
    
    Returns:
        Span context manager
    
    Usage:
        with create_span('my_operation', {'key': 'value'}) as span:
            # Your code here
            pass
    """
    tracer = get_tracer()
    span = tracer.start_span(span_name)
    
    if attributes:
        for key, value in attributes.items():
            span.set_attribute(key, value)
    
    return span


# Example usage in FastAPI app
if __name__ == '__main__':
    # This would be called in your FastAPI startup
    init_phoenix_tracing(
        service_name='social-agent-aiflow',
        phoenix_endpoint='http://otel.agent-buildkit.orb.local:4318',
        phoenix_project='aiflow-social-agents'
    )
    
    # Example traced function
    @trace_agent_task('generate_social_post')
    async def generate_social_post(platform: str, mood: str):
        # Add character interaction metadata
        trace_character_interaction(
            character_name='AIFlow',
            interaction_type='post',
            platform=platform,
            mood=mood
        )
        
        # Simulate LLM call
        trace_llm_call(
            provider='anthropic',
            model='claude-3-sonnet',
            prompt='Generate a social media post',
            response='Hello world!',
            input_tokens=150,
            output_tokens=50,
            cost=0.001
        )
        
        return {'content': 'Hello world!', 'platform': platform}

