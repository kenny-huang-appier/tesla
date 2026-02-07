"use client";

import { useTranslations, useLocale } from "next-intl";
import { motion, useScroll, useTransform } from "framer-motion";
import { Zap } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import Button from "@/components/ui/Button";
import { getReferralLink } from "@/lib/referral";

export default function Header() {
  const t = useTranslations("header");
  const locale = useLocale();
  const { scrollY } = useScroll();
  const bgOpacity = useTransform(scrollY, [0, 100], [0, 0.85]);

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <motion.div
        className="absolute inset-0 bg-tesla-dark/80"
        style={{ opacity: bgOpacity }}
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="#" className="flex items-center gap-2 text-xl font-bold">
            <Zap className="w-6 h-6 text-tesla-red" />
            <span>{t("title")}</span>
          </a>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <LanguageSwitcher />
            <Button
              variant="primary"
              size="sm"
              href={getReferralLink(locale)}
              external
            >
              {t("cta")}
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
