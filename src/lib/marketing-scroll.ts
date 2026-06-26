/** Shared scroll helpers for the marketing homepage. */

const MARKETING_HEADER_OFFSET_FALLBACK = 72;
const MARKETING_HEADER_GAP_PX = 8;
const HASH_SCROLL_MAX_ATTEMPTS = 24;
const HASH_SCROLL_RETRY_MS = 100;

/** Height of the fixed marketing header + small gap (measured live when possible). */
export function getMarketingHeaderOffset(): number {
  if (typeof document === "undefined") return MARKETING_HEADER_OFFSET_FALLBACK;

  const header = document.querySelector<HTMLElement>("[data-marketing-header]");
  if (!header) return MARKETING_HEADER_OFFSET_FALLBACK;

  const rect = header.getBoundingClientRect();
  return Math.ceil(rect.bottom) + MARKETING_HEADER_GAP_PX;
}

export function applyMarketingScrollPadding() {
  if (typeof document === "undefined") return;
  const offset = getMarketingHeaderOffset();
  document.documentElement.style.setProperty("--marketing-header-offset", `${offset}px`);
  document.documentElement.style.scrollPaddingTop = `${offset}px`;
}

/** Smooth-scroll to a homepage section; works when already on `/`. */
export function scrollToMarketingSection(
  hash: string,
  behavior: ScrollBehavior = "smooth"
): boolean {
  const id = hash.replace(/^#/, "");
  if (!id || typeof window === "undefined") return false;

  const el = document.getElementById(id);
  if (!el) return false;

  applyMarketingScrollPadding();
  el.scrollIntoView({ behavior, block: "start" });

  const nextHash = `#${id}`;
  if (window.location.hash !== nextHash) {
    window.history.replaceState(null, "", nextHash);
  }

  return true;
}

export function getMarketingSectionHref(hash: string, pathname: string) {
  if (!hash.startsWith("#")) return hash;
  return pathname === "/" ? hash : `/${hash}`;
}

export function handleMarketingSectionClick(
  event: React.MouseEvent<HTMLAnchorElement>,
  href: string,
  pathname: string
) {
  const hash = href.startsWith("#")
    ? href
    : href.includes("#")
      ? `#${href.split("#")[1]}`
      : "";

  if (!hash) return;

  if (pathname === "/") {
    if (scrollToMarketingSection(hash)) {
      event.preventDefault();
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    }
    return;
  }

  if (!href.startsWith("/")) {
    event.preventDefault();
    window.location.assign(getMarketingSectionHref(hash, pathname));
  }
}

/** Scroll to the URL hash after landing on the homepage (e.g. /#apply). */
export function scrollToMarketingHashOnLoad(pathname: string) {
  if (pathname !== "/" || typeof window === "undefined") return;

  const hash = window.location.hash;
  if (!hash) return;

  applyMarketingScrollPadding();

  const tryScroll = (attempt = 0) => {
    if (scrollToMarketingSection(hash, "auto") || attempt >= HASH_SCROLL_MAX_ATTEMPTS) {
      return;
    }
    window.setTimeout(() => tryScroll(attempt + 1), HASH_SCROLL_RETRY_MS);
  };

  requestAnimationFrame(() => tryScroll());
}
