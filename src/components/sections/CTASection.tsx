"use client";

import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import RevealOnScroll from "@/components/motion/RevealOnScroll";
import Button from "@/components/ui/Button";
import { getReferralLink } from "@/lib/referral";

export default function CTASection() {
  const t = useTranslations("cta");
  const locale = useLocale();

  return (
    <section className="py-20 md:py-32 px-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-tesla-dark via-tesla-red/5 to-tesla-dark" />

      <div className="relative max-w-4xl mx-auto text-center">
        <RevealOnScroll>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-6">
            {t("title")}
          </h2>
          <p className="text-xl text-tesla-silver mb-10 max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant="primary"
              size="lg"
              href={getReferralLink(locale)}
              external
              className="text-xl px-12 py-5"
            >
              {t("button")}
              <ExternalLink className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
          <p className="text-sm text-tesla-silver mt-6">{t("note")}</p>
        </RevealOnScroll>
      </div>
    </section>
  );
}
