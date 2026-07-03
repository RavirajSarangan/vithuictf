function isOpaqueProductionError(message: string): boolean {
  return (
    message.includes("An error occurred in the Server Components render") ||
    message.includes("digest property is included on this error instance")
  );
}

function readErrorMessage(error: unknown): string | null {
  if (error instanceof Error) {
    const message = error.message?.trim();
    if (message && !isOpaqueProductionError(message)) {
      return message;
    }
    return null;
  }

  if (typeof error === "string" && error.trim()) {
    const trimmed = error.trim();
    return isOpaqueProductionError(trimmed) ? null : trimmed;
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    for (const key of ["message", "error", "details", "hint"] as const) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) {
        const trimmed = value.trim();
        if (!isOpaqueProductionError(trimmed)) {
          return trimmed;
        }
      }
    }
  }

  return null;
}

/** Client-safe message for toasts and UI — replaces opaque production digest errors. */
export function getActionErrorMessage(error: unknown, fallback: string): string {
  return readErrorMessage(error) ?? fallback;
}

/** Normalize unknown failures into client-safe Error messages for server actions. */
export function toActionError(error: unknown, fallback: string): Error {
  return new Error(getActionErrorMessage(error, fallback));
}

export function rethrowActionError(error: unknown, fallback: string): never {
  throw toActionError(error, fallback);
}
