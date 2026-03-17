"use client";

import type { Tag } from "@/lib/types";

type TagFilterProps = {
  tags: Tag[];
  selectedTag: string | null;
  onTagSelect: (tagName: string | null) => void;
};

function getButtonClassName(isActive: boolean) {
  return [
    "cursor-pointer rounded-full px-2 py-1 text-xs transition focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-1 focus-visible:outline-none",
    isActive
      ? "bg-slate-700 text-white"
      : "bg-slate-100 text-slate-600 hover:bg-slate-200",
  ].join(" ");
}

export function TagFilter({ tags, selectedTag, onTagSelect }: Readonly<TagFilterProps>) {
  return (
    <>
      <div className="md:hidden">
        <label className="sr-only" htmlFor="tag-filter-mobile">
          Filter by tag
        </label>
        <select
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          id="tag-filter-mobile"
          onChange={(event) => onTagSelect(event.target.value || null)}
          value={selectedTag ?? ""}
        >
          <option value="">All bookmarks</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.name}>
              {tag.name}
            </option>
          ))}
        </select>
      </div>

      <div aria-label="Filter bookmarks by tag" className="hidden md:flex flex-wrap items-center gap-2" role="group">
        <button
          aria-pressed={selectedTag === null}
          className={getButtonClassName(selectedTag === null)}
          onClick={() => onTagSelect(null)}
          type="button"
        >
          All
        </button>
        {tags.map((tag) => {
          const isActive = selectedTag === tag.name;

          return (
            <button
              aria-pressed={isActive}
              className={getButtonClassName(isActive)}
              key={tag.id}
              onClick={() => onTagSelect(tag.name)}
              type="button"
            >
              {tag.name}
            </button>
          );
        })}
      </div>
    </>
  );
}
