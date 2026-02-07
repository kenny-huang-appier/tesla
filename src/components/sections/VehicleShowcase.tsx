"use client";

import { useTranslations, useLocale } from "next-intl";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Battery, Gauge, Timer, ExternalLink } from "lucide-react";
import SectionTitle from "@/components/ui/SectionTitle";
import RevealOnScroll from "@/components/motion/RevealOnScroll";
import Button from "@/components/ui/Button";
import { getReferralLink } from "@/lib/referral";
import type { Vehicle } from "@/types";

export default function VehicleShowcase() {
  const t = useTranslations("vehicles");
  const locale = useLocale();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    import(`../../../content/vehicles/${locale}.json`).then((m) =>
      setVehicles(m.default)
    );
  }, [locale]);

  if (!vehicles.length) return null;
  const active = vehicles[activeIdx];

  return (
    <section className="py-20 md:py-32 px-4 bg-tesla-darker/50">
      <div className="max-w-7xl mx-auto">
        <SectionTitle
          title={t("sectionTitle")}
          subtitle={t("sectionSubtitle")}
        />

        {/* Tab bar */}
        <RevealOnScroll>
          <div className="flex justify-center gap-2 mb-12 flex-wrap">
            {vehicles.map((v, i) => (
              <button
                key={v.id}
                onClick={() => setActiveIdx(i)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
                  i === activeIdx
                    ? "bg-tesla-red text-white"
                    : "bg-tesla-card text-tesla-silver hover:text-white border border-tesla-border"
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>
        </RevealOnScroll>

        {/* Vehicle detail */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="glass-card p-8 md:p-12"
          >
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Left: info */}
              <div>
                <h3 className="text-4xl md:text-5xl font-black mb-2">
                  {active.name}
                </h3>
                <p className="text-tesla-silver text-lg mb-6">
                  {active.tagline}
                </p>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="text-center p-4 rounded-lg bg-white/5">
                    <Battery className="w-5 h-5 mx-auto mb-2 text-tesla-red" />
                    <p className="text-xs text-tesla-silver">{t("range")}</p>
                    <p className="font-bold">{active.range}</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-white/5">
                    <Gauge className="w-5 h-5 mx-auto mb-2 text-tesla-red" />
                    <p className="text-xs text-tesla-silver">{t("topSpeed")}</p>
                    <p className="font-bold">{active.topSpeed}</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-white/5">
                    <Timer className="w-5 h-5 mx-auto mb-2 text-tesla-red" />
                    <p className="text-xs text-tesla-silver">
                      {t("acceleration")}
                    </p>
                    <p className="font-bold">{active.acceleration}</p>
                  </div>
                </div>

                <p className="text-2xl font-bold mb-6">
                  <span className="text-sm text-tesla-silver font-normal">
                    {t("startingAt")}{" "}
                  </span>
                  {active.startingPrice}
                </p>

                <Button
                  variant="primary"
                  size="lg"
                  href={getReferralLink(locale)}
                  external
                >
                  {t("orderNow")}
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>

              {/* Right: specs grid */}
              <div className="space-y-4">
                {active.specs.map((s) => (
                  <div
                    key={s.label}
                    className="flex justify-between items-center p-4 rounded-lg bg-white/5"
                  >
                    <span className="text-tesla-silver">{s.label}</span>
                    <span className="font-bold">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
