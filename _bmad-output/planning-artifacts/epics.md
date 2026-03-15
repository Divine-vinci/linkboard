---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
status: 'complete'
completedAt: '2026-03-15'
inputDocuments:
  - planning-artifacts/prd.md
  - planning-artifacts/architecture.md
workflowType: 'epics-and-stories'
project_name: 'Linkboard'
date: '2026-03-15'
---

# Linkboard - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Linkboard, decomposing the requirements from the PRD and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

- **FR1:** Users can sign up using their email address via magic-link authentication
- **FR2:** Users can sign in to an existing account via magic-link email
- **FR3:** Users can sign out of their account
- **FR4:** The system restricts access to bookmark data to authenticated users only
- **FR5:** The system maintains user sessions across browser tabs and page refreshes
- **FR6:** Users can save a new bookmark by providing a URL
- **FR7:** The system automatically fetches metadata (title, description, favicon, Open Graph image) for a submitted URL
- **FR8:** The system saves bookmarks even when metadata fetching fails, using the URL as the fallback title
- **FR9:** Users can view all their bookmarks in a visual dashboard
- **FR10:** Users can edit the title and description of any bookmark
- **FR11:** Users can delete any bookmark
- **FR12:** Users can view a bookmark's metadata (title, description, favicon, OG image, source URL) on its dashboard card
- **FR13:** The system displays bookmarks sorted by date added (newest first)
- **FR14:** Users can assign one or more tags to a bookmark when creating it
- **FR15:** Users can add or remove tags on an existing bookmark
- **FR16:** Users can view all tags currently in use across their bookmarks
- **FR17:** Users can filter their bookmarks by selecting a tag
- **FR18:** Users can search across bookmark titles, URLs, descriptions, and tags using a text query
- **FR19:** The system returns search results that match any indexed field (title, URL, description, tags)
- **FR20:** Users can initiate a search from the main dashboard
- **FR21:** The system displays search results as the same rich bookmark cards used on the dashboard
- **FR22:** Users see a clear empty state with guidance when they have no bookmarks
- **FR23:** The dashboard renders bookmark cards in a responsive grid layout (single column on mobile, multi-column on desktop)
- **FR24:** Each bookmark card displays: favicon, title, description snippet, OG image thumbnail, tags, and source URL
- **FR25:** Users can access all core features (save, search, tag filter, edit, delete) on both mobile and desktop viewports
- **FR26:** The system provides visual feedback during metadata fetching (loading state)
- **FR27:** The system indicates when metadata fetching has failed for a bookmark
- **FR28:** Unauthenticated visitors can view a landing page describing Linkboard's value proposition
- **FR29:** Unauthenticated visitors can navigate to the sign-up flow from the landing page

### NonFunctional Requirements

- **NFR1:** Authenticated dashboard loads in < 500ms after initial JS bundle cached
- **NFR2:** Search queries return results in < 200ms client-perceived latency
- **NFR3:** Metadata fetching completes within 3 seconds per URL
- **NFR4:** Landing page achieves Largest Contentful Paint < 2.5s
- **NFR5:** Core JavaScript bundle size under 200KB gzipped
- **NFR6:** Dashboard renders 1,000+ bookmarks without UI degradation
- **NFR7:** All data transmitted over HTTPS (TLS 1.2+)
- **NFR8:** User bookmark data is isolated — no user can access another user's bookmarks
- **NFR9:** Authentication tokens stored securely via Supabase session management
- **NFR10:** Server-side metadata fetching does not expose internal infrastructure details
- **NFR11:** URL inputs validated and sanitized to prevent injection attacks
- **NFR12:** Row-level security enforced at the database level
- **NFR13:** All interactive elements are keyboard-navigable
- **NFR14:** Color contrast meets WCAG 2.1 AA (4.5:1 normal text, 3:1 large text)
- **NFR15:** Form inputs have associated labels; error states announced to screen readers
- **NFR16:** Focus indicators visible on all interactive elements
- **NFR17:** Bookmark cards convey content to screen readers via ARIA attributes
- **NFR18:** 99.5% uptime
- **NFR19:** Bookmark save succeeds even when metadata fetching fails
- **NFR20:** No data loss — bookmarks persist reliably across sessions

