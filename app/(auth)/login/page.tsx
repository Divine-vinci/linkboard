import { AuthForm } from "@/components/auth-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirectedFrom?: string }>;
}) {
  const { error, redirectedFrom } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-24 text-foreground">
      <section className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Linkboard
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Sign in with magic link</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Enter your email and we’ll send you a secure sign-in link.
          </p>
        </div>
        <AuthForm callbackError={error} redirectedFrom={redirectedFrom} />
      </section>
    </main>
  );
}
