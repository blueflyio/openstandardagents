# Multi-stage build for OpenAPI AI Agents Validation API
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Production image
FROM node:18-alpine AS production

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S apiuser -u 1001

# Set working directory
WORKDIR /app

# Copy built dependencies
COPY --from=builder --chown=apiuser:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=apiuser:nodejs . .

# Create logs directory
RUN mkdir -p logs && chown apiuser:nodejs logs

# Switch to non-root user
USER apiuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]

# Labels for metadata
LABEL org.opencontainers.image.title="OpenAPI AI Agents Validation API"
LABEL org.opencontainers.image.description="REST API for validating AI agent specifications and compliance"
LABEL org.opencontainers.image.vendor="OpenAPI AI Agents Consortium"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/openapi-ai-agents/standard"