"use client";

import { useState, useTransition } from "react";

import { signInWithMagicLink } from "@/lib/actions/auth";

type AuthFormProps = {
  redirectedFrom?: string;
  callbackError?: string;
};

export function AuthForm({ redirectedFrom, callbackError }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState(
    callbackError === "auth_callback_failed"
      ? "We couldn’t verify that sign-in link. Request a new one."
      : "",
  );
  const [successMessage, setSuccessMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const errorId = errorMessage ? "email-error" : undefined;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    startTransition(async () => {
      const result = await signInWithMagicLink(email, redirectedFrom);

      if (!result.success) {
        setErrorMessage(result.error.message);
        return;
      }

      setSuccessMessage(result.data.message);
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div className="space-y-2 text-left">
        <label className="text-sm font-medium text-foreground" htmlFor="email">
          Email address
        </label>
        <input
          aria-describedby={errorId}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-foreground outline-none transition focus-visible:border-slate-600 focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
          id="email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </div>

      <div aria-live="polite" className="min-h-6 text-sm">
        {errorMessage ? (
          <p className="text-red-700" id="email-error">
            {errorMessage}
          </p>
        ) : null}
        {successMessage ? <p className="text-emerald-700">{successMessage}</p> : null}
      </div>

      <button
        className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Sending magic link..." : "Send magic link"}
      </button>
    </form>
  );
}
