export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-24 text-foreground">
      <section className="w-full max-w-2xl space-y-4 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Linkboard
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Save, tag, and find links without losing context.
        </h1>
        <p className="text-base leading-7 text-muted-foreground sm:text-lg">
          Foundation scaffold complete. Authentication, dashboard, metadata capture,
          and search ship in subsequent stories.
        </p>
      </section>
    </main>
  );
}
