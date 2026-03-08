FROM python:3.12-slim

WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY pyproject.toml README.md ./
COPY adapters/agentscope/ ./adapters/agentscope/
RUN pip install --no-cache-dir -e ".[dev]" || pip install --no-cache-dir pydantic pyyaml aiohttp agentscope

# Copy manifests
COPY examples/agentscope/ ./examples/agentscope/

EXPOSE 12310

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -f http://localhost:12310/api/v1/health || exit 1

ENTRYPOINT ["python", "-m", "adapters.agentscope.cli"]
CMD ["serve", "examples/agentscope/react-assistant/agent.ossa.yaml", "--host", "0.0.0.0"]
