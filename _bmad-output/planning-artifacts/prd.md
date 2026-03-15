---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
inputDocuments:
  - planning-artifacts/product-brief-Linkboard-2026-03-15.md
workflowType: 'prd'
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 0
  projectDocs: 0
classification:
  projectType: web_app
  domain: general
  complexity: low
  projectContext: greenfield
---

# Product Requirements Document - Linkboard

**Author:** User
**Date:** 2026-03-15

## Executive Summary

Linkboard is a personal bookmark management web application that solves a fundamental problem: browser bookmarks are informational dead ends. Users save URLs but lose all context about what they contain and why they mattered. Linkboard closes this gap through automatic metadata enrichment — when a user pastes a URL, the system fetches the page's title, description, favicon, and Open Graph image, creating a rich, searchable record with zero manual effort.

The target user is anyone who saves 10+ links per week and routinely fails to find them later — developers curating technical references, researchers collecting sources across topics, and knowledge workers building personal reference libraries. Linkboard replaces the fragmented workarounds (browser bookmark folders, notes apps, messages-to-self) with a single, search-first interface.

Built on Next.js, Supabase (auth + Postgres), and deployed to Vercel, Linkboard prioritizes speed to value: magic-link authentication eliminates password friction, and the core save-tag-search loop is designed to complete in under 60 seconds from first signup.

### What Makes This Special

1. **Automatic metadata enrichment eliminates the input barrier.** Every other bookmark system requires manual effort to add context. Linkboard inverts this — paste a URL and the system does the work. This single design decision removes the friction that causes every bookmark collection to decay.

2. **Search-first architecture treats every field as queryable.** Title, URL, description, tags, and fetched metadata text are all indexed for full-text search. Users find bookmarks by what they remember about the content, not by where they filed it.

3. **Radical scope discipline.** No read-later queue, no social sharing, no team features, no article archiving. Linkboard does one thing — save, enrich, and retrieve URLs — and does it faster and better than tools that try to do everything.

The core insight: bookmark systems fail not because of poor organization tools, but because of missing information. Enriching every saved link with searchable metadata at save time solves the retrieval problem at its root.

## Project Classification

| Dimension | Value |
|-----------|-------|
| Project Type | Web Application (Next.js SPA) |
| Domain | General / Personal Productivity |
| Complexity | Low |
| Project Context | Greenfield — new product, no existing codebase |
| Stack | Next.js + Supabase + Vercel |

## Success Criteria

### User Success

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| First bookmark saved | < 60s from signup | Time from account creation to first save event |
| Bookmark retrieval | > 90% of searches surface the desired link | Click-through rate on search results |
| Collection building | 5+ bookmarks saved per week after month 1 | Weekly creation count per user |
| Search habit formation | 3+ searches per week per active user | Search query count |
| Metadata quality | > 95% of URLs return valid title + description + favicon | Automated fetch result monitoring |

**Aha moment:** User searches for a keyword 2+ weeks after saving a link and finds it instantly with full context — the metadata enrichment differentiator proving its value.

### Business Success

**3-month (MVP launch):**
- Core loop functional end-to-end: save → auto-enrich → tag → search → find
- Performance targets met (see NFRs)
- Metadata fetch success rate > 95%
- Deployed and stable on Vercel + Supabase

**6-month:**
- 60%+ activation rate (5 bookmarks within 7 days of signup)
- 50% D7 retention, 30% D30 retention
- 70%+ monthly retention among weekly-active users

**12-month:**
- Recognized tool in personal knowledge management space
- Sustainable growth through organic discovery (dev communities, GitHub, Product Hunt)

### Technical Success

| Metric | Target |
|--------|--------|
| Dashboard load time | < 500ms |
| Search response time | < 200ms |
| Metadata fetch completion | < 3 seconds per URL |
| Metadata fetch success rate | > 95% of submitted URLs |
| Uptime | 99.5% |
| Graceful degradation | Bookmarks save even when metadata fetch fails |

## User Journeys

### Journey 1: Alex — The Developer Curator (Happy Path)

**Opening Scene:** Alex is reading a blog post about PostgreSQL partial indexes at 11pm. It's exactly the optimization technique they need for next week's sprint. They've been burned before — bookmarked a similar article in Chrome six months ago and spent 20 minutes trying to find it when they actually needed it. They never did.

