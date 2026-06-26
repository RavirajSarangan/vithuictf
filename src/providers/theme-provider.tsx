"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      storageKey="icvf-theme"
      disableTransitionOnChange
      scriptProps={{ suppressHydrationWarning: true }}
    >
      {children}
    </NextThemesProvider>
  );
}
