/**
 * Meta Threads API scraper
 * Uses keyword_search to find Tesla-related posts
 *
 * Env: THREADS_ACCESS_TOKEN
 * Output: raw/threads-{locale}.json
 */

import {
  loadEnv,
  RateLimiter,
  withRetry,
  fetchJSON,
  filterContent,
  extractModel,
  generateId,
  truncate,
  writeRawOutput,
} from "./utils.js";
import type { Testimonial } from "../../src/types/index.js";

loadEnv();

const ACCESS_TOKEN = process.env.THREADS_ACCESS_TOKEN;
const BASE = "https://graph.threads.net/v1.0";
const limiter = new RateLimiter(500);

const SEARCH_QUERIES: Record<string, string[]> = {
  "zh-TW": ["特斯拉 車主", "Tesla 心得", "特斯拉 開箱"],
  en: ["Tesla owner review", "love my Tesla", "Tesla experience"],
  ja: ["テスラ オーナー", "テスラ レビュー"],
  ko: ["테슬라 후기", "테슬라 오너"],
};

interface ThreadsPost {
  id: string;
  text?: string;
  username?: string;
  timestamp?: string;
}

async function searchThreads(query: string): Promise<ThreadsPost[]> {
  await limiter.wait();
  const params = new URLSearchParams({
    q: query,
    fields: "id,text,username,timestamp",
    access_token: ACCESS_TOKEN!,
  });

  try {
    const data = await withRetry(() =>
      fetchJSON<{ data: ThreadsPost[] }>(
        `${BASE}/keyword_search?${params}`
      )
    );
    return data.data || [];
  } catch (err) {
    console.error(`  Search error for "${query}":`, err);
    return [];
  }
}

async function scrapeLocale(locale: string): Promise<Testimonial[]> {
  const queries = SEARCH_QUERIES[locale] || SEARCH_QUERIES.en;
  const testimonials: Testimonial[] = [];

  for (const query of queries) {
    console.log(`  Searching: "${query}"`);
    const posts = await searchThreads(query);

    for (const post of posts) {
      if (!post.text || !filterContent(post.text)) continue;

      testimonials.push({
        id: generateId("threads", post.text),
        content: truncate(post.text),
        source: "Threads",
        author: post.username ? `@${post.username}` : "Threads user",
        model: extractModel(post.text),
        url: `https://www.threads.net/@${post.username}/post/${post.id}`,
        fetchedAt: new Date().toISOString(),
      });
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  return testimonials.filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  }).slice(0, 30);
}

async function main() {
  if (!ACCESS_TOKEN) {
    console.error("Error: THREADS_ACCESS_TOKEN not set in .env.local");
    process.exit(1);
  }

  console.log("Threads scraper starting...");

  for (const locale of Object.keys(SEARCH_QUERIES)) {
    console.log(`\nScraping locale: ${locale}`);
    try {
      const results = await scrapeLocale(locale);
      writeRawOutput(`threads-${locale}.json`, results);
    } catch (err) {
      console.error(`  Error scraping ${locale}:`, err);
    }
  }

  console.log("\nThreads scraper done.");
}

main();