**Rising Action:** Alex opens Linkboard, pastes the URL into the input field. Within 2 seconds, the card populates: title ("Partial Indexes in PostgreSQL: A Practical Guide"), description, the blog's favicon, and the article's Open Graph image showing a database diagram. Alex types two tags: `postgres` and `performance`. Hits save. Total time: 8 seconds.

**Climax:** Three weeks later, mid-sprint, Alex needs that article. They open Linkboard, type "postgres indexing" in search. The article appears instantly — rich card with the title, description snippet, and that familiar database diagram thumbnail. One click and they're reading it. No digging through Chrome bookmark folders. No Slack message archaeology. No re-Googling.

**Resolution:** Linkboard becomes Alex's default save action. Over three months they build a 200+ link library organized by technology tags. Their bookmark collection is no longer a graveyard — it's an active, searchable reference library.

**Requirements revealed:** URL input with auto-metadata fetch, tag input, full-text search across all fields, rich preview cards, fast response times.

### Journey 2: Sarah — The Research Collector (Multi-Topic Organization)

**Opening Scene:** Sarah is deep in her thesis research, juggling three topics: climate policy frameworks, carbon capture technology, and economic impact modeling. She has 47 links in a Google Doc, 23 in Chrome bookmarks, and 15 she emailed to herself. She can never find the right source when writing.

**Rising Action:** Sarah signs up for Linkboard via magic link — no password to remember, email arrives in 10 seconds, she's in. She sees a clean, empty dashboard with a prominent URL input. She starts migrating her most important links: pastes a URL, watches the metadata auto-populate, tags it `climate-policy`, saves. She gets through 15 links in her first session.

**Climax:** While writing her thesis chapter on carbon pricing, Sarah searches "carbon tax economic" in Linkboard. Four relevant articles surface — two she'd completely forgotten about. Each card shows enough context (title, description snippet, source) that she can identify which one she needs without clicking through.

**Resolution:** Sarah develops a tagging system aligned with her thesis chapters. Linkboard becomes her research command center. When her advisor asks "where did you find that statistic?", she searches Linkboard and has the source in seconds.

**Requirements revealed:** Magic-link authentication, tag-based filtering, search across description/metadata text, sufficient card context to identify links without clicking, multi-tag support per bookmark.

### Journey 3: First-Time User — Discovery to Habit (Onboarding Edge Case)

**Opening Scene:** A developer sees Linkboard mentioned in a Hacker News comment. They click through to the landing page. "Save a URL, get a rich bookmark. Search everything." Simple enough.

**Rising Action:** They click "Get Started", enter their email. Magic link arrives. They land on an empty dashboard. The UI communicates clearly: there's a URL input field, nothing else competing for attention. They paste a link — a CSS Grid tutorial from earlier today. The metadata populates. They add a tag. Save. *"Huh, that was fast."*

**Climax (potential failure point):** They save 3 more links over the next week. But the following week, they forget Linkboard exists — it's not integrated into their browsing flow (no extension in MVP). They stumble back to it when they can't find something in Chrome bookmarks, search Linkboard on a hunch, and find it.

**Resolution:** The retrieval success creates the habit loop. They start consciously opening Linkboard to save links worth keeping. The missing browser extension is a friction point they tolerate because the search payoff is worth it.

**Requirements revealed:** Clear empty-state UX, minimal onboarding friction, search that works even with small collections, value delivery on first retrieval.

### Journey 4: Power User — Metadata Fetch Failure (Error Recovery)

**Opening Scene:** Alex pastes a URL to a private GitHub wiki page. The metadata fetch fails — the page requires authentication that Linkboard's server-side fetcher can't provide.

**Rising Action:** Linkboard saves the bookmark anyway with the URL intact, but shows a fallback state: URL as title, no description, no image, generic favicon. Alex manually edits the title to "Team Wiki: Deployment Runbook" and adds tags `devops` and `internal`.

**Climax:** Later, Alex searches "deployment runbook" and finds it — the manual title and tags make it searchable even without auto-fetched metadata.

**Resolution:** Graceful degradation means no link is ever lost. The system works even when metadata fetch fails.

**Requirements revealed:** Graceful metadata fetch failure handling, editable title/description fields, bookmark saves even on fetch failure, manual metadata as search fallback.

### Journey Requirements Traceability

