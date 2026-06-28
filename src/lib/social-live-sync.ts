/** Platforms that support automatic follower count sync on the tracking dashboard. */
export const LIVE_SYNC_PLATFORM_SLUGS = ["youtube", "facebook", "linkedin"] as const;

export type LiveSyncPlatformSlug = (typeof LIVE_SYNC_PLATFORM_SLUGS)[number];

export const LIVE_SYNC_INTERVAL_MS = 5 * 60 * 1000;

export interface LiveSyncPlatformState {
  lastSynced: string | null;
  syncing: boolean;
}

export type LiveSyncState = Record<LiveSyncPlatformSlug, LiveSyncPlatformState>;

export function createInitialLiveSyncState(): LiveSyncState {
  return {
    youtube: { lastSynced: null, syncing: false },
    facebook: { lastSynced: null, syncing: false },
    linkedin: { lastSynced: null, syncing: false },
  };
}

export function isLiveSyncPlatform(
  slug: string | undefined,
  configuredSlugs?: readonly string[]
): slug is LiveSyncPlatformSlug {
  const allowed = configuredSlugs ?? LIVE_SYNC_PLATFORM_SLUGS;
  return allowed.includes(slug as LiveSyncPlatformSlug);
}
