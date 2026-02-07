import { createHash } from "crypto";
import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import dotenv from "dotenv";

// Load .env.local
export function loadEnv() {
  dotenv.config({ path: resolve(process.cwd(), ".env.local") });
}

// Rate limiter - ensures minimum delay between requests
export class RateLimiter {
  private lastRequest = 0;

  constructor(private delayMs: number) {}

  async wait() {
    const now = Date.now();
    const elapsed = now - this.lastRequest;
    if (elapsed < this.delayMs) {
      await new Promise((r) => setTimeout(r, this.delayMs - elapsed));
    }
    this.lastRequest = Date.now();
  }
}

// Retry with exponential backoff for transient errors
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const isRetryable =
        err instanceof Error &&
        "status" in err &&
        (((err as { status: number }).status === 429) ||
          ((err as { status: number }).status >= 500));

      if (!isRetryable || attempt === maxRetries - 1) throw err;

      const delay = Math.pow(2, attempt) * 1000;
      console.warn(
        `  Retry ${attempt + 1}/${maxRetries} after ${delay}ms...`
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("Unreachable");
}

// Filter content for quality
const TESLA_KEYWORDS = [
  "tesla",
  "特斯拉",
  "テスラ",
  "테슬라",
  "model 3",
  "model y",
  "model s",
  "model x",
  "cybertruck",
];

const SPAM_PATTERNS = [
  /https?:\/\/\S+\.(com|net|org)\S{20,}/i, // long suspicious URLs
  /免費|free giveaway|click here|訂閱.*抽獎/i,
  new RegExp("(\\p{Emoji_Presentation}.*){5,}", "u"), // too many emojis
];

export function filterContent(text: string, minLength = 20): boolean {
  if (!text || text.length < minLength) return false;

  const lower = text.toLowerCase();
  const hasTeslaKeyword = TESLA_KEYWORDS.some((kw) => lower.includes(kw));
  if (!hasTeslaKeyword) return false;

  const isSpam = SPAM_PATTERNS.some((p) => p.test(text));
  if (isSpam) return false;

  return true;
}

// Extract Tesla model from text
const MODEL_PATTERNS = [
  /model\s*3/i,
  /model\s*y/i,
  /model\s*s/i,
  /model\s*x/i,
  /cybertruck/i,
];

const MODEL_NAMES: Record<number, string> = {
  0: "Model 3",
  1: "Model Y",
  2: "Model S",
  3: "Model X",
  4: "Cybertruck",
};

export function extractModel(text: string): string | undefined {
  for (let i = 0; i < MODEL_PATTERNS.length; i++) {
    if (MODEL_PATTERNS[i].test(text)) return MODEL_NAMES[i];
  }
  return undefined;
}

// Generate stable ID: {platform}-{hash8}
export function generateId(platform: string, content: string): string {
  const hash = createHash("sha256").update(content).digest("hex").slice(0, 8);
  return `${platform}-${hash}`;
}

// Write raw output to content/testimonials/raw/
const RAW_DIR = resolve(process.cwd(), "content/testimonials/raw");

export function writeRawOutput(filename: string, data: unknown) {
  mkdirSync(RAW_DIR, { recursive: true });
  const filepath = resolve(RAW_DIR, filename);
  writeFileSync(filepath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`  Written: ${filepath} (${Array.isArray(data) ? data.length : "?"} items)`);
}

// HTTP fetch helper with error status
export async function fetchJSON<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}: ${res.statusText}`) as Error & {
      status: number;
    };
    err.status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}

// Truncate content to reasonable length for display
export function truncate(text: string, maxLength = 300): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, "") + "...";
}
