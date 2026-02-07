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
  ];
}
