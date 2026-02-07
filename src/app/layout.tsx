import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Why Tesla? | 為何推薦購買特斯拉？",
  description:
    "Discover why Tesla is the smartest car purchase you can make. Zero emissions, safest vehicles, massive fuel savings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
