---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  - _bmad-output/plan.md
date: 2026-03-15
author: User
---

# Product Brief: Linkboard

<!-- Content will be appended sequentially through collaborative workflow steps -->

## Executive Summary

Linkboard is a personal bookmark management application designed to replace the disorganized, unsearchable mess of browser bookmarks with a clean, intelligent system. It automatically fetches page metadata (title, description, favicon, Open Graph images), supports user-defined tagging, and provides powerful full-text search across all saved content. Built on Next.js with Supabase for authentication and data storage, deployed to Vercel, Linkboard targets individuals who save dozens of links weekly but struggle to find them later.

---

## Core Vision

### Problem Statement

Browser bookmarks are fundamentally broken for anyone who saves more than a handful of links. They lack organization beyond simple folders, provide no search beyond title matching, show no visual previews, and don't sync well across contexts. Users resort to scattered workarounds — notes apps, spreadsheets, messaging themselves — which fragments their saved content further.

### Problem Impact

Knowledge workers, researchers, developers, and avid readers lose significant time re-finding content they've already discovered. Links rot in bookmark bars never to be found again. The friction of organizing bookmarks discourages saving, meaning valuable resources are lost entirely. The cumulative effect is a personal knowledge management gap that grows with every unsaved or unfindable link.

### Why Existing Solutions Fall Short

- **Browser built-in bookmarks**: No metadata preview, weak search, clunky folder-based organization, poor cross-browser sync
- **Pocket/Raindrop/similar**: Often feature-bloated, subscription-gated for core features, or designed more for read-later than quick reference
- **Notes apps (Notion, etc.)**: Not purpose-built for links — require manual metadata entry, no automatic enrichment
- **The gap**: A simple, fast, free-to-self-host personal bookmark tool with automatic metadata enrichment, flexible tagging, and powerful search — without the overhead

### Proposed Solution

Linkboard provides a focused, single-purpose bookmark manager with:
- **One-action saving**: Save a URL and Linkboard automatically fetches title, description, favicon, and Open Graph image
- **Flexible tagging**: User-defined tags for organization without rigid folder hierarchies
- **Full-text search**: Search across tags, titles, URLs, and fetched metadata text
- **Clean dashboard**: Simple, visual UI showing bookmarks with their metadata previews
- **Passwordless auth**: Supabase magic-link authentication for frictionless access
- **Modern stack**: Next.js + Supabase + Vercel for fast, reliable, easy-to-deploy architecture

### Key Differentiators

1. **Automatic metadata enrichment**: No manual data entry — paste a URL and get a rich, searchable bookmark instantly
2. **Search-first design**: Every piece of metadata is searchable, making retrieval fast and intuitive
3. **Simplicity as a feature**: Purpose-built for bookmarking only — no read-later queue, no social features, no bloat
4. **Modern, self-hostable stack**: Built on open-source foundations (Next.js, Supabase) with straightforward Vercel deployment
5. **MVP-first approach**: Ship fast with core value, iterate based on real usage

## Target Users

### Primary Users

#### Persona 1: Alex — The Developer Curator
**Background:** Full-stack developer, 28, works at a mid-size tech company. Spends 2-3 hours daily reading technical articles, documentation, and blog posts. Currently has 500+ browser bookmarks across 3 browsers with no consistent organization.

**Problem Experience:** Alex finds a great article on database optimization, bookmarks it in Chrome, then can't find it two weeks later when they actually need it. Searches through bookmark folders, Slack messages, and browser history — usually gives up and Googles for the article again. Has tried Pocket but found it too focused on "read later" rather than quick reference.

**Goals:** Quickly save links while reading, find them instantly when needed, tag by project/technology for easy filtering.

**Success Vision:** "I paste a URL, it grabs the title and description automatically, I slap a couple tags on it, and two months later I search 'postgres indexing' and it's right there."

#### Persona 2: Sarah — The Research Collector
**Background:** Graduate student, 25, researching across multiple topics. Saves 20-30 links per week from academic papers, news articles, tutorials, and reference material. Uses a mix of browser bookmarks, a Google Doc of links, and emails to herself.

**Problem Experience:** Sarah's research links are scattered across four different systems. When writing a paper, she spends significant time hunting for that one article she read weeks ago. The metadata (what the article was about, why she saved it) is lost because she only saved the URL.

**Goals:** Centralize all research links in one searchable place, see at a glance what each link is about via metadata previews, organize by research topic with tags.

**Success Vision:** "One place for everything. I search by topic, I see the previews, I find what I need in seconds instead of minutes."

### Secondary Users

For MVP, Linkboard is a single-user personal tool. There are no secondary user roles (no admin, team, or sharing features). Future iterations may consider shared collections or team bookmarking, but the MVP focuses entirely on the individual user experience.

### User Journey

**Discovery → Value Timeline:**

