# Multi-stage build for OSSA website
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
FROM base AS deps
COPY website/package.json website/package-lock.json* ./
RUN npm ci

# Build website
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
WORKDIR /app/website
RUN npm run build

# Production image
FROM base AS website
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/website/public ./public
COPY --from=builder /app/website/.next/standalone ./
COPY --from=builder /app/website/.next/static ./.next/static
COPY --from=builder /app/website/lib ./lib
COPY --from=builder /app/scripts ./scripts

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
