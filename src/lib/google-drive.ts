import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { Readable } from "stream";
import type { drive_v3 } from "googleapis";

export type DriveFileNode = {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string | null;
};

/** MIME types accepted for direct pass-paper uploads. */
export const ALLOWED_UPLOAD_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

type GoogleApisModule = typeof import("googleapis");

let googleApisModule: GoogleApisModule | null = null;

async function loadGoogleApis(): Promise<GoogleApisModule> {
  if (!googleApisModule) {
    googleApisModule = await import("googleapis");
  }
  return googleApisModule;
}

function parseServiceAccountJson(raw: string, source: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error(
      `Invalid ${source}. Paste valid JSON or use GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON_BASE64 on Vercel.`
    );
  }
}

function loadServiceAccountCredentials(): Record<string, unknown> {
  const jsonEnv = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON?.trim();
  if (jsonEnv) {
    return parseServiceAccountJson(jsonEnv, "GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON");
  }

  const base64Env = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON_BASE64?.trim();
  if (base64Env) {
    const decoded = Buffer.from(base64Env, "base64").toString("utf8");
    return parseServiceAccountJson(decoded, "GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON_BASE64");
  }

  const pathEnv = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_PATH?.trim();
  if (pathEnv) {
    const absolute = resolve(process.cwd(), pathEnv);
    if (!existsSync(absolute)) {
      throw new Error(`GOOGLE_DRIVE_SERVICE_ACCOUNT_PATH not found: ${absolute}`);
    }
    return parseServiceAccountJson(
      readFileSync(absolute, "utf8"),
      "GOOGLE_DRIVE_SERVICE_ACCOUNT_PATH file"
    );
  }

  throw new Error(
    "Google Drive credentials missing. Set GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON, GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON_BASE64, or GOOGLE_DRIVE_SERVICE_ACCOUNT_PATH."
  );
}

export async function createDriveClient(): Promise<drive_v3.Drive> {
  const { google } = await loadGoogleApis();
  const credentials = loadServiceAccountCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  return google.drive({ version: "v3", auth });
}

/** Drive client with write scope, used for admin uploads into a Shared Drive folder. */
export async function createDriveWriteClient(): Promise<drive_v3.Drive> {
  const { google } = await loadGoogleApis();
  const credentials = loadServiceAccountCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  return google.drive({ version: "v3", auth });
}

/**
 * Upload a file into a Drive folder and make it readable by anyone with the link.
 * The parent must live in a Shared Drive — service accounts have no My Drive quota.
 */
export async function uploadFileToDrive(options: {
  name: string;
  mimeType: string;
  buffer: Buffer;
  parentFolderId: string;
}): Promise<{ fileId: string; webViewLink: string | null }> {
  const drive = await createDriveWriteClient();

  let created;
  try {
    created = await drive.files.create({
      requestBody: {
        name: options.name,
        parents: [options.parentFolderId],
      },
      media: {
        mimeType: options.mimeType,
        body: Readable.from(options.buffer),
      },
      fields: "id, webViewLink",
      supportsAllDrives: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes("storage quota")) {
      throw new Error(
        "Upload failed: the Drive service account has no storage quota. The upload folder must be inside a Shared Drive with the service account added as a Content Manager."
      );
    }
    throw new Error(`Drive upload failed: ${message}`);
  }

  const fileId = created.data.id;
  if (!fileId) {
    throw new Error("Drive upload failed: no file ID returned");
  }

  await drive.permissions.create({
    fileId,
    requestBody: { type: "anyone", role: "reader" },
    supportsAllDrives: true,
  });

  return { fileId, webViewLink: created.data.webViewLink ?? null };
}

export async function listDriveChildren(
  drive: drive_v3.Drive,
  parentId: string
): Promise<DriveFileNode[]> {
  const results: DriveFileNode[] = [];
  let pageToken: string | undefined;

  do {
    const response = await drive.files.list({
      q: `'${parentId}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType, webViewLink)",
      pageSize: 200,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    for (const file of response.data.files ?? []) {
      if (!file.id || !file.name) continue;
      results.push({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType ?? "application/octet-stream",
        webViewLink: file.webViewLink ?? null,
      });
    }

    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken);

  results.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  return results;
}

export function isDriveFolder(mimeType: string): boolean {
  return mimeType === "application/vnd.google-apps.folder";
}

export function isPdfFile(node: DriveFileNode): boolean {
  const name = node.name.toLowerCase();
  return node.mimeType.includes("pdf") || name.endsWith(".pdf");
}
