"use client";

import { useEffect, useState } from "react";

import { deleteBookmark } from "@/lib/actions/bookmarks";
import { BookmarkCard } from "@/components/bookmark-card";
import type { BookmarkWithTags } from "@/lib/types";

type BookmarkListProps = {
  bookmarks: BookmarkWithTags[];
};

export function BookmarkList({ bookmarks: initialBookmarks }: Readonly<BookmarkListProps>) {
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setBookmarks(initialBookmarks);
  }, [initialBookmarks]);

  function handleBookmarkUpdate(updatedBookmark: BookmarkWithTags) {
    setDeleteError(null);
    setBookmarks((currentBookmarks) =>
      currentBookmarks.map((bookmark) =>
        bookmark.id === updatedBookmark.id ? updatedBookmark : bookmark,
      ),
    );
  }

  async function handleBookmarkDelete(bookmarkId: string) {
    setDeleteError(null);

    let removedBookmark: BookmarkWithTags | undefined;
    let removedBookmarkIndex = -1;

    setBookmarks((currentBookmarks) => {
      removedBookmarkIndex = currentBookmarks.findIndex((bookmark) => bookmark.id === bookmarkId);
      removedBookmark = currentBookmarks[removedBookmarkIndex];

      if (!removedBookmark) {
        return currentBookmarks;
      }

      return currentBookmarks.filter((bookmark) => bookmark.id !== bookmarkId);
    });

    if (!removedBookmark) {
      return;
    }

    const result = await deleteBookmark(bookmarkId);

    if (!result.success) {
      setBookmarks((currentBookmarks) => {
        const restoredBookmarks = [...currentBookmarks];
        restoredBookmarks.splice(removedBookmarkIndex, 0, removedBookmark!);
        return restoredBookmarks;
      });
      setDeleteError(result.error.message);
    }
  }

  if (bookmarks.length === 0) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
        <svg
          aria-hidden="true"
          className="mb-4 h-12 w-12 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6.75 4.75A1.75 1.75 0 0 1 8.5 3h7A1.75 1.75 0 0 1 17.25 4.75v15.19a.75.75 0 0 1-1.2.6L12 17.5l-4.05 3.04a.75.75 0 0 1-1.2.6V4.75Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </svg>
        <h2 className="text-lg font-semibold text-slate-900">No bookmarks yet</h2>
        <p className="mt-2 text-sm text-slate-500">Paste a URL above to save your first bookmark</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {deleteError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {deleteError}
        </p>
      ) : null}
      <div
        aria-label="Saved bookmarks"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        role="list"
      >
        {bookmarks.map((bookmark) => (
          <BookmarkCard
            bookmark={bookmark}
            deleteError={deleteError}
            key={bookmark.id}
            onBookmarkDelete={handleBookmarkDelete}
            onBookmarkUpdate={handleBookmarkUpdate}
          />
        ))}
      </div>
    </div>
  );
}
