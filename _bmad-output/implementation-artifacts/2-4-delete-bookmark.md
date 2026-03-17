# Story 2.4: Delete Bookmark

Status: ready-for-dev

## Story

As a user,
I want to delete any bookmark,
so that I can remove links I no longer need.

## Acceptance Criteria

1. **Given** an authenticated user viewing a bookmark card **When** they initiate a delete action **Then** a confirmation prompt is displayed to prevent accidental deletion

2. **Given** a user confirming bookmark deletion **When** the delete is confirmed **Then** the `deleteBookmark` Server Action removes the bookmark from the database (RLS enforced) **And** the UI updates optimistically to remove the card immediately **And** associated `bookmark_tags` entries are cascade-deleted by the database

3. **Given** a user confirming bookmark deletion **When** the server delete fails **Then** the optimistic removal is reverted (bookmark card reappears) **And** an error message is displayed with `role="alert"`

4. **Given** a user viewing the confirmation prompt **When** they cancel the deletion **Then** no changes are made and the bookmark remains as-is

## Tasks / Subtasks

- [ ] Task 1: Create `deleteBookmark` Server Action (AC: #2, #3)
  - [ ] Add `deleteBookmark(id: string)` to `lib/actions/bookmarks.ts`
  - [ ] Authenticate user via `supabase.auth.getUser()`
  - [ ] Validate `id` is a non-empty string
  - [ ] Delete via `supabase.from('bookmarks').delete().eq('id', id)`
  - [ ] RLS enforces `user_id = auth.uid()` — no manual ownership check needed
  - [ ] `bookmark_tags` entries cascade-deleted by FK constraint — no manual cleanup
  - [ ] Return `ActionResult<null>` (success returns `{ success: true, data: null }`)
  - [ ] Error codes: `AUTH_NOT_AUTHENTICATED`, `BOOKMARK_NOT_FOUND`, `BOOKMARK_DELETE_FAILED`

- [ ] Task 2: Add delete UI to `BookmarkCard` (AC: #1, #2, #3, #4)
  - [ ] Add a Delete button (trash icon or text) next to the existing Edit button
  - [ ] Add `isConfirmingDelete` state to show/hide confirmation prompt
  - [ ] Add `isDeleting` state for pending operation
  - [ ] Confirmation prompt: inline text "Delete this bookmark?" with Confirm and Cancel buttons
  - [ ] On confirm: call `onBookmarkDelete(bookmark.id)` callback prop
  - [ ] On cancel: set `isConfirmingDelete` to false
  - [ ] Delete button: keyboard-accessible with visible focus ring (`focus-visible:ring-2 focus-visible:ring-slate-500`)
  - [ ] Hide Edit button while confirming delete (prevent conflicting states)
  - [ ] Add `onBookmarkDelete` callback prop: `(bookmarkId: string) => void`

- [ ] Task 3: Wire optimistic delete through `BookmarkList` (AC: #2, #3)
  - [ ] Add `handleBookmarkDelete(bookmarkId: string)` to `BookmarkList`
  - [ ] Optimistic: remove bookmark from local state immediately
  - [ ] Call `deleteBookmark(bookmarkId)` Server Action
  - [ ] On failure: revert by restoring the removed bookmark to its original position
  - [ ] On failure: display error (pass error back to card or show at list level)
  - [ ] Pass `onBookmarkDelete` callback to each `BookmarkCard`

- [ ] Task 4: Verify build and accessibility (AC: all)
  - [ ] Run `npm run typecheck`, `npm run lint`, `npm run build`
  - [ ] Ensure no regressions in existing tests (30 tests passing)
  - [ ] Keyboard: Tab to Delete button, Enter to activate, Tab between Confirm/Cancel, Escape to cancel confirmation
  - [ ] Confirm/Cancel buttons have accessible labels
  - [ ] Error messages use `role="alert"` for screen reader announcement

## Dev Notes

### Architecture Compliance

- **Server Actions**: `deleteBookmark` goes in `lib/actions/bookmarks.ts` — same file as `createBookmark`, `updateBookmark`, `listBookmarks`. Do NOT create a separate file.
- **No new components**: Delete UI is inline on the `BookmarkCard`. No separate delete dialog/modal component.
- **Named exports**: All functions use named exports.
- **File naming**: `kebab-case.tsx` for any files.
- **Import order**: React/Next → external packages → `@/` internal → relative → types.
- **ActionResult<T>**: `deleteBookmark` must return `ActionResult<null>`, never throw.
- **Optimistic updates**: Remove card from list immediately, revert on server error. Follow pattern established in Story 2.3.
- **No global state**: Use existing React `useState` in BookmarkList. No external state library.

### Existing Code to Reuse

- **`lib/actions/bookmarks.ts`** — Add `deleteBookmark` to existing file. Follow the exact pattern of `createBookmark` and `updateBookmark`.
- **`components/bookmark-card.tsx`** — Enhance in place to add delete button and confirmation UI. Do NOT recreate.
- **`components/bookmark-list.tsx`** — Already manages local `bookmarks` state from Story 2.3. Add `handleBookmarkDelete` alongside existing `handleBookmarkUpdate`.
- **`lib/types.ts`** — `Bookmark`, `BookmarkWithTags`, `ActionResult<T>` already defined. No changes needed.
- **`lib/validators/bookmark.ts`** — No new schema needed for delete (only takes an ID string).

### Database Schema (Already Migrated)

```sql
bookmarks (id, user_id, url, title, description, favicon_url, og_image_url, metadata_status, created_at, updated_at)
```
- RLS policy `bookmarks_delete_own`: `FOR DELETE USING (auth.uid() = user_id)` — already exists in migration 005.
- `bookmark_tags` has `ON DELETE CASCADE` on `bookmark_id` FK — associated tags are automatically removed. Do NOT manually delete from `bookmark_tags`.
- No new migrations needed.

### Server Action Pattern

Follow the exact pattern from `updateBookmark`:
```typescript
"use server";

export async function deleteBookmark(
  id: string,
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: { code: "AUTH_NOT_AUTHENTICATED", message: "You must be signed in to delete bookmarks." } };
  }

  if (!id) {
    return { success: false, error: { code: "VALIDATION_ERROR", message: "Bookmark ID is required." } };
  }

  const { error, count } = await supabase
    .from("bookmarks")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: { code: "BOOKMARK_DELETE_FAILED", message: "Failed to delete bookmark. Please try again." } };
  }

  // Note: RLS silently filters — if the bookmark doesn't exist or belongs to another user,
  // the delete succeeds with 0 affected rows. Use { count: 'exact' } to detect this.
  // Alternative: just return success — the bookmark is gone from the user's perspective.

  return { success: true, data: null };
}
```

**Important RLS behavior**: Supabase `delete()` with RLS will succeed silently even if no rows match (the row simply isn't visible). To detect `BOOKMARK_NOT_FOUND`, use `.delete({ count: 'exact' })` and check `count === 0`. However, for delete operations this is often acceptable — if the bookmark is already gone, the user's intent is fulfilled.

### Optimistic Delete Pattern

Extends the optimistic pattern established in Story 2.3:
```typescript
// In BookmarkList:
const handleBookmarkDelete = async (bookmarkId: string) => {
  // Save current state for rollback
  const previousBookmarks = bookmarks;
  // Optimistic removal
  setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
  // Server call
  const result = await deleteBookmark(bookmarkId);
  if (!result.success) {
    // Revert
    setBookmarks(previousBookmarks);
    // Surface error (consider passing error state down or using a list-level error)
  }
};
```

### Delete Confirmation UI

Inline confirmation on the card (not a browser `window.confirm()` or modal):
```
┌─────────────────────────┐
│  OG Image               │
├─────────────────────────┤
│ 🔖 Title                │
│ Description snippet...  │
│ 🏷 tag1, tag2           │
│ 🔗 example.com          │
│                          │
│ ⚠ Delete this bookmark? │  ← confirmation text
│  [Cancel]  [Delete]      │  ← Delete button red/destructive
└─────────────────────────┘
```

Styling for delete-specific buttons:
- Delete trigger button: `text-slate-400 hover:text-red-600` (subtle until hover)
- Confirm Delete button: `bg-red-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-red-700 disabled:opacity-50`
- Cancel button: `text-slate-600 rounded-lg px-4 py-2 text-sm hover:bg-slate-100` (same as edit cancel)
- Confirmation text: `text-sm text-slate-700 font-medium`

### Accessibility Requirements (NFR13, NFR15, NFR16)

- Delete button: keyboard-focusable with `focus-visible:ring-2 focus-visible:ring-slate-500`
- Confirmation text + buttons: accessible to screen readers
- Confirm Delete button should have `aria-label="Confirm delete bookmark"` for clarity
- Error messages: use `role="alert"` so screen readers announce errors
- When confirmation appears, focus should move to Cancel button (safer default)
- Escape key: dismiss confirmation without deleting

### Important Anti-Patterns to Avoid

- Do NOT use `window.confirm()` — use inline confirmation UI for consistent UX and accessibility.
- Do NOT install any UI component library (shadcn, radix, headlessui) — use plain HTML + Tailwind.
- Do NOT create a separate route for deleting (e.g., `/dashboard/delete/[id]`).
- Do NOT manually delete from `bookmark_tags` — the CASCADE constraint handles this.
- Do NOT use `any` type — use proper types from `lib/types.ts`.
- Do NOT add `export default` — named exports only.
- Do NOT create new database migrations.
- Do NOT modify BookmarkForm (the URL input form) or BookmarkEditForm.
- Do NOT use `useTransition` for the delete call in BookmarkList — the optimistic pattern requires `async/await` to know when to revert. `useTransition` in BookmarkCard can manage the `isDeleting` pending state for button disable.

### Previous Story Intelligence

From Story 2.3 implementation and review:
- **Optimistic update pattern is established** in `BookmarkList` — `handleBookmarkUpdate` sets state, and BookmarkCard calls it via `onBookmarkUpdate`. Follow this same callback pattern with `onBookmarkDelete`.
- **`BookmarkList` already manages `bookmarks` state** via `useState` — initialized from `initialBookmarks` prop with `useEffect` sync. Just add the filter operation for deletes.
- **BookmarkCard already has `isEditing` state** — make sure delete confirmation (`isConfirmingDelete`) and edit mode are mutually exclusive. If editing, hide delete. If confirming delete, hide edit.
- **Success message pattern** (3-second auto-dismiss) exists in BookmarkCard for edit. Not needed for delete since the card disappears.
- **Zod v3 is installed** (not v4) — but no Zod schema needed for delete.
- **30 tests currently passing** — do not break them.
- **Review feedback from Story 2.3**: success message was initially broken due to state timing. Keep delete UI simple to avoid similar issues.
- **`useTransition` works in React 19** for wrapping async server action calls.

### Library Versions

- **Next.js**: 16.1.6 (App Router, Turbopack, React 19.2)
- **React**: 19.2.3
- **Tailwind CSS**: v4
- **@supabase/supabase-js**: ^2.99.1
- **@supabase/ssr**: ^0.9.0
- **Zod**: ^3.25.76

### Data Flow

```
BookmarkCard (Client) — user clicks Delete
  → Show inline confirmation (isConfirmingDelete = true)
  → User clicks Confirm
    → Call onBookmarkDelete(bookmark.id) callback
      → BookmarkList.handleBookmarkDelete(bookmarkId)
        → Optimistic: filter bookmark from state
        → deleteBookmark(id) Server Action
          → Auth check
          → Supabase DELETE (RLS enforced)
          → bookmark_tags CASCADE deleted
          → Return ActionResult<null>
        → On failure: revert state (restore bookmark)
        → On failure: surface error
  → User clicks Cancel
    → isConfirmingDelete = false, no changes
```

### Project Structure Notes

Files to modify:
```
lib/actions/bookmarks.ts           — Add deleteBookmark Server Action
components/bookmark-card.tsx       — Add delete button, confirmation UI
components/bookmark-list.tsx       — Add handleBookmarkDelete with optimistic removal
```

No new files needed.

### References

- [Source: epics.md#Story 2.4] — acceptance criteria and BDD scenarios
- [Source: architecture.md#Frontend Architecture] — RSC vs Client, optimistic updates
- [Source: architecture.md#API & Communication Patterns] — Server Actions, ActionResult<T>
- [Source: architecture.md#Implementation Patterns] — naming, structure, error handling
- [Source: architecture.md#Communication Patterns] — immutable state updates, optimistic patterns
- [Source: supabase/migrations/005_add_rls_policies.sql] — bookmarks_delete_own policy exists
- [Source: supabase/migrations/003_create_bookmark_tags.sql] — ON DELETE CASCADE on bookmark_id FK
- [Source: lib/types.ts] — Bookmark, BookmarkWithTags, ActionResult<T>
- [Source: lib/actions/bookmarks.ts] — existing createBookmark, updateBookmark patterns
- [Source: components/bookmark-card.tsx] — existing card with edit mode to enhance with delete
- [Source: components/bookmark-list.tsx] — existing list with optimistic update state management
- [Source: 2-3-edit-bookmark.md] — previous story learnings and review feedback

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