### Additional Requirements

**From Architecture — Starter Template:**
- Project must be initialized using `create-next-app` with: `npx create-next-app@latest linkboard --typescript --tailwind --eslint --app --turbopack --import-alias "@/*"` — This impacts Epic 1 Story 1
- Additional dependencies to install: `@supabase/supabase-js@^2.99` and `@supabase/ssr`

**From Architecture — Infrastructure & Database:**
- PostgreSQL via Supabase with specific schema: bookmarks, tags, bookmark_tags tables
- Supabase CLI migrations under `supabase/migrations/` checked into version control
- tsvector generated column + GIN index for full-text search
- Zod v4.3 for runtime schema validation on all inputs

**From Architecture — Security:**
- Row-Level Security (RLS) policies on all tables (`user_id = auth.uid()`)
- Next.js Middleware for route protection on `/dashboard/*` routes
- Server-side metadata fetcher: max 3 redirect hops, non-identifying User-Agent
- Three separate Supabase client factories: browser, server, middleware

**From Architecture — API & Communication:**
- Server Actions for all bookmark/tag CRUD operations
- Single API Route: `POST /api/metadata` for server-side URL metadata fetching
- Consistent `ActionResult<T>` response type for all Server Actions
- Error codes use `UPPER_SNAKE_CASE` with domain prefixes

**From Architecture — Frontend:**
- React Server Components for landing page, layouts, initial data loading
- Client Components for all interactive elements (forms, search, cards)
- No global state library — React useState/useReducer only
- Optimistic updates on bookmark CRUD
- Next.js Image component with lazy loading for OG image thumbnails

**From Architecture — Implementation Patterns:**
- Files: `kebab-case.ts` / `kebab-case.tsx`
- Components: `PascalCase`, functions/variables: `camelCase`
- Named exports only (no default exports)
- Co-located tests: `*.test.ts` next to source files
- Import order: React/Next → external → internal `@/` → relative → types

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 1 | Magic-link sign up |
| FR2 | Epic 1 | Magic-link sign in |
| FR3 | Epic 1 | Sign out |
| FR4 | Epic 1 | Authenticated access only |
| FR5 | Epic 1 | Session persistence |
| FR6 | Epic 2 | Save bookmark by URL |
| FR7 | Epic 2 | Auto-fetch metadata |
| FR8 | Epic 2 | Save on metadata failure |
| FR9 | Epic 2 | View bookmarks dashboard |
| FR10 | Epic 2 | Edit bookmark title/description |
| FR11 | Epic 2 | Delete bookmark |
| FR12 | Epic 2 | View bookmark metadata card |
| FR13 | Epic 2 | Sort by date (newest first) |
| FR14 | Epic 3 | Assign tags on creation |
| FR15 | Epic 3 | Add/remove tags on existing |
| FR16 | Epic 3 | View all tags |
| FR17 | Epic 3 | Filter by tag |
| FR18 | Epic 4 | Full-text search |
| FR19 | Epic 4 | Multi-field search results |
| FR20 | Epic 4 | Search from dashboard |
| FR21 | Epic 4 | Search results as cards |
| FR22 | Epic 2 | Empty state guidance |
| FR23 | Epic 2 | Responsive grid layout |
| FR24 | Epic 2 | Rich bookmark cards |
| FR25 | Epic 2 | Mobile + desktop features |
| FR26 | Epic 2 | Metadata fetch loading state |
| FR27 | Epic 2 | Metadata fetch failure indicator |
| FR28 | Epic 1 | Landing page |
| FR29 | Epic 1 | Landing page → sign up |

## Epic List

### Epic 1: Project Foundation & Authentication
Users can sign up, sign in, and sign out via magic link — establishing identity and securing their data. Unauthenticated visitors can view a landing page and navigate to sign up.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR28, FR29

### Epic 2: Core Bookmark Management
Users can save URLs with automatic metadata enrichment, view their bookmarks as rich cards on a responsive dashboard, edit bookmark details, and delete bookmarks. Graceful degradation when metadata fetch fails.
**FRs covered:** FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR22, FR23, FR24, FR25, FR26, FR27

