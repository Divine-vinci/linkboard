# Story 1.2: Magic Link Authentication Flow

Status: ready-for-dev

## Story

As a user,
I want to sign up and sign in using my email via magic link,
So that I can access my bookmarks without managing a password.

## Acceptance Criteria

1. **Given** an unauthenticated user on the login page **When** they enter a valid email address and submit the form **Then** a magic link email is sent via Supabase Auth and the page displays a confirmation message ("Check your email for a sign-in link")
2. **Given** a user clicks the magic link from their email **When** the auth callback route processes the token **Then** the user is authenticated, a Supabase session is established, and they are redirected to `/dashboard`
3. **Given** an authenticated user **When** they click the sign-out button **Then** the Supabase session is destroyed and the user is redirected to the landing page (`/`)
4. **Given** a user enters an invalid email format **When** they attempt to submit the login form **Then** a validation error is displayed inline and announced to screen readers (NFR15)
5. The email input has an associated `<label>`, is keyboard-navigable, and has a visible focus indicator (NFR13, NFR15, NFR16)
6. The auth callback route (`app/(auth)/auth/callback/route.ts`) exchanges the code for a session using Supabase server client
7. All form validation uses Zod (`zod@^3.25` already installed)

## Tasks / Subtasks

- [ ] Task 1: Create login page (AC: #1, #4, #5)
  - [ ] Create `app/(auth)/login/page.tsx` — server component wrapper that renders the auth form
  - [ ] Create `components/auth-form.tsx` — client component with email input, submit button, confirmation/error states
  - [ ] Validate email with Zod schema in `lib/validators/auth.ts`
  - [ ] Display inline error for invalid email; display confirmation message on successful submission
  - [ ] Ensure `<label>` is associated with input, keyboard navigation works, focus indicator visible
  - [ ] Announce errors to screen readers via `aria-live="polite"` region or `aria-describedby`
- [ ] Task 2: Create auth callback route (AC: #2, #6)
  - [ ] Create `app/(auth)/auth/callback/route.ts` — GET handler
  - [ ] Extract `code` from URL search params
  - [ ] Exchange code for session using `supabase.auth.exchangeCodeForSession(code)`
  - [ ] On success: redirect to `/dashboard` (or `redirectedFrom` query param if present)
  - [ ] On failure: redirect to `/login?error=auth_callback_failed`
- [ ] Task 3: Create sign-in Server Action (AC: #1)
  - [ ] Create `lib/actions/auth.ts` with `signInWithMagicLink` Server Action
  - [ ] Action accepts email string, validates with Zod, calls `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } })`
  - [ ] Returns `ActionResult<{ message: string }>` — success message or error
- [ ] Task 4: Implement sign-out (AC: #3)
  - [ ] Add `signOut` Server Action in `lib/actions/auth.ts`
  - [ ] Calls `supabase.auth.signOut()` and redirects to `/`
  - [ ] Add sign-out button to dashboard layout (or create minimal `components/sign-out-button.tsx` client component)
- [ ] Task 5: Wire up auth redirect flow
  - [ ] Middleware already redirects unauthenticated `/dashboard/*` users to `/login` (done in Story 1.1)
  - [ ] Ensure `redirectedFrom` param is preserved and used in callback redirect
  - [ ] Set `emailRedirectTo` in magic link to `{origin}/auth/callback`

## Dev Notes

### Architecture Compliance

- **File naming:** `kebab-case.ts` / `kebab-case.tsx` for all files. [Source: architecture.md#Naming Patterns]
- **Named exports only** — except `page.tsx` and `route.ts` which Next.js requires as default exports. [Source: architecture.md#Structure Patterns, Story 1.1 review note H1]
- **Import order:** React/Next → external → internal `@/` → relative → types. [Source: architecture.md#Structure Patterns]
- **Server Actions return `ActionResult<T>`** — never throw, always return success/error shape. [Source: architecture.md#Format Patterns]
- **Error codes:** `UPPER_SNAKE_CASE` with domain prefix: `AUTH_INVALID_EMAIL`, `AUTH_MAGIC_LINK_FAILED`, `AUTH_SIGN_OUT_FAILED`. [Source: architecture.md#Format Patterns]
- **Zod validation before any operation.** [Source: architecture.md#Enforcement Guidelines]
- **Use Supabase client factories from `lib/supabase/`** — never create ad-hoc clients. [Source: architecture.md#Enforcement Guidelines]

### Supabase Auth Magic Link — Implementation Details

**Sending the magic link:**
```typescript
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: `${origin}/auth/callback`,
  },
});
```

**Auth callback exchange:**
```typescript
// app/(auth)/auth/callback/route.ts
const { searchParams } = new URL(request.url);
const code = searchParams.get("code");
if (code) {
  const supabase = await createClient(); // from lib/supabase/server.ts
  await supabase.auth.exchangeCodeForSession(code);
}
```

**Sign out:**
```typescript
const supabase = await createClient(); // from lib/supabase/server.ts
await supabase.auth.signOut();
```

### File Structure for This Story

```
app/
  (auth)/
    login/
      page.tsx            # Login page (renders AuthForm)
    auth/
      callback/
        route.ts          # Auth callback handler (GET)
components/
  auth-form.tsx           # Client component — email form + states
  sign-out-button.tsx     # Client component — sign out button (optional, can be inline)
lib/
  actions/
    auth.ts               # Server Actions: signInWithMagicLink, signOut
  validators/
    auth.ts               # Zod schema: emailSchema
```

[Source: architecture.md#Component Organization, architecture.md#Complete Project Directory Structure]

### Existing Code to Reuse

- `lib/supabase/client.ts` — browser client (for client components if needed)
- `lib/supabase/server.ts` — server client (for Server Actions and route handler)
- `lib/supabase/middleware.ts` + `middleware.ts` — session refresh and `/dashboard` route protection already implemented
- `lib/types.ts` — `ActionResult<T>` type already defined

### Middleware Integration

The root `middleware.ts` from Story 1.1 already:
1. Refreshes the Supabase session on every request via `updateSession`
2. Redirects unauthenticated users from `/dashboard/*` to `/login` with `redirectedFrom` param
3. Excludes static files via `config.matcher`

No changes to middleware needed for this story. The auth callback route at `/auth/callback` is already allowed through the matcher (it doesn't match `/dashboard/*`).

### Accessibility Requirements (WCAG 2.1 AA)

- Email input MUST have an associated `<label htmlFor="email">` (NFR15)
- Error messages MUST be announced to screen readers — use `aria-live="polite"` or `aria-describedby` linking input to error (NFR15)
- All interactive elements (input, buttons) MUST be keyboard-navigable (NFR13)
- Focus indicators MUST be visible on input and buttons (NFR16) — Tailwind's `focus-visible:ring-2` pattern
- Color contrast MUST meet 4.5:1 for normal text, 3:1 for large text (NFR14)

### Anti-Patterns to Avoid

- Do NOT use `any` type — use proper types or `unknown`
- Do NOT create ad-hoc Supabase client instances
- Do NOT throw errors from Server Actions — return `ActionResult`
- Do NOT use `console.log` for error handling
- Do NOT bypass the Zod validation step
- Do NOT hardcode the callback URL — derive from `request.headers.get("origin")` or `process.env.NEXT_PUBLIC_SITE_URL`

### Previous Story Learnings (from Story 1.1)

- **Default exports are OK for framework files** — `page.tsx`, `layout.tsx`, `route.ts`, `middleware.ts` require default exports per Next.js conventions. All other files use named exports only.
- **Zod v3.x is installed** (not v4) — use `zod@^3.25.76` as currently in `package.json`. The architecture doc says "v4.3" but v4 was not stable at implementation time.
- **Next.js 16.1.6 with React 19.2.3** — current versions in the project.
- **Supabase packages:** `@supabase/supabase-js@^2.99.1`, `@supabase/ssr@^0.9.0`
- **No `updated_at` trigger exists yet** — noted in Story 1.1 review as future scope.

### References

- [Source: architecture.md#Authentication & Security] — Supabase Auth magic link, client factories, route protection
- [Source: architecture.md#Component Organization] — File structure for auth routes
- [Source: architecture.md#API & Communication Patterns] — Server Actions, ActionResult pattern
- [Source: architecture.md#Implementation Patterns & Consistency Rules] — Naming, exports, imports
- [Source: epics.md#Story 1.2] — Acceptance criteria, BDD scenarios
- [Source: prd.md#FR1-FR3] — Sign up, sign in, sign out requirements
- [Source: Story 1.1 completion notes] — Foundation code, review findings, version decisions

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
