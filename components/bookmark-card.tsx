"use client";

import type { Bookmark } from "@/lib/types";

function getDisplayTitle(bookmark: Bookmark) {
  return bookmark.title?.trim() || bookmark.url;
}

export function BookmarkCard({ bookmark }: Readonly<{ bookmark: Bookmark }>) {
  return (
    <article
      aria-label={`Bookmark: ${getDisplayTitle(bookmark)}`}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-start gap-3">
        {bookmark.favicon_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt=""
            aria-hidden="true"
            className="mt-1 h-5 w-5 rounded-sm"
            height={20}
            src={bookmark.favicon_url}
            width={20}
          />
        ) : (
          <div aria-hidden="true" className="mt-1 h-5 w-5 rounded-sm bg-slate-200" />
        )}

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">{getDisplayTitle(bookmark)}</h2>
            {bookmark.metadata_status === "failed" ? (
              <span
                aria-label="Metadata fetch failed"
                className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900"
                role="status"
              >
                Metadata unavailable
              </span>
            ) : null}
          </div>

          {bookmark.description ? (
            <p className="text-sm leading-6 text-slate-600">{bookmark.description}</p>
          ) : (
            <p className="text-sm leading-6 text-slate-500">No description available yet.</p>
          )}

          <a
            className="inline-flex max-w-full items-center text-sm font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
            href={bookmark.url}
            rel="noreferrer noopener"
            target="_blank"
          >
            <span className="truncate">{bookmark.url}</span>
          </a>
        </div>
      </div>
    </article>
  );
}
