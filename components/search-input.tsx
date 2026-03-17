"use client";

import { useEffect, useRef, useState } from "react";

type SearchInputProps = {
  onSearch: (query: string) => void;
  isSearching: boolean;
};

export function SearchInput({ onSearch, isSearching }: Readonly<SearchInputProps>) {
  const [value, setValue] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  function handleChange(newValue: string) {
    setValue(newValue);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      onSearch(newValue.trim());
    }, 300);
  }

  function handleClear() {
    setValue("");
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    onSearch("");
  }

  return (
    <div className="relative">
      <label className="sr-only" htmlFor="bookmark-search">
        Search bookmarks
      </label>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          d="M21 21l-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <input
        autoComplete="off"
        className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
        id="bookmark-search"
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search bookmarks..."
        type="search"
        value={value}
      />
      {isSearching ? (
        <div
          aria-label="Searching"
          className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"
          role="status"
        />
      ) : value ? (
        <button
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:rounded"
          onClick={handleClear}
          type="button"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
