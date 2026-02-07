import RevealOnScroll from "@/components/motion/RevealOnScroll";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
}

export default function SectionTitle({ title, subtitle }: SectionTitleProps) {
  return (
    <RevealOnScroll className="text-center mb-12 md:mb-16">
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-tesla-silver text-lg md:text-xl max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </RevealOnScroll>
  );
}
