import type { PassPaperExamType } from "@/types";

export const DEFAULT_DRIVE_ROOT_URL =
  "https://drive.google.com/drive/folders/15nxxwVRxTv0nIMhm3Ubvl8CuNfD2Jn4o";

export type DriveSyncUnmatched = {
  driveName: string;
  driveUrl: string;
  reason: string;
};

export type DriveSyncReport = {
  scanned: number;
  created: number;
  updated: number;
  skipped: number;
  foldersEnsured: number;
  unmatched: DriveSyncUnmatched[];
};

export type DriveSyncOptions = {
  rootUrl: string;
  dryRun?: boolean;
  publish?: boolean;
  includeFiles?: boolean;
  examTypes?: PassPaperExamType[];
};

export function isGoogleDriveConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON?.trim() ||
      process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON_BASE64?.trim() ||
      process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_PATH?.trim()
  );
}
