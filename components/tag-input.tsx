"use client";

import { useId, useMemo, useState } from "react";

import { tagNameSchema } from "@/lib/validators/tag";

type TagInputProps = {
  id?: string;
  label: string;
  value: string[];
  onChange: (nextValue: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
};

function createTagId(tagName: string) {
  return `tag-${tagName}`;
}

export function TagInput({
  id,
  label,
  value,
  onChange,
  disabled = false,
  placeholder = "Add a tag...",
}: Readonly<TagInputProps>) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const selectedTagsId = `${inputId}-selected-tags`;
  const [draftValue, setDraftValue] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const normalizedTags = useMemo(() => value.map((tag) => tag.toLowerCase()), [value]);

  function commitTag(rawValue: string) {
    const parsedTag = tagNameSchema.safeParse(rawValue);

    if (!parsedTag.success) {
      setErrorMessage(parsedTag.error.issues[0]?.message ?? "Enter a valid tag.");
      return false;
    }

    if (normalizedTags.includes(parsedTag.data)) {
      setDraftValue("");
      setErrorMessage("That tag has already been added.");
      return false;
    }

    onChange([...normalizedTags, parsedTag.data]);
    setDraftValue("");
    setErrorMessage(null);
    return true;
  }

  function handleRemove(tagName: string) {
    onChange(normalizedTags.filter((tag) => tag !== tagName));
    setErrorMessage(null);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (disabled) {
      return;
    }

    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();

      if (!draftValue.trim()) {
        return;
      }

      commitTag(draftValue);
      return;
    }

    if (event.key === "Backspace" && !draftValue && normalizedTags.length > 0) {
      event.preventDefault();
      handleRemove(normalizedTags[normalizedTags.length - 1]!);
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700" htmlFor={inputId}>
        {label}
      </label>
      <div className="rounded-lg border border-slate-300 px-3 py-2 focus-within:ring-2 focus-within:ring-slate-500">
        <div aria-label="Selected tags" className="flex flex-wrap items-center gap-2" id={selectedTagsId}>
          {normalizedTags.map((tag) => (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600" key={createTagId(tag)}>
              {tag}
              <button
                aria-label={`Remove tag ${tag}`}
                className="ml-1 text-slate-400 transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                disabled={disabled}
                onClick={() => handleRemove(tag)}
                type="button"
              >
                ×
              </button>
            </span>
          ))}
          <input
            aria-describedby={errorMessage ? errorId : selectedTagsId}
            aria-invalid={Boolean(errorMessage)}
            className="min-w-32 flex-1 border-0 bg-transparent text-sm text-slate-950 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-0"
            disabled={disabled}
            id={inputId}
            onBlur={() => {
              if (draftValue.trim()) {
                commitTag(draftValue);
              }
            }}
            onChange={(event) => {
              setDraftValue(event.target.value);
              if (errorMessage) {
                setErrorMessage(null);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            type="text"
            value={draftValue}
          />
        </div>
      </div>
      {errorMessage ? (
        <p className="text-sm text-rose-700" id={errorId} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