| Capability | Journeys | FR Coverage |
|-----------|----------|-------------|
| URL input + auto-metadata fetch | 1, 2, 3 | FR6, FR7 |
| Tag creation and assignment | 1, 2, 3, 4 | FR14, FR15 |
| Full-text search (title, URL, description, tags) | 1, 2, 4 | FR18, FR19 |
| Rich preview cards (favicon, title, description, OG image) | 1, 2, 3 | FR12, FR24 |
| Magic-link authentication | 2, 3 | FR1, FR2 |
| Tag-based filtering | 2 | FR17 |
| Edit bookmark metadata | 4 | FR10 |
| Graceful metadata fetch failure | 4 | FR8, FR27 |
| Clear empty-state UX | 3 | FR22 |
| Responsive dashboard layout | 1, 2, 3 | FR23, FR25 |

## Web Application Specific Requirements

### Browser Support

| Browser | Minimum Version | Priority |
|---------|----------------|----------|
| Chrome | Last 2 versions | Primary |
| Firefox | Last 2 versions | Primary |
| Safari | Last 2 versions (macOS + iOS) | Primary |
| Edge | Last 2 versions | Secondary |

No IE11 support. No legacy browser polyfills. Modern evergreen browsers only.

### Responsive Design

| Breakpoint | Range | Layout |
|-----------|-------|--------|
| Mobile | 320px - 767px | Single column, stacked cards |
| Tablet | 768px - 1023px | 2-column grid |
| Desktop | 1024px+ | 3-4 column grid |

- URL input spans full width on all breakpoints
- Tag filter collapses to dropdown/modal on mobile
- Search accessible from main dashboard at all breakpoints

### SEO Strategy

- **Landing page:** Server-rendered with meta tags, Open Graph data, structured data
- **Authenticated app:** No SEO — behind auth wall, client-side rendered
- **robots.txt:** Allow landing page, disallow authenticated routes

### Implementation Considerations

- **Framework:** Next.js App Router — React Server Components for landing page, client components for dashboard
- **State management:** React state + Supabase client; no global state library for MVP
- **Styling:** Tailwind CSS
- **Image handling:** Next.js Image component for OG image thumbnails with lazy loading
- **API routes:** Next.js API routes for server-side metadata fetching (avoids CORS)

## Product Scope

### MVP Strategy

**Approach:** Problem-solving MVP — deliver the core save-enrich-search loop with enough polish that users immediately see the value over browser bookmarks. Prove that automatic metadata enrichment makes bookmark retrieval dramatically better.

**Resource Requirements:** Single developer. Next.js + Supabase + Vercel minimizes infrastructure complexity. Estimated 2-3 weeks for a focused sprint.

### MVP Feature Set

**All four user journeys supported.** Must-have capabilities:

| Capability | Rationale |
|-----------|-----------|
| Magic-link auth | Without it, users can't save or access bookmarks |
| URL input + auto-metadata fetch | Core differentiator — without it, this is just another bookmark folder |
| Tag creation and assignment | Primary organization mechanism |
| Full-text search | Core retrieval mechanism — without it, the "find later" promise fails |
| Bookmark card dashboard | Users need to see and browse their collection |
| Edit bookmark metadata | Fallback when metadata fetch fails (Journey 4) |
| Delete bookmarks | Basic CRUD completeness |
| Responsive layout | Mobile access is table stakes |

**Explicitly NOT in MVP:** Browser extension, bulk import, sharing/collaboration, read-later/archiving, analytics dashboard.

### Growth Features (Phase 2 — months 3-6)

- Browser extension for one-click saving (eliminates biggest MVP friction point)
- Bulk import from Chrome/Firefox bookmarks and Pocket/Raindrop exports
- Keyboard shortcuts for power users
- Duplicate URL detection
- Custom tag colors

### Vision Features (Phase 3 — months 6-12)

- Public API for integrations (Raycast, Alfred, iOS Shortcuts)
- Bookmark collections/groups beyond flat tagging
- AI-powered auto-tagging suggestions
- Full-text content archiving (save page content)
- PWA or native mobile apps
- Self-hosting Docker deployment
- Shared collections / collaborative bookmarking

### Risk Mitigation

**Technical Risks:**
- *Metadata fetch reliability:* Some sites block server-side scraping. Mitigation: multiple fetch strategies with user-agent rotation; graceful fallback to URL-only bookmark. Target 95%.
- *Search performance at scale:* PostgreSQL full-text search may slow with thousands of bookmarks. Mitigation: `tsvector` GIN indexes from day one. Acceptable at MVP scale (< 10K bookmarks per user).
- *OG image storage:* MVP links to OG image URLs directly — no proxying. Accept broken images when source pages change.

