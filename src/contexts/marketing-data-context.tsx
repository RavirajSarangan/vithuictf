"use client";

import { createContext, useContext } from "react";
import type { MarketingHomeData } from "@/lib/marketing-data";

const MarketingDataContext = createContext<MarketingHomeData | null>(null);

export function MarketingDataProvider({
  data,
  children,
}: {
  data: MarketingHomeData;
  children: React.ReactNode;
}) {
  return <MarketingDataContext.Provider value={data}>{children}</MarketingDataContext.Provider>;
}

export function useMarketingData() {
  return useContext(MarketingDataContext);
}
