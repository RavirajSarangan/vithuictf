import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import HomePage from "../page";

export const metadata: Metadata = buildPageMetadata({
  title: "ICTF — O/L & A/L ICT நிறுவனம் இலங்கை",
  description:
    "ICT அடித்தளம் (ICTF) — இலங்கையின் நம்பகமான O/L & A/L ICT நிறுவனம். Zoom வகுப்புகள், பேப்பர் மையங்கள், மாணவர் தளம். நிறுவனர் விதூசன் சிவநாதன்.",
  path: "/",
  locale: "ta",
});

export default HomePage;
