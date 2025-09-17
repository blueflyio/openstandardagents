FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY src/ ./src/
COPY dist/ ./dist/

# Install additional runtime dependencies
RUN npm install ws express cors uuid tsx

# Create non-root user
RUN addgroup -g 1001 -S ossa && \
    adduser -S ossa -u 1001

# Set ownership
RUN chown -R ossa:ossa /app
USER ossa

# Expose MCP server ports
EXPOSE 4000 4001 4002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start MCP server
CMD ["node", "--import", "tsx/esm", "src/mcp/crud-server.ts"]