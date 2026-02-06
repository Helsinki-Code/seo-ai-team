# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AI SEO Employees** is a production-grade autonomous SEO platform powered by coordinated AI agents. It functions as a 24/7 AI workforce that executes comprehensive SEO strategies—from technical audits to content creation, link building, and reporting—at a fraction of traditional agency costs.

### Core Differentiator
Users witness live "Agent Meetings" where AI employees discuss strategy, delegate tasks, and report progress in real-time. This transparency is the killer differentiator versus competitors who only provide recommendations.

**Database**: Neon PostgreSQL
**Database URL**: `postgresql://neondb_owner:npg_zmhPZ75ftdax@ep-jolly-snow-ah747bri-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`

---

## Architecture Overview

### 1. Data Ingestion Layer ("Three Windows System")
The AI agents read from three distinct data sources:

- **Window 1 (Website Intelligence)**: Full website scraping, technical SEO audit data, content inventory, site architecture, schema markup, image optimization, existing backlinks
- **Window 2 (Google Search Console Data)**: Search queries, performance metrics, indexed pages, mobile usability issues, Core Web Vitals, manual actions
- **Window 3 (Domain Authority & Competitive Intelligence)**: Domain Rating, referring domains, competitor analysis, keyword gap, industry benchmarks, trust metrics

### 2. AI Agent Team Architecture
Multi-agent system using A2A (Agent-to-Agent) protocol. Each agent has:
- Persona definition (role, responsibilities, decision authority)
- Read access to relevant data windows
- Tool access (browser automation, web search, image generation)
- Memory system (persistent knowledge of past actions)
- Communication channels (message other agents, escalate to users)

**Core agents (Phase 1)**: Technical SEO Agent, Content Strategy Agent, Content Creation Agent
**Full roster (Phase 2)**: 11+ specialized agents including Link Building, Social Media, Analytics, etc.

### 3. Real-Time Agent Communication
- **Agent Meeting Dashboard**: Chat-like interface showing agent-to-agent conversations with timestamps and message threading
- **Task Board**: Kanban board (To Do | In Progress | Review Needed | Completed) with drag-drop reordering
- **Agent Status Panel**: Real-time status indicators (idle/working/blocked), activity badges, click for details
- **Activity Feed**: Chronological stream of agent actions with filtering by agent/action type
- **Decision Log**: Record of major strategic decisions made by agents

### 4. User Interface Architecture
**Design Philosophy**: Linear/Vercel/Stripe-level professional aesthetic
- Glassmorphism effects for depth
- Smooth animations (200-300ms page transitions, micro-interactions)
- Dark mode primary, light mode optional
- Data-dense but never overwhelming
- Skeleton loaders (no spinners), shimmer effects, progressive rendering

**Key Sections**:
- Agent Team Status (left sidebar, always visible)
- Performance Metrics Cards (organic traffic, rankings, domain authority, backlinks, content published)
- Live Agent Activity Feed (filterable, searchable, exportable)
- Task Board (drag-drop Kanban)
- Agent Meeting Room (threaded conversations)
- Weekly Report (auto-generated executive summary from SEO Director)

---

## Tech Stack & Key Dependencies

### Frontend
- **Framework**: Next.js 14+ (App Router, not pages directory)
- **Language**: TypeScript (strict mode enabled)
- **UI/Styling**:
  - Tailwind CSS for styling
  - Framer Motion for animations
  - Shadcn/ui for component base (customizable, headless)
  - D3.js or Vis.js for advanced agent meeting visualizations
  - SVG animations for agent status indicators
- **State Management**: React Context + Hooks (or Zustand if complexity requires)
- **Real-time Updates**: WebSockets or Server-Sent Events (SSE) for live agent communication streams
- **HTTP Client**: TanStack Query (React Query) for data fetching and caching

### Backend
- **Framework**: Next.js API Routes (app/api) with TypeScript
- **ORM**: Prisma (handles Neon PostgreSQL seamlessly)
- **Authentication**: Clerk with Next.js App Router (see integration details below)
- **Database**: Neon PostgreSQL (serverless, branch-ready)
- **Job Queue**: Bull (Redis-based) for background agent tasks
- **Logging**: Structured logging (Winston or Pino) for debugging agent actions
- **Error Tracking**: Sentry for production error monitoring
- **Monitoring**: Datadog or New Relic for infrastructure metrics

