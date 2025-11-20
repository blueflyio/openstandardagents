# OSSA Website - Next.js Dev Server (for quick deployment)
# Build from project root to access examples directory
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY website/package*.json ./website/
RUN cd website && npm install --legacy-peer-deps

# Copy examples directory (needed for generate-examples script)
COPY examples ./examples

# Copy website source code
COPY website ./website

WORKDIR /app/website

# Generate examples.json - this MUST succeed
RUN npm run generate-examples

# Verify examples.json was created and has content
RUN test -f public/examples.json && echo "✅ examples.json created" || (echo "❌ examples.json NOT FOUND" && exit 1)
RUN test -s public/examples.json && echo "✅ examples.json has content" || (echo "❌ examples.json is empty" && exit 1)

# Expose port
EXPOSE 3000

# Start Next.js dev server
CMD ["npm", "run", "dev"]
