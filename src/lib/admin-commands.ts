import { adminNav } from "@/lib/navigation";

export type AdminCommand = {
  label: string;
  href: string;
  keywords?: string[];
  group: "navigation" | "actions";
};

export const adminCommands: AdminCommand[] = [
  ...adminNav.map((item) => ({
    label: item.label,
    href: item.href,
    keywords: [item.label.toLowerCase(), item.href.replace("/admin/", "")],
    group: "navigation" as const,
  })),
  {
    label: "View marketing site",
    href: "/",
    keywords: ["home", "public", "website"],
    group: "actions",
  },
  {
    label: "Student login",
    href: "/login",
    keywords: ["auth", "sign in"],
    group: "actions",
  },
];