### Development Tools
- **Testing**: Jest + React Testing Library (unit + integration tests, 80%+ coverage target)
- **Linting**: ESLint + Prettier (enforce code consistency)
- **Pre-commit**: Husky + lint-staged (prevent bad commits)
- **API Docs**: OpenAPI/Swagger for agent APIs
- **Deployment**: Docker + Kubernetes (or Vercel for simpler initial deployment)

---

## Database Schema (Neon PostgreSQL)

Run these SQL statements in the Neon SQL Editor to set up the database:

```sql
-- Users & Authentication
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  clerk_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Organizations (for agency white-label)
CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_id INT REFERENCES users(id) ON DELETE CASCADE,
  custom_domain VARCHAR(255),
  branding_logo_url TEXT,
  primary_color VARCHAR(7),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Websites (each client's website being optimized)
CREATE TABLE websites (
  id SERIAL PRIMARY KEY,
  organization_id INT REFERENCES organizations(id) ON DELETE CASCADE,
  url VARCHAR(255) NOT NULL,
  domain_name VARCHAR(255),
  gsc_connected BOOLEAN DEFAULT FALSE,
  gsc_property_id VARCHAR(255),
  last_scraped_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, url)
);

-- Website Data (scraped content, metadata, technical metrics)
CREATE TABLE website_data (
  id SERIAL PRIMARY KEY,
  website_id INT REFERENCES websites(id) ON DELETE CASCADE,
  data_type VARCHAR(50), -- 'pages', 'technical_audit', 'schema_markup', 'backlinks'
  raw_data JSONB,
  scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(website_id, data_type)
);

-- Google Search Console Integration
CREATE TABLE gsc_data (
  id SERIAL PRIMARY KEY,
  website_id INT REFERENCES websites(id) ON DELETE CASCADE,
  query VARCHAR(255),
  impressions INT,
  clicks INT,
  ctr DECIMAL(5, 4),
  avg_position DECIMAL(5, 2),
  date DATE,
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(website_id, date)
);

-- AI Agents (instances of agent roles assigned to websites)
CREATE TABLE agents (
  id SERIAL PRIMARY KEY,
  website_id INT REFERENCES websites(id) ON DELETE CASCADE,
  agent_type VARCHAR(50), -- 'technical_seo', 'content_strategy', 'content_creation', etc.
  status VARCHAR(20) DEFAULT 'idle', -- 'idle', 'working', 'blocked', 'needs_approval'
  current_task_id INT,
  memory JSONB, -- Persistent agent knowledge/decisions
  last_active_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agent Tasks (work items assigned to agents)
CREATE TABLE agent_tasks (
  id SERIAL PRIMARY KEY,
  agent_id INT REFERENCES agents(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'todo', -- 'todo', 'in_progress', 'review_needed', 'completed'
  priority VARCHAR(10) DEFAULT 'medium', -- 'low', 'medium', 'high'
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_by INT REFERENCES users(id),
  result_data JSONB,
  INDEX(agent_id, status)
);

-- Agent Communications (A2A messages and meetings)
CREATE TABLE agent_messages (
  id SERIAL PRIMARY KEY,
  website_id INT REFERENCES websites(id) ON DELETE CASCADE,
  from_agent_id INT REFERENCES agents(id),
  to_agent_id INT REFERENCES agents(id),
  message_type VARCHAR(50), -- 'task_assignment', 'status_update', 'decision', 'discussion'
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(website_id, created_at)
);

-- Content Pieces (articles, blog posts created by agents)
CREATE TABLE content_pieces (
  id SERIAL PRIMARY KEY,
  website_id INT REFERENCES websites(id) ON DELETE CASCADE,
  created_by_agent_id INT REFERENCES agents(id),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255),
  content TEXT,
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'review', 'approved', 'published'
  published_url VARCHAR(255),
  seo_score INT,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Backlinks & Link Building
CREATE TABLE backlinks (
  id SERIAL PRIMARY KEY,
  website_id INT REFERENCES websites(id) ON DELETE CASCADE,
  source_url VARCHAR(255) NOT NULL,
  target_url VARCHAR(255) NOT NULL,
  anchor_text VARCHAR(255),
  domain_rating INT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'acquired', 'failed'
  created_by_agent_id INT REFERENCES agents(id),
  acquired_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance Metrics (daily/weekly snapshots for trend tracking)
CREATE TABLE performance_metrics (
  id SERIAL PRIMARY KEY,
  website_id INT REFERENCES websites(id) ON DELETE CASCADE,
  organic_traffic INT,
  keyword_rankings_average DECIMAL(5, 2),
  domain_authority INT,
  new_backlinks INT,
  content_published INT,
  recorded_date DATE,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(website_id, recorded_date)
);

-- Weekly Reports (auto-generated summaries)
CREATE TABLE weekly_reports (
  id SERIAL PRIMARY KEY,
  website_id INT REFERENCES websites(id) ON DELETE CASCADE,
  week_start_date DATE,
  executive_summary TEXT,
  wins_of_week TEXT[],
  challenges TEXT[],
  next_week_priorities TEXT[],
  performance_snapshot JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Approvals (for high-stakes agent actions)
CREATE TABLE approval_requests (
  id SERIAL PRIMARY KEY,
  website_id INT REFERENCES websites(id) ON DELETE CASCADE,
  agent_id INT REFERENCES agents(id),
  action_type VARCHAR(50), -- 'publish_content', 'high_spend', 'strategy_pivot'
  action_details JSONB,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  approved_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP
);

-- API Keys (for agency/partner integrations)
CREATE TABLE api_keys (
  id SERIAL PRIMARY KEY,
  organization_id INT REFERENCES organizations(id) ON DELETE CASCADE,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

-- Create indices for performance
CREATE INDEX idx_websites_organization ON websites(organization_id);
CREATE INDEX idx_agents_website ON agents(website_id, status);
CREATE INDEX idx_messages_website_time ON agent_messages(website_id, created_at);
CREATE INDEX idx_tasks_agent ON agent_tasks(agent_id, status);
CREATE INDEX idx_metrics_website_date ON performance_metrics(website_id, recorded_date);
```

