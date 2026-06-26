/** Canonical compliance badge artwork — always use these paths everywhere. */
export const COMPLIANCE_BADGE_ASSETS = [
  {
    src: "/papa.png",
    alt: "PDPA Compliance",
    width: 606,
    height: 254,
  },
  {
    src: "/iso.png",
    alt: "ISO 27001 Certified",
    width: 619,
    height: 246,
  },
  {
    src: "/pci.png",
    alt: "PCI DSS Compliant",
    width: 494,
    height: 191,
  },
] as const;

export type ComplianceBadgeAsset = (typeof COMPLIANCE_BADGE_ASSETS)[number];
