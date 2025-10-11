# OSSA Code Reviewer Agent - Production Container
FROM node:20-alpine AS base

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S ossa && \
    adduser -S ossa -u 1001 -G ossa

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY src/ ./src/
COPY config/ ./config/

# Build the application
RUN npm run build

# Remove dev dependencies and source files
RUN rm -rf src/ tsconfig.json && \
    npm prune --production

# Change ownership to ossa user
RUN chown -R ossa:ossa /app

# Switch to non-root user
USER ossa

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV LOG_LEVEL=info

# Add labels for OSSA compliance
LABEL maintainer="Bluefly.io <agents@bluefly.io>"
LABEL ossa.version="1.0.0"
LABEL ossa.category="critics"
LABEL ossa.agent="code-reviewer"
LABEL ossa.capabilities="code_analysis,security_scanning,quality_assessment"

# Start application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]