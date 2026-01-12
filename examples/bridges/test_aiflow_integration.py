"""
Integration Tests for AIFlow Bridge with BuildKit & Phoenix

Tests:
1. Agent registration with BuildKit
2. Phoenix tracing initialization
3. API endpoint functionality
4. Heartbeat mechanism
5. Metrics collection
6. Error handling

Usage:
    pytest test_aiflow_integration.py -v
"""

import pytest
import asyncio
import os
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
from fastapi.testclient import TestClient


# Set test environment variables
os.environ['AIFLOW_API_KEY'] = 'test-key'
os.environ['PHOENIX_ENDPOINT'] = 'http://localhost:4318'
os.environ['PHOENIX_PROJECT'] = 'test-project'
os.environ['BUILDKIT_REGISTRY_URL'] = 'http://localhost:3000/api/v1'
os.environ['AGENT_ID'] = 'test-agent'


@pytest.fixture
def mock_http_client():
    """Mock httpx client for BuildKit communication"""
    client = AsyncMock(spec=httpx.AsyncClient)
    
    # Mock registration response
    registration_response = MagicMock()
    registration_response.json.return_value = {
        "agent_id": "test-agent",
        "instance_id": "test-instance-123",
        "registered_at": "2025-10-21T00:00:00Z",
        "health_check_interval": 30,
        "phoenix_trace_url": "http://phoenix/test-project"
    }
    registration_response.raise_for_status = MagicMock()
    client.post.return_value = registration_response
    
    # Mock heartbeat response
    heartbeat_response = MagicMock()
    heartbeat_response.json.return_value = {
        "acknowledged": True,
        "registry_status": "active"
    }
    heartbeat_response.raise_for_status = MagicMock()
    client.post.return_value = heartbeat_response
    
    # Mock deregistration response
    deregister_response = MagicMock()
    deregister_response.raise_for_status = MagicMock()
    client.delete.return_value = deregister_response
    
    return client


@pytest.fixture
def test_client():
    """Create FastAPI test client"""
    # Mock Phoenix tracing to avoid OpenTelemetry setup in tests
    with patch('aiflow_phoenix_tracing.init_phoenix_tracing'):
        from aiflow_bridge_enhanced import app
        return TestClient(app)


class TestBuildKitRegistration:
    """Test BuildKit registration functionality"""
    
    @pytest.mark.asyncio
    async def test_register_with_buildkit(self, mock_http_client):
        """Test successful registration with BuildKit"""
        with patch('aiflow_bridge_enhanced.http_client', mock_http_client):
            from aiflow_bridge_enhanced import register_with_buildkit
            
            result = await register_with_buildkit()
            
            # Verify registration was called
            assert mock_http_client.post.called
            call_args = mock_http_client.post.call_args
            
            # Verify registration URL
            assert '/agents/register' in call_args[0][0]
            
            # Verify registration data
            registration_data = call_args[1]['json']
            assert registration_data['agent_id'] == 'test-agent'
            assert 'ossa_manifest' in registration_data
            assert 'capabilities' in registration_data
            
            # Verify response
            assert result['instance_id'] == 'test-instance-123'
    
    @pytest.mark.asyncio
    async def test_send_heartbeat(self, mock_http_client):
        """Test heartbeat sending"""
        with patch('aiflow_bridge_enhanced.http_client', mock_http_client):
            from aiflow_bridge_enhanced import send_heartbeat
            
            await send_heartbeat()
            
            # Verify heartbeat was sent
            assert mock_http_client.post.called
            call_args = mock_http_client.post.call_args
            
            # Verify heartbeat URL
            assert '/heartbeat' in call_args[0][0]
            
            # Verify heartbeat data
            heartbeat_data = call_args[1]['json']
            assert 'status' in heartbeat_data
            assert 'metrics' in heartbeat_data
    
    @pytest.mark.asyncio
    async def test_deregister_from_buildkit(self, mock_http_client):
        """Test deregistration from BuildKit"""
        with patch('aiflow_bridge_enhanced.http_client', mock_http_client):
            from aiflow_bridge_enhanced import deregister_from_buildkit
            
            await deregister_from_buildkit()
            
            # Verify deregistration was called
            assert mock_http_client.delete.called
            call_args = mock_http_client.delete.call_args
            
            # Verify deregistration URL
            assert '/agents/test-agent' in call_args[0][0]


