"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";

import { updateBookmark } from "@/lib/actions/bookmarks";
import type { BookmarkWithTags } from "@/lib/types";
import { bookmarkUpdateSchema } from "@/lib/validators/bookmark";

type BookmarkEditFormProps = {
  bookmark: BookmarkWithTags;
  onSave: (updated: BookmarkWithTags) => void;
  onSaveComplete: (updated: BookmarkWithTags) => void;
  onCancel: () => void;
};

export function BookmarkEditForm({ bookmark, onSave, onSaveComplete, onCancel }: Readonly<BookmarkEditFormProps>) {
  const [title, setTitle] = useState(bookmark.title ?? "");
  const [description, setDescription] = useState(bookmark.description ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUpdating, startTransition] = useTransition();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const titleInputId = useId();
  const descriptionInputId = useId();

  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  function handleCancel() {
    setTitle(bookmark.title ?? "");
    setDescription(bookmark.description ?? "");
    setErrorMessage(null);
    onCancel();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const parsedInput = bookmarkUpdateSchema.safeParse({
      title: title.trim() ? title.trim() : null,
      description: description.trim() ? description.trim() : null,
    });

    if (!parsedInput.success) {
      setErrorMessage(parsedInput.error.issues[0]?.message ?? "Enter valid bookmark details.");
      return;
    }

    startTransition(async () => {
      const optimisticBookmark: BookmarkWithTags = {
        ...bookmark,
        ...parsedInput.data,
      };

      onSave(optimisticBookmark);

      const result = await updateBookmark(bookmark.id, parsedInput.data);

      if (!result.success) {
        onSave(bookmark);
        setErrorMessage(result.error.message);
        return;
      }

      onSaveComplete({
        ...bookmark,
        ...result.data,
        tags: bookmark.tags,
      });
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      handleCancel();
    }
  }

  return (
    <form className="space-y-4" onKeyDown={handleKeyDown} onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor={titleInputId}>
          Title
        </label>
        <input
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-500"
          disabled={isUpdating}
          id={titleInputId}
          maxLength={500}
          onChange={(event) => setTitle(event.target.value)}
          ref={titleInputRef}
          type="text"
          value={title}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor={descriptionInputId}>
          Description
        </label>
        <textarea
          className="min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-500"
          disabled={isUpdating}
          id={descriptionInputId}
          maxLength={2000}
          onChange={(event) => setDescription(event.target.value)}
          value={description}
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          className="rounded-lg px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          disabled={isUpdating}
          onClick={handleCancel}
          type="button"
        >
          Cancel
        </button>
        <button
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:opacity-50"
          disabled={isUpdating}
          type="submit"
        >
          {isUpdating ? "Saving…" : "Save"}
        </button>
      </div>

      {errorMessage ? (
        <p className="text-sm text-rose-700" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}
