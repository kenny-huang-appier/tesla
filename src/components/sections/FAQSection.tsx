"use client";

import { useTranslations, useLocale } from "next-intl";
import { useState, useEffect } from "react";
import SectionTitle from "@/components/ui/SectionTitle";
import RevealOnScroll from "@/components/motion/RevealOnScroll";
import Accordion from "@/components/ui/Accordion";
import type { FAQ } from "@/types";

export default function FAQSection() {
  const t = useTranslations("faq");
  const locale = useLocale();
  const [faqs, setFaqs] = useState<FAQ[]>([]);

  useEffect(() => {
    import(`../../../content/faq/${locale}.json`).then((m) =>
      setFaqs(m.default)
    );
  }, [locale]);

  return (
    <section className="py-20 md:py-32 px-4 bg-tesla-darker/50">
      <div className="max-w-7xl mx-auto">
        <SectionTitle
          title={t("sectionTitle")}
          subtitle={t("sectionSubtitle")}
        />
        <RevealOnScroll>
          <Accordion items={faqs} />
        </RevealOnScroll>
      </div>
    </section>
  );
}
