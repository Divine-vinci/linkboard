# Execution Plan — Linkboard

## Goal
Build Linkboard: a personal bookmark manager with URL saving, tags, automatic page metadata fetch, tag/keyword search, simple dashboard UI, Supabase magic-link auth, and Next.js deployment on Vercel.

## Stack
- Next.js
- Supabase Auth + Postgres
- Vercel

## BMAD Flow
1. create-product-brief
2. create-prd
3. create-architecture
4. create-epics-and-stories
5. check-implementation-readiness
6. sprint-planning
7. Phase 4 story loop
8. Stop and wait for /deploy

## Constraints
- Keep UI simple
- Favor fast MVP architecture
- Search should work across tags, title, URL, and metadata text
- Metadata fetch should handle title, description, favicon, and Open Graph image when available
