type MetadataResult = {
  title: string | null;
  description: string | null;
  favicon_url: string | null;
  og_image_url: string | null;
};

const USER_AGENT = "Mozilla/5.0 (compatible; LinkboardBot/1.0)";
const MAX_REDIRECTS = 3;
const MAX_HEAD_CHARS = 50_000;

function normalizeValue(value: string | null | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function getHeadFragment(html: string) {
  const limitedHtml = html.slice(0, MAX_HEAD_CHARS);
  const headEndIndex = limitedHtml.search(/<\/head>/i);

  if (headEndIndex === -1) {
    return limitedHtml;
  }

  return limitedHtml.slice(0, headEndIndex);
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function extractTagContent(head: string, pattern: RegExp) {
  const match = head.match(pattern);

  if (!match?.[1]) {
    return null;
  }

  return normalizeValue(decodeHtmlEntities(match[1]));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractMetaContent(head: string, attribute: "name" | "property", key: string) {
  const escapedKey = escapeRegExp(key);
  const patterns = [
    new RegExp(
      `<meta[^>]*${attribute}=["']${escapedKey}["'][^>]*content=["']([^"']*)["'][^>]*>`,
      "i",
    ),
    new RegExp(
      `<meta[^>]*content=["']([^"']*)["'][^>]*${attribute}=["']${escapedKey}["'][^>]*>`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const content = extractTagContent(head, pattern);

    if (content) {
      return content;
    }
  }

  return null;
}

function extractLinkHref(head: string, relValue: string) {
  const escapedRel = escapeRegExp(relValue);
  const patterns = [
    new RegExp(
      `<link[^>]*rel=["'][^"']*${escapedRel}[^"']*["'][^>]*href=["']([^"']*)["'][^>]*>`,
      "i",
    ),
    new RegExp(
      `<link[^>]*href=["']([^"']*)["'][^>]*rel=["'][^"']*${escapedRel}[^"']*["'][^>]*>`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const href = extractTagContent(head, pattern);

    if (href) {
      return href;
    }
  }

  return null;
}

function toAbsoluteUrl(resourceUrl: string | null, baseUrl: string) {
  if (!resourceUrl) {
    return null;
  }

  try {
    return new URL(resourceUrl, baseUrl).toString();
  } catch {
    return null;
  }
}

async function fetchWithRedirects(
  url: string,
  signal: AbortSignal,
  redirects = 0,
): Promise<Response | null> {
  if (redirects > MAX_REDIRECTS) {
    return null;
  }

  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": USER_AGENT,
      },
      redirect: "manual",
      signal,
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");

      if (!location) {
        return null;
      }

      const nextUrl = new URL(location, url).toString();

      return fetchWithRedirects(nextUrl, signal, redirects + 1);
    }

    if (!response.ok) {
      return null;
    }

    return response;
  } catch {
    return null;
  }
}

async function readLimitedBody(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) {
    return (await response.text()).slice(0, maxBytes);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let result = "";

  try {
    while (result.length < maxBytes) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      result += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.cancel().catch(() => {});
  }

  return result.slice(0, maxBytes);
}

export async function fetchUrlMetadata(url: string): Promise<MetadataResult | null> {
  const signal = AbortSignal.timeout(3000);
  const response = await fetchWithRedirects(url, signal);

  if (!response) {
    return null;
  }

  try {
    const html = await readLimitedBody(response, MAX_HEAD_CHARS);
    const resolvedUrl = response.url || url;
    const head = getHeadFragment(html);
    const title = extractTagContent(head, /<title[^>]*>([^<]*)<\/title>/i);
    const description = extractMetaContent(head, "name", "description");
    const faviconHref =
      extractLinkHref(head, "icon") ??
      extractLinkHref(head, "shortcut icon") ??
      "/favicon.ico";
    const ogImageHref = extractMetaContent(head, "property", "og:image");

    return {
      title,
      description,
      favicon_url: toAbsoluteUrl(faviconHref, resolvedUrl),
      og_image_url: toAbsoluteUrl(ogImageHref, resolvedUrl),
    };
  } catch {
    return null;
  }
}
