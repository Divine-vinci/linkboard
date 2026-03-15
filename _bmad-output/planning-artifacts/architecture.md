---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-03-15'
inputDocuments:
  - planning-artifacts/prd.md
  - planning-artifacts/product-brief-Linkboard-2026-03-15.md
workflowType: 'architecture'
project_name: 'Linkboard'
user_name: 'User'
date: '2026-03-15'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

29 functional requirements across 6 categories define a focused bookmark management application:

- **Authentication & Identity (FR1-5):** Magic-link email auth via Supabase, session management, protected routes. Architecturally simple — Supabase handles the heavy lifting. No OAuth, no passwords, no MFA.
- **Bookmark Management (FR6-13):** Core CRUD with the distinguishing feature of automatic metadata fetching (title, description, favicon, OG image). The fetch-on-save pattern is the primary async operation. Graceful degradation when fetch fails is a firm requirement — bookmarks must save regardless.
- **Tagging (FR14-17):** Multi-tag support per bookmark, tag filtering, tag listing. Many-to-many relationship between bookmarks and tags. No tag hierarchy — flat structure only.
- **Search (FR18-21):** Full-text search across titles, URLs, descriptions, and tags. Search results use the same card component as the dashboard. PostgreSQL `tsvector` with GIN indexes is the implied implementation.
- **Dashboard & UI (FR22-27):** Responsive grid layout, rich bookmark cards, loading states during metadata fetch, error indicators for failed fetches. Empty state guidance for new users.
- **Landing Page (FR28-29):** Static marketing page for unauthenticated visitors. Server-rendered for SEO.

**Non-Functional Requirements:**

20 NFRs that shape architecture:

- **Performance (NFR1-6):** Dashboard <500ms, search <200ms, metadata fetch <3s, LCP <2.5s, JS bundle <200KB gzipped, handle 1000+ bookmarks without UI degradation. These are achievable with the chosen stack without exotic optimization.
- **Security (NFR7-12):** HTTPS-only, strict data isolation between users, Supabase session management, server-side fetch must not leak infrastructure details, input sanitization, **row-level security (RLS) at database level**. RLS is a key architectural decision — enforced at Supabase/Postgres level.
- **Accessibility (NFR13-17):** WCAG 2.1 AA compliance — keyboard navigation, color contrast, labeled forms, focus indicators, ARIA on bookmark cards. Standard modern web accessibility.
- **Reliability (NFR18-20):** 99.5% uptime (Vercel + Supabase managed services make this straightforward), bookmark save succeeds even on metadata fetch failure, no data loss.

**Scale & Complexity:**

- Primary domain: Full-stack web application
- Complexity level: Low
- Estimated architectural components: ~8 (auth, bookmark CRUD, metadata fetcher, search, tagging, dashboard UI, landing page, database/RLS)

### Technical Constraints & Dependencies

- **Stack locked in PRD:** Next.js App Router, Supabase (Auth + Postgres), Vercel deployment, Tailwind CSS
- **Server-side metadata fetching:** Required to avoid CORS — Next.js API routes serve as the proxy
- **Supabase RLS:** Security model is database-enforced, not application-enforced
- **No external service dependencies** beyond Supabase and the target URLs being fetched
- **Single developer resource:** Architecture must minimize operational complexity
- **MVP scope discipline:** No browser extension, no bulk import, no sharing, no offline — keep it lean

### Cross-Cutting Concerns Identified

- **Authentication/Authorization:** Every data operation must respect user isolation via Supabase RLS. Auth state propagated through Supabase client.
- **Error Handling & Graceful Degradation:** Metadata fetch failures must not block bookmark saving. UI must communicate fetch status clearly.
- **Responsive Design:** All features accessible across mobile/tablet/desktop breakpoints. Grid layout adapts from 1 to 3-4 columns.
- **Accessibility:** WCAG 2.1 AA compliance touches every UI component — must be designed in, not bolted on.
- **Performance:** Bundle size discipline, efficient search indexing, lazy loading for images — applies across all features.

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application — Next.js App Router with Supabase backend, deployed to Vercel. The PRD explicitly specifies this stack, so the starter evaluation focuses on the best way to scaffold it.

### Technical Preferences (from PRD)

