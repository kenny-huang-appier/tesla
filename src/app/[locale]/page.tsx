import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import WhyTeslaSection from "@/components/sections/WhyTeslaSection";
import VehicleShowcase from "@/components/sections/VehicleShowcase";
import CostCalculator from "@/components/sections/CostCalculator";
import StatsSection from "@/components/sections/StatsSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import FAQSection from "@/components/sections/FAQSection";
import CTASection from "@/components/sections/CTASection";

export default function HomePage() {

  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <WhyTeslaSection />
        <VehicleShowcase />
        <CostCalculator />
        <StatsSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
