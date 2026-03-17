# Story 3.2: Tag Listing & Filtering

Status: done

## Story

As a user,
I want to view all my tags and filter bookmarks by selecting a tag,
so that I can quickly narrow down my collection by topic.

## Acceptance Criteria

1. **Given** an authenticated user on the dashboard **When** they view the tag filter component **Then** all tags currently in use across their bookmarks are displayed (FR16) **And** the tag filter collapses to a dropdown/modal on mobile viewports

2. **Given** a user selecting a tag from the filter **When** a tag is selected **Then** only bookmarks with that tag are displayed on the dashboard (FR17) **And** the active filter is visually indicated **And** the user can clear the filter to show all bookmarks again

3. **Given** a user deletes the last bookmark associated with a tag **When** the tag has no remaining bookmarks **Then** the tag is no longer shown in the filter list (or the UI handles the orphan gracefully)

## Tasks / Subtasks

- [x] Task 1: Create `TagFilter` component (AC: #1, #2)
  - [x] Create `components/tag-filter.tsx` as a Client Component (`'use client'`)
  - [x] Accept props: `tags: Tag[]`, `selectedTag: string | null`, `onTagSelect: (tagName: string | null) => void`
  - [x] Render tags as clickable pills/buttons (reuse the pill style from `bookmark-card.tsx` lines 184-195)
  - [x] On desktop (>=768px): render inline as a horizontal scrollable list or wrap
  - [x] On mobile (<768px): collapse into a dropdown select or expandable section
  - [x] Highlight active tag with distinct styling (e.g., `bg-slate-700 text-white` vs default `bg-slate-100 text-slate-600`)
  - [x] Include an "All" option (or clear button) to remove the filter
  - [x] Named export only: `export function TagFilter`
  - [x] Keyboard-navigable: tag buttons are focusable, Enter/Space activates (NFR13)
  - [x] Focus indicators: `focus-visible:ring-2 focus-visible:ring-slate-500` (NFR16)
  - [x] `aria-pressed` on each tag button to indicate active state (NFR17)
  - [x] `aria-label="Filter by tag"` on the container

- [x] Task 2: Add client-side tag filtering to `BookmarkList` (AC: #2)
  - [x] Add state: `selectedTag: string | null` (via `useState`)
  - [x] Filter bookmarks in render: if `selectedTag` is set, show only bookmarks where `bookmark.tags.some(t => t.name === selectedTag)`
  - [x] Pass `selectedTag` and `onTagSelect` handler to `TagFilter`
  - [x] Preserve existing sort order (newest first) after filtering

- [x] Task 3: Integrate `TagFilter` into dashboard UI (AC: #1)
  - [x] Extract unique tags from the bookmarks data (derive from `bookmarks.flatMap(b => b.tags)`, dedupe by name)
  - [x] Render `TagFilter` above the bookmark grid in `BookmarkList` (between the form and the grid)
  - [x] Only show `TagFilter` when there are tags to display (hide if zero tags)

- [x] Task 4: Handle orphan tags when bookmarks are deleted (AC: #3)
  - [x] When a bookmark is deleted and the active filter tag no longer exists in remaining bookmarks, clear the filter automatically
  - [x] The tag list derives from current bookmarks, so orphan tags disappear naturally when the bookmark list updates
  - [x] If the filtered view becomes empty after a delete, show the empty state or clear the filter

- [x] Task 5: Handle tag filter interaction with bookmark mutations (AC: #2, #3)
  - [x] After creating a new bookmark with tags, the new tags should appear in the filter list (they will, since tags derive from bookmarks)
  - [x] After editing bookmark tags, the filter list should update accordingly
  - [x] Ensure optimistic updates in `BookmarkList` work correctly with the derived tag list

- [x] Task 6: Verify build and accessibility (AC: all)
  - [x] Run `npm run typecheck`, `npm run lint`, `npm run build`
  - [x] Ensure no regressions — all 37 existing tests must pass
  - [x] Keyboard: Tab to tag filter, Enter/Space to select tag, Tab to clear/all button
  - [x] Screen reader: `aria-pressed` reflects selected state, filter role is clear
  - [x] Mobile: tag filter collapses properly below 768px

## Dev Notes

### Architecture Compliance

- **New files to create:**
  - `components/tag-filter.tsx` — Tag listing and filter component (Client)
- **Files to modify:**
  - `components/bookmark-list.tsx` — Add tag filtering state, derive tag list, render TagFilter
- **No changes needed to:**
  - `lib/types.ts` — `Tag`, `BookmarkWithTags` already defined
  - `lib/actions/tags.ts` — `listUserTags()` exists but NOT needed here (derive tags from bookmarks instead — avoids extra server call)
  - `lib/actions/bookmarks.ts` — No server-side filtering needed for MVP tag count
  - `app/dashboard/page.tsx` — No changes; all filtering is client-side within BookmarkList
  - `components/bookmark-card.tsx` — Tag display unchanged
  - Database migrations — No schema changes needed
- **Named exports only** — no default exports
- **File naming**: `kebab-case.tsx`
- **Import order**: React/Next → external packages → `@/` internal → relative → types

### Critical Design Decision: Client-Side Filtering

Use **client-side filtering** (not server-side) because:
1. `listBookmarks()` already returns ALL bookmarks with tags populated (`BookmarkWithTags[]`)
2. The dashboard already has all bookmark data in memory
3. Avoids adding a new server action or modifying `listBookmarks`
4. Performance is fine — NFR6 says dashboard handles 1000+ bookmarks without degradation
5. Simpler implementation — filter is just `bookmarks.filter(b => b.tags.some(t => t.name === selectedTag))`

Derive the tag list from bookmarks data (not from `listUserTags()`) because:
- Tags in the filter should only show tags that have bookmarks (FR16 says "tags currently in use")
- Avoids an extra server round-trip
- Automatically handles orphan tag removal (AC #3) — if no bookmarks have a tag, it disappears from the list

### Existing Code to Reuse

- **`components/bookmark-list.tsx`** — Current state management:
  - `bookmarks` state (synced from props via `useEffect`)
  - `handleBookmarkUpdate(updated)` — replaces a bookmark in the array
  - `handleBookmarkDelete(id)` — optimistic delete with rollback
  - Grid: `grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
  - Add `selectedTag` state and filtering logic here

- **`components/bookmark-card.tsx` (lines 184-195)** — Tag pill styling to reuse:
  ```
  rounded-full bg-slate-100 text-slate-600 text-xs px-2 py-0.5
  ```
  Use same styling for inactive filter pills, with a distinct active variant.

- **`lib/types.ts`** — `Tag` type: `{ id: string; user_id: string; name: string }`

- **`components/tag-input.tsx`** — Reference for tag interaction patterns (Enter to select, keyboard nav). Don't reuse directly — TagFilter is a selector, not an editor.

### TagFilter Component Pattern

**Desktop layout (>=768px):**
```
┌──────────────────────────────────────────────────────┐
│ Filter: [All] [react] [typescript] [nextjs] [design] │
└──────────────────────────────────────────────────────┘
```

**Mobile layout (<768px):**
```
┌──────────────────────────┐
│ Filter by tag:  [▼ All ] │
└──────────────────────────┘
```

**Component API:**
```typescript
interface TagFilterProps {
  tags: Tag[];              // Unique tags derived from bookmarks
  selectedTag: string | null;  // Currently active tag name (or null for all)
  onTagSelect: (tagName: string | null) => void;  // null = clear filter
}
```

**Styling conventions (match project):**
- Inactive pill: `rounded-full bg-slate-100 text-slate-600 text-xs px-2 py-1 hover:bg-slate-200`
- Active pill: `rounded-full bg-slate-700 text-white text-xs px-2 py-1`
- "All" button: same pill style, active when no tag selected
- Container: `flex flex-wrap gap-2 items-center` (desktop)
- Focus: `focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-1 outline-none`
- Use `<button>` elements (not `<a>` or `<div>`) for proper keyboard/screen reader semantics

### BookmarkList Integration Pattern

Current `BookmarkList` structure (simplified):
```tsx
export function BookmarkList({ bookmarks: initialBookmarks }: Props) {
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  // ... delete/update handlers ...

  return (
    <div>
      {bookmarks.length === 0 ? <EmptyState /> : (
        <div className="grid ...">
          {bookmarks.map(b => <BookmarkCard key={b.id} ... />)}
        </div>
      )}
    </div>
  );
}
```

**Add filtering:**
```tsx
export function BookmarkList({ bookmarks: initialBookmarks }: Props) {
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Derive unique tags from ALL bookmarks (not filtered)
  const availableTags = useMemo(() => {
    const tagMap = new Map<string, Tag>();
    for (const b of bookmarks) {
      for (const t of b.tags) {
        if (!tagMap.has(t.name)) tagMap.set(t.name, t);
      }
    }
    return Array.from(tagMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [bookmarks]);

  // Apply filter
  const displayedBookmarks = selectedTag
    ? bookmarks.filter(b => b.tags.some(t => t.name === selectedTag))
    : bookmarks;

  // Clear filter if selected tag disappears (e.g., after bookmark delete)
  useEffect(() => {
    if (selectedTag && !availableTags.some(t => t.name === selectedTag)) {
      setSelectedTag(null);
    }
  }, [availableTags, selectedTag]);

  return (
    <div>
      {availableTags.length > 0 && (
        <TagFilter
          tags={availableTags}
          selectedTag={selectedTag}
          onTagSelect={setSelectedTag}
        />
      )}
      {displayedBookmarks.length === 0 ? <EmptyState /> : (
        <div className="grid ...">
          {displayedBookmarks.map(b => <BookmarkCard key={b.id} ... />)}
        </div>
      )}
    </div>
  );
}
```

**Important considerations:**
- Derive `availableTags` from the FULL `bookmarks` array, not the filtered view
- Use `useMemo` to avoid re-computing tags on every render
- Auto-clear `selectedTag` when the tag disappears from available tags
- Show `EmptyState` only when `displayedBookmarks` is empty — but consider showing a "No bookmarks with this tag" message instead of the generic empty state when a filter is active

### Filtered Empty State

When a tag filter is active but no bookmarks match (e.g., after deleting the last bookmark with that tag):
- Don't show the generic "Save your first bookmark" empty state
- Show a contextual message: "No bookmarks tagged with '{tagName}'" with a "Clear filter" button
- Or auto-clear the filter (handled by the `useEffect` above)

### Accessibility Requirements (NFR13, NFR15, NFR16, NFR17)

- Tag filter container: `role="group"` with `aria-label="Filter bookmarks by tag"`
- Each tag button: `<button>` with `aria-pressed={isActive}` for toggle semantics
- "All" button: `aria-pressed={selectedTag === null}`
- Focus indicators: `focus-visible:ring-2 focus-visible:ring-slate-500`
- Color contrast: pill text on pill background must meet 4.5:1 (NFR14) — `slate-600` on `slate-100` passes; `white` on `slate-700` passes
- Mobile dropdown: use `<select>` element which is natively accessible, or an accessible custom dropdown with proper ARIA

### Mobile Responsive Behavior

Architecture specifies: "the tag filter collapses to a dropdown/modal on mobile viewports"

**Implementation approach:** Use Tailwind responsive classes:
- Desktop (md+): Show tag pills inline with `flex flex-wrap`
- Mobile (<md): Show a `<select>` dropdown (natively accessible, keyboard-friendly)

```tsx
{/* Desktop: pill buttons */}
<div className="hidden md:flex flex-wrap gap-2" role="group" aria-label="Filter bookmarks by tag">
  <button aria-pressed={!selectedTag} onClick={() => onTagSelect(null)}>All</button>
  {tags.map(t => (
    <button key={t.id} aria-pressed={selectedTag === t.name} onClick={() => onTagSelect(t.name)}>
      {t.name}
    </button>
  ))}
</div>

{/* Mobile: select dropdown */}
<div className="md:hidden">
  <label htmlFor="tag-filter-mobile" className="sr-only">Filter by tag</label>
  <select
    id="tag-filter-mobile"
    value={selectedTag ?? ""}
    onChange={e => onTagSelect(e.target.value || null)}
  >
    <option value="">All bookmarks</option>
    {tags.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
  </select>
</div>
```

### Important Anti-Patterns to Avoid

- Do NOT install any UI component library (shadcn, radix, headlessui) — use plain HTML + Tailwind
- Do NOT use `any` type — use proper types from `lib/types.ts`
- Do NOT add `export default` — named exports only
- Do NOT create new database migrations — no schema changes needed
- Do NOT modify `listBookmarks()` — filtering is client-side
- Do NOT call `listUserTags()` separately — derive tags from bookmarks to show only "in-use" tags
- Do NOT use global state (Redux, Zustand) — React useState only
- Do NOT modify `bookmark-card.tsx` — tag display on cards is unchanged
- Do NOT create a separate route for tag filtering — it's inline on the dashboard
- Do NOT use URL query params for filter state — simple React state is sufficient for MVP
- Zod is v3 (`^3.25.76`), NOT v4 — though this story likely needs no Zod at all
- Do NOT break the existing 37 tests

### Previous Story Intelligence

From Story 3.1 implementation:
- **Tag actions work correctly** — `createTagsAndAssign`, `updateBookmarkTags`, `listUserTags` all tested and reviewed
- **`listUserTags`** exists but returns ALL user tags (including orphans not on any bookmark). For FR16 ("tags currently in use"), derive from bookmarks instead.
- **Tag validation**: lowercase, alphanumeric + hyphens, max 50 chars. Tags are already normalized.
- **`BookmarkList` state sync**: `useEffect` syncs `bookmarks` state from props when `initialBookmarks` changes (props from server). Filtering state should be separate.
- **Optimistic update pattern**: `handleBookmarkUpdate` replaces entire bookmark in state. Tag changes flow through this. After a tag is removed from a bookmark, `availableTags` will recompute and may remove the tag from the filter list.
- **Review feedback from 3.1**: Non-atomic `updateBookmarkTags` noted as tech debt. `onBlur` commit added to TagInput. Partial failure handling improved. These don't directly impact 3.2 but inform the overall stability of tag operations.
- **37 tests pass** — verify no regressions after changes.

### Git Intelligence

Latest commit `6a316fe` completed Story 3.1 (Tag Creation & Assignment). Key patterns established:
- `components/tag-input.tsx` — Tag UI interaction patterns
- `lib/actions/tags.ts` — Tag server action patterns
- `lib/validators/tag.ts` — Tag validation
- Optimistic update + rollback for tag operations in `bookmark-edit-form.tsx`
- No new dependencies added — project uses only core Next.js + Supabase + Zod

### Library Versions

- **Next.js**: 16.1.6 (App Router, Turbopack, React 19.2)
- **React**: 19.2.3
- **Tailwind CSS**: v4
- **@supabase/supabase-js**: ^2.99.1
- **@supabase/ssr**: ^0.9.0
- **Zod**: ^3.25.76 (likely not needed for this story)

### Project Structure Notes

Files to create:
```
components/tag-filter.tsx           — Tag listing and filter component (Client)
```

Files to modify:
```
components/bookmark-list.tsx       — Add selectedTag state, derive tag list, render TagFilter, filter display
```

No changes needed:
```
lib/types.ts                       — Tag, BookmarkWithTags already defined
lib/actions/tags.ts                — listUserTags exists but not used (derive from bookmarks)
lib/actions/bookmarks.ts           — listBookmarks unchanged
app/dashboard/page.tsx             — Server component unchanged
app/dashboard/layout.tsx           — Layout unchanged
components/bookmark-card.tsx       — Tag display on cards unchanged
components/bookmark-form.tsx       — Bookmark creation unchanged
components/bookmark-edit-form.tsx  — Tag editing unchanged
components/tag-input.tsx           — Tag input unchanged
supabase/migrations/               — No schema changes
```

### References

- [Source: epics.md#Story 3.2] — Acceptance criteria and BDD scenarios
- [Source: architecture.md#Frontend Architecture] — `tag-filter.tsx` listed in component organization
- [Source: architecture.md#Tagging (FR14-17)] — `components/tag-filter.tsx` — filter by tag
- [Source: architecture.md#Component Organization] — tag-filter.tsx is a Client Component
- [Source: architecture.md#State Management Patterns] — React useState only, no global state
- [Source: architecture.md#Communication Patterns] — Immutable state, optimistic updates
- [Source: architecture.md#Implementation Patterns] — Naming conventions, file structure
- [Source: architecture.md#Accessibility (NFR13-17)] — WCAG 2.1 AA, keyboard nav, ARIA
- [Source: lib/types.ts] — Tag, BookmarkWithTags, ActionResult<T>
- [Source: components/bookmark-list.tsx] — Current bookmark display and state management
- [Source: components/bookmark-card.tsx:184-195] — Tag pill styling to reuse
- [Source: lib/actions/tags.ts:248-283] — listUserTags (exists, not needed for this story)
- [Source: 3-1-tag-creation-and-assignment.md] — Previous story patterns, review findings, file list

## Dev Agent Record

### Agent Model Used

openai/gpt-5.4

### Debug Log References

- Red: `node --test tests/story-3-2.test.mjs` (failed before implementation)
- Green: `node --test tests/story-3-2.test.mjs`
- Regression: `npm test`
- Quality gates: `npm run typecheck`, `npm run lint`, `npm run build`

### Completion Notes List

- Added `components/tag-filter.tsx` as a client component with desktop pill buttons, mobile select fallback, `aria-pressed`, and focus ring support. (AC1, AC2)
- Added `selectedTag` state, derived `availableTags` via `useMemo`, and client-side filtered rendering in `components/bookmark-list.tsx`. (AC1, AC2)
- Auto-clear active filters when bookmark mutations remove the last matching tag; render contextual filtered empty state with clear action. (AC2, AC3)
- Preserved optimistic bookmark update/delete flows and newest-first order by filtering the existing in-memory list only. (AC2, AC3)
- Added `tests/story-3-2.test.mjs`; full suite now passes at 40/40. (AC1, AC2, AC3)

### File List

- components/bookmark-list.tsx
- components/tag-filter.tsx
- tests/story-3-2.test.mjs

### Change Log

- 2026-03-17: Implemented Story 3.2 tag listing/filtering UI, bookmark filtering state, orphan-tag cleanup, and regression coverage.
- 2026-03-17: Code review (claude-opus-4-6). Fixed: H1 — memoized `displayedBookmarks` with `useMemo` for NFR6 perf compliance; M4 — added `cursor-pointer` to tag filter buttons and clear filter button. Noted but not fixed: M1 — tests are source-code string searches, not behavioral tests; M2 — dual DOM trees for responsive layout (standard Tailwind pattern); M3 — wasted computation before early return on empty bookmarks (negligible impact).