- **Language:** TypeScript
- **Framework:** Next.js App Router (React Server Components for landing page, client components for dashboard)
- **Database:** PostgreSQL via Supabase
- **Auth:** Supabase magic-link authentication
- **Styling:** Tailwind CSS
- **Deployment:** Vercel
- **State Management:** React state + Supabase client (no global state library)

### Starter Options Considered

**Option 1: `create-next-app` (Official Next.js Starter)**
- Maintained by Vercel, always current
- Default setup includes: TypeScript, Tailwind CSS, ESLint, App Router, Turbopack
- Minimal — no opinionated database or auth layer
- Current version: Next.js 16.1.6

**Option 2: T3 Stack (`create-t3-app`)**
- Includes tRPC, Prisma, NextAuth — none of which we need
- Supabase replaces Prisma (direct Supabase client) and NextAuth (Supabase Auth)
- tRPC adds unnecessary complexity for this project's simple API surface
- Would require removing more than it adds

**Option 3: Supabase + Next.js Starter**
- Supabase provides example templates but they're tutorial-grade, not production starters
- Better to add Supabase to a clean Next.js project than to build on a demo app

### Selected Starter: `create-next-app`

**Rationale for Selection:**

The official `create-next-app` is the clear choice. It provides exactly the foundation we need (TypeScript, Tailwind, App Router, Turbopack) without imposing architectural opinions we'd need to remove. Supabase integration is a lightweight addition (`@supabase/supabase-js` + `@supabase/ssr`) rather than a starter-level concern. For a low-complexity project with a single developer, starting clean and adding only what's needed is the pragmatic path.

**Initialization Command:**

