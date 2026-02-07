"use client";

import { useTranslations, useLocale } from "next-intl";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Quote } from "lucide-react";
import SectionTitle from "@/components/ui/SectionTitle";
import RevealOnScroll from "@/components/motion/RevealOnScroll";
import type { Testimonial } from "@/types";

const sourceColors: Record<string, string> = {
  PTT: "bg-blue-500/20 text-blue-400",
  X: "bg-gray-500/20 text-gray-300",
  RedNote: "bg-red-500/20 text-red-400",
  YouTube: "bg-red-600/20 text-red-400",
  Facebook: "bg-blue-600/20 text-blue-400",
  Reddit: "bg-orange-500/20 text-orange-400",
  Threads: "bg-purple-500/20 text-purple-400",
  Mobile01: "bg-green-500/20 text-green-400",
};

const filterKeys = [
  "filterAll",
  "filterPTT",
  "filterX",
  "filterRedNote",
  "filterYouTube",
  "filterFacebook",
  "filterReddit",
  "filterThreads",
  "filterMobile01",
] as const;

const sourceMap: Record<string, string | null> = {
  filterAll: null,
  filterPTT: "PTT",
  filterX: "X",
  filterRedNote: "RedNote",
  filterYouTube: "YouTube",
  filterFacebook: "Facebook",
  filterReddit: "Reddit",
  filterThreads: "Threads",
  filterMobile01: "Mobile01",
};

export default function TestimonialsSection() {
  const t = useTranslations("testimonials");
  const locale = useLocale();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    import(`../../../content/testimonials/${locale}.json`).then((m) =>
      setTestimonials(m.default)
    );
  }, [locale]);

  const filtered = filter
    ? testimonials.filter((t) => t.source === filter)
    : testimonials;

  return (
    <section className="py-20 md:py-32 px-4">
      <div className="max-w-7xl mx-auto">
        <SectionTitle
          title={t("sectionTitle")}
          subtitle={t("sectionSubtitle")}
        />

        {/* Filters */}
        <RevealOnScroll>
          <div className="flex justify-center gap-2 mb-12 flex-wrap">
            {filterKeys.map((key) => {
              const src = sourceMap[key];
              const active = filter === src;
              return (
                <button
                  key={key}
                  onClick={() => setFilter(src)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                    active
                      ? "bg-tesla-red text-white"
                      : "bg-tesla-card text-tesla-silver hover:text-white border border-tesla-border"
                  }`}
                >
                  {t(key)}
                </button>
              );
            })}
          </div>
        </RevealOnScroll>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((item, i) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="glass-card p-6 flex flex-col"
              >
                <Quote className="w-8 h-8 text-tesla-red/30 mb-3" />
                <p className="text-tesla-white/90 leading-relaxed flex-1 mb-4">
                  {item.content}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-tesla-border">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-tesla-silver" />
                    <span className="text-sm text-tesla-silver">
                      {item.author}
                    </span>
                    {item.model && (
                      <span className="text-xs text-tesla-light-gray">
                        · {item.model}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      sourceColors[item.source] || ""
                    }`}
                  >
                    {item.source}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
