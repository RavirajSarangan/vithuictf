import { BRAND } from "@/lib/constants";

function parseLinkedInVanityName(url: string): string | null {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/company\/([^/]+)/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function getLinkedInVanityName(): string {
  const fromEnv = process.env.LINKEDIN_ORGANIZATION_VANITY?.trim();
  if (fromEnv) return fromEnv.replace(/^\/+|\/+$/g, "");

  const fromUrl = parseLinkedInVanityName(BRAND.contact.social.linkedin);
  return fromUrl ?? "ictfofficial";
}

export function getLinkedInOrganizationId(): string | null {
  const id = process.env.LINKEDIN_ORGANIZATION_ID?.trim();
  return id || null;
}

function linkedInHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    "X-Restli-Protocol-Version": "2.0.0",
  };
}

interface LinkedInOrganizationsResponse {
  elements?: Array<{ id: number }>;
  error?: { message?: string };
}

interface LinkedInNetworkSizeResponse {
  firstDegreeSize?: number;
  error?: { message?: string };
}

async function resolveLinkedInOrganizationId(accessToken: string): Promise<string> {
  const fromEnv = getLinkedInOrganizationId();
  if (fromEnv) return fromEnv;

  const vanityName = getLinkedInVanityName();
  const params = new URLSearchParams({
    q: "vanityName",
    vanityName,
  });

  const response = await fetch(`https://api.linkedin.com/v2/organizations?${params.toString()}`, {
    headers: linkedInHeaders(accessToken),
    cache: "no-store",
  });

  const data = (await response.json()) as LinkedInOrganizationsResponse;
  if (!response.ok) {
    throw new Error(data.error?.message ?? `LinkedIn organization lookup failed (${response.status})`);
  }

  const orgId = data.elements?.[0]?.id;
  if (!orgId) {
    throw new Error(
      `LinkedIn company "${vanityName}" not found. Set LINKEDIN_ORGANIZATION_ID in environment variables.`
    );
  }

  return String(orgId);
}

export async function fetchLinkedInFollowerCount(): Promise<number> {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    throw new Error(
      "LinkedIn access token is not configured. Add LINKEDIN_ACCESS_TOKEN to .env.local (LinkedIn Developer app with organization scopes)."
    );
  }

  const organizationId = await resolveLinkedInOrganizationId(accessToken);
  const urn = encodeURIComponent(`urn:li:organization:${organizationId}`);
  const params = new URLSearchParams({ edgeType: "CompanyFollowedByMember" });

  const response = await fetch(
    `https://api.linkedin.com/v2/networkSizes/${urn}?${params.toString()}`,
    {
      headers: linkedInHeaders(accessToken),
      cache: "no-store",
    }
  );

  const data = (await response.json()) as LinkedInNetworkSizeResponse;
  if (!response.ok) {
    throw new Error(data.error?.message ?? `LinkedIn API error (${response.status})`);
  }

  const count = data.firstDegreeSize;
  if (count === undefined || !Number.isFinite(count) || count < 0) {
    throw new Error(
      "LinkedIn did not return a follower count. Check organization permissions (r_organization_social)."
    );
  }

  return count;
}

export function isLinkedInLiveSyncConfigured(): boolean {
  return Boolean(process.env.LINKEDIN_ACCESS_TOKEN?.trim());
}
