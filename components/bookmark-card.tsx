"use client";

import Image from "next/image";
import { useState } from "react";

import type { BookmarkWithTags } from "@/lib/types";

function getDisplayTitle(bookmark: BookmarkWithTags) {
  return bookmark.title?.trim() || bookmark.url;
}

function getImageAlt(bookmark: BookmarkWithTags) {
  return bookmark.title?.trim() || "Bookmark preview";
}

export function BookmarkCard({ bookmark }: Readonly<{ bookmark: BookmarkWithTags }>) {
  const [imageError, setImageError] = useState(false);
  const showImage = Boolean(bookmark.og_image_url) && !imageError;

  return (
    <article
      aria-label={`Bookmark: ${getDisplayTitle(bookmark)}`}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      role="listitem"
    >
      {showImage ? (
        <div className="relative aspect-video overflow-hidden rounded-t-2xl bg-slate-100">
          <Image
            alt={getImageAlt(bookmark)}
            className="object-cover"
            fill
            loading="lazy"
            onError={() => setImageError(true)}
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 25vw"
            src={bookmark.og_image_url!}
          />
        </div>
      ) : null}

      <div className="p-5">
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

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold tracking-tight text-slate-950">{getDisplayTitle(bookmark)}</h2>
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
              <p className="line-clamp-2 text-sm leading-6 text-slate-600">{bookmark.description}</p>
            ) : (
              <p className="text-sm leading-6 text-slate-500">No description available yet.</p>
            )}

            {bookmark.tags.length > 0 ? (
              <ul className="flex flex-wrap gap-2" aria-label="Bookmark tags">
                {bookmark.tags.map((tag) => (
                  <li
                    className="rounded-full bg-slate-100 text-slate-600 text-xs px-2 py-0.5"
                    key={tag.id}
                  >
                    {tag.name}
                  </li>
                ))}
              </ul>
            ) : null}

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
      </div>
    </article>
  );
}
