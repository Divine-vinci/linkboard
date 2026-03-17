import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = async (relativePath) => fs.readFile(path.join(root, relativePath), "utf8");

test("AC1 TagFilter exposes responsive desktop/mobile controls and accessibility semantics", async () => {
  const src = await read("components/tag-filter.tsx");

  assert.ok(src.includes('"use client"'), "TagFilter must be a client component");
  assert.ok(src.includes("export function TagFilter"), "TagFilter must use a named export");
  assert.ok(src.includes("selectedTag: string | null"), "TagFilter must accept selectedTag prop");
  assert.ok(src.includes("onTagSelect: (tagName: string | null) => void"), "TagFilter must accept onTagSelect prop");
  assert.ok(src.includes('className="md:hidden"'), "TagFilter must collapse to a mobile control below md");
  assert.ok(src.includes('className="hidden md:flex'), "TagFilter must render inline pills on desktop");
  assert.ok(src.includes('role="group"'), "TagFilter must expose grouped filter semantics");
  assert.ok(src.includes('aria-label="Filter by tag"') || src.includes('aria-label="Filter bookmarks by tag"'), "TagFilter must label the filter control");
  assert.ok(src.includes("aria-pressed"), "TagFilter buttons must expose pressed state");
  assert.ok(src.includes("focus-visible:ring-2 focus-visible:ring-slate-500"), "TagFilter must expose visible focus rings");
  assert.ok(src.includes("All"), "TagFilter must render an all/clear option");
});

test("AC2-AC3 BookmarkList derives available tags, filters bookmarks, and clears orphan filters", async () => {
  const src = await read("components/bookmark-list.tsx");

  assert.ok(src.includes("useMemo"), "BookmarkList must memoize derived tags");
  assert.ok(src.includes("selectedTag"), "BookmarkList must keep selectedTag state");
  assert.ok(src.includes("bookmarks.filter"), "BookmarkList must filter bookmarks client-side");
  assert.ok(src.includes("bookmark.tags.some"), "BookmarkList filter must match bookmark tags");
  assert.ok(src.includes("new Map<string, Tag>()"), "BookmarkList must dedupe tags by name");
  assert.ok(src.includes("localeCompare"), "BookmarkList must preserve deterministic tag ordering");
  assert.ok(src.includes("<TagFilter"), "BookmarkList must render TagFilter above the grid");
  assert.ok(src.includes("availableTags.length > 0"), "BookmarkList must hide TagFilter when there are no tags");
  assert.ok(src.includes("!availableTags.some((tag) => tag.name === selectedTag)"), "BookmarkList must clear filters when the active tag disappears");
});

test("AC2 BookmarkList preserves bookmark mutations and filtered empty-state affordances", async () => {
  const src = await read("components/bookmark-list.tsx");

  assert.ok(src.includes("handleBookmarkUpdate"), "BookmarkList must still support optimistic bookmark updates");
  assert.ok(src.includes("handleBookmarkDelete"), "BookmarkList must still support optimistic bookmark deletes");
  assert.ok(src.includes("No bookmarks tagged with"), "BookmarkList must render contextual filtered empty state copy");
  assert.ok(src.includes("Clear filter"), "BookmarkList must let users clear an active filter from empty state");
  assert.ok(src.includes("bookmark.id === updatedBookmark.id ? updatedBookmark : bookmark"), "BookmarkList must replace the full bookmark payload so tag edits update filters");
});
