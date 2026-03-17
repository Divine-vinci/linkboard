"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { BookmarkCard } from "@/components/bookmark-card";
import { SearchInput } from "@/components/search-input";
import { TagFilter } from "@/components/tag-filter";
import { deleteBookmark, searchBookmarks } from "@/lib/actions/bookmarks";
import type { BookmarkWithTags, Tag } from "@/lib/types";

type BookmarkListProps = {
  bookmarks: BookmarkWithTags[];
};

export function BookmarkList({ bookmarks: initialBookmarks }: Readonly<BookmarkListProps>) {
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BookmarkWithTags[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    setBookmarks(initialBookmarks);
  }, [initialBookmarks]);

  const availableTags = useMemo(() => {
    const tagMap = new Map<string, Tag>();

    for (const bookmark of bookmarks) {
      for (const tag of bookmark.tags) {
        if (!tagMap.has(tag.name)) {
          tagMap.set(tag.name, tag);
        }
      }
    }

    return Array.from(tagMap.values()).sort((left, right) => left.name.localeCompare(right.name));
  }, [bookmarks]);

  const isSearchActive = searchQuery.length > 0;
  const sourceBookmarks = isSearchActive && searchResults !== null ? searchResults : bookmarks;

  const displayedBookmarks = useMemo(
    () =>
      selectedTag
        ? sourceBookmarks.filter((bookmark) => bookmark.tags.some((tag) => tag.name === selectedTag))
        : sourceBookmarks,
    [sourceBookmarks, selectedTag],
  );

  useEffect(() => {
    if (selectedTag && !availableTags.some((tag) => tag.name === selectedTag)) {
      setSelectedTag(null);
    }
  }, [availableTags, selectedTag]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    setSearchError(null);

    if (!query) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);

    try {
      const result = await searchBookmarks(query);

      if (result.success) {
        setSearchResults(result.data);
      } else {
        setSearchError(result.error.message);
        setSearchResults(null);
      }
    } finally {
      setIsSearching(false);
    }
  }, []);

  function handleBookmarkUpdate(updatedBookmark: BookmarkWithTags) {
    setDeleteError(null);
    setBookmarks((currentBookmarks) =>
      currentBookmarks.map((bookmark) =>
        bookmark.id === updatedBookmark.id ? updatedBookmark : bookmark,
      ),
    );
    if (searchResults) {
      setSearchResults((current) =>
        current?.map((bookmark) =>
          bookmark.id === updatedBookmark.id ? updatedBookmark : bookmark,
        ) ?? null,
      );
    }
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

    if (searchResults) {
      setSearchResults((current) =>
        current?.filter((bookmark) => bookmark.id !== bookmarkId) ?? null,
      );
    }

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

  const hasActiveFilter = selectedTag !== null || isSearchActive;

  return (
    <div className="space-y-4">
      {deleteError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {deleteError}
        </p>
      ) : null}

      {searchError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {searchError}
        </p>
      ) : null}

      <SearchInput isSearching={isSearching} onSearch={handleSearch} />

      {availableTags.length > 0 ? (
        <TagFilter onTagSelect={setSelectedTag} selectedTag={selectedTag} tags={availableTags} />
      ) : null}

      {displayedBookmarks.length === 0 && hasActiveFilter ? (
        <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            {isSearchActive
              ? `No results for "${searchQuery}"`
              : `No bookmarks tagged with "${selectedTag}"`}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {isSearchActive
              ? "Try a different search term."
              : "Try another tag or clear the current filter."}
          </p>
          {selectedTag ? (
            <button
              className="mt-4 cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
              onClick={() => setSelectedTag(null)}
              type="button"
            >
              Clear filter
            </button>
          ) : null}
        </div>
      ) : (
        <div
          aria-label={isSearchActive ? "Search results" : "Saved bookmarks"}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          role="list"
        >
          {displayedBookmarks.map((bookmark) => (
            <BookmarkCard
              bookmark={bookmark}
              deleteError={deleteError}
              key={bookmark.id}
              onBookmarkDelete={handleBookmarkDelete}
              onBookmarkUpdate={handleBookmarkUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
