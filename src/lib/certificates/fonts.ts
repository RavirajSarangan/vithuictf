import fs from "fs";
import path from "path";

const FONT_FILES = {
  DancingScript: "dancing-script-latin-400-normal.woff",
  Inter: "inter-latin-700-normal.woff",
  InterRegular: "inter-latin-400-normal.woff",
} as const;

const FONT_CANDIDATES: Record<keyof typeof FONT_FILES, string[]> = {
  DancingScript: [
    path.join("public", "fonts", "certificates", FONT_FILES.DancingScript),
    path.join(
      "node_modules",
      "@fontsource",
      "dancing-script",
      "files",
      FONT_FILES.DancingScript
    ),
  ],
  Inter: [
    path.join("public", "fonts", "certificates", FONT_FILES.Inter),
    path.join("node_modules", "@fontsource", "inter", "files", FONT_FILES.Inter),
  ],
  InterRegular: [
    path.join("public", "fonts", "certificates", FONT_FILES.InterRegular),
    path.join("node_modules", "@fontsource", "inter", "files", FONT_FILES.InterRegular),
  ],
};

function readFontBase64(fontKey: keyof typeof FONT_FILES): string {
  const cwd = process.cwd();
  for (const relativePath of FONT_CANDIDATES[fontKey]) {
    const fontPath = path.join(cwd, relativePath);
    if (fs.existsSync(fontPath)) {
      return fs.readFileSync(fontPath).toString("base64");
    }
  }

  throw new Error(
    `Certificate font file missing: ${FONT_FILES[fontKey]} (checked public/fonts/certificates and @fontsource)`
  );
}

let cachedFontCss: string | null = null;

export function getCertificateFontFaceCss(): string {
  if (cachedFontCss) return cachedFontCss;

  const dancing = readFontBase64("DancingScript");
  const interBold = readFontBase64("Inter");
  const interRegular = readFontBase64("InterRegular");

  cachedFontCss = `
    @font-face {
      font-family: 'DancingScript';
      src: url('data:font/woff;base64,${dancing}') format('woff');
      font-weight: 400;
      font-style: normal;
    }
    @font-face {
      font-family: 'Inter';
      src: url('data:font/woff;base64,${interBold}') format('woff');
      font-weight: 700;
      font-style: normal;
    }
    @font-face {
      font-family: 'Inter';
      src: url('data:font/woff;base64,${interRegular}') format('woff');
      font-weight: 400;
      font-style: normal;
    }
  `;

  return cachedFontCss;
}

export function resolveFontFamily(fontFamily?: string): string {
  if (fontFamily === "DancingScript") return "DancingScript";
  return "Inter";
}

export { FONT_FILES };
