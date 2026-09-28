import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { PUBLIC_DOMAIN, resolveHost } from "@/lib/tenant";

/**
 * Qidiruv tizimlari faqat rasmiy saytni (onetizim.uz) indekslaydi. Markaz subdomenlari va admin manzili
 * butunlay yopiq: ularda faqat kirish sahifasi va markaz ichki ma'lumotlari bor.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = resolveHost((await headers()).get("host"));
  if (host.kind !== "root") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    sitemap: `https://${PUBLIC_DOMAIN}/sitemap.xml`,
  };
}
