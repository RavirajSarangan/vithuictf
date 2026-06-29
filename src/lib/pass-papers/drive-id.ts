const FOLDER_ID_PATTERN =
  /\/(?:drive\/)?folders\/([a-zA-Z0-9_-]+)|[?&]id=([a-zA-Z0-9_-]+)|\/file\/d\/([a-zA-Z0-9_-]+)/;

export function extractDriveResourceId(urlOrId: string): string | null {
  const trimmed = urlOrId.trim();
  if (!trimmed) return null;
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed) && !trimmed.includes("/")) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    const match = parsed.pathname.match(FOLDER_ID_PATTERN);
    if (match) {
      return match[1] ?? match[2] ?? match[3] ?? null;
    }
    const idParam = parsed.searchParams.get("id");
    if (idParam) return idParam;
  } catch {
    const match = trimmed.match(FOLDER_ID_PATTERN);
    if (match) return match[1] ?? match[2] ?? match[3] ?? null;
  }
  return null;
}

export function buildDriveFolderUrl(folderId: string): string {
  return `https://drive.google.com/drive/folders/${folderId}`;
}

export function buildDriveFileUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

export function buildDrivePreviewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

export function buildDriveDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}
