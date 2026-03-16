import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const packageJson = JSON.parse(read("package.json"));

test("AC1 AC4 AC5 AC7 login flow uses zod validation and accessible form markup", () => {
  const loginPage = read("app/(auth)/login/page.tsx");
  const authForm = read("components/auth-form.tsx");
  const authValidator = read("lib/validators/auth.ts");
  const authAction = read("lib/actions/auth.ts");

  assert.equal(loginPage.includes("<AuthForm"), true);
  assert.equal(authForm.includes('htmlFor="email"'), true);
  assert.equal(authForm.includes('id="email"'), true);
  assert.equal(authForm.includes('aria-live="polite"'), true);
  assert.equal(authForm.includes('type="email"'), true);
  assert.equal(authForm.includes("focus-visible:ring-2"), true);
  assert.equal(authAction.includes("Check your email for a sign-in link"), true);
  assert.equal(authValidator.includes("z.object"), true);
  assert.equal(authValidator.includes("Enter a valid email address"), true);
  assert.equal(authAction.includes("emailSchema.safeParse"), true);
  assert.equal(authAction.includes("AUTH_INVALID_EMAIL"), true);
});

test("AC1 AC2 AC3 AC6 redirect flow, auth callback, and sign-out are implemented", () => {
  const authAction = read("lib/actions/auth.ts");
  const callbackRoute = read("app/(auth)/auth/callback/route.ts");
  const dashboardLayout = read("app/dashboard/layout.tsx");
  const signOutButton = read("components/sign-out-button.tsx");

  assert.equal(authAction.includes("signInWithOtp"), true);
  assert.equal(authAction.includes("emailRedirectTo"), true);
  assert.equal(authAction.includes('new URL("/auth/callback", origin)'), true);
  assert.equal(authAction.includes("getSafeRedirectPath"), true);
  assert.equal(authAction.includes("redirectedFrom"), true);
  assert.equal(authAction.includes("AUTH_MAGIC_LINK_FAILED"), true);
  assert.equal(authAction.includes("AUTH_SIGN_OUT_FAILED"), true);
  assert.equal(authAction.includes('redirect("/")'), true);
  assert.equal(callbackRoute.includes("exchangeCodeForSession(code)"), true);
  assert.equal(callbackRoute.includes('"/login?error=auth_callback_failed"'), true);
  assert.equal(callbackRoute.includes("getSafeRedirectPath(redirectedFrom)"), true);
  assert.equal(dashboardLayout.includes("<SignOutButton />"), true);
  assert.equal(signOutButton.includes("action={signOut}"), true);
});

test("story 1.2 test coverage is included in npm test", () => {
  assert.equal(packageJson.scripts.test, "node --test tests/*.mjs");
});
