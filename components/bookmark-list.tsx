"use client";

import type { Bookmark } from "@/lib/types";

import { BookmarkCard } from "@/components/bookmark-card";

export function BookmarkList({ bookmarks }: Readonly<{ bookmarks: Bookmark[] }>) {
  if (bookmarks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center text-sm text-slate-600">
        No bookmarks saved yet. Paste a URL above to add your first link.
      </div>
    );
  }

  return (
    <div aria-label="Saved bookmarks" className="grid gap-4" role="list">
      {bookmarks.map((bookmark) => (
        <BookmarkCard bookmark={bookmark} key={bookmark.id} />
      ))}
    </div>
  );
}
