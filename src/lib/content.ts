import type { Vehicle, Testimonial, FAQ } from "@/types";

export async function getVehicles(locale: string): Promise<Vehicle[]> {
  const data = await import(`../../content/vehicles/${locale}.json`);
  return data.default;
}

export async function getTestimonials(locale: string): Promise<Testimonial[]> {
  const data = await import(`../../content/testimonials/${locale}.json`);
  return data.default;
}

export async function getFAQs(locale: string): Promise<FAQ[]> {
  const data = await import(`../../content/faq/${locale}.json`);
  return data.default;
}
