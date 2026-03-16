# Story 2.1: Save Bookmark with Metadata Fetching

Status: done

## Story

As a user,
I want to save a bookmark by pasting a URL and have metadata automatically fetched,
So that my bookmarks are enriched with context without manual effort.

## Acceptance Criteria

1. **Given** an authenticated user on the dashboard **When** they paste a valid URL into the bookmark input and submit **Then** the system calls `POST /api/metadata` to fetch the page's title, description, favicon, and OG image server-side **And** a visual loading indicator is displayed during metadata fetching (FR26) **And** the bookmark is saved to the database with the fetched metadata **And** the bookmark appears in the dashboard with `metadata_status: 'success'` **And** the URL input is validated with Zod before submission (NFR11)

2. **Given** an authenticated user submits a URL **When** the metadata fetch fails (timeout, blocked, invalid page) **Then** the bookmark is saved anyway with the URL as the fallback title (FR8) **And** `metadata_status` is set to `'failed'` **And** the bookmark card displays an indicator that metadata fetching failed (FR27)

3. **Given** the metadata fetch API route **When** it fetches a target URL **Then** it completes within 3 seconds (NFR3) **And** it does not follow more than 3 redirects **And** it uses a non-identifying User-Agent and does not expose infrastructure details (NFR10) **And** it returns `{ title, description, favicon_url, og_image_url }` on success

4. **Given** a database operation to save a bookmark **When** the insert is executed **Then** RLS policies enforce that `user_id = auth.uid()` (NFR12) **And** the bookmark is created via a `createBookmark` Server Action returning `ActionResult<Bookmark>`

## Tasks / Subtasks

