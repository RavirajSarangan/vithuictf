const CANVA_DESIGN_PATH =
  /^\/design\/([a-zA-Z0-9_-]+)(?:\/([a-zA-Z0-9_-]+))?\/(view|watch)\/?$/;

export interface ParsedCanvaDesignUrl {
  designId: string;
  designToken?: string;
  viewMode: "view" | "watch";
}

export function parseCanvaDesignUrl(urlOrPath: string): ParsedCanvaDesignUrl | null {
  const trimmed = urlOrPath.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (!parsed.hostname.endsWith("canva.com")) return null;
    const match = parsed.pathname.match(CANVA_DESIGN_PATH);
    if (!match) return null;
    return {
      designId: match[1]!,
      designToken: match[2],
      viewMode: (match[3] as "view" | "watch") ?? "view",
    };
  } catch {
    const match = trimmed.match(CANVA_DESIGN_PATH);
    if (!match) return null;
    return {
      designId: match[1]!,
      designToken: match[2],
      viewMode: (match[3] as "view" | "watch") ?? "view",
    };
  }
}

export function isValidCanvaDesignUrl(url: string): boolean {
  return parseCanvaDesignUrl(url) !== null;
}

function buildCanvaDesignPath(parsed: ParsedCanvaDesignUrl): string {
  const segment = parsed.designToken
    ? `${parsed.designId}/${parsed.designToken}`
    : parsed.designId;
  return `/design/${segment}/${parsed.viewMode}`;
}

export function toCanvaEmbedUrl(url: string): string | null {
  const parsed = parseCanvaDesignUrl(url);
  if (!parsed) return null;
  return `https://www.canva.com${buildCanvaDesignPath(parsed)}?embed`;
}

export function toCanvaViewUrl(url: string): string | null {
  const parsed = parseCanvaDesignUrl(url);
  if (!parsed) return null;
  return `https://www.canva.com${buildCanvaDesignPath(parsed)}`;
}

export function validateCanvaSlideUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new Error("Canva URL is required");
  }
  if (!isValidCanvaDesignUrl(trimmed)) {
    throw new Error(
      "Enter a valid Canva design link (e.g. https://www.canva.com/design/…/view)"
    );
  }
  return trimmed;
}
