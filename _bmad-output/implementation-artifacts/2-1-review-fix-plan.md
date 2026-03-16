# Story 2.1 Review Fix Plan

Status: in-progress

## Objective
Address the Story 2.1 code review blockers without expanding scope.

## Planned changes
1. Replace `tests/story-2-1.test.mjs` source-string assertions with behavioral/runtime tests.
   - Test `fetchUrlMetadata()` parsing + asset URL resolution against a local HTTP server.
   - Test redirect handling behavior with mocked `fetch`, including shared timeout signal across redirects and redirect cap.
   - Test `POST /api/metadata` behavior with mocked metadata fetcher for valid/invalid/failure paths.
   - Test bookmark server actions with mocked Supabase client for auth, validation, insert, and list flows.
2. Update `lib/metadata/fetcher.ts` so the 3s timeout budget is created once and shared across redirect hops.
3. Run full validation:
   - `npm test`
   - `npm run typecheck`
   - `npm run lint`
   - `npm run build`
4. Update Story 2.1 implementation artifact with review-fix notes and validation results.

## Non-goals
- Expanding SSRF protections beyond the current review scope.
- Streaming partial response bodies.
- Refactoring unrelated bookmark UI code.
