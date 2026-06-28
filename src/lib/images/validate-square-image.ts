const SQUARE_TOLERANCE = 0.02;

export function isSquareAspectRatio(width: number, height: number): boolean {
  if (width <= 0 || height <= 0) return false;
  const ratio = width / height;
  return Math.abs(ratio - 1) <= SQUARE_TOLERANCE;
}

export async function validateSquareImageFile(file: File): Promise<void> {
  if (file.type === "image/svg+xml") return;

  const objectUrl = URL.createObjectURL(file);
  try {
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error("Could not read image dimensions"));
      img.src = objectUrl;
    });

    if (!isSquareAspectRatio(dimensions.width, dimensions.height)) {
      throw new Error(
        `Course image must be square (1:1). Yours is ${dimensions.width}×${dimensions.height}px.`
      );
    }
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
