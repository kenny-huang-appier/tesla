/**
 * Merge raw scraper output into website testimonial JSON files.
 *
 * Reads from: content/testimonials/raw/{platform}-{locale}.json
 * Merges into: content/testimonials/{locale}.json
 *
 * - Deduplicates by id
 * - Strips raw-only fields (url, fetchedAt)
 * - Anonymizes author names from scraped data (privacy)
 * - Keeps existing hand-written testimonials
 * - Caps total per locale at --limit (default 20)
 *
 * Usage:
 *   pnpm merge:testimonials              # merge all
 *   pnpm merge:testimonials -- --limit 30 # custom limit
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { resolve } from "path";
import type { Testimonial } from "../src/types/index.js";

const CONTENT_DIR = resolve(process.cwd(), "content/testimonials");
const RAW_DIR = resolve(CONTENT_DIR, "raw");
const LOCALES = ["zh-TW", "en", "ja", "ko"];

// Locale mapping: raw filename pattern -> locale
// e.g. ptt-zh-TW.json -> zh-TW, reddit-en.json -> en
function getLocaleFromFilename(filename: string): string | null {
  for (const locale of LOCALES) {
    if (filename.includes(`-${locale}.json`)) return locale;
  }
  return null;
}

// Hand-written testimonial IDs start with "t" (e.g. t1, t2)
// Scraped IDs start with platform prefix (e.g. ptt-, reddit-)
const HAND_WRITTEN_ID = /^t\d+$/;

// Anonymous labels per source
const ANON_LABELS: Record<string, string> = {
  PTT: "匿名車主",
  Reddit: "Reddit User",
  YouTube: "YouTube User",
  Threads: "Threads User",
  Mobile01: "匿名車主",
  RedNote: "匿名用戶",
  X: "匿名車主",
  Facebook: "匿名車主",
};

// Anonymize author for scraped items (privacy)
function anonymizeAuthor(item: Testimonial): string {
  if (HAND_WRITTEN_ID.test(item.id)) return item.author;
  return ANON_LABELS[item.source] || "匿名車主";
}

// Strip fields not needed by the website and anonymize authors
function toWebsiteFormat(item: Testimonial): Testimonial {
  const clean: Testimonial = {
    id: item.id,
    content: item.content,
    source: item.source,
    author: anonymizeAuthor(item),
  };
  if (item.model) clean.model = item.model;
  if (item.rating) clean.rating = item.rating;
  return clean;
}

function parseLimit(): number {
  const idx = process.argv.indexOf("--limit");
  if (idx !== -1 && process.argv[idx + 1]) {
    return parseInt(process.argv[idx + 1], 10) || 20;
  }
  return 20;
}

function main() {
  const limit = parseLimit();
  console.log(`Merge testimonials (limit: ${limit} per locale)\n`);

  if (!existsSync(RAW_DIR)) {
    console.log("No raw/ directory found. Run scrapers first: pnpm fetch:all");
    return;
  }

  // Collect raw items grouped by locale
  const rawByLocale = new Map<string, Testimonial[]>();
  const rawFiles = readdirSync(RAW_DIR).filter((f) => f.endsWith(".json"));

  for (const file of rawFiles) {
    const locale = getLocaleFromFilename(file);
    if (!locale) {
      console.warn(`  Skipping ${file} (unknown locale)`);
      continue;
    }

    const filepath = resolve(RAW_DIR, file);
    const items = JSON.parse(readFileSync(filepath, "utf-8")) as Testimonial[];
    console.log(`  Read ${file}: ${items.length} items -> ${locale}`);

    if (!rawByLocale.has(locale)) rawByLocale.set(locale, []);
    rawByLocale.get(locale)!.push(...items);
  }

  // Merge into each locale
  for (const locale of LOCALES) {
    const outPath = resolve(CONTENT_DIR, `${locale}.json`);
    const existing: Testimonial[] = existsSync(outPath)
      ? JSON.parse(readFileSync(outPath, "utf-8"))
      : [];

    const rawItems = rawByLocale.get(locale) || [];

    // Existing items first (hand-written), then raw items
    const all = [...existing, ...rawItems];

    // Deduplicate by id
    const seen = new Set<string>();
    const unique = all.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    // Clean and cap
    const final = unique.slice(0, limit).map(toWebsiteFormat);

    writeFileSync(outPath, JSON.stringify(final, null, 2) + "\n", "utf-8");
    console.log(
      `  ${locale}.json: ${existing.length} existing + ${rawItems.length} raw -> ${final.length} total`
    );
  }

  console.log("\nDone! Website testimonials updated.");
}

main();
