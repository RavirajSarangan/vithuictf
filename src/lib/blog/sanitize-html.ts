const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "s",
  "h2", "h3", "h4", "ul", "ol", "li", "blockquote",
  "a", "img", "figure", "figcaption", "span", "div",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
  img: new Set(["src", "alt", "title", "width", "height"]),
  "*": new Set(["class"]),
};

function isSafeUrl(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  return (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("mailto:")
  );
}

function sanitizeAttributes(tag: string, attrs: string): string {
  const allowedForTag = ALLOWED_ATTRS[tag] ?? new Set<string>();
  const allowedGlobal = ALLOWED_ATTRS["*"] ?? new Set<string>();
  const parts: string[] = [];

  const attrRegex = /([a-zA-Z_:][\w:.-]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let match: RegExpExecArray | null;

  while ((match = attrRegex.exec(attrs)) !== null) {
    const name = match[1].toLowerCase();
    const value = match[3] ?? match[4] ?? match[5] ?? "";

    if (name.startsWith("on")) continue;
    if (!allowedForTag.has(name) && !allowedGlobal.has(name)) continue;
    if ((name === "href" || name === "src") && !isSafeUrl(value)) continue;

    const safeValue = value.replace(/"/g, "&quot;");
    parts.push(`${name}="${safeValue}"`);
  }

  if (tag === "a" && parts.some((p) => p.startsWith('target="'))) {
    if (!parts.some((p) => p.startsWith('rel="'))) {
      parts.push('rel="noopener noreferrer"');
    }
  }

  return parts.length > 0 ? ` ${parts.join(" ")}` : "";
}

export function sanitizeBlogHtml(html: string): string {
  if (!html.trim()) return "";

  return html.replace(/<\/?([a-zA-Z][\w-]*)\b([^>]*)>/g, (full, rawTag: string, attrs: string) => {
    const tag = rawTag.toLowerCase();

    if (tag === "script" || tag === "style" || tag === "iframe" || tag === "object" || tag === "embed") {
      return "";
    }

    if (full.startsWith("</")) {
      return ALLOWED_TAGS.has(tag) ? `</${tag}>` : "";
    }

    if (!ALLOWED_TAGS.has(tag)) return "";

    if (tag === "img" && !/\ssrc\s*=/.test(attrs)) return "";

    return `<${tag}${sanitizeAttributes(tag, attrs)}>`;
  });
}
