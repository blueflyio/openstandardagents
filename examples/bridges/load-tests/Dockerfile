FROM python:3.11-slim

WORKDIR /app

# Copy application files
COPY aiflow-bridge-enhanced.py .
COPY aiflow-phoenix-tracing.py .
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Create non-root user
RUN useradd -m -u 1000 aiflow && \
    chown -R aiflow:aiflow /app

USER aiflow

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health').raise_for_status()"

# Run application
CMD ["python", "aiflow-bridge-enhanced.py"]

