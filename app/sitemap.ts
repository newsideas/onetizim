import type { MetadataRoute } from "next";
import { PUBLIC_DOMAIN } from "@/lib/tenant";

/** Rasmiy saytda bitta sahifa bor (bo'limlar — shu sahifaning qismlari). */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `https://${PUBLIC_DOMAIN}/`, changeFrequency: "weekly", priority: 1 }];
}
