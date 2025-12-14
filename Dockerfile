# OSSA Website - OrbStack Review App (Static Export)
# Builds Next.js static export and serves via nginx
#
# Usage:
#   docker build -t ossa-review .
#   docker run -d --name ossa -p 80:80 ossa-review
#
# Access at: http://ossa.orb.local (OrbStack auto-configures this)

FROM node:22-alpine AS builder
WORKDIR /app

# Install git (needed for fetching spec)
RUN apk add --no-cache git

# Copy only website (not monorepo structure)
COPY website/package.json website/package-lock.json* ./
RUN npm ci --prefer-offline 2>/dev/null || npm install

# Copy website source
COPY website ./

# Build static export
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build without wiki sync (faster for review apps)
# Skip fetch scripts that require network access
RUN npm run sync-version 2>/dev/null || true
RUN npm run fetch-spec 2>/dev/null || true
RUN npm run fetch-examples 2>/dev/null || true
RUN npm run fetch-versions 2>/dev/null || true
RUN npx next build

# Production stage - nginx for static files
FROM nginx:alpine AS runner

# Copy static export to nginx
COPY --from=builder /app/out /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
