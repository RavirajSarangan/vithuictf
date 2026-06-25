"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center font-sans">
        <h1 className="text-2xl font-bold">Application error</h1>
        <p className="max-w-md text-sm text-zinc-600">
          {error.message || "A critical error occurred."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-icvf-navy px-4 py-2 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
