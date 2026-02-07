# Agent Marketplace Frontend

A Next.js-based marketplace for browsing, discovering, and deploying OSSA (Open Standard for Software Agents) agents.

## Features

### 1. Agent Catalog Grid
- Card-based layout with agent information
- Agent name, description, and icon
- Star ratings and review counts
- Trust level badges (Verified, Trusted, Unverified, Experimental)
- Capability tags
- Quick deploy button
- Author information
- Download/deployment statistics

### 2. Search & Filters
- **Search Bar**: Search by agent name, description, or capability
- **Trust Level Filter**: Filter by verification status
- **Domain Filter**: Filter by agent domain (governance, data-processing, etc.)
- **Platform Support Filter**: Filter by deployment platform (Kubernetes, Docker, etc.)
- **Rating Filter**: Filter by minimum star rating (4+, 3+, etc.)
- **Tag Filter**: Filter by capability tags
- Clear all filters functionality

### 3. Agent Detail Page
- Complete Agent ID Card display with gradient background
- Agent metadata (GAID, version, author, ratings)
- Tabbed interface:
  - **README**: Rendered markdown documentation
  - **Deployment**: Platform-specific deployment instructions
  - **Reviews**: User reviews and ratings
- Usage statistics dashboard:
  - Total deployments
  - Active instances
  - Success rate
  - Average response time
- Related agents recommendations
- Deploy button with platform selection

### 4. Agent Registration Form
- Multi-step wizard (Upload → Preview → Submit → Success)
- File upload for OSSA manifest (.yaml/.yml)
- Manual YAML input option
- Real-time manifest validation
- Agent ID Card preview before submission
- GAID generation on successful registration
- Terms of service acceptance

### 5. Discovery Features
- **Trending Agents**: Most popular agents right now
- **Recently Added**: Latest marketplace additions
- **Top Rated**: Highest rated agents
- **Recommended for You**: Personalized recommendations
- Quick stats dashboard (total agents, deployments, developers, success rate)
- View all link for each discovery section

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS
- **Icons**: Heroicons
- **Markdown**: react-markdown with remark-gfm
- **HTTP Client**: Axios
- **Type Safety**: TypeScript
- **YAML**: js-yaml
- **Validation**: Zod (via @bluefly/openstandardagents)

## Project Structure

```
marketplace-frontend/
├── src/
│   ├── app/                      # Next.js app router pages
│   │   ├── layout.tsx           # Root layout with header/footer
│   │   ├── page.tsx             # Homepage with discovery sections
│   │   ├── agents/
│   │   │   ├── page.tsx         # Agent catalog with filters
│   │   │   └── [gaid]/
│   │   │       └── page.tsx     # Agent detail page
│   │   └── register/
│   │       └── page.tsx         # Agent registration
│   ├── components/
│   │   ├── agent-card/
│   │   │   └── AgentCard.tsx    # Agent card component
│   │   ├── agent-detail/
│   │   │   └── AgentDetailView.tsx  # Agent detail view
│   │   ├── catalog/
│   │   │   └── AgentCatalog.tsx # Agent grid catalog
│   │   ├── discovery/
│   │   │   ├── DiscoverySection.tsx  # Discovery sections
│   │   │   └── HomePage.tsx     # Homepage layout
│   │   ├── filters/
│   │   │   ├── FilterPanel.tsx  # Filter sidebar
│   │   │   └── SearchBar.tsx    # Search input
│   │   ├── layout/
│   │   │   ├── Header.tsx       # Site header
│   │   │   └── Footer.tsx       # Site footer
│   │   └── registration/
│   │       └── AgentRegistrationForm.tsx  # Registration wizard
│   ├── lib/
│   │   ├── api.ts               # API client
│   │   └── utils.ts             # Utility functions
│   ├── types/
│   │   └── agent.ts             # TypeScript types
│   └── hooks/
│       └── useDebounce.ts       # Custom hooks
├── public/                       # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- Agent Registry API running (see backend setup)

### Installation

1. Install dependencies:

```bash
cd marketplace-frontend
npm install
```

2. Create environment file:

```bash
cp .env.example .env.local
```

3. Configure environment variables:

```env
NEXT_PUBLIC_REGISTRY_API_URL=http://localhost:3000/api/v1
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

### Linting & Type Checking

```bash
npm run lint
npm run typecheck
```

## API Integration

The frontend integrates with the Agent Registry API for:

