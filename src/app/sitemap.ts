import type { MetadataRoute } from "next";

const siteUrl = "https://tesla.orz.tw";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: {
          "zh-TW": siteUrl,
          en: `${siteUrl}/en`,
          ja: `${siteUrl}/ja`,
          ko: `${siteUrl}/ko`,
        },
      },
    },
    {
      url: `${siteUrl}/sale/`,
      lastModified: new Date("2026-10-14"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
