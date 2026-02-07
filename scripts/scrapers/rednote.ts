/**
 * 小紅書 scraper via RapidAPI proxy
 * Searches for Tesla owner notes
 *
 * Env: RAPIDAPI_KEY
 * Output: raw/rednote-zh-TW.json
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

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = "xiaohongshu-scraper.p.rapidapi.com";
const limiter = new RateLimiter(1000);

const SEARCH_QUERIES = [
  "特斯拉 车主",
  "特斯拉 提车",
  "Tesla 用车体验",
  "特斯拉 真实感受",
];

interface RedNoteItem {
  id?: string;
  note_id?: string;
  title?: string;
  desc?: string;
  content?: string;
  user?: {
    nickname?: string;
    user_id?: string;
  };
  nickname?: string;
  likes_count?: number;
}

async function searchRedNote(query: string): Promise<RedNoteItem[]> {
  await limiter.wait();
  const params = new URLSearchParams({
    keyword: query,
    page: "1",
    sort: "general",
  });

  try {
    const data = await withRetry(() =>
      fetchJSON<{ data: { items: RedNoteItem[] } } | { items: RedNoteItem[] }>(
        `https://${RAPIDAPI_HOST}/search/notes?${params}`,
        {
          headers: {
            "X-RapidAPI-Key": RAPIDAPI_KEY!,
            "X-RapidAPI-Host": RAPIDAPI_HOST,
          },
        }
      )
    );

    // Handle different response shapes
    if ("data" in data && data.data?.items) return data.data.items;
    if ("items" in data) return data.items;
    return [];
  } catch (err) {
    console.error(`  Search error for "${query}":`, err);
    return [];
  }
}

async function main() {
  if (!RAPIDAPI_KEY) {
    console.error("Error: RAPIDAPI_KEY not set in .env.local");
    process.exit(1);
  }

  console.log("RedNote (小紅書) scraper starting...");

  const testimonials: Testimonial[] = [];

  for (const query of SEARCH_QUERIES) {
    console.log(`  Searching: "${query}"`);
    const items = await searchRedNote(query);

    for (const item of items) {
      const text = item.desc || item.content || item.title || "";
      if (!filterContent(text)) continue;

      const author =
        item.user?.nickname || item.nickname || "小紅書用戶";
      const noteId = item.note_id || item.id || "";

      testimonials.push({
        id: generateId("rednote", text),
        content: truncate(text),
        source: "RedNote",
        author,
        model: extractModel(text),
        url: noteId
          ? `https://www.xiaohongshu.com/explore/${noteId}`
          : undefined,
        fetchedAt: new Date().toISOString(),
      });
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  const unique = testimonials.filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  }).slice(0, 30);

  writeRawOutput("rednote-zh-TW.json", unique);
  console.log("\nRedNote scraper done.");
}

main();