### Agent Discovery
- `GET /api/v1/registry/agents` - Search and filter agents
- `GET /api/v1/registry/agents/trending` - Get trending agents
- `GET /api/v1/registry/agents/recent` - Get recently added agents
- `GET /api/v1/registry/agents/top-rated` - Get top rated agents
- `GET /api/v1/registry/agents/recommended` - Get recommendations

### Agent Details
- `GET /api/v1/registry/agents/:gaid` - Get agent by GAID
- `GET /api/v1/registry/agents/:gaid/reviews` - Get agent reviews
- `GET /api/v1/registry/agents/:gaid/statistics` - Get usage statistics
- `GET /api/v1/registry/agents/:gaid/recommended` - Get related agents

### Agent Registration
- `POST /api/v1/registry/agents` - Register new agent
- `POST /api/v1/registry/validate` - Validate OSSA manifest

### Metadata
- `GET /api/v1/registry/metadata/domains` - Get available domains
- `GET /api/v1/registry/metadata/platforms` - Get available platforms
- `GET /api/v1/registry/metadata/tags` - Get available tags

## Components

### AgentCard
Displays agent summary in card format with:
- Icon/avatar
- Name and version
- Trust level badge
- Description
- Rating with star display
- Capability tags (first 3)
- Author info
- Deploy button
- Download count

### AgentCatalog
Grid layout of agent cards with:
- Loading states (skeleton screens)
- Error handling
- Empty state
- Result count display
- Responsive grid (1/2/3 columns)

### FilterPanel
Sidebar filter controls:
- Trust level checkboxes
- Rating radio buttons
- Domain checkboxes
- Platform checkboxes
- Clear all filters button
- Active filter count

### SearchBar
Search input with:
- Magnifying glass icon
- Placeholder text
- Real-time search on submit
- Debounced input (optional)

### AgentDetailView
Comprehensive agent details:
- Hero section with gradient background
- Agent ID Card display
- Usage statistics cards
- Tabbed content (README, Deployment, Reviews)
- Related agents carousel
- Deploy button

### AgentRegistrationForm
Multi-step registration wizard:
1. **Upload**: File upload or manual YAML input
2. **Preview**: Agent ID Card preview + manifest display
3. **Submit**: Terms acceptance + confirmation
4. **Success**: GAID display + navigation options

### DiscoverySection
Reusable discovery component:
- Section header with icon
- Description
- View all link
- Compact agent cards
- Loading states

## Styling

### Color Scheme
- **Primary**: Blue gradient (50-900 shades)
- **Trust Levels**:
  - Verified: Green (#10b981)
  - Trusted: Blue (#3b82f6)
  - Unverified: Orange (#f59e0b)
  - Experimental: Purple (#8b5cf6)

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Hamburger menu on mobile
- Responsive grid layouts

### Components
- Consistent border radius (0.5rem - 1rem)
- Shadow levels (sm, md, lg, xl)
- Hover effects and transitions
- Focus states for accessibility

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Docker

```bash
docker build -t marketplace-frontend .
docker run -p 3000:3000 marketplace-frontend
```

### Environment Variables

Required for production:
- `NEXT_PUBLIC_REGISTRY_API_URL` - Registry API endpoint
- Optional: Analytics, feature flags, etc.

## Development Workflow

1. Start the backend registry API
2. Start the frontend dev server
3. Make changes to components
4. Test in browser with hot reload
5. Run type checking and linting
6. Build for production
7. Deploy

## Future Enhancements

- [ ] User authentication and profiles
- [ ] Agent collections/favorites
- [ ] Advanced search with filters persistence
- [ ] Agent comparison feature
- [ ] Deployment history tracking
- [ ] Real-time agent status monitoring
- [ ] Comment system for agents
- [ ] Agent version history
- [ ] API key management
- [ ] Usage analytics dashboard
- [ ] Agent health monitoring
- [ ] Automated testing suite
- [ ] Storybook component library
- [ ] Internationalization (i18n)
- [ ] Dark mode support
- [ ] Accessibility improvements (WCAG 2.1)

## Contributing

1. Follow the existing code style
2. Use TypeScript strict mode
3. Add proper type definitions
4. Test all features before submitting
5. Update documentation as needed

## License

Apache 2.0 - See LICENSE file for details

## Support

- Documentation: https://openstandardagents.org/docs
- Community: https://discord.gg/ossa
- Issues: https://github.com/openstandardagents/marketplace/issues
