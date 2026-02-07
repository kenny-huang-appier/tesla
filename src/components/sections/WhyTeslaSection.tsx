"use client";

import { useTranslations } from "next-intl";
import {
  Leaf,
  Shield,
  PiggyBank,
  Smartphone,
  Navigation,
  Zap,
} from "lucide-react";
import SectionTitle from "@/components/ui/SectionTitle";
import RevealOnScroll from "@/components/motion/RevealOnScroll";

const icons = [Leaf, Shield, PiggyBank, Smartphone, Navigation, Zap];
const cardKeys = [
  "zeroEmission",
  "safest",
  "saveMoney",
  "otaUpdate",
  "autopilot",
  "supercharger",
] as const;

export default function WhyTeslaSection() {
  const t = useTranslations("whyTesla");

  return (
    <section id="why-tesla" className="py-20 md:py-32 px-4">
      <div className="max-w-7xl mx-auto">
        <SectionTitle
          title={t("sectionTitle")}
          subtitle={t("sectionSubtitle")}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cardKeys.map((key, i) => {
            const Icon = icons[i];
            return (
              <RevealOnScroll key={key} delay={i * 0.1}>
                <div className="glass-card p-8 h-full transition-all duration-300 hover:scale-[1.02]">
                  <div className="w-12 h-12 rounded-lg bg-tesla-red/10 flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6 text-tesla-red" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">
                    {t(`cards.${key}.title`)}
                  </h3>
                  <p className="text-tesla-silver leading-relaxed">
                    {t(`cards.${key}.description`)}
                  </p>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>
      </div>
    </section>
  );
}
