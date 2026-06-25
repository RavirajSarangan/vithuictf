import Image from "next/image";

export function MarketingFooterJaffnaStrip() {
  return (
    <div className="relative w-full overflow-hidden bg-icvf-navy-dark">
      <div className="relative aspect-[2172/724] w-full min-h-40 max-h-64 sm:min-h-48 sm:max-h-72 lg:min-h-56 lg:max-h-[22rem]">
        <Image
          src="/landing/jaffna-footer.webp"
          alt="Jaffna landmarks — Nallur Kovil, Jaffna Fort, and Sri Lankan heritage"
          fill
          className="object-cover object-bottom"
          sizes="100vw"
          quality={90}
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-icvf-navy-dark via-icvf-navy-dark/70 to-transparent sm:h-14"
      />
    </div>
  );
}
