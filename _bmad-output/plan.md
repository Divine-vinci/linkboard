# Execution Plan — Story 1.4

## Goal
Implement Story 1.4 Landing Page in `/home/clawd/projects/linkboard`.

## Scope
1. Replace `app/page.tsx` placeholder with static RSC landing page.
2. Add page-level metadata + Open Graph.
3. Add `app/robots.ts` to allow `/` and disallow `/dashboard` + `/api`.
4. Add Story 1.4 test coverage.
5. Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` and confirm `/` is static.

## Constraints
- No `'use client'`
- No new deps
- Tailwind utilities only
- CTA => `/login`
- Semantic HTML + visible focus states
