/** ICT hero background — lite layer on all devices; SVG detail from sm/md up. */
export function HeroDecor() {
  const gold = "rgba(245,166,35,0.35)";
  const goldSoft = "rgba(245,166,35,0.18)";
  const navy = "rgba(39, 52, 97, 0.28)";
  const navySoft = "rgba(39, 52, 97, 0.14)";
  const goldFill = "rgba(245,166,35,0.55)";
  const navyFill = "rgba(39, 52, 97, 0.35)";

  const binaryBits = [
    { char: "1", left: "12%", delay: "0s", duration: "13s" },
    { char: "0", left: "78%", delay: "2s", duration: "15s" },
    { char: "1", left: "48%", delay: "5s", duration: "14s" },
  ];

  const binaryBitsDesktop = [
    { char: "0", left: "18%", delay: "2.5s", duration: "16s" },
    { char: "0", left: "84%", delay: "4s", duration: "15s" },
    { char: "1", left: "58%", delay: "3s", duration: "17s" },
  ];

  return (
    <div className="hero-decor-layer pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="hero-ict-grid absolute inset-0 opacity-[0.4]" />
      <div className="hero-ict-glow absolute inset-0" />
      <div className="hero-theme-orb hero-theme-orb-gold" />
      <div className="hero-theme-orb hero-theme-orb-navy" />

      <div className="hero-ict-scan absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-transparent via-icvf-accent/8 to-transparent" />

      {binaryBits.map((bit, i) => (
        <span
          key={`m-${i}`}
          className="hero-binary-bit absolute bottom-[12%] font-mono text-[11px] font-semibold text-icvf-navy/18 sm:hidden"
          style={{
            left: bit.left,
            animationDelay: bit.delay,
            animationDuration: bit.duration,
          }}
        >
          {bit.char}
        </span>
      ))}

      <div className="hero-decor-detail hidden sm:contents">
        {binaryBitsDesktop.map((bit, i) => (
          <span
            key={`d-${i}`}
            className="hero-binary-bit absolute bottom-[10%] font-mono text-xs font-semibold text-icvf-navy/20"
            style={{
              left: bit.left,
              animationDelay: bit.delay,
              animationDuration: bit.duration,
            }}
          >
            {bit.char}
          </span>
        ))}

        <svg
          viewBox="0 0 240 180"
          className="hero-float-slow absolute -left-4 top-[6%] hidden w-[min(34vw,200px)] opacity-50 md:left-[1%] md:block md:w-[220px] md:opacity-55"
          fill="none"
        >
          <path
            d="M20 40 H100 V20 H140 V60 H200"
            stroke={gold}
            strokeWidth="1.5"
            strokeLinecap="round"
            className="hero-circuit-flow"
          />
          <path
            d="M20 90 H70 V120 H120 V90 H200"
            stroke={navy}
            strokeWidth="1.5"
            strokeLinecap="round"
            className="hero-circuit-flow"
            style={{ animationDelay: "0.8s" }}
          />
          <path d="M40 120 V160 H180" stroke={goldSoft} strokeWidth="1.2" strokeLinecap="round" />
          {[
            [20, 40],
            [100, 20],
            [140, 60],
            [200, 60],
            [70, 90],
            [120, 120],
            [40, 160],
            [180, 160],
          ].map(([cx, cy], i) => (
            <circle
              key={`${cx}-${cy}`}
              cx={cx}
              cy={cy}
              r="4"
              fill={navyFill}
              stroke={gold}
              strokeWidth="1"
              className="hero-node-pulse"
              style={{ animationDelay: `${i * 0.35}s` }}
            />
          ))}
          <rect
            x="150"
            y="24"
            width="28"
            height="20"
            rx="3"
            stroke={gold}
            strokeWidth="1.2"
            fill="rgba(245,166,35,0.06)"
          />
          <path d="M158 34 H170 M163 29 V39" stroke={goldSoft} strokeWidth="1" />
        </svg>

        <svg
          viewBox="0 0 120 120"
          className="hero-float absolute bottom-[18%] left-[4%] hidden w-[88px] opacity-40 md:block md:w-[104px] md:opacity-45"
          fill="none"
        >
          <rect
            x="28"
            y="28"
            width="64"
            height="64"
            rx="8"
            stroke={navy}
            strokeWidth="1.5"
            fill="rgba(39,52,97,0.04)"
          />
          <rect
            x="40"
            y="40"
            width="40"
            height="40"
            rx="4"
            stroke={gold}
            strokeWidth="1.2"
            fill="rgba(245,166,35,0.05)"
          />
          {Array.from({ length: 6 }, (_, i) => (
            <g key={i}>
              <line
                x1={20 + i * 16}
                y1="20"
                x2={20 + i * 16}
                y2="28"
                stroke={goldSoft}
                strokeWidth="1.2"
              />
              <line
                x1={20 + i * 16}
                y1="92"
                x2={20 + i * 16}
                y2="100"
                stroke={goldSoft}
                strokeWidth="1.2"
              />
              <line
                x1="20"
                y1={20 + i * 16}
                x2="28"
                y2={20 + i * 16}
                stroke={navySoft}
                strokeWidth="1.2"
              />
              <line
                x1="92"
                y1={20 + i * 16}
                x2="100"
                y2={20 + i * 16}
                stroke={navySoft}
                strokeWidth="1.2"
              />
            </g>
          ))}
          <circle cx="60" cy="60" r="6" fill={goldFill} className="hero-node-pulse" />
        </svg>

        <svg
          viewBox="0 0 220 170"
          className="hero-float-slow absolute bottom-[14%] right-[8%] hidden w-[140px] opacity-35 md:block lg:right-[12%] lg:w-[170px] lg:opacity-40"
          fill="none"
        >
          <line x1="60" y1="60" x2="110" y2="30" stroke={gold} strokeWidth="1.5" className="hero-circuit-flow" />
          <line
            x1="110"
            y1="30"
            x2="160"
            y2="60"
            stroke={gold}
            strokeWidth="1.5"
            className="hero-circuit-flow"
            style={{ animationDelay: "0.5s" }}
          />
          <line
            x1="160"
            y1="60"
            x2="160"
            y2="110"
            stroke={gold}
            strokeWidth="1.5"
            className="hero-circuit-flow"
            style={{ animationDelay: "1s" }}
          />
          <line x1="160" y1="110" x2="110" y2="140" stroke={gold} strokeWidth="1.5" />
          <line x1="110" y1="140" x2="60" y2="110" stroke={gold} strokeWidth="1.5" />
          <line x1="60" y1="110" x2="60" y2="60" stroke={gold} strokeWidth="1.5" />
          <line x1="110" y1="85" x2="110" y2="30" stroke={gold} strokeWidth="1.5" />
          <line x1="110" y1="85" x2="160" y2="110" stroke={gold} strokeWidth="1.5" />
          <line x1="110" y1="85" x2="60" y2="110" stroke={gold} strokeWidth="1.5" />
          {[
            [60, 60],
            [110, 30],
            [160, 60],
            [160, 110],
            [110, 140],
            [60, 110],
          ].map(([cx, cy], i) => (
            <circle
              key={`${cx}-${cy}`}
              cx={cx}
              cy={cy}
              r="7"
              fill={navyFill}
              stroke={gold}
              strokeWidth="1"
              className="hero-node-pulse"
              style={{ animationDelay: `${i * 0.45}s` }}
            />
          ))}
          <circle
            cx="110"
            cy="85"
            r="10"
            fill={goldFill}
            stroke={gold}
            strokeWidth="1"
            className="hero-node-pulse"
          />
        </svg>

        <svg
          viewBox="0 0 160 80"
          className="hero-float absolute right-[14%] top-[22%] hidden w-[120px] opacity-30 lg:block"
          fill="none"
        >
          <path
            d="M48 20 C28 20 20 30 20 40 C20 50 28 60 48 60"
            stroke={navy}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M112 20 C132 20 140 30 140 40 C140 50 132 60 112 60"
            stroke={gold}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <text
            x="72"
            y="46"
            fill={navySoft}
            fontSize="14"
            fontFamily="ui-monospace, monospace"
            fontWeight="600"
            className="hero-code-blink"
          >
            ICT
          </text>
        </svg>

        <svg
          viewBox="0 0 100 80"
          className="hero-float-slow absolute left-[38%] top-[12%] hidden w-[72px] opacity-30 xl:block"
          fill="none"
        >
          <path
            d="M10 58 Q50 18 90 58"
            stroke={goldSoft}
            strokeWidth="1.5"
            strokeLinecap="round"
            className="hero-code-blink"
          />
          <path
            d="M22 58 Q50 30 78 58"
            stroke={gold}
            strokeWidth="1.5"
            strokeLinecap="round"
            className="hero-code-blink"
            style={{ animationDelay: "0.6s" }}
          />
          <path
            d="M34 58 Q50 42 66 58"
            stroke={navy}
            strokeWidth="1.5"
            strokeLinecap="round"
            className="hero-code-blink"
            style={{ animationDelay: "1.2s" }}
          />
          <circle cx="50" cy="60" r="4" fill={goldFill} className="hero-node-pulse" />
        </svg>

        <div className="hero-ict-snippet hero-ict-snippet--alt absolute bottom-[32%] left-[2%] hidden select-none font-mono text-[10px] leading-[1.65] tracking-[0.1em] text-icvf-accent/15 md:block">
          <p className="hero-code-blink">{`{ ICT }`}</p>
          <p className="hero-code-blink" style={{ animationDelay: "0.5s" }}>{`</>`}</p>
          <p className="hero-code-blink" style={{ animationDelay: "1s" }}>
            HTML/CSS
          </p>
          <p className="hero-code-blink" style={{ animationDelay: "1.5s" }}>
            Python
          </p>
        </div>

        <svg
          viewBox="0 0 120 120"
          className="hero-float absolute bottom-[6%] right-[20%] hidden w-[96px] opacity-30 md:block"
          fill="none"
        >
          <g className="hero-orbit-spin">
            <ellipse
              cx="60"
              cy="60"
              rx="52"
              ry="48"
              stroke={gold}
              strokeWidth="1.5"
              fill="rgba(245,166,35,0.04)"
              strokeDasharray="4 8"
            />
            <circle cx="60" cy="12" r="3" fill={goldFill} />
            <circle cx="108" cy="60" r="3" fill={navyFill} />
          </g>
          <ellipse cx="60" cy="60" rx="28" ry="24" stroke={navy} strokeWidth="1" fill="none" />
          <circle cx="60" cy="60" r="4" fill={goldFill} className="hero-node-pulse" />
        </svg>

        <svg
          viewBox="0 0 180 100"
          className="hero-float-slow absolute right-[2%] top-[8%] hidden w-[130px] opacity-25 lg:block"
          fill="none"
        >
          <path
            d="M10 50 H60 V20 H120 V50 H170"
            stroke={navy}
            strokeWidth="1.2"
            strokeLinecap="round"
            className="hero-circuit-flow"
          />
          <path
            d="M40 50 V80 H140"
            stroke={goldSoft}
            strokeWidth="1.2"
            strokeLinecap="round"
            className="hero-circuit-flow"
            style={{ animationDelay: "1.2s" }}
          />
          <circle cx="60" cy="20" r="3" fill={goldFill} className="hero-node-pulse" />
          <circle
            cx="120"
            cy="50"
            r="3"
            fill={navyFill}
            className="hero-node-pulse"
            style={{ animationDelay: "0.7s" }}
          />
          <circle
            cx="140"
            cy="80"
            r="3"
            fill={goldFill}
            className="hero-node-pulse"
            style={{ animationDelay: "1.4s" }}
          />
        </svg>
      </div>
    </div>
  );
}