### Epic 3: Tagging System
Users can organize bookmarks with tags — assigning tags during creation, managing tags on existing bookmarks, viewing all tags in use, and filtering bookmarks by tag.
**FRs covered:** FR14, FR15, FR16, FR17

### Epic 4: Search & Discovery
Users can search across all bookmark content (titles, URLs, descriptions, tags) and find any saved link instantly via full-text search.
**FRs covered:** FR18, FR19, FR20, FR21

---

## Epic 1: Project Foundation & Authentication

Users can sign up, sign in, and sign out via magic link — establishing identity and securing their data. Unauthenticated visitors can view a landing page and navigate to sign up.

### Story 1.1: Project Initialization & Supabase Configuration

As a developer,
I want the project scaffolded with Next.js and Supabase configured,
So that all subsequent stories have a working foundation to build upon.

**Acceptance Criteria:**

**Given** no project exists yet
**When** the developer runs the initialization command
**Then** a Next.js project is created with TypeScript, Tailwind CSS, ESLint, App Router, and Turbopack enabled
**And** the `@/*` import alias is configured in `tsconfig.json`
**And** `@supabase/supabase-js` and `@supabase/ssr` are installed
**And** three Supabase client factory files exist: `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server), `lib/supabase/middleware.ts` (middleware)
**And** `.env.local` contains `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` placeholders
**And** `.env.example` documents all required environment variables
**And** `lib/types.ts` defines the `ActionResult<T>` type used across all Server Actions
**And** `Zod` v4.3 is installed for runtime validation

### Story 1.2: Magic Link Authentication Flow

As a user,
I want to sign up and sign in using my email via magic link,
So that I can access my bookmarks without managing a password.

**Acceptance Criteria:**

**Given** an unauthenticated user on the login page
**When** they enter a valid email address and submit the form
**Then** a magic link email is sent to the provided address
**And** the login page displays a confirmation message ("Check your email for a sign-in link")
**And** the email input has an associated label and is keyboard-navigable (NFR13, NFR15)

**Given** a user clicks the magic link from their email
**When** the auth callback route processes the token
**Then** the user is authenticated and redirected to the `/dashboard` page
**And** a Supabase session is established

**Given** an authenticated user
**When** they click the sign-out button
**Then** the Supabase session is destroyed
**And** the user is redirected to the landing page

**Given** a user enters an invalid email format
**When** they attempt to submit the login form
**Then** a validation error is displayed inline
**And** the error is announced to screen readers (NFR15)

### Story 1.3: Route Protection & Session Persistence

As a user,
I want my session to persist across tabs and refreshes and unauthenticated access to be blocked,
So that my bookmarks are secure and I don't have to log in repeatedly.

**Acceptance Criteria:**

**Given** an unauthenticated user
**When** they attempt to access any `/dashboard/*` route
**Then** they are redirected to the `/login` page

**Given** an authenticated user with an active session
**When** they open the dashboard in a new browser tab
**Then** they remain authenticated without needing to log in again (FR5)

**Given** an authenticated user
**When** they refresh the dashboard page
**Then** their session is preserved and they remain on the dashboard
**And** the Next.js Middleware refreshes the Supabase session on each request

**Given** a user whose session has expired
**When** they attempt to access a protected route
**Then** they are redirected to the login page

### Story 1.4: Landing Page

As an unauthenticated visitor,
I want to see a landing page describing Linkboard's value proposition,
So that I understand what the product offers and can sign up.

**Acceptance Criteria:**

**Given** an unauthenticated visitor
**When** they navigate to the root URL (`/`)
**Then** they see a server-rendered landing page describing Linkboard's value proposition
**And** the page includes a clear call-to-action to sign up / get started
**And** the CTA navigates to the `/login` page

**Given** a search engine crawler
**When** it requests the landing page
**Then** the page is server-rendered (RSC) with proper meta tags and Open Graph data (NFR4)
**And** `robots.txt` allows the landing page and disallows authenticated routes

**Given** the landing page is loaded
**When** performance is measured
**Then** Largest Contentful Paint is < 2.5s (NFR4)

---

## Epic 2: Core Bookmark Management

Users can save URLs with automatic metadata enrichment, view their bookmarks as rich cards on a responsive dashboard, edit bookmark details, and delete bookmarks. Graceful degradation when metadata fetch fails.

### Story 2.1: Save Bookmark with Metadata Fetching

As a user,
I want to save a bookmark by pasting a URL and have metadata automatically fetched,
So that my bookmarks are enriched with context without manual effort.

**Acceptance Criteria:**

**Given** an authenticated user on the dashboard
**When** they paste a valid URL into the bookmark input and submit
**Then** the system calls `POST /api/metadata` to fetch the page's title, description, favicon, and OG image server-side
**And** a visual loading indicator is displayed during metadata fetching (FR26)
**And** the bookmark is saved to the database with the fetched metadata
**And** the bookmark appears in the dashboard with `metadata_status: 'success'`
**And** the URL input is validated with Zod before submission (NFR11)

**Given** an authenticated user submits a URL
**When** the metadata fetch fails (timeout, blocked, invalid page)
**Then** the bookmark is saved anyway with the URL as the fallback title (FR8)
**And** `metadata_status` is set to `'failed'`
**And** the bookmark card displays an indicator that metadata fetching failed (FR27)

**Given** the metadata fetch API route
**When** it fetches a target URL
**Then** it completes within 3 seconds (NFR3)
**And** it does not follow more than 3 redirects
**And** it uses a non-identifying User-Agent and does not expose infrastructure details (NFR10)
**And** it returns `{ title, description, favicon_url, og_image_url }` on success

**Given** a database operation to save a bookmark
**When** the insert is executed
**Then** RLS policies enforce that `user_id = auth.uid()` (NFR12)
**And** the bookmark is created via a `createBookmark` Server Action returning `ActionResult<Bookmark>`

### Story 2.2: Bookmark Dashboard & Card Display

As a user,
I want to view all my bookmarks as rich cards on a responsive dashboard,
So that I can browse my collection and identify links at a glance.

**Acceptance Criteria:**

**Given** an authenticated user with saved bookmarks
**When** they navigate to the dashboard
**Then** bookmarks are displayed as cards in a responsive grid layout (FR23)
**And** the grid is single-column on mobile (320-767px), 2-column on tablet (768-1023px), and 3-4 column on desktop (1024px+)
**And** bookmarks are sorted by date added, newest first (FR13)

**Given** a bookmark card
**When** it is rendered on the dashboard
**Then** it displays: favicon, title, description snippet, OG image thumbnail (lazy loaded), tags, and source URL (FR12, FR24)
**And** the OG image uses Next.js Image component with lazy loading
**And** the card conveys content to screen readers via ARIA attributes (NFR17)

**Given** an authenticated user with no bookmarks
**When** they view the dashboard
**Then** they see a clear empty state with guidance on how to save their first bookmark (FR22)

**Given** the dashboard is loaded
**When** performance is measured
**Then** the dashboard loads in < 500ms after initial JS bundle is cached (NFR1)
**And** the dashboard renders 1,000+ bookmarks without UI degradation (NFR6)

**Given** a user on any viewport size
**When** they view the dashboard
**Then** all core features (save, edit, delete) are accessible on both mobile and desktop (FR25)

### Story 2.3: Edit Bookmark

As a user,
I want to edit the title and description of any bookmark,
So that I can correct auto-fetched metadata or add my own context.

**Acceptance Criteria:**

**Given** an authenticated user viewing a bookmark card
**When** they initiate an edit action on the bookmark
**Then** an edit form is displayed with the current title and description pre-populated

**Given** a user editing a bookmark
**When** they modify the title and/or description and save
**Then** the `updateBookmark` Server Action validates the input with Zod
**And** the bookmark is updated in the database via Supabase (RLS enforced)
**And** the UI updates optimistically to reflect the changes immediately
**And** a success confirmation is shown

**Given** a user editing a bookmark
**When** the server update fails
**Then** the optimistic UI update is reverted
**And** an error message is displayed to the user

**Given** a user editing a bookmark
**When** they cancel the edit
**Then** no changes are saved and the original values are displayed

### Story 2.4: Delete Bookmark

As a user,
I want to delete any bookmark,
So that I can remove links I no longer need.

**Acceptance Criteria:**

**Given** an authenticated user viewing a bookmark card
**When** they initiate a delete action
**Then** a confirmation prompt is displayed to prevent accidental deletion

**Given** a user confirming bookmark deletion
**When** the delete is confirmed
**Then** the `deleteBookmark` Server Action removes the bookmark from the database (RLS enforced)
**And** the UI updates optimistically to remove the card immediately
**And** associated bookmark_tags entries are cascade-deleted

**Given** a user confirming bookmark deletion
**When** the server delete fails
**Then** the optimistic removal is reverted
**And** an error message is displayed

---

## Epic 3: Tagging System

Users can organize bookmarks with tags — assigning tags during creation, managing tags on existing bookmarks, viewing all tags in use, and filtering bookmarks by tag.

### Story 3.1: Tag Creation & Assignment

As a user,
I want to assign tags to bookmarks when creating or editing them,
So that I can organize my links by topic.

**Acceptance Criteria:**

**Given** an authenticated user creating a new bookmark
**When** they type tag names into the tag input component
**Then** they can assign one or more tags to the bookmark (FR14)
**And** new tags are created in the `tags` table if they don't already exist (unique per user)
**And** tag names are validated with Zod (length limits, allowed characters)
**And** the bookmark-tag relationships are stored in the `bookmark_tags` junction table

**Given** an authenticated user viewing an existing bookmark
**When** they add or remove tags on that bookmark
**Then** the tag associations are updated via Server Actions (FR15)
**And** the UI reflects the changes immediately (optimistic update)

**Given** a tag input component
**When** it is rendered
**Then** it is keyboard-navigable (NFR13)
**And** has associated labels and proper focus indicators (NFR15, NFR16)

### Story 3.2: Tag Listing & Filtering

As a user,
I want to view all my tags and filter bookmarks by selecting a tag,
So that I can quickly narrow down my collection by topic.

**Acceptance Criteria:**

**Given** an authenticated user on the dashboard
**When** they view the tag filter component
**Then** all tags currently in use across their bookmarks are displayed (FR16)
**And** the tag filter collapses to a dropdown/modal on mobile viewports

**Given** a user selecting a tag from the filter
**When** a tag is selected
**Then** only bookmarks with that tag are displayed on the dashboard (FR17)
**And** the active filter is visually indicated
**And** the user can clear the filter to show all bookmarks again

**Given** a user deletes the last bookmark associated with a tag
**When** the tag has no remaining bookmarks
**Then** the tag is no longer shown in the filter list (or the UI handles the orphan gracefully)

---

## Epic 4: Search & Discovery

Users can search across all bookmark content (titles, URLs, descriptions, tags) and find any saved link instantly via full-text search.

### Story 4.1: Full-Text Search

As a user,
I want to search across all my bookmark content using a text query,
So that I can find any saved link by what I remember about it.

**Acceptance Criteria:**

**Given** an authenticated user on the dashboard
**When** they type a query into the search input
**Then** the input is debounced to avoid excessive server calls
**And** the `searchBookmarks` Server Action performs a PostgreSQL full-text search using `tsvector` and `ts_rank`

**Given** a search query
**When** results are returned
**Then** results match across title, URL, description, and tag fields (FR18, FR19)
**And** results are displayed as the same rich bookmark cards used on the dashboard (FR21)
**And** results are ordered by relevance (ts_rank)
**And** search response time is < 200ms client-perceived latency (NFR2)

**Given** a user on the main dashboard
**When** they want to search
**Then** the search input is accessible directly from the dashboard (FR20)
**And** the search input is keyboard-navigable with visible focus indicators (NFR13, NFR16)

**Given** a search query that matches no bookmarks
**When** results are returned
**Then** the user sees a clear "no results" message with guidance

**Given** a user with an active search
**When** they clear the search input
**Then** the dashboard returns to showing all bookmarks (or the previously active tag filter)
