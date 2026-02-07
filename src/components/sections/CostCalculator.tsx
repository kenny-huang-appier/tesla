"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, TreePine, TrendingDown } from "lucide-react";
import SectionTitle from "@/components/ui/SectionTitle";
import RevealOnScroll from "@/components/motion/RevealOnScroll";
import Button from "@/components/ui/Button";

export default function CostCalculator() {
  const t = useTranslations("calculator");
  const [monthlyFuel, setMonthlyFuel] = useState(4000);
  const [monthlyKm, setMonthlyKm] = useState(1500);
  const [fuelPrice, setFuelPrice] = useState(32);
  const [elecPrice, setElecPrice] = useState(3.5);
  const [result, setResult] = useState<{
    yearly: number;
    fiveYear: number;
    trees: number;
  } | null>(null);

  function calculate() {
    // Tesla Model 3 average: 14.5 kWh/100km
    const monthlyElecCost = (monthlyKm / 100) * 14.5 * elecPrice;
    const monthlySaving = monthlyFuel - monthlyElecCost;
    const yearly = Math.round(monthlySaving * 12);
    const fiveYear = yearly * 5;
    // ~21.77 kg CO2 per tree per year; ~2.31 kg CO2 per liter gas
    const litersPerMonth = monthlyFuel / fuelPrice;
    const co2Saved = litersPerMonth * 12 * 2.31;
    const trees = Math.round(co2Saved / 21.77);

    setResult({ yearly: Math.max(0, yearly), fiveYear: Math.max(0, fiveYear), trees });
  }

  return (
    <section className="py-20 md:py-32 px-4">
      <div className="max-w-7xl mx-auto">
        <SectionTitle
          title={t("sectionTitle")}
          subtitle={t("sectionSubtitle")}
        />

        <RevealOnScroll>
          <div className="glass-card max-w-2xl mx-auto p-8 md:p-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm text-tesla-silver mb-2">
                  {t("monthlyFuel")}
                </label>
                <input
                  type="number"
                  value={monthlyFuel}
                  onChange={(e) => setMonthlyFuel(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white/5 border border-tesla-border rounded-lg text-white focus:outline-none focus:border-tesla-red transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-tesla-silver mb-2">
                  {t("monthlyKm")}
                </label>
                <input
                  type="number"
                  value={monthlyKm}
                  onChange={(e) => setMonthlyKm(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white/5 border border-tesla-border rounded-lg text-white focus:outline-none focus:border-tesla-red transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-tesla-silver mb-2">
                  {t("fuelPrice")}
                </label>
                <input
                  type="number"
                  value={fuelPrice}
                  onChange={(e) => setFuelPrice(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white/5 border border-tesla-border rounded-lg text-white focus:outline-none focus:border-tesla-red transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-tesla-silver mb-2">
                  {t("electricityPrice")}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={elecPrice}
                  onChange={(e) => setElecPrice(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white/5 border border-tesla-border rounded-lg text-white focus:outline-none focus:border-tesla-red transition-colors"
                />
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={calculate}
            >
              <Calculator className="w-5 h-5 mr-2" />
              {t("calculate")}
            </Button>

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <div className="text-center p-6 rounded-lg bg-tesla-red/10 border border-tesla-red/20">
                  <TrendingDown className="w-6 h-6 text-tesla-red mx-auto mb-2" />
                  <p className="text-sm text-tesla-silver">
                    {t("yearlySaving")}
                  </p>
                  <p className="text-3xl font-black text-tesla-red mt-1">
                    ${result.yearly.toLocaleString()}
                  </p>
                  <p className="text-xs text-tesla-silver">{t("twd")}</p>
                </div>
                <div className="text-center p-6 rounded-lg bg-white/5 border border-tesla-border">
                  <TrendingDown className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-tesla-silver">
                    {t("fiveyearSaving")}
                  </p>
                  <p className="text-3xl font-black text-green-400 mt-1">
                    ${result.fiveYear.toLocaleString()}
                  </p>
                  <p className="text-xs text-tesla-silver">{t("twd")}</p>
                </div>
                <div className="sm:col-span-2 text-center p-4 rounded-lg bg-white/5">
                  <TreePine className="w-5 h-5 text-green-400 mx-auto mb-1" />
                  <p className="text-sm text-tesla-silver">
                    {t("treesEquivalent", { count: result.trees })}
                  </p>
                </div>
              </motion.div>
            )}

            <p className="text-xs text-tesla-light-gray text-center mt-4">
              {t("disclaimer")}
            </p>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
