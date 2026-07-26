const DRIVE_FILE_ID_PATTERNS = [/\/file\/d\/([a-zA-Z0-9_-]+)/, /[?&]id=([a-zA-Z0-9_-]+)/];

/** Extracts the file ID from a Google Drive file share URL, e.g. .../file/d/<id>/view or ...?id=<id>. */
export function extractGoogleDriveFileId(url: string): string | null {
  for (const pattern of DRIVE_FILE_ID_PATTERNS) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

/** Embeddable Drive preview URL for an iframe. Falls back to the original URL if not a recognized Drive file link. */
export function toGoogleDrivePreviewUrl(url: string): string {
  const id = extractGoogleDriveFileId(url);
  return id ? `https://drive.google.com/file/d/${id}/preview` : url;
}

/** Direct-download Drive URL (served with Content-Disposition: attachment). Falls back to the original URL otherwise. */
export function toGoogleDriveDownloadUrl(url: string): string {
  const id = extractGoogleDriveFileId(url);
  return id ? `https://drive.google.com/uc?export=download&id=${id}` : url;
}
