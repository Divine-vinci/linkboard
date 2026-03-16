import { NextResponse } from "next/server";

import { fetchUrlMetadata } from "@/lib/metadata/fetcher";
import { urlSchema } from "@/lib/validators/bookmark";

const emptyMetadata = {
  title: null,
  description: null,
  favicon_url: null,
  og_image_url: null,
};

function isPrivateHostname(hostname: string) {
  const normalizedHostname = hostname.toLowerCase();

  if (normalizedHostname === "localhost" || normalizedHostname.endsWith(".localhost")) {
    return true;
  }

  if (normalizedHostname === "127.0.0.1" || normalizedHostname === "0.0.0.0" || normalizedHostname === "::1") {
    return true;
  }

  if (/^10\./.test(normalizedHostname)) {
    return true;
  }

  if (/^192\.168\./.test(normalizedHostname)) {
    return true;
  }

  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(normalizedHostname)) {
    return true;
  }

  if (/^169\.254\./.test(normalizedHostname)) {
    return true;
  }

  if (/^100\.(6[4-9]|[7-9]\d|1[0-1]\d|12[0-7])\./.test(normalizedHostname)) {
    return true;
  }

  if (/^f[cd]/.test(normalizedHostname) || /^fe[89ab]/.test(normalizedHostname)) {
    return true;
  }

  return false;
}

function isAllowedUrl(input: string) {
  try {
    const parsedUrl = new URL(input);

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return false;
    }

    return !isPrivateHostname(parsedUrl.hostname);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsedUrl = urlSchema.safeParse(body?.url);

  if (!parsedUrl.success || !isAllowedUrl(parsedUrl.data)) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Enter a valid public http(s) URL",
        },
      },
      { status: 400 },
    );
  }

  const metadata = await fetchUrlMetadata(parsedUrl.data);

  if (!metadata) {
    return NextResponse.json(emptyMetadata, { status: 200 });
  }

  return NextResponse.json(metadata, { status: 200 });
}
