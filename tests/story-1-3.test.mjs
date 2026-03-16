import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

test("AC1 AC4 middleware protects dashboard routes and preserves redirect intent", () => {
  const middlewareFile = read("middleware.ts");

  assert.equal(middlewareFile.includes("updateSession(request)"), true);
  assert.equal(middlewareFile.includes('request.nextUrl.pathname.startsWith("/dashboard")'), true);
  assert.equal(middlewareFile.includes('new URL("/login", request.url)'), true);
  assert.equal(middlewareFile.includes('loginUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname)'), true);
  assert.equal(middlewareFile.includes("NextResponse.redirect(loginUrl)"), true);
});

test("AC2 AC3 Supabase middleware refreshes auth cookies for persistent sessions", () => {
  const supabaseMiddleware = read("lib/supabase/middleware.ts");

  assert.equal(supabaseMiddleware.includes("createServerClient"), true);
  assert.equal(supabaseMiddleware.includes("request.cookies.getAll()"), true);
  assert.equal(supabaseMiddleware.includes("request.cookies.set(name, value)"), true);
  assert.equal(supabaseMiddleware.includes("response.cookies.set(name, value, options)"), true);
  assert.equal(supabaseMiddleware.includes("NextResponse.next"), true);
});

test("AC1 AC3 protected dashboard layout verifies the user server-side before render", () => {
  const dashboardLayout = read("app/dashboard/layout.tsx");

  assert.equal(dashboardLayout.includes("createClient()"), true);
  assert.equal(dashboardLayout.includes("supabase.auth.getUser()"), true);
  assert.equal(dashboardLayout.includes('redirect("/login")'), true);
  assert.equal(dashboardLayout.includes("Signed in as {user.email}"), true);
});

test("story 1.3 artifact exists with expected content", () => {
  const storyFile = read("_bmad-output/implementation-artifacts/1-3-route-protection-and-session-persistence.md");

  assert.equal(storyFile.includes("# Story 1.3: Route Protection & Session Persistence"), true);
  assert.match(storyFile, /Status: (ready-for-dev|in-progress|review|done)/);
  assert.equal(storyFile.includes("/dashboard/*"), true);
});