class TestAPIEndpoints:
    """Test API endpoint functionality"""
    
    def test_health_endpoint(self, test_client):
        """Test health check endpoint"""
        response = test_client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data['status'] == 'healthy'
        assert 'character' in data
        assert 'platforms' in data
        assert data['buildkit_registered'] is True
        assert data['phoenix_tracing'] is True
    
    def test_generate_post_success(self, test_client):
        """Test successful post generation"""
        request_data = {
            "platform": "twitter",
            "time_of_day": "morning"
        }
        
        response = test_client.post(
            "/generate_post",
            json=request_data,
            headers={"X-API-Key": "test-key"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert 'content' in data
        assert data['platform'] == 'twitter'
        assert isinstance(data['media_urls'], list)
    
    def test_generate_post_invalid_auth(self, test_client):
        """Test post generation with invalid API key"""
        request_data = {
            "platform": "twitter",
            "time_of_day": "morning"
        }
        
        response = test_client.post(
            "/generate_post",
            json=request_data,
            headers={"X-API-Key": "invalid-key"}
        )
        
        assert response.status_code == 401
    
    def test_generate_response_success(self, test_client):
        """Test successful response generation"""
        request_data = {
            "message": {
                "id": "msg-123",
                "author": "user123",
                "content": "What do you think about AI?",
                "platform": "twitter"
            }
        }
        
        response = test_client.post(
            "/generate_response",
            json=request_data,
            headers={"X-API-Key": "test-key"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert 'content' in data
        assert 'should_respond' in data
        assert data['should_respond'] is True
    
    def test_metrics_endpoint(self, test_client):
        """Test Prometheus metrics endpoint"""
        response = test_client.get("/metrics")
        
        assert response.status_code == 200
        assert 'aiflow_posts_generated_total' in response.text
        assert 'aiflow_api_requests_total' in response.text
    
    def test_character_endpoint(self, test_client):
        """Test character configuration endpoint"""
        response = test_client.get(
            "/character",
            headers={"X-API-Key": "test-key"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert 'name' in data
        assert 'traits' in data
        assert 'moods' in data


class TestPhoenixTracing:
    """Test Phoenix tracing integration"""
    
    @patch('aiflow_phoenix_tracing.trace.set_tracer_provider')
    @patch('aiflow_phoenix_tracing.FastAPIInstrumentation')
    def test_phoenix_initialization(self, mock_fastapi_instr, mock_set_provider):
        """Test Phoenix tracing initialization"""
        from aiflow_phoenix_tracing import init_phoenix_tracing
        
        init_phoenix_tracing(
            service_name='test-agent',
            phoenix_endpoint='http://localhost:4318',
            phoenix_project='test-project'
        )
        
        # Verify tracer provider was set
        assert mock_set_provider.called
        
        # Verify FastAPI instrumentation was applied
        assert mock_fastapi_instr.called
    
    def test_trace_decorator(self):
        """Test trace_agent_task decorator"""
        from aiflow_phoenix_tracing import trace_agent_task, get_tracer
        
        # Mock tracer
        with patch('aiflow_phoenix_tracing._tracer') as mock_tracer:
            mock_span = MagicMock()
            mock_tracer.start_as_current_span.return_value.__enter__.return_value = mock_span
            
            @trace_agent_task('test_task')
            async def test_function():
                return "success"
            
            # Run the decorated function
            result = asyncio.run(test_function())
            
            # Verify tracing was applied
            assert result == "success"
            assert mock_tracer.start_as_current_span.called


class TestMetrics:
    """Test metrics collection"""
    
    def test_post_generation_metrics(self, test_client):
        """Test that post generation increments metrics"""
        # Generate a post
        test_client.post(
            "/generate_post",
            json={"platform": "twitter", "time_of_day": "morning"},
            headers={"X-API-Key": "test-key"}
        )
        
        # Check metrics
        response = test_client.get("/metrics")
        metrics_text = response.text
        
        # Verify post generation metric exists
        assert 'aiflow_posts_generated_total{platform="twitter",time_of_day="morning"}' in metrics_text
    
    def test_health_check_metrics(self, test_client):
        """Test that health checks increment metrics"""
        # Call health endpoint
        test_client.get("/health")
        
        # Check metrics
        response = test_client.get("/metrics")
        metrics_text = response.text
        
        # Verify health check metric exists
        assert 'aiflow_health_checks_total' in metrics_text


class TestErrorHandling:
    """Test error handling"""
    
    def test_invalid_request_body(self, test_client):
        """Test handling of invalid request body"""
        response = test_client.post(
            "/generate_post",
            json={"invalid": "data"},
            headers={"X-API-Key": "test-key"}
        )
        
        assert response.status_code == 422  # Validation error
    
    @pytest.mark.asyncio
    async def test_registration_failure(self, mock_http_client):
        """Test handling of registration failures"""
        # Configure mock to raise exception
        mock_http_client.post.side_effect = httpx.HTTPError("Connection failed")
        
        with patch('aiflow_bridge_enhanced.http_client', mock_http_client):
            from aiflow_bridge_enhanced import register_with_buildkit
            
            with pytest.raises(httpx.HTTPError):
                await register_with_buildkit()


# Run tests
if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])