- [x] Task 1: Create URL metadata fetcher (AC: #3)
  - [x] Create `lib/metadata/fetcher.ts` with a `fetchUrlMetadata(url: string)` function
  - [x] Use native `fetch()` with 3-second timeout (`AbortSignal.timeout(3000)`)
  - [x] Set `redirect: "follow"` with max 3 redirects (use `follow` + count check, or manual redirect handling)
  - [x] Set a non-identifying User-Agent header (e.g., `"Mozilla/5.0 (compatible; LinkboardBot/1.0)"`)
  - [x] Parse HTML response to extract: `<title>`, `<meta name="description">`, `<link rel="icon">`, `<meta property="og:image">`
  - [x] Return `{ title, description, favicon_url, og_image_url }` or `null` on failure
  - [x] Resolve relative favicon/OG image URLs to absolute using the page's base URL
  - [x] Catch all errors (network, timeout, parse) — never throw

- [x] Task 2: Create `POST /api/metadata` route (AC: #3)
  - [x] Create `app/api/metadata/route.ts`
  - [x] Accept `POST` with JSON body `{ url: string }`
  - [x] Validate URL with Zod (`urlSchema`) before fetching
  - [x] Call `fetchUrlMetadata(url)` from `lib/metadata/fetcher.ts`
  - [x] Return `200` with `{ title, description, favicon_url, og_image_url }` on success
  - [x] Return `200` with `{ title: null, description: null, favicon_url: null, og_image_url: null }` on fetch failure (NOT an error — the client decides how to handle)
  - [x] Return `400` for invalid URL input
  - [x] Do NOT require authentication — the Server Action that saves the bookmark handles auth. But DO validate the URL to prevent SSRF (reject private IPs, localhost, non-http(s) schemes)

- [x] Task 3: Create Zod validators for bookmarks (AC: #1, #4)
  - [x] Create `lib/validators/bookmark.ts`
  - [x] Define `urlSchema`: `z.string().trim().min(1).url()` — validates URL format
  - [x] Define `bookmarkCreateSchema`: `z.object({ url: urlSchema, title: z.string().nullable().optional(), description: z.string().nullable().optional(), favicon_url: z.string().url().nullable().optional(), og_image_url: z.string().url().nullable().optional(), metadata_status: z.enum(["pending", "success", "failed"]).default("pending") })`

- [x] Task 4: Create `createBookmark` Server Action (AC: #4)
  - [x] Create `lib/actions/bookmarks.ts` with `'use server'` directive
  - [x] Implement `createBookmark(input)` returning `ActionResult<Bookmark>`
  - [x] Authenticate user via `supabase.auth.getUser()` — return `AUTH_NOT_AUTHENTICATED` error if no user
  - [x] Validate input with `bookmarkCreateSchema`
  - [x] Insert into `bookmarks` table with `user_id` set to authenticated user's ID
  - [x] Return the created bookmark on success
  - [x] Follow the exact pattern established in `lib/actions/auth.ts` — catch all errors, never throw

- [x] Task 5: Create bookmark form component (AC: #1, #2)
  - [x] Create `components/bookmark-form.tsx` with `'use client'` directive
  - [x] Render a URL text input with label and submit button
  - [x] On submit: validate URL client-side with Zod, call `POST /api/metadata`, then call `createBookmark` Server Action with fetched metadata
  - [x] Show loading spinner/indicator during metadata fetch (FR26)
  - [x] Disable submit button while operation is pending
  - [x] On metadata fetch failure: still call `createBookmark` with `metadata_status: 'failed'` and URL as fallback title
  - [x] Clear form and show success feedback after save
  - [x] Show inline validation error for invalid URLs
  - [x] Ensure keyboard-navigable, label associated with input (NFR13, NFR15)

- [x] Task 6: Create basic bookmark card component (AC: #1, #2)
  - [x] Create `components/bookmark-card.tsx` with `'use client'` directive
  - [x] Accept a `Bookmark` prop and render: title (or URL fallback), description snippet, favicon, source URL
  - [x] Show a visual indicator when `metadata_status === 'failed'` (FR27)
  - [x] Use ARIA attributes for screen reader accessibility (NFR17)
  - [x] NOTE: This is a minimal card for Story 2.1. Full card with OG image, tags, edit/delete comes in Story 2.2

- [x] Task 7: Create bookmark list component (AC: #1)
  - [x] Create `components/bookmark-list.tsx` with `'use client'` directive
  - [x] Accept `Bookmark[]` prop and render cards sorted by `created_at` descending (newest first)
  - [x] Show empty state message when no bookmarks exist (FR22)

- [x] Task 8: Create `listBookmarks` Server Action (AC: #1)
  - [x] Add `listBookmarks()` to `lib/actions/bookmarks.ts`
  - [x] Query `bookmarks` table ordered by `created_at desc`
  - [x] Return `ActionResult<Bookmark[]>`
  - [x] RLS ensures only the authenticated user's bookmarks are returned

- [x] Task 9: Update dashboard page (AC: #1, #2)
  - [x] Update `app/dashboard/page.tsx` to fetch bookmarks via `listBookmarks` Server Action
  - [x] Render `BookmarkForm` component for URL input
  - [x] Render `BookmarkList` component with fetched bookmarks
  - [x] Wire up form submission to refresh the bookmark list after save

- [x] Task 10: Verify build (AC: all)
  - [x] Run `npm run typecheck`, `npm run lint`, `npm run build`
  - [x] Ensure no regressions in existing tests

## Dev Notes

### Architecture Compliance

- **Server Actions**: All bookmark CRUD in `lib/actions/bookmarks.ts` with `'use server'` directive. Return `ActionResult<T>` — never throw.
- **API Route**: Only `POST /api/metadata` at `app/api/metadata/route.ts`. This is the only API route in the app per architecture.
- **Supabase clients**: Use `createClient()` from `lib/supabase/server.ts` in Server Actions and API routes. Use `lib/supabase/client.ts` only in Client Components (not needed for this story).
- **Zod validation**: Validate all inputs before database operations. Schemas in `lib/validators/bookmark.ts`.
- **RLS**: Database RLS policies already exist (migration 005). Do NOT add application-level authorization checks beyond verifying the user is authenticated.
- **Named exports**: All components and functions use named exports. Exception: page/layout files use `export default` (Next.js requirement).
- **File naming**: `kebab-case.ts` / `kebab-case.tsx` for all files.
- **Import order**: React/Next → external packages → `@/` internal → relative → types.

### Existing Code to Reuse

- **`lib/types.ts`** — `Bookmark`, `BookmarkWithTags`, `ActionResult<T>`, `ActionError` types already defined. Do NOT redefine.
- **`lib/supabase/server.ts`** — `createClient()` for server-side Supabase access. Use this in Server Actions and API routes.
- **`lib/supabase/client.ts`** — `createClient()` for browser-side Supabase access. Not needed for Server Actions.
- **`lib/actions/auth.ts`** — Reference pattern for Server Action structure: async function, Zod validation, `createClient()`, return `ActionResult<T>`.
- **`lib/validators/auth.ts`** — Reference pattern for Zod schema definition.
- **`supabase/migrations/001_create_bookmarks.sql`** — Schema already exists with `metadata_status` CHECK constraint (`'pending' | 'success' | 'failed'`).
- **`supabase/migrations/005_add_rls_policies.sql`** — RLS policies already exist for bookmarks table (select/insert/update/delete own).
- **`components/sign-out-button.tsx`** — Reference for Client Component pattern with `'use client'` directive.
- **`app/dashboard/layout.tsx`** — Already handles auth check and redirects unauthenticated users. The dashboard page inherits this protection.

### Database Schema (Already Migrated)

The `bookmarks` table already exists from migration 001:
```sql
bookmarks (
  id uuid PK DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url text NOT NULL,
  title text,
  description text,
  favicon_url text,
  og_image_url text,
  metadata_status text NOT NULL DEFAULT 'pending' CHECK ('pending'|'success'|'failed'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
)
```
RLS policies from migration 005 enforce `auth.uid() = user_id` on all operations. Do NOT create new migrations — the schema is ready.

### Metadata Fetcher Technical Details

- Use Node.js native `fetch()` — no external HTTP libraries needed.
- **Timeout**: `AbortSignal.timeout(3000)` for the 3-second limit (NFR3).
- **Redirect limit**: Native `fetch` follows redirects by default. Use `redirect: "follow"` but implement a manual redirect counter if the runtime doesn't limit redirects to 3. Alternatively, use `redirect: "manual"` and follow manually up to 3 times.
- **User-Agent**: Set a generic, non-identifying User-Agent. Do NOT use strings that reveal infrastructure (no "Vercel", "Next.js", server IPs, etc.).
- **HTML parsing**: Use regex or string parsing to extract `<title>`, `<meta>` tags. Do NOT install a DOM parser library (cheerio, jsdom) — keep it lightweight. Parse only the `<head>` section (stop reading after `</head>` or first 50KB, whichever comes first) for performance.
- **Favicon resolution**: Check for `<link rel="icon">` or `<link rel="shortcut icon">`. If not found, try `/favicon.ico` at the domain root. Resolve relative URLs to absolute.
- **OG image**: Extract `<meta property="og:image" content="...">`. Resolve relative URLs.
- **SSRF protection**: In the API route, reject URLs with: private IP ranges (10.x, 172.16-31.x, 192.168.x), localhost/127.0.0.1, non-http(s) schemes (file://, ftp://, etc.). Use `new URL()` to parse and validate before fetching.

### Error Handling Patterns

- **Metadata fetch fails**: Return `null` from `fetchUrlMetadata()`. API route returns empty metadata (all null fields). Client saves bookmark with `metadata_status: 'failed'` and URL as title.
- **Server Action errors**: Return `ActionResult` with `success: false` — error codes: `AUTH_NOT_AUTHENTICATED`, `VALIDATION_ERROR`, `BOOKMARK_CREATE_FAILED`.
- **Client-side**: Show inline error messages. Do NOT use `console.log` for error handling.

### Important Anti-Patterns to Avoid

- Do NOT install `cheerio`, `jsdom`, `axios`, `node-fetch`, or any external HTTP/parsing library. Use native `fetch()` and regex/string parsing.
- Do NOT create a new Supabase client outside of `lib/supabase/`. Use the existing factories.
- Do NOT bypass RLS with service role key.
- Do NOT use `any` type — use proper types from `lib/types.ts`.
- Do NOT use `console.log` for error handling — return proper `ActionResult` errors.
- Do NOT add `export default` on components — use named exports. Only page/layout files use default exports.
- Do NOT create separate files for each Server Action — all bookmark actions go in `lib/actions/bookmarks.ts`.

### Library Versions

- **Next.js**: 16.1.6 (App Router, Turbopack, React 19.2)
- **Supabase JS**: ^2.99.1 with `@supabase/ssr` ^0.9.0
- **Zod**: ^3.25.76 (note: architecture doc says v4.3 but v3.25 is what's installed — use v3 API)
- **React**: 19.2.3
- **TypeScript**: ^5
- **Tailwind CSS**: v4

### Data Flow

```
User pastes URL → BookmarkForm (Client)
  → Client-side Zod validation
  → POST /api/metadata (API Route)
    → fetchUrlMetadata() (lib/metadata/fetcher.ts)
    → Returns { title, description, favicon_url, og_image_url } or nulls
  → createBookmark Server Action (lib/actions/bookmarks.ts)
    → Server-side Zod validation
    → Supabase INSERT (RLS enforced)
    → Returns ActionResult<Bookmark>
  → UI updates with new bookmark in list
```

### Previous Story Intelligence

- **Story 1.4 review**: Tests using string-matching against source files were flagged as an anti-pattern. If writing tests, use behavioral/rendering assertions.
- **Story 1.4 review**: Hardcoded URLs were flagged — use env vars or relative paths where possible.
- **Existing dashboard layout** (`app/dashboard/layout.tsx`) already checks auth and shows user email. The dashboard page just needs to render the bookmark form and list.
- **Existing dashboard page** (`app/dashboard/page.tsx`) is a placeholder with "Bookmark creation ships in the next story" — replace this entirely.

### Project Structure Notes

Files to create:
```
lib/metadata/fetcher.ts          — URL metadata extraction logic
app/api/metadata/route.ts        — POST endpoint for metadata fetching
lib/validators/bookmark.ts       — Zod schemas for bookmark validation
lib/actions/bookmarks.ts         — Server Actions: createBookmark, listBookmarks
components/bookmark-form.tsx     — URL input form (Client Component)
components/bookmark-card.tsx     — Bookmark display card (Client Component)
components/bookmark-list.tsx     — Bookmark grid container (Client Component)
```

Files to modify:
```
app/dashboard/page.tsx           — Replace placeholder with bookmark dashboard
```

### References

- [Source: epics.md#Story 2.1] — acceptance criteria and BDD scenarios
- [Source: architecture.md#Data Architecture] — bookmarks schema, Zod validation, migration approach
- [Source: architecture.md#API & Communication Patterns] — Server Actions + POST /api/metadata pattern
- [Source: architecture.md#Frontend Architecture] — RSC vs Client Component boundaries
- [Source: architecture.md#Implementation Patterns] — naming, structure, error handling, ActionResult<T>
- [Source: architecture.md#Project Structure] — file locations for all new files
- [Source: architecture.md#Data Flow] — bookmark save flow diagram
- [Source: supabase/migrations/001_create_bookmarks.sql] — existing bookmarks table schema
- [Source: supabase/migrations/005_add_rls_policies.sql] — existing RLS policies
- [Source: lib/types.ts] — Bookmark, ActionResult<T> types already defined
- [Source: lib/actions/auth.ts] — Server Action reference pattern

## Dev Agent Record

### Agent Model Used

openai/gpt-5.4

### Debug Log References

- `_bmad-output/implementation-artifacts/dev-story-log.md`

### Completion Notes List

- Implemented metadata fetcher + API route with a shared 3-second timeout budget across redirect hops, max 3 redirects, HTML head parsing, absolute asset URL resolution, and public-http(s)-only SSRF guards.
- Implemented bookmark validators, `createBookmark`, and `listBookmarks` server actions using existing Supabase server client and `ActionResult<T>` patterns.
- Replaced dashboard placeholder with bookmark form + list UI; form validates URL client-side, saves fallback title on metadata failure, shows loading/success/error states, and refreshes the dashboard after save.
- Replaced the original source-string assertions in `tests/story-2-1.test.mjs` with behavioral runtime tests covering metadata parsing, redirect/timeout behavior, API route validation/fallback handling, and bookmark server action auth/validation/query behavior.
- Re-ran `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` successfully after the review fixes.
- Non-blocking existing framework warning remains during build: Next.js `middleware.ts` deprecation in favor of `proxy.ts`.

### File List

- `_bmad-output/implementation-artifacts/2-1-review-fix-plan.md`
- `app/api/metadata/route.ts`
- `app/dashboard/page.tsx`
- `components/bookmark-card.tsx`
- `components/bookmark-form.tsx`
- `components/bookmark-list.tsx`
- `lib/actions/bookmarks.ts`
- `lib/metadata/fetcher.ts`
- `lib/validators/bookmark.ts`
- `tests/story-2-1.test.mjs`

## Senior Developer Review (AI)

_Reviewer: User on 2026-03-16_
_Review Agent: claude-opus-4-6_

### Review Outcome: Approved (with fixes applied)

All 4 Acceptance Criteria verified as IMPLEMENTED. All 10 tasks verified as complete.

### Issues Found & Fixed (6 fixed, 2 LOW deferred)

**HIGH — Fixed:**
1. **XSS via non-http URL storage** (`lib/validators/bookmark.ts`) — `urlSchema` accepted `javascript:` URLs. Added `.refine()` to enforce http/https protocol. This closes the vector where direct server action calls could store executable URLs rendered in `<a href>`.
2. **Unbounded response body buffering** (`lib/metadata/fetcher.ts`) — `response.text()` loaded entire response into memory. Replaced with `readLimitedBody()` streaming reader that stops at 50KB, matching the story's spec.

**MEDIUM — Fixed:**
3. **Incomplete SSRF protection** (`app/api/metadata/route.ts`) — Added checks for `169.254.x.x` (link-local), `100.64.0.0/10` (carrier-grade NAT), and IPv6 private ranges (`fc00::/7`, `fe80::/10`).
4. **Redundant client-side sorting** (`components/bookmark-list.tsx`) — Removed duplicate sort; data arrives pre-sorted from `listBookmarks` server action.
5. **Silent error on bookmark load failure** (`app/dashboard/page.tsx`) — Dashboard now shows error message instead of empty state when `listBookmarks` fails.
6. **Bookmark list missing list semantics** (`components/bookmark-list.tsx`) — Added `role="list"` for screen reader accessibility.

**LOW — Not fixed (cosmetic):**
7. `MetadataResult` type not exported from `fetcher.ts` — duplicated inline in form/route. Acceptable for 2 consumers.
8. `tsconfig.json` modified but undocumented in File List — change appears to be dev tooling, not story-related.

### Change Log

- 2026-03-16: Code review by claude-opus-4-6. 6 issues fixed (2 HIGH, 4 MEDIUM). All tests pass. Build clean.
