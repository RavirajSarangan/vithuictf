import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-icvf-accent">404</p>
      <h1 className="text-2xl font-bold text-icvf-navy">Page not found</h1>
      <p className="max-w-md text-sm text-icvf-text-light">
        The page you requested does not exist or may have moved.
      </p>
      <Link
        href="/"
        className="inline-flex h-9 items-center rounded-lg bg-icvf-navy px-4 text-sm font-semibold text-white hover:bg-icvf-navy-hover"
      >
        Back to home
      </Link>
    </div>
  );
}