**Market Risks:**
- *Low retention without browser extension:* Browser extension is Phase 2 priority. MVP validates the search/retrieval value proposition even with higher save friction.
- *Competition:* Pocket, Raindrop.io have large user bases. Linkboard targets a different audience — simplicity-first, self-hosting potential.

**Resource Risks:**
- *Single developer:* Vercel + Supabase managed services eliminate ops burden. If timeline slips, cut tag filtering and mobile breakpoints to ship faster.

## Functional Requirements

### Authentication & Identity

- **FR1:** Users can sign up using their email address via magic-link authentication
- **FR2:** Users can sign in to an existing account via magic-link email
- **FR3:** Users can sign out of their account
- **FR4:** The system restricts access to bookmark data to authenticated users only
- **FR5:** The system maintains user sessions across browser tabs and page refreshes

### Bookmark Management

- **FR6:** Users can save a new bookmark by providing a URL
- **FR7:** The system automatically fetches metadata (title, description, favicon, Open Graph image) for a submitted URL
- **FR8:** The system saves bookmarks even when metadata fetching fails, using the URL as the fallback title
- **FR9:** Users can view all their bookmarks in a visual dashboard
- **FR10:** Users can edit the title and description of any bookmark
- **FR11:** Users can delete any bookmark
- **FR12:** Users can view a bookmark's metadata (title, description, favicon, OG image, source URL) on its dashboard card
- **FR13:** The system displays bookmarks sorted by date added (newest first)

### Tagging

- **FR14:** Users can assign one or more tags to a bookmark when creating it
- **FR15:** Users can add or remove tags on an existing bookmark
- **FR16:** Users can view all tags currently in use across their bookmarks
- **FR17:** Users can filter their bookmarks by selecting a tag

### Search

- **FR18:** Users can search across bookmark titles, URLs, descriptions, and tags using a text query
- **FR19:** The system returns search results that match any indexed field (title, URL, description, tags)
- **FR20:** Users can initiate a search from the main dashboard
- **FR21:** The system displays search results as the same rich bookmark cards used on the dashboard

### Dashboard & UI

- **FR22:** Users see a clear empty state with guidance when they have no bookmarks
- **FR23:** The dashboard renders bookmark cards in a responsive grid layout (single column on mobile, multi-column on desktop)
- **FR24:** Each bookmark card displays: favicon, title, description snippet, OG image thumbnail, tags, and source URL
- **FR25:** Users can access all core features (save, search, tag filter, edit, delete) on both mobile and desktop viewports
- **FR26:** The system provides visual feedback during metadata fetching (loading state)
- **FR27:** The system indicates when metadata fetching has failed for a bookmark

### Landing Page

- **FR28:** Unauthenticated visitors can view a landing page describing Linkboard's value proposition
- **FR29:** Unauthenticated visitors can navigate to the sign-up flow from the landing page

## Non-Functional Requirements

### Performance

- **NFR1:** Authenticated dashboard loads in < 500ms after initial JS bundle cached
- **NFR2:** Search queries return results in < 200ms client-perceived latency
- **NFR3:** Metadata fetching completes within 3 seconds per URL
- **NFR4:** Landing page achieves Largest Contentful Paint < 2.5s
- **NFR5:** Core JavaScript bundle size under 200KB gzipped
- **NFR6:** Dashboard renders 1,000+ bookmarks without UI degradation

### Security

- **NFR7:** All data transmitted over HTTPS (TLS 1.2+)
- **NFR8:** User bookmark data is isolated — no user can access another user's bookmarks
- **NFR9:** Authentication tokens stored securely via Supabase session management
- **NFR10:** Server-side metadata fetching does not expose internal infrastructure details
- **NFR11:** URL inputs validated and sanitized to prevent injection attacks
- **NFR12:** Row-level security enforced at the database level

### Accessibility

- **NFR13:** All interactive elements are keyboard-navigable
- **NFR14:** Color contrast meets WCAG 2.1 AA (4.5:1 normal text, 3:1 large text)
- **NFR15:** Form inputs have associated labels; error states announced to screen readers
- **NFR16:** Focus indicators visible on all interactive elements
- **NFR17:** Bookmark cards convey content to screen readers via ARIA attributes

### Reliability

- **NFR18:** 99.5% uptime
- **NFR19:** Bookmark save succeeds even when metadata fetching fails
- **NFR20:** No data loss — bookmarks persist reliably across sessions
