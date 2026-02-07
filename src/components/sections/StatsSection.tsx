"use client";

import { useTranslations } from "next-intl";
import SectionTitle from "@/components/ui/SectionTitle";
import RevealOnScroll from "@/components/motion/RevealOnScroll";
import AnimatedCounter from "@/components/motion/AnimatedCounter";

const stats = [
  { key: "globalOwners", value: 700 },
  { key: "safetyRating", value: 5 },
  { key: "superchargers", value: 60000 },
  { key: "countries", value: 40 },
] as const;

export default function StatsSection() {
  const t = useTranslations("stats");

  return (
    <section className="py-20 md:py-32 px-4 bg-tesla-darker/50">
      <div className="max-w-7xl mx-auto">
        <SectionTitle title={t("sectionTitle")} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <RevealOnScroll key={s.key} delay={i * 0.1}>
              <div className="text-center p-4 sm:p-8">
                <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-tesla-white whitespace-nowrap">
                  <AnimatedCounter target={s.value} />
                  <span className="text-tesla-red text-xl sm:text-2xl md:text-3xl ml-1">
                    {t(`${s.key}Unit`)}
                  </span>
                </div>
                <p className="text-tesla-silver mt-3 text-sm sm:text-lg">{t(s.key)}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