```bash
npx create-next-app@latest linkboard --typescript --tailwind --eslint --app --turbopack --import-alias "@/*"
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
- TypeScript strict mode enabled
- Node.js 20.9+ required
- React 19.2 (via Next.js 16 canary channel)

**Styling Solution:**
- Tailwind CSS v4 with PostCSS configuration
- CSS Modules available as fallback

**Build Tooling:**
- Turbopack (stable in Next.js 16) for dev and build
- File system caching enabled by default for fast restarts
- React Compiler stable — automatic memoization

**Testing Framework:**
- Not included by starter — will be added as architectural decision (Vitest + React Testing Library recommended)

**Code Organization:**
- `app/` directory with App Router conventions
- `public/` for static assets
- `@/*` import alias configured
- Layout/page/loading/error file conventions

**Development Experience:**
- Hot module replacement via Turbopack
- TypeScript type checking
- ESLint for code quality
- `@/*` path alias for clean imports

**Additional Dependencies to Install:**
- `@supabase/supabase-js@^2.99` — Supabase client
- `@supabase/ssr` — Server-side Supabase helpers for Next.js App Router

**Note:** Project initialization using this command should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
1. Database schema design — defines data model for all features
2. Supabase RLS policies — enforces multi-tenant data isolation
3. Metadata fetching strategy — core differentiating feature
4. Search indexing approach — primary retrieval mechanism

**Important Decisions (Shape Architecture):**
5. API pattern (Server Actions vs API Routes)
6. Component architecture (RSC vs Client boundaries)
7. Input validation strategy
8. Error handling patterns

**Deferred Decisions (Post-MVP):**
- Caching layer (not needed at MVP scale)
- Rate limiting (Vercel's built-in limits sufficient for MVP)
- Monitoring/APM (Vercel Analytics sufficient initially)
- CI/CD pipeline (manual deploys via Vercel Git integration)

### Data Architecture

**Database: PostgreSQL via Supabase**
- Version: Supabase manages PostgreSQL 15+
- Access pattern: Direct Supabase client (`@supabase/supabase-js@^2.99`) — no ORM
- Rationale: Supabase client provides type-safe queries, RLS integration, and real-time subscriptions. An ORM like Prisma would add a dependency layer between the app and Supabase's native capabilities without meaningful benefit at this scale.

**Schema Design:**

```sql
-- Users managed by Supabase Auth (auth.users) — no custom user table needed

-- Bookmarks
bookmarks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  url         text NOT NULL,
  title       text,           -- auto-fetched or manual
  description text,           -- auto-fetched or manual
  favicon_url text,           -- auto-fetched
  og_image_url text,          -- auto-fetched
  metadata_status text DEFAULT 'pending', -- 'pending' | 'success' | 'failed'
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  search_vector tsvector      -- generated column for full-text search
)

-- Tags
tags (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        text NOT NULL,
  UNIQUE(user_id, name)       -- tags are unique per user
)

-- Bookmark-Tag junction
bookmark_tags (
  bookmark_id uuid REFERENCES bookmarks(id) ON DELETE CASCADE,
  tag_id      uuid REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (bookmark_id, tag_id)
)
```

**Search Indexing:**
- PostgreSQL `tsvector` generated column on bookmarks combining title, url, description
- GIN index on `search_vector` for fast full-text search (FR18-19)
- Tag search handled via JOIN with tag name matching
- `ts_rank` for result ordering by relevance

**Data Validation:**
- Zod v4.3 for runtime schema validation on all inputs
- URL validation on bookmark creation (format + sanitization per NFR11)
- Tag name validation (length limits, allowed characters)
- Validation runs in Server Actions before database operations

**Migration Approach:**
- Supabase CLI migrations (`supabase migration new`, `supabase db push`)
- Migration files checked into version control under `supabase/migrations/`

### Authentication & Security

**Authentication: Supabase Auth — Magic Link**
- `@supabase/ssr` for server-side auth in Next.js App Router
- `createServerClient` in Server Components, Route Handlers, and Middleware
- `createBrowserClient` in Client Components
- Session refresh handled via Next.js Middleware on every request

**Authorization: Row-Level Security (RLS)**
- All tables have RLS enabled — no application-level authorization code
- Policies: `user_id = auth.uid()` on all CRUD operations
- This is the security boundary — even if application code has bugs, the database enforces isolation

**Route Protection:**
- Next.js Middleware checks Supabase session on all `/dashboard/*` routes
- Unauthenticated users redirected to `/login`
- Landing page (`/`) and auth routes (`/login`, `/auth/callback`) are public

**Input Sanitization:**
- URL inputs validated via Zod (valid URL format)
- Text inputs sanitized before storage (prevent XSS in title/description)
- Server-side metadata fetcher does not follow redirects beyond 3 hops
- Fetcher sets a non-identifying User-Agent; does not expose server IP or infrastructure

### API & Communication Patterns

**Primary Pattern: Next.js Server Actions**
- All bookmark CRUD operations use Server Actions (create, update, delete, list, search)
- Server Actions provide built-in CSRF protection, progressive enhancement, and type safety
- Co-located with the components that use them in `app/` directory

**Secondary Pattern: Next.js API Route for Metadata Fetching**
- `POST /api/metadata` — accepts a URL, fetches page metadata server-side
- Returns: `{ title, description, favicon_url, og_image_url }`
- Separate API route (not Server Action) because:
  - Metadata fetch is an async background-ish operation with timeout handling
  - May be called independently from bookmark creation (fetch preview before save)
  - Easier to add rate limiting later

**Error Handling:**
- Consistent error response shape: `{ success: boolean, data?: T, error?: { code: string, message: string } }`
- Server Actions return this shape directly
- Metadata fetch errors are non-fatal — bookmark saves with `metadata_status: 'failed'`
- Client-side error boundaries for unexpected failures

### Frontend Architecture

**Component Architecture:**
- React Server Components (RSC) for: landing page, layout shells, initial data loading
- Client Components for: bookmark form, search input, tag filter, bookmark card interactions (edit/delete), auth forms
- Boundary: Server Components fetch data and pass to Client Components as props

**State Management:**
- No global state library — React `useState`/`useReducer` for local UI state
- Supabase client for server state (bookmarks, tags)
- Optimistic updates on bookmark CRUD for responsive UI
- Search state managed locally in the search component

**Component Organization:**
```
app/
  (landing)/           -- Landing page (RSC, public)
    page.tsx
  (auth)/              -- Auth routes (public)
    login/page.tsx
    auth/callback/route.ts
  dashboard/           -- Protected routes
    page.tsx           -- Bookmark dashboard
    layout.tsx         -- Dashboard shell with search/nav
  api/
    metadata/route.ts  -- Metadata fetch endpoint
components/
  ui/                  -- Shared UI primitives
  bookmark-card.tsx    -- Bookmark display card (client)
  bookmark-form.tsx    -- URL input + tag assignment (client)
  search-input.tsx     -- Search bar (client)
  tag-filter.tsx       -- Tag sidebar/dropdown (client)
lib/
  supabase/
    client.ts          -- Browser Supabase client
    server.ts          -- Server Supabase client
    middleware.ts      -- Middleware Supabase client
  actions/             -- Server Actions
    bookmarks.ts
    tags.ts
  validators/          -- Zod schemas
  metadata/            -- Metadata fetching logic
```

**Performance Optimization:**
- Next.js Image component for OG image thumbnails with lazy loading
- Pagination or virtual scrolling for 1000+ bookmarks (NFR6)
- Bundle splitting via Next.js automatic code splitting
- Turbopack for fast builds

### Infrastructure & Deployment

**Hosting: Vercel**
- Automatic deployments from Git (main branch → production)
- Preview deployments on pull requests
- Edge network for static assets and serverless functions
- Built-in analytics for Core Web Vitals

**Environment Configuration:**
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key (safe for client)
- `SUPABASE_SERVICE_ROLE_KEY` — Server-only, for admin operations if needed
- Managed via Vercel environment variables (per-environment)

**Monitoring (MVP):**
- Vercel Analytics for performance monitoring
- Supabase Dashboard for database monitoring and auth metrics
- Console error logging — no external APM for MVP

### Decision Impact Analysis

**Implementation Sequence:**
1. Project scaffolding (`create-next-app`) + Supabase project setup
2. Database schema + RLS policies + migrations
3. Supabase client configuration (`@supabase/ssr` setup)
4. Authentication flow (magic link login/logout)
5. Metadata fetching API route
6. Bookmark CRUD (Server Actions + UI)
7. Tagging system
8. Full-text search
9. Dashboard UI polish (responsive grid, empty states, loading states)
10. Landing page

**Cross-Component Dependencies:**
- Auth → everything (all features require authenticated user)
- Database schema → CRUD operations → search → UI
- Metadata fetcher → bookmark creation flow (but decoupled — save works without it)
- RLS policies → data isolation (must be set up before any data operations)

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 5 major areas where AI agents could make inconsistent choices — naming, file organization, API response formats, error handling, and state management.

### Naming Patterns

**Database Naming Conventions:**
- Tables: `snake_case`, plural (`bookmarks`, `tags`, `bookmark_tags`)
- Columns: `snake_case` (`user_id`, `created_at`, `og_image_url`)
- Foreign keys: `{referenced_table_singular}_id` (`user_id`, `bookmark_id`, `tag_id`)
- Indexes: `idx_{table}_{columns}` (`idx_bookmarks_user_id`, `idx_bookmarks_search_vector`)
- Constraints: `{table}_{type}_{columns}` (`bookmark_tags_pkey`, `tags_user_id_name_unique`)

**API Naming Conventions:**
- API routes: `kebab-case`, resource-oriented (`/api/metadata`, not `/api/fetchMetadata`)
- Query parameters: `camelCase` (`searchQuery`, `tagId`)
- No versioning for MVP — single version

**Code Naming Conventions:**
- Files: `kebab-case.ts` / `kebab-case.tsx` (`bookmark-card.tsx`, `search-input.tsx`)
- React components: `PascalCase` (`BookmarkCard`, `SearchInput`)
- Functions/variables: `camelCase` (`createBookmark`, `fetchMetadata`, `userId`)
- Server Actions: `camelCase` verbs (`createBookmark`, `updateBookmark`, `deleteBookmark`, `searchBookmarks`)
- Types/interfaces: `PascalCase` (`Bookmark`, `Tag`, `BookmarkWithTags`)
- Zod schemas: `camelCase` with `Schema` suffix (`bookmarkSchema`, `tagSchema`, `urlSchema`)
- Constants: `UPPER_SNAKE_CASE` (`MAX_TAG_LENGTH`, `METADATA_FETCH_TIMEOUT`)
- Boolean variables: `is`/`has` prefix (`isLoading`, `hasError`, `isFetching`)

### Structure Patterns

**Project Organization:**
- Co-located tests: `*.test.ts` / `*.test.tsx` next to source files
- Components organized by feature scope: shared in `components/`, page-specific in `app/` route directories
- Server Actions in `lib/actions/` — one file per domain (`bookmarks.ts`, `tags.ts`)
- Supabase clients in `lib/supabase/` — separate files for client, server, and middleware contexts
- Validation schemas in `lib/validators/` — one file per domain
- Types in `lib/types.ts` — single file for MVP (split when it exceeds ~200 lines)

**File Structure Patterns:**
- One React component per file (exception: small sub-components used only by the parent)
- Exports: named exports for components and functions, no default exports (better refactoring support)
- Import order: React/Next → external packages → internal `@/` imports → relative imports → types

### Format Patterns

**API Response Formats:**

Server Actions return a consistent `ActionResult<T>` type:
```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };
```

Error codes use `UPPER_SNAKE_CASE` domain prefixes:
- `AUTH_NOT_AUTHENTICATED`
- `BOOKMARK_NOT_FOUND`
- `BOOKMARK_URL_INVALID`
- `TAG_ALREADY_EXISTS`
- `METADATA_FETCH_FAILED`
- `VALIDATION_ERROR`

**Data Exchange Formats:**
- JSON field naming: `camelCase` in TypeScript, `snake_case` in database — Supabase client handles the mapping via column selection
- Dates: ISO 8601 strings (`2026-03-15T22:30:00Z`) — stored as `timestamptz`, serialized as ISO strings
- Null: use `null` not `undefined` in API responses — explicit absence
- Empty arrays: return `[]` not `null` for list fields

### Communication Patterns

**State Management Patterns:**
- Immutable state updates only (`...spread` or `Array.filter/map`)
- Optimistic updates: update UI immediately, revert on server error
- Loading states: per-operation boolean (`isCreating`, `isDeleting`, `isSearching`)
- No global state — each component manages its own state via `useState`/`useReducer`

### Process Patterns

**Error Handling Patterns:**
- Server Actions: catch all errors, return `ActionResult` — never throw
- API Routes: return appropriate HTTP status codes with JSON error body
- Client components: use `try/catch` around Server Action calls, show toast/inline error
- Error boundaries: one at the dashboard layout level for unexpected crashes
- Metadata fetch errors: log server-side, return `metadata_status: 'failed'` — never surface raw errors to user
- Never expose stack traces, database errors, or internal details to the client

**Loading State Patterns:**
- Use Next.js `loading.tsx` for route-level loading states
- Use local `isLoading` state for action-triggered operations (save, delete, search)
- Show skeleton/spinner during loading — never blank screen
- Disable submit buttons during pending operations to prevent double-submission

### Enforcement Guidelines

**All AI Agents MUST:**
- Follow the naming conventions exactly — no variations (e.g., always `kebab-case` files, never `camelCase` files)
- Return `ActionResult<T>` from all Server Actions — no raw data returns or thrown errors
- Use the Supabase client factories from `lib/supabase/` — never create ad-hoc clients
- Apply Zod validation before any database operation
- Never bypass RLS by using the service role key for user-facing operations

**Anti-Patterns to Avoid:**
- `any` type usage — use proper types or `unknown` with narrowing
- Inline SQL strings — use Supabase query builder
- `console.log` for error handling — use proper error returns
- Mixing Server and Client Component concerns in a single file
- Creating new Supabase client instances outside `lib/supabase/`

## Project Structure & Boundaries

### Complete Project Directory Structure

```
linkboard/
├── .env.local                    # Local environment variables (git-ignored)
├── .env.example                  # Template for required env vars
├── .gitignore
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json
├── public/
│   ├── favicon.ico
│   └── images/                   # Static images (logo, landing page assets)
├── supabase/
│   ├── config.toml               # Supabase CLI project config
│   └── migrations/               # Database migrations (version controlled)
│       ├── 001_create_bookmarks.sql
│       ├── 002_create_tags.sql
│       ├── 003_create_bookmark_tags.sql
│       ├── 004_add_search_vector.sql
│       └── 005_add_rls_policies.sql
├── app/
│   ├── globals.css               # Global styles + Tailwind imports
│   ├── layout.tsx                # Root layout (RSC — html/body, metadata)
│   ├── page.tsx                  # Landing page (RSC — public, SEO)
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx          # Login page with magic link form (Client)
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts      # Supabase auth callback handler
│   ├── dashboard/
│   │   ├── layout.tsx            # Dashboard shell — nav, search bar (RSC)
│   │   ├── page.tsx              # Main bookmark dashboard (RSC → Client)
│   │   ├── loading.tsx           # Dashboard loading skeleton
│   │   └── error.tsx             # Dashboard error boundary
│   └── api/
│       └── metadata/
│           └── route.ts          # POST — server-side URL metadata fetcher
├── components/
│   ├── ui/
│   │   ├── button.tsx            # Shared button component
│   │   ├── input.tsx             # Shared input component
│   │   ├── skeleton.tsx          # Loading skeleton primitives
│   │   └── toast.tsx             # Toast notification component
│   ├── bookmark-card.tsx         # Bookmark display card (Client)
│   ├── bookmark-form.tsx         # URL input + tag assignment form (Client)
│   ├── bookmark-list.tsx         # Bookmark grid/list container (Client)
│   ├── bookmark-edit-form.tsx    # Edit bookmark title/description (Client)
│   ├── search-input.tsx          # Search bar with debounced input (Client)
│   ├── tag-filter.tsx            # Tag sidebar/dropdown filter (Client)
│   ├── tag-input.tsx             # Tag creation/assignment input (Client)
│   ├── empty-state.tsx           # Empty dashboard guidance (Client)
│   ├── auth-form.tsx             # Magic link email form (Client)
│   └── navbar.tsx                # Dashboard navigation bar (Client)
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client (createBrowserClient)
│   │   ├── server.ts             # Server Supabase client (createServerClient)
│   │   └── middleware.ts         # Middleware Supabase client (session refresh)
│   ├── actions/
│   │   ├── bookmarks.ts          # Server Actions: createBookmark, updateBookmark, deleteBookmark, listBookmarks, searchBookmarks
│   │   └── tags.ts               # Server Actions: createTag, deleteTag, listTags, addTagToBookmark, removeTagFromBookmark
│   ├── validators/
│   │   ├── bookmark.ts           # Zod schemas: urlSchema, bookmarkCreateSchema, bookmarkUpdateSchema
│   │   └── tag.ts                # Zod schemas: tagNameSchema, tagCreateSchema
│   ├── metadata/
│   │   └── fetcher.ts            # URL metadata extraction logic (title, description, favicon, OG image)
│   └── types.ts                  # Shared TypeScript types: Bookmark, Tag, BookmarkWithTags, ActionResult<T>
├── middleware.ts                  # Next.js middleware — auth check, session refresh, route protection
└── tests/                        # Test utilities and fixtures (co-located tests next to source)
    └── fixtures/
        └── bookmarks.ts          # Test data factories
```

### Architectural Boundaries

**API Boundaries:**
- `/api/metadata` — the only API Route; accepts POST with `{ url: string }`, returns metadata JSON. Called from `bookmark-form.tsx` before or during bookmark creation.
- All other data operations use Server Actions (not API routes) — invoked directly from Client Components.

**Component Boundaries:**
- **Server Components** (RSC): `app/layout.tsx`, `app/page.tsx`, `app/dashboard/layout.tsx`, `app/dashboard/page.tsx` — handle data fetching and pass props to Client Components.
- **Client Components**: Everything in `components/` — handle interactivity, forms, state, event handlers. Marked with `'use client'` directive.
- **Boundary rule**: Server Components fetch initial data and pass it down. Client Components call Server Actions for mutations and re-fetch.

**Data Boundaries:**
- **Supabase is the single data store** — no local caching layer, no secondary databases.
- **RLS is the authorization boundary** — the database enforces user isolation. Application code does not need authorization checks beyond ensuring the user is authenticated.
- **Supabase client factories** (`lib/supabase/`) are the only entry points for database access. No direct `fetch` calls to Supabase REST API.

### Requirements to Structure Mapping

**Authentication (FR1-5):**
- `app/(auth)/login/page.tsx` — magic link form
- `app/(auth)/auth/callback/route.ts` — auth callback
- `components/auth-form.tsx` — email input form
- `lib/supabase/middleware.ts` — session refresh
- `middleware.ts` — route protection
- `supabase/migrations/005_add_rls_policies.sql` — RLS policies

**Bookmark Management (FR6-13):**
- `components/bookmark-form.tsx` — URL input + save
- `components/bookmark-card.tsx` — display card
- `components/bookmark-list.tsx` — grid container
- `components/bookmark-edit-form.tsx` — edit title/description
- `lib/actions/bookmarks.ts` — CRUD Server Actions
- `lib/metadata/fetcher.ts` — metadata extraction
- `app/api/metadata/route.ts` — metadata API endpoint
- `lib/validators/bookmark.ts` — input validation
- `supabase/migrations/001_create_bookmarks.sql` — schema

**Tagging (FR14-17):**
- `components/tag-input.tsx` — tag assignment
- `components/tag-filter.tsx` — filter by tag
- `lib/actions/tags.ts` — tag Server Actions
- `lib/validators/tag.ts` — tag validation
- `supabase/migrations/002_create_tags.sql` — tags table
- `supabase/migrations/003_create_bookmark_tags.sql` — junction table

**Search (FR18-21):**
- `components/search-input.tsx` — search bar with debounce
- `lib/actions/bookmarks.ts` → `searchBookmarks` action
- `supabase/migrations/004_add_search_vector.sql` — tsvector + GIN index

**Dashboard & UI (FR22-27):**
- `app/dashboard/page.tsx` — dashboard page
- `app/dashboard/layout.tsx` — dashboard shell
- `app/dashboard/loading.tsx` — loading skeleton
- `app/dashboard/error.tsx` — error boundary
- `components/empty-state.tsx` — empty state guidance
- `components/navbar.tsx` — navigation

**Landing Page (FR28-29):**
- `app/page.tsx` — landing page (RSC, server-rendered for SEO)

### Integration Points

**Internal Communication:**
- Client Components → Server Actions: direct function calls (Next.js handles serialization)
- Client Components → API Route: `fetch('/api/metadata', { method: 'POST', body: JSON.stringify({ url }) })`
- Server Components → Supabase: direct queries via `createServerClient`

**External Integrations:**
- **Supabase Auth**: magic link emails, session management, auth callbacks
- **Supabase Database**: PostgreSQL via Supabase client (all bookmark/tag data)
- **Target URLs**: server-side HTTP fetch for metadata extraction (title, description, favicon, OG image)
- **Vercel**: deployment, edge network, serverless functions, analytics

**Data Flow:**
```
User pastes URL
  → bookmark-form.tsx (Client)
    → POST /api/metadata (API Route)
      → fetcher.ts fetches target URL server-side
      → Returns { title, description, favicon_url, og_image_url }
    → User adds tags, clicks save
    → createBookmark Server Action
      → Zod validation
      → Supabase INSERT (RLS enforced)
      → Returns ActionResult<Bookmark>
    → UI updates optimistically

User searches
  → search-input.tsx (Client, debounced)
    → searchBookmarks Server Action
      → Supabase full-text query (tsvector + ts_rank)
      → Returns ActionResult<BookmarkWithTags[]>
    → bookmark-list.tsx re-renders with results
```

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:** All technology choices are compatible and well-integrated:
- Next.js 16.1 + React 19.2 + TypeScript — fully supported combination
- Supabase JS v2.99 + @supabase/ssr — designed for Next.js App Router
- Tailwind CSS — works natively with Next.js
- Zod 4.3 — TypeScript-native, no conflicts
- Vercel deployment — optimized for Next.js

**Pattern Consistency:** All patterns align with the technology stack:
- `snake_case` database naming matches PostgreSQL conventions
- `camelCase` code naming matches TypeScript/React conventions
- Server Actions align with Next.js App Router patterns
- `ActionResult<T>` pattern works cleanly with TypeScript generics
- Co-located tests follow Next.js community conventions

**Structure Alignment:** Project structure directly supports all decisions:
- `app/` directory uses App Router file conventions (layout, page, loading, error)
- `lib/supabase/` separation supports the three Supabase client contexts (browser, server, middleware)
- `lib/actions/` co-locates Server Actions by domain
- `supabase/migrations/` enables version-controlled schema evolution

### Requirements Coverage Validation

**Functional Requirements Coverage:**

| FR Range | Category | Architectural Support | Status |
|----------|----------|----------------------|--------|
| FR1-5 | Authentication | Supabase Auth + magic link + middleware route protection + RLS | Covered |
| FR6-8 | Bookmark Creation + Metadata | Server Action + API Route metadata fetcher + graceful fallback | Covered |
| FR9-13 | Bookmark Display + CRUD | Server Actions + bookmark-card + bookmark-list + bookmark-edit-form | Covered |
| FR14-17 | Tagging | Tags table + junction table + tag Server Actions + tag-filter component | Covered |
| FR18-21 | Search | tsvector + GIN index + searchBookmarks action + search-input component | Covered |
| FR22-27 | Dashboard & UI | Dashboard layout + responsive grid + empty-state + loading/error states | Covered |
| FR28-29 | Landing Page | RSC landing page at app/page.tsx (server-rendered, SEO) | Covered |

**Non-Functional Requirements Coverage:**

| NFR Range | Category | Architectural Support | Status |
|-----------|----------|----------------------|--------|
| NFR1-6 | Performance | Turbopack builds, automatic code splitting, GIN indexes, lazy loading, Next.js Image | Covered |
| NFR7-12 | Security | HTTPS (Vercel), RLS, Supabase sessions, server-side fetch isolation, Zod validation | Covered |
| NFR13-17 | Accessibility | Component-level responsibility, ARIA in bookmark cards, keyboard nav, focus indicators | Covered |
| NFR18-20 | Reliability | Vercel + Supabase managed uptime, graceful metadata degradation, RLS data protection | Covered |

### Implementation Readiness Validation

**Decision Completeness:** All critical and important decisions are documented with specific versions, rationale, and implementation guidance. No ambiguous "TBD" items remain.

**Structure Completeness:** Every file in the project tree maps to a specific requirement or architectural concern. No placeholder directories or undefined files.

**Pattern Completeness:** Naming conventions, error handling, state management, and data formats are all specified with concrete examples and anti-patterns.

### Gap Analysis Results

**No Critical Gaps Found.**

**Minor Gaps (acceptable for MVP):**
- Testing strategy not fully specified (framework choice deferred — recommend Vitest + React Testing Library when ready)
- No CI/CD pipeline defined (Vercel Git integration is sufficient for MVP; GitHub Actions can be added later)
- No monitoring/alerting beyond Vercel Analytics (acceptable at MVP scale)
- Pagination strategy not specified for 1000+ bookmarks — cursor-based pagination recommended when needed

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed (low complexity, single developer)
- [x] Technical constraints identified (stack locked in PRD)
- [x] Cross-cutting concerns mapped (auth, error handling, responsive, a11y, performance)

**Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified (Next.js 16.1, Supabase JS 2.99, Zod 4.3, Tailwind)
- [x] Integration patterns defined (Server Actions + API Route for metadata)
- [x] Performance considerations addressed (GIN indexes, lazy loading, code splitting)

**Implementation Patterns**
- [x] Naming conventions established (database, API, code)
- [x] Structure patterns defined (file organization, imports, exports)
- [x] Communication patterns specified (ActionResult, error codes)
- [x] Process patterns documented (error handling, loading states)

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established (RSC vs Client)
- [x] Integration points mapped (data flow diagrams)
- [x] Requirements to structure mapping complete (every FR → specific files)

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High — this is a low-complexity, well-defined project with a proven technology stack and clear requirements.

**Key Strengths:**
- Stack is production-proven and well-documented (Next.js + Supabase + Vercel)
- Security model is database-enforced (RLS), reducing application-level security bugs
- Clear separation between Server and Client Components
- Graceful degradation designed in from the start (metadata fetch failures)
- Minimal moving parts — no unnecessary abstraction layers

**Areas for Future Enhancement:**
- Add testing infrastructure (Vitest + React Testing Library) before Phase 2
- Add CI/CD pipeline (GitHub Actions) when team grows beyond single developer
- Consider cursor-based pagination when users exceed 1000 bookmarks
- Add monitoring/APM (e.g., Sentry) before production launch with real users

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Refer to this document for all architectural questions
- When in doubt, prefer simplicity — this is a low-complexity MVP

**First Implementation Priority:**
```bash
npx create-next-app@latest linkboard --typescript --tailwind --eslint --app --turbopack --import-alias "@/*"
```
Then: install Supabase dependencies, set up client factories, create database migrations, implement auth flow.
