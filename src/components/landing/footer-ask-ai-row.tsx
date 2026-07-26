"use client";

import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { useMarketingText } from "@/hooks/use-marketing-text";

/**
 * Official brand marks, sourced from the CC0-licensed "SVG Logos" project
 * (github.com/gilbarbara/logos). OpenAI and Grok ship with no brand color in
 * that source (plain black), so they use currentColor to stay legible on the
 * footer's dark background; Claude and Perplexity keep their true brand hex.
 */
function OpenAiIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 126" className={className} fill="currentColor" aria-hidden>
      <path d="M365.131 49.074c-7.537 0-12.917 2.575-15.557 7.45l-1.42 2.64v-8.819H335.89v53.61h12.901V72.06c0-7.62 4.142-11.991 11.356-11.991c6.88 0 10.825 4.256 10.825 11.674v32.211h12.907V69.442c0-12.764-7.007-20.368-18.747-20.368m-62.565 0c-15.224 0-24.652 9.5-24.652 24.789v7.527c0 14.703 9.538 23.835 24.893 23.835c10.271 0 17.47-3.763 22-11.504l-7.998-4.602c-3.347 4.465-8.694 7.231-13.997 7.231c-7.773 0-12.413-4.798-12.413-12.84v-2.131h36.008v-8.891c0-14.243-9.352-23.414-23.83-23.414zm12.1 23.638h-24.311v-1.287c0-8.825 4.333-13.695 12.2-13.695c7.576 0 12.101 4.798 12.101 12.84zM512 41.52V31.265h-44.625V41.52h15.646v52.157h-15.646v10.255H512V93.677h-15.651V41.52zM173.638 29.786c-19.93 0-32.32 12.419-32.32 32.42v10.813c0 19.995 12.385 32.42 32.32 32.42s32.321-12.425 32.321-32.42V62.205c-.005-20.022-12.408-32.42-32.321-32.42m18.987 43.973c0 13.279-6.919 20.893-18.987 20.893s-18.982-7.614-18.982-20.893V61.46c0-13.279 6.925-20.893 18.988-20.893S192.63 48.18 192.63 61.46zm53.856-24.685c-6.771 0-12.633 2.805-15.69 7.5l-1.386 2.136v-8.365h-12.27V122.4h12.906V96.3l1.38 2.049c2.904 4.306 8.574 6.875 15.17 6.875c11.125 0 22.35-7.27 22.35-23.518v-9.115c0-11.707-6.919-23.518-22.46-23.518m9.554 32.003c0 8.64-5.04 14.008-13.148 14.008c-7.56 0-12.835-5.675-12.835-13.794v-8.064c0-8.217 5.319-14.002 12.945-14.002c8.047 0 13.048 5.363 13.048 14.002zM419.54 31.27l-26.037 72.684h13.109l4.985-15.58h29.932l.05.154l4.93 15.426h13.104l-26.082-72.69zm-4.744 46.855l11.745-36.748l11.625 36.748zM116.085 51.561a31.37 31.37 0 0 0-2.695-25.774a31.77 31.77 0 0 0-34.184-15.224A31.4 31.4 0 0 0 55.536.001a31.74 31.74 0 0 0-30.278 21.99A31.4 31.4 0 0 0 4.282 37.213a31.77 31.77 0 0 0 3.906 37.218a31.4 31.4 0 0 0 2.695 25.748a31.77 31.77 0 0 0 34.21 15.256a31.4 31.4 0 0 0 23.644 10.562a31.74 31.74 0 0 0 30.278-21.99a31.4 31.4 0 0 0 20.97-15.223a31.73 31.73 0 0 0-3.9-37.224m-47.348 66.22a23.52 23.52 0 0 1-15.108-5.478c.186-.104.548-.285.756-.422l25.09-14.484a4.07 4.07 0 0 0 2.06-3.567V58.453l10.6 6.119a.37.37 0 0 1 .208.296v29.28c0 13.041-10.564 23.618-23.606 23.633M18.015 96.12a23.56 23.56 0 0 1-2.82-15.821c.185.115.514.312.744.443l25.096 14.49a4.08 4.08 0 0 0 4.12 0L75.77 77.528v12.238a.37.37 0 0 1-.148.328L50.26 104.732c-11.292 6.502-25.716 2.637-32.245-8.64zm-6.573-54.782a23.5 23.5 0 0 1 12.287-10.354v29.823a4.08 4.08 0 0 0 2.06 3.567l30.623 17.683l-10.639 6.141a.37.37 0 0 1-.356.033L20.059 73.589c-11.282-6.527-15.148-20.957-8.64-32.25zm87.102 20.27L67.92 43.924l10.59-6.125a.38.38 0 0 1 .355-.033l25.359 14.643a23.61 23.61 0 0 1-3.649 42.598V65.191a4.08 4.08 0 0 0-2.049-3.583zM109.1 45.721a30 30 0 0 0-.745-.444L83.26 30.788a4.08 4.08 0 0 0-4.12 0L48.517 48.466V36.233a.4.4 0 0 1 .154-.328l25.358-14.638a23.61 23.61 0 0 1 35.06 24.46zM42.738 67.546l-10.605-6.119a.4.4 0 0 1-.203-.295V31.85a23.605 23.605 0 0 1 38.714-18.155c-.186.105-.52.285-.756.422l-25.09 14.484a4.08 4.08 0 0 0-2.06 3.567zm5.758-12.418l13.64-7.878l13.635 7.878v15.744l-13.64 7.877l-13.64-7.877z" />
    </svg>
  );
}

function ClaudeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 257" className={className} aria-hidden>
      <path
        fill="#d97757"
        d="m50.228 170.321l50.357-28.257l.843-2.463l-.843-1.361h-2.462l-8.426-.518l-28.775-.778l-24.952-1.037l-24.175-1.296l-6.092-1.297L0 125.796l.583-3.759l5.12-3.434l7.324.648l16.202 1.101l24.304 1.685l17.629 1.037l26.118 2.722h4.148l.583-1.685l-1.426-1.037l-1.101-1.037l-25.147-17.045l-27.22-18.017l-14.258-10.37l-7.713-5.25l-3.888-4.925l-1.685-10.758l7-7.713l9.397.649l2.398.648l9.527 7.323l20.35 15.75L94.817 91.9l3.889 3.24l1.555-1.102l.195-.777l-1.75-2.917l-14.453-26.118l-15.425-26.572l-6.87-11.018l-1.814-6.61c-.648-2.723-1.102-4.991-1.102-7.778l7.972-10.823L71.42 0l10.63 1.426l4.472 3.888l6.61 15.101l10.694 23.786l16.591 32.34l4.861 9.592l2.592 8.879l.973 2.722h1.685v-1.556l1.36-18.211l2.528-22.36l2.463-28.776l.843-8.1l4.018-9.722l7.971-5.25l6.222 2.981l5.12 7.324l-.713 4.73l-3.046 19.768l-5.962 30.98l-3.889 20.739h2.268l2.593-2.593l10.499-13.934l17.628-22.036l7.778-8.749l9.073-9.657l5.833-4.601h11.018l8.1 12.055l-3.628 12.443l-11.342 14.388l-9.398 12.184l-13.48 18.147l-8.426 14.518l.778 1.166l2.01-.194l30.46-6.481l16.462-2.982l19.637-3.37l8.88 4.148l.971 4.213l-3.5 8.62l-20.998 5.184l-24.628 4.926l-36.682 8.685l-.454.324l.519.648l16.526 1.555l7.065.389h17.304l32.21 2.398l8.426 5.574l5.055 6.805l-.843 5.184l-12.962 6.611l-17.498-4.148l-40.83-9.721l-14-3.5h-1.944v1.167l11.666 11.406l21.387 19.314l26.767 24.887l1.36 6.157l-3.434 4.86l-3.63-.518l-23.526-17.693l-9.073-7.972l-20.545-17.304h-1.36v1.814l4.73 6.935l25.017 37.59l1.296 11.536l-1.814 3.76l-6.481 2.268l-7.13-1.297l-14.647-20.544l-15.1-23.138l-12.185-20.739l-1.49.843l-7.194 77.448l-3.37 3.953l-7.778 2.981l-6.48-4.925l-3.436-7.972l3.435-15.749l4.148-20.544l3.37-16.333l3.046-20.285l1.815-6.74l-.13-.454l-1.49.194l-15.295 20.999l-23.267 31.433l-18.406 19.702l-4.407 1.75l-7.648-3.954l.713-7.064l4.277-6.286l25.47-32.405l15.36-20.092l9.917-11.6l-.065-1.686h-.583L44.07 198.125l-12.055 1.555l-5.185-4.86l.648-7.972l2.463-2.593l20.35-13.999z"
      />
    </svg>
  );
}

function PerplexityIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 298" className={className} aria-hidden>
      <path
        fill="#3f7e8b"
        d="m34.831 0l84.689 78.028V.18h16.486v78.197L221.074 0v88.964H256v128.322h-34.819v79.218l-85.175-74.833v75.692H119.52v-74.459l-84.593 74.508v-80.126H0V88.964h34.831zm72.26 105.248H16.487v95.753h18.42v-30.204zm-55.68 72.775v83.052l68.109-59.988v-84.926zm85.069 22.27v-84.212l68.128 61.865v39.34h.088v42.94zm84.701.708h18.333v-95.753h-89.93l71.597 64.87zM204.588 88.964V37.457l-55.904 51.507zm-97.368 0H51.317V37.457z"
      />
    </svg>
  );
}

function GrokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 246" className={className} fill="currentColor" aria-hidden>
      <path d="M63.83 56.843c27.469-27.48 67.635-34.865 101.712-21.87l2.314.917c7.645 2.844 14.309 6.89 19.507 10.651l-28.857 13.342c-26.869-11.286-57.649-3.609-76.435 15.2c-25.405 25.414-30.539 69.484-.764 97.96L0 245.764c4.296-5.923 9.457-11.573 14.75-17.178l5.815-6.13l2.608-2.774c15.53-16.655 28.81-33.77 20.496-56.709l-.766-1.98c-14.592-35.497-6.094-77.096 20.928-104.15m156.956-21.587L256 0l-10.128 14.069c-21.094 29.716-30.456 48.424-21.11 88.659l-.065-.065c7.23 30.728-.503 64.803-25.472 89.802c-31.478 31.538-81.852 38.558-123.336 10.17l28.923-13.407c26.476 10.41 55.442 5.839 76.26-15.003c20.818-20.844 25.493-51.2 15.03-76.462c-1.989-4.79-7.952-5.992-12.125-2.909L98.87 157.755L220.786 35.147z" />
    </svg>
  );
}

const PROMPT =
  "I'm looking at ICTF (ictf.lk), a Sri Lankan O/L & A/L ICT education institute. Can you tell me about their courses, fees, and how to register?";

const PROVIDERS = [
  {
    name: "ChatGPT",
    Icon: OpenAiIcon,
    buildUrl: (q: string) => `https://chatgpt.com/?q=${q}`,
    iconClassName: "text-white/80",
  },
  {
    name: "Claude",
    Icon: ClaudeIcon,
    buildUrl: () => "https://claude.ai/new",
    iconClassName: "",
  },
  {
    name: "Perplexity",
    Icon: PerplexityIcon,
    buildUrl: (q: string) => `https://www.perplexity.ai/search?q=${q}`,
    iconClassName: "",
  },
  {
    name: "Grok",
    Icon: GrokIcon,
    buildUrl: (q: string) => `https://grok.com/?q=${q}`,
    iconClassName: "text-white/80",
  },
] as const;

export function FooterAskAiRow() {
  const { t } = useMarketingText();
  const reduceMotion = useReducedMotion();

  const handleClick = async (provider: (typeof PROVIDERS)[number]) => {
    try {
      await navigator.clipboard.writeText(PROMPT);
      toast.success(`Prompt copied — paste it into ${provider.name} if it doesn't appear automatically.`);
    } catch {
      // Clipboard access can fail (e.g. insecure context); the tab still opens either way.
    }
    const encoded = encodeURIComponent(PROMPT);
    window.open(provider.buildUrl(encoded), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
      <span className="text-[0.6875rem] font-bold uppercase tracking-[0.24em] text-icvf-accent">
        {t("footer.askAi")}
      </span>
      <div className="flex items-center gap-2">
        {PROVIDERS.map((provider) => (
          <motion.button
            key={provider.name}
            type="button"
            onClick={() => void handleClick(provider)}
            aria-label={`Ask ${provider.name} about ICTF`}
            title={`Ask ${provider.name} about ICTF`}
            className="flex size-9 items-center justify-center rounded-full border border-white/12 bg-white/[0.05] p-2 text-white/70 transition-colors hover:border-icvf-accent/45 hover:bg-icvf-accent/12 hover:text-icvf-accent"
            whileHover={reduceMotion ? undefined : { y: -3, scale: 1.05 }}
            whileTap={reduceMotion ? undefined : { scale: 0.96 }}
          >
            <provider.Icon className={`size-full ${provider.iconClassName}`} />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
