export interface Vehicle {
  id: string;
  name: string;
  tagline: string;
  image: string;
  startingPrice: string;
  range: string;
  topSpeed: string;
  acceleration: string;
  specs: VehicleSpec[];
}

export interface VehicleSpec {
  label: string;
  value: string;
}

export interface Testimonial {
  id: string;
  content: string;
  source: "PTT" | "X" | "RedNote" | "YouTube" | "Facebook" | "Reddit" | "Threads" | "Mobile01";
  author: string;
  model?: string;
  rating?: number;
  url?: string;
  fetchedAt?: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface WhyTeslaCard {
  icon: string;
  title: string;
  description: string;
}

export interface Stat {
  value: number;
  suffix: string;
  label: string;
}
