# Quick Start Guide

Get the Agent Marketplace frontend running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- npm 8+ installed
- Agent Registry API (or mock data mode)

## Installation

```bash
# 1. Navigate to the project
cd marketplace-frontend

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env.local

# 4. Edit .env.local with your API URL
echo "NEXT_PUBLIC_REGISTRY_API_URL=http://localhost:3000/api/v1" > .env.local
```

## Running

### Development Mode

```bash
npm run dev
```

Visit: http://localhost:3000

### Production Mode

```bash
npm run build
npm start
```

## Project Features

### Homepage (/)
- Hero section with search
- Stats dashboard
- Trending agents
- Recently added agents
- Top rated agents
- Recommended agents

### Browse Agents (/agents)
- Searchable catalog
- Filter sidebar:
  - Trust level
  - Rating
  - Domain
  - Platform support
- Responsive grid layout

### Agent Detail (/agents/:gaid)
- Agent ID Card
- Usage statistics
- Tabs:
  - README (markdown)
  - Deployment instructions
  - Reviews
- Related agents

### Register Agent (/register)
- Upload OSSA manifest
- Validate manifest
- Preview Agent ID Card
- Submit for registration
- Get GAID

## Mock Data Mode

If the backend API is not available, you can use mock data:

1. Edit `src/lib/api.ts`
2. Import mock data: `import { mockAgents } from './mockData'`
3. Return mock data instead of API calls

Example:
```typescript
async searchAgents(filters: AgentFilter): Promise<Agent[]> {
  // Instead of API call, return mock data
  return mockAgents;
}
```

## Troubleshooting

### Port Already in Use
```bash
# Use different port
PORT=3001 npm run dev
```

### API Connection Failed
- Verify `NEXT_PUBLIC_REGISTRY_API_URL` in `.env.local`
- Check backend API is running
- Try mock data mode

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### Type Errors
```bash
# Check TypeScript
npm run typecheck
```

## Next Steps

1. Connect to real Agent Registry API
2. Configure environment variables
3. Customize styling in `tailwind.config.ts`
4. Add authentication (if needed)
5. Deploy to Vercel/Netlify

## Deployment

### Vercel (1-click)
```bash
npm install -g vercel
vercel
```

### Docker
```bash
docker build -t marketplace-frontend .
docker run -p 3000:3000 marketplace-frontend
```

### Manual
```bash
npm run build
# Copy .next, public, package.json to server
# Run: npm start
```

## Key Files

- `src/app/page.tsx` - Homepage
- `src/app/agents/page.tsx` - Catalog
- `src/app/agents/[gaid]/page.tsx` - Detail
- `src/app/register/page.tsx` - Registration
- `src/lib/api.ts` - API client
- `src/types/agent.ts` - TypeScript types

## Support

- Docs: https://openstandardagents.org/docs
- Issues: https://github.com/openstandardagents/marketplace/issues
- Discord: https://discord.gg/ossa
