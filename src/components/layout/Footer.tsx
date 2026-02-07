"use client";

import { useTranslations } from "next-intl";
import { Zap } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-tesla-border bg-tesla-darker">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-tesla-red" />
            <span className="font-bold">Why Tesla?</span>
          </div>
          <LanguageSwitcher />
        </div>
        <div className="mt-8 pt-8 border-t border-tesla-border text-center">
          <p className="text-tesla-silver text-sm max-w-3xl mx-auto leading-relaxed">
            {t("disclaimer")}
          </p>
          <p className="text-tesla-light-gray text-xs mt-4">
            {t("referralNote")}
          </p>
        </div>
      </div>
    </footer>
  );
}
