export const HERO_SRI_LANKA_MAP_SRC = "/landing/sri-lanka-map.svg";

/** Sri Lanka map backdrop behind the founder portrait (plain img for stable SSR hydration). */
export function HeroFounderIslandMap() {
  return (
    <div className="hero-founder-map-backdrop" aria-hidden>
      <img
        src={HERO_SRI_LANKA_MAP_SRC}
        alt=""
        className="hero-founder-island-map-img"
        decoding="async"
        loading="lazy"
      />
    </div>
  );
}
