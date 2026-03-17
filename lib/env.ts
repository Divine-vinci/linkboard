const FALLBACK_APP_URL = "http://localhost:3000";

function normalizeAppUrl(value?: string | null) {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();

  if (!normalized) {
    return undefined;
  }

  return normalized.replace(/\/$/, "");
}

export function getAppUrl() {
  return (
    normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL) ??
    normalizeAppUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizeAppUrl(process.env.APP_URL) ??
    normalizeAppUrl(process.env.SITE_URL) ??
    FALLBACK_APP_URL
  );
}
