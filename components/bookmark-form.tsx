"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createBookmark } from "@/lib/actions/bookmarks";
import { urlSchema } from "@/lib/validators/bookmark";

type MetadataResponse = {
  title: string | null;
  description: string | null;
  favicon_url: string | null;
  og_image_url: string | null;
};

const emptyMetadata: MetadataResponse = {
  title: null,
  description: null,
  favicon_url: null,
  og_image_url: null,
};

export function BookmarkForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const parsedUrl = urlSchema.safeParse(url);

    if (!parsedUrl.success) {
      setErrorMessage(parsedUrl.error.issues[0]?.message ?? "Enter a valid URL");
      return;
    }

    startTransition(async () => {
      let metadata = emptyMetadata;
      let metadataStatus: "success" | "failed" = "failed";

      try {
        const response = await fetch("/api/metadata", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ url: parsedUrl.data }),
        });

        if (response.ok) {
          const payload = (await response.json()) as MetadataResponse;
          metadata = payload;
          metadataStatus = Object.values(payload).some((value) => value) ? "success" : "failed";
        }
      } catch {
        metadataStatus = "failed";
      }

      const bookmarkResult = await createBookmark({
        url: parsedUrl.data,
        title: metadata.title ?? parsedUrl.data,
        description: metadata.description,
        favicon_url: metadata.favicon_url,
        og_image_url: metadata.og_image_url,
        metadata_status: metadataStatus,
      });

      if (!bookmarkResult.success) {
        setErrorMessage(bookmarkResult.error.message);
        return;
      }

      setUrl("");
      setSuccessMessage("Bookmark saved.");
      router.refresh();
    });
  }

  return (
    <form className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-900" htmlFor="bookmark-url">
          Save a new bookmark
        </label>
        <input
          aria-describedby="bookmark-form-feedback"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
          disabled={isPending}
          id="bookmark-url"
          name="url"
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com/article"
          type="url"
          value={url}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Fetching metadata…" : "Save bookmark"}
        </button>
        {isPending ? (
          <span className="text-sm text-slate-600" role="status">
            Loading bookmark metadata…
          </span>
        ) : null}
      </div>

      <p aria-live="polite" className="min-h-6 text-sm text-slate-600" id="bookmark-form-feedback">
        {errorMessage ? <span className="text-rose-700">{errorMessage}</span> : successMessage}
      </p>
    </form>
  );
}