---

## Development Workflow

### Initial Setup
```bash
# Install dependencies
npm install

# Set up environment variables
# Copy .env.example to .env.local and fill in:
# - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (from Clerk dashboard)
# - CLERK_SECRET_KEY (from Clerk dashboard)
# - DATABASE_URL (provided Neon URL)
# - REDIS_URL (for job queue)

# Initialize database (run SQL schema above in Neon editor)
# Then sync Prisma:
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### Running the App
```bash
# Development
npm run dev

# Production build
npm run build
npm run start

# Run tests
npm run test          # all tests
npm run test:watch   # watch mode
npm run test:coverage # with coverage report

# Linting & formatting
npm run lint          # ESLint check
npm run format        # Prettier format
npm run format:check  # check without fixing
```

### Database Management
```bash
# View database in Prisma Studio
npx prisma studio

# Create migration (if schema changes)
npx prisma migrate dev --name description_of_change

# Reset database (dev only)
npx prisma migrate reset
```

---

## Clerk Authentication Integration (App Router)

**Middleware Setup** (`proxy.ts` at project root):
```typescript
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

**Layout Wrapper** (`app/layout.tsx`):
```typescript
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

**Protected Routes**: Use Clerk's `auth()` in API routes and server components. Use `<SignedIn>` / `<SignedOut>` components in client components.

**Critical**: Never use deprecated patterns like `authMiddleware()` or `_app.tsx`. Only use App Router with `clerkMiddleware()`.

---

## Real-Time Agent Communication Implementation

### WebSocket / Server-Sent Events (SSE) Strategy
- **Agent Messages**: Use SSE for one-way streams (server → client) for cost-effectiveness and simplicity
- **User Actions → Agents**: Standard HTTP POST endpoints
- **Live Task Updates**: Stream updates as agents complete subtasks

### Key Patterns
1. **Agent Message Stream Endpoint** (`/api/websocket/agent-messages?websiteId=X`):
   - Returns EventSource-compatible streaming of `agent_messages` table updates
   - Filter by website and timestamp to avoid overwhelming clients

2. **Agent Status Polling Fallback** (`/api/agents/status`):
   - If SSE unavailable, poll every 2-5 seconds
   - Use Redis caching to reduce database load

3. **Optimistic Updates**:
   - Client updates UI immediately, server confirms/corrects
   - Use React Query's `setQueryData()` for smooth UX

---

## Multi-Agent System Architecture

### Agent Base Structure
Each agent instance inherits from a base class with:
- **Initialization**: Load from `agents` table, restore memory from last session
- **Decision Making**: Load relevant data window, analyze, determine action
- **Communication**: Queue messages to other agents via `agent_messages` table
- **Task Execution**: Create `agent_tasks`, update status, store results
- **Approval Flow**: For risky actions, create `approval_requests` and wait for user

### Agent Orchestration
- Use a job queue (Bull/Redis) to execute agent background jobs
- Each agent gets scheduled tasks or event-triggered actions
- Circular dependency detection (agent A waits for B, B waits for A)
- Rate limiting per agent to prevent resource exhaustion

### Memory & Learning
- Store decisions and reasoning in `agents.memory` (JSONB)
- Cross-website pattern detection (what works in e-commerce helps similar clients)
- Regular "agent reviews" to update instructions/prompts

---

## Implementation Phases & Priorities

### Phase 1: MVP (3-4 months)
- [ ] User authentication (Clerk)
- [ ] Website onboarding flow (URL input, validation, scraping)
- [ ] GSC OAuth integration
- [ ] Database schema and Prisma setup
- [ ] 3 core agents: Technical SEO, Content Strategy, Content Creation
- [ ] Basic agent communication (logged, not real-time)
- [ ] Simple dashboard with key metrics (traffic, rankings, DA)
- [ ] WordPress content publishing automation
- [ ] Basic UI (minimalist, dark mode)

**Success Metrics**: Time-to-first-value < 30 mins, user can see first agent action within 5 minutes of approval

### Phase 2: Core Product (2-3 months)
- [ ] Real-time agent meeting dashboard (WebSocket/SSE)
- [ ] Full agent roster (link building, social media, analytics, etc.)
- [ ] Task board with drag-drop Kanban
- [ ] Agent approval workflow for high-stakes actions
- [ ] Advanced analytics dashboard
- [ ] Weekly auto-generated reports from SEO Director
- [ ] Performance metrics tracking (30/60/90-day trends)
- [ ] Mascot character with contextual tips

**Success Metrics**: 80%+ of actions executed autonomously without user intervention

### Phase 3: Scale Features (3-4 months)
- [ ] White-label capabilities (custom domain, branding, email domain)
- [ ] Multi-site management per organization
- [ ] Agency admin panel
- [ ] API access for partners
- [ ] Performance-based pricing model
- [ ] Advanced visualizations (D3.js agent meeting flowcharts)

**Success Metrics**: Support 100+ agents per website, 10,000+ concurrent users

### Phase 4: Advanced Intelligence (ongoing)
- [ ] Predictive analytics (forecast traffic, rankings)
- [ ] Industry-specific agent specializations
- [ ] Custom agent training on brand guidelines
- [ ] Video SEO (YouTube optimization)
- [ ] International SEO (multi-language)
- [ ] Mobile app (React Native)

---

## Performance & Scalability Requirements

### Performance Targets
- **Initial page load**: < 2 seconds
- **Time to interactive**: < 3 seconds
- **Agent response time**: < 500ms for status updates
- **Dashboard real-time updates**: < 100ms latency
- **Search query response**: < 200ms

### Scalability Targets
- **Support 10,000+ concurrent users**
- **Handle 100+ agents per website**
- **Process 1000+ tasks/day per website**
- **Stream 100+ real-time messages/minute**

### Architecture for Scale
- **Horizontal scaling**: All services stateless and horizontally scalable
- **Database sharding**: Shard by organization_id for multi-tenancy
- **Redis caching**: Cache GSC data, domain metrics, performance snapshots
- **CDN**: Serve static assets (images, scripts, styles)
- **Message queue**: Bull (Redis) for async agent jobs
- **Circuit breakers**: Graceful degradation if external APIs fail
- **Rate limiting**: Per-user API limits, per-agent action limits

---

## Security & Compliance

### Authentication & Authorization
- **JWT tokens** via Clerk (secure by default)
- **Role-based access control (RBAC)**: User, Admin, Agency, Enterprise
- **Multi-factor authentication (2FA)**: Encourage for admin accounts
- **API key management**: Secure hashing and rotation

### Data Protection
- **Encryption at rest**: Database encryption (Neon default)
- **Encryption in transit**: TLS 1.3 for all connections
- **Database backups**: Neon automatic snapshots
- **PII handling**: GDPR compliance (data export, deletion on request)

### Agent Safety
- **Content moderation**: Profanity filter, brand safety checks
- **Link quality validation**: Block toxic/spam backlinks before publishing
- **Google compliance**: Monitor and prevent black-hat SEO techniques
- **Rollback capability**: Version control for agent actions (undo/revert)
- **Spending limits**: Circuit breaker if agents exceed budget thresholds

### Monitoring & Observability
- **Error tracking**: Sentry for production errors
- **Session replay**: LogRocket for user issue debugging
- **Infrastructure monitoring**: Datadog/New Relic metrics
- **Custom agent dashboards**: Task completion rates, success rates, idle time
- **Business metrics**: MRR, CAC, LTV, NPS tracking

---

## Code Quality Standards

- **TypeScript strict mode**: No `any` types without explicit `@ts-ignore` comment
- **Test coverage**: 80%+ (unit + integration tests)
- **ESLint rules**: Enforce naming conventions, no console logs in production
- **Prettier**: Automatic code formatting on save
- **Husky pre-commit hooks**: Prevent commits that fail linting/tests
- **Error handling**: All async operations have try-catch with context logging
- **Logging**: Structured logs (JSON format) for debugging agent decisions

---

## Important Notes for Future Development

### No Mocks or Placeholders
This is a **production-grade application** launched to millions of users. All features must be fully functional:
- Real website scraping (not placeholder data)
- Real GSC data integration (not mocked responses)
- Real agent actions with measurable results
- Real content publishing to user websites

### Mascot Character Implementation
The mascot should:
- Appear contextually (onboarding, feature explanations, progress updates)
- Provide professional, insightful guidance (not generic tips)
- Use smooth, non-intrusive animations
- Align with the premium, minimalist brand voice
- Never distract from the main UI (small, subtle)

### Agent Meeting Dashboard Excellence
This is the **killer differentiator**. Invest heavily in:
- Real-time message streaming (< 100ms latency)
- Beautiful visualization of agent collaboration (D3.js/Vis.js)
- Clear decision flow visualization (what agents considered, why they chose X)
- Thread support for long discussions
- Search and filter capabilities
- Export to PDF/CSV for audit trails

### Design Consistency
Every element must feel premium and cohesive:
- Consistent spacing (8px grid)
- Consistent animations (easing functions, duration)
- Consistent colors (dark mode primary, high contrast)
- Micro-interactions delight without distraction (card lift on hover, smooth checkmarks)
- No generic or stock-looking UI

---

## Key Files & Directories Structure (Expected)

```
seo-ai-emp/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth-related routes (wrapped by Clerk)
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── page.tsx              # Main dashboard
│   │   ├── agents/
│   │   ├── meetings/
│   │   ├── tasks/
│   │   └── reports/
│   ├── api/                      # Backend API routes
│   │   ├── agents/               # Agent status, control
│   │   ├── websites/             # Website management
│   │   ├── gsc/                  # GSC integration
│   │   ├── tasks/                # Task management
│   │   ├── websocket/            # WebSocket/SSE for real-time
│   │   └── webhooks/             # External integrations
│   ├── layout.tsx                # Root layout with ClerkProvider
│   └── page.tsx                  # Landing page
├── components/                   # Reusable React components
│   ├── dashboard/
│   ├── agents/
│   ├── ui/                       # Shadcn/ui components
│   └── animations/               # Framer Motion sequences
├── lib/                          # Utility functions
│   ├── prisma.ts                 # Prisma client singleton
│   ├── auth.ts                   # Clerk auth helpers
│   ├── db/                       # Database queries (optional: separate file per entity)
│   ├── agents/                   # Agent orchestration logic
│   └── webscraper.ts             # Website scraping utilities
├── jobs/                         # Bull job queue handlers
│   ├── scrapeWebsite.ts
│   ├── agentTask.ts
│   └── publishContent.ts
├── types/                        # TypeScript type definitions
│   └── index.ts
├── styles/                       # Global styles
│   └── globals.css
├── prisma/
│   └── schema.prisma             # Database schema definition
├── proxy.ts                      # Clerk middleware
├── .env.example                  # Environment variables template
├── CLAUDE.md                     # This file
└── package.json
```

---

## Questions Before Starting?

If you encounter ambiguities during development, refer to:
1. **Phase priorities**: Start Phase 1 features only
2. **Design reference**: Linear.app, Vercel.com, Stripe.com (modern, professional, minimalist)
3. **AI agent best practices**: Consider multi-agent coordination patterns from ReAct, AutoGPT
4. **Real-time patterns**: Refer to Slack API, Linear API for streaming/WebSocket patterns

This specification is comprehensive but implementation decisions should prioritize:
- **Clarity over cleverness** (straightforward code is better than clever)
- **MVP over perfection** (Phase 1 ships with 3 agents, not 11)
- **User value over features** (real results for users, not cool tech)
- **Production-ready over experimentation** (no mocks, all real data)