1. **Discovery:** User hears about Linkboard through developer communities, Product Hunt, or GitHub — attracted by the "simple bookmark manager" positioning
2. **Onboarding:** Signs up via magic link (no password friction). Sees a clean, empty dashboard with a prominent "Add URL" input
3. **First Save (30 seconds):** Pastes a URL → watches metadata auto-populate (title, description, favicon, OG image) → adds 1-2 tags → saves. *"Oh, that was easy."*
4. **Building the Collection (Week 1):** Saves 10-20 links. Starts developing a personal tagging system. Dashboard fills with rich visual cards
5. **Aha Moment (Week 2-3):** Needs to find a link saved earlier. Searches by keyword → finds it instantly with full context. *"This actually works — I can find things!"*
6. **Habitual Use (Month 1+):** Linkboard becomes the default "save for later" action. User develops consistent tagging habits. The collection becomes a personal knowledge base

## Success Metrics

### User Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to first bookmark saved | < 60 seconds from signup | Track time from account creation to first bookmark save |
| Bookmark retrieval success rate | > 90% of searches return the desired link | Search result click-through and user satisfaction |
| Weekly active usage | User saves 5+ links per week after first month | Weekly bookmark creation count per user |
| Search usage frequency | 3+ searches per week per active user | Search query count |
| Metadata fetch success rate | > 95% of URLs return valid metadata | Automated monitoring of fetch results |

### Business Objectives

**3-Month Goals (MVP Launch):**
- Deploy functional MVP with core features (save, tag, search, metadata fetch)
- Achieve stable architecture with < 500ms page load times
- Successfully handle metadata fetching for 95%+ of submitted URLs

**6-Month Goals:**
- Establish a growing user base through organic discovery (developer communities, GitHub)
- Maintain > 70% monthly retention rate among active users
- Collect user feedback to inform v2 feature prioritization

**12-Month Goals:**
- Build a self-sustaining open-source community if open-sourced
- Explore sustainable monetization (premium features, hosted offering) if applicable
- Establish Linkboard as a recognized tool in the personal knowledge management space

### Key Performance Indicators

1. **Activation Rate**: % of signups who save their first 5 bookmarks within 7 days — *Target: 60%+*
2. **Retention (D7/D30)**: % of users returning after 7 and 30 days — *Target: 50% D7, 30% D30*
3. **Core Action Frequency**: Average bookmarks saved per active user per week — *Target: 5+*
4. **Search Effectiveness**: % of searches that result in a bookmark click — *Target: 70%+*
5. **Infrastructure Reliability**: Uptime and metadata fetch success rate — *Target: 99.5% uptime, 95% fetch success*
6. **Performance**: Dashboard load time and search response time — *Target: < 500ms load, < 200ms search*

## MVP Scope

### Core Features

**1. Authentication**
- Supabase magic-link email authentication
- Session management and protected routes
- Simple login/logout flow

**2. Bookmark Management**
- Add bookmark by pasting a URL
- Automatic metadata fetching: title, description, favicon, Open Graph image
- Edit bookmark tags and notes
- Delete bookmarks
- View all bookmarks on a dashboard with metadata preview cards

**3. Tagging System**
- Add multiple user-defined tags per bookmark
- Filter bookmarks by tag
- View all tags in use

**4. Search**
- Full-text search across bookmark title, URL, description/metadata, and tags
- Real-time search results with highlighting
- Search from the main dashboard

**5. Dashboard UI**
- Clean, responsive grid/list of bookmark cards
- Each card shows: favicon, title, description snippet, OG image thumbnail, tags, source URL
- Sort by date added (newest first)

### Out of Scope for MVP

The following are explicitly **not** included in the MVP to keep scope tight and ship fast:

- **Browser extension**: Users will save URLs directly in the web app (no extension for v1)
- **Import/export**: No bulk import from browser bookmarks or other services
- **Sharing/collaboration**: No shared collections, public profiles, or team features
- **Read-later / archiving**: No article content saving or offline reading
- **Folders/hierarchy**: Tags only — no nested folder structures
- **Custom domains or self-hosting docs**: MVP deploys to Vercel only
- **Mobile app**: Responsive web only — no native iOS/Android apps
- **API**: No public API for third-party integrations
- **Analytics dashboard**: No usage analytics visible to users
- **Rich text notes**: Tags and simple notes only — no markdown editor per bookmark

### MVP Success Criteria

The MVP is considered successful when:

1. **Functional completeness**: A user can sign up, save a URL, see auto-fetched metadata, tag it, and find it via search — the full core loop works end to end
2. **Performance**: Dashboard loads in < 500ms, search returns results in < 200ms, metadata fetches complete within 3 seconds
3. **Reliability**: Metadata fetch succeeds for 95%+ of submitted URLs (graceful fallback for failures)
4. **Usability**: A new user can save their first bookmark within 60 seconds of landing on the app
5. **Deployment**: Successfully deployed and running on Vercel with Supabase backend

### Future Vision

**Post-MVP Enhancements (v2 candidates):**
- Browser extension for one-click saving from any page
- Bulk import from Chrome/Firefox bookmarks and Pocket/Raindrop exports
- Keyboard shortcuts for power users
- Custom tag colors and bookmark collections/groups
- Duplicate URL detection

**Long-Term Vision (v3+):**
- Public API for integrations (Raycast, Alfred, Shortcuts)
- Shared collections and collaborative bookmarking
- AI-powered auto-tagging and smart suggestions
- Full-text content archiving (save page content, not just metadata)
- Mobile apps (PWA or native)
- Self-hosting guide and Docker deployment option
