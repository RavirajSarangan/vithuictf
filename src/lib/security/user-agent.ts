/** Best-effort UA → human label for the admin session panel. Raw UA is stored regardless. */
export function parseUserAgent(userAgent: string | null | undefined): string {
  if (!userAgent) return "Unknown device";

  const ua = userAgent.toLowerCase();

  let browser = "Unknown browser";
  if (ua.includes("edg/")) browser = "Edge";
  else if (ua.includes("opr/") || ua.includes("opera")) browser = "Opera";
  else if (ua.includes("firefox/")) browser = "Firefox";
  else if (ua.includes("crios") || (ua.includes("chrome/") && !ua.includes("chromium")))
    browser = "Chrome";
  else if (ua.includes("fxios")) browser = "Firefox";
  else if (ua.includes("safari/") && !ua.includes("chrome")) browser = "Safari";

  let os = "Unknown OS";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) os = "iOS";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("mac os x")) os = "macOS";
  else if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("linux")) os = "Linux";

  return `${browser} on ${os}`;
}
