import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import "../globals.css";

const siteUrl = "https://tesla.orz.tw";

const metaByLocale: Record<string, { title: string; description: string }> = {
  "zh-TW": {
    title: "為何推薦購買特斯拉？| Why Tesla?",
    description:
      "探索購買 Tesla 的六大理由：零排放、最安全、省油錢、OTA 更新、Autopilot、超級充電網路。使用推薦連結訂購享優惠。",
  },
  en: {
    title: "Why Choose Tesla? | Why Tesla?",
    description:
      "Discover 6 reasons to buy Tesla: zero emissions, safest cars, fuel savings, OTA updates, Autopilot, Supercharger network. Order with referral link.",
  },
  ja: {
    title: "なぜテスラを選ぶのか？| Why Tesla?",
    description:
      "テスラを購入する6つの理由：ゼロエミッション、最高の安全性、燃費節約、OTAアップデート、オートパイロット、スーパーチャージャー。",
  },
  ko: {
    title: "왜 테슬라인가? | Why Tesla?",
    description:
      "테슬라를 구매해야 하는 6가지 이유: 제로 배출, 최고 안전, 연료비 절약, OTA 업데이트, 오토파일럿, 슈퍼차저 네트워크.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = metaByLocale[locale] || metaByLocale["zh-TW"];

  return {
    title: meta.title,
    description: meta.description,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: locale === "zh-TW" ? "/" : `/${locale}`,
      languages: {
        "zh-TW": "/",
        en: "/en",
        ja: "/ja",
        ko: "/ko",
      },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: siteUrl,
      siteName: "Why Tesla?",
      type: "website",
      locale: locale.replace("-", "_"),
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Noto+Sans+TC:wght@300;400;500;700;900&family=Noto+Sans+JP:wght@300;400;500;700;900&family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-tesla-dark text-tesla-white antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
