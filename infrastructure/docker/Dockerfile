<<<<<<< HEAD
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Build the source code
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 ossa

# Copy the built application
COPY --from=builder --chown=ossa:nodejs /app/dist ./dist
COPY --from=deps --chown=ossa:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=ossa:nodejs /app/package.json ./package.json

USER ossa

EXPOSE 3000 3001 3002

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]
=======
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
>>>>>>> feature/redis-event-bus-v0.1.9
