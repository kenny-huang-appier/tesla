/**
 * YouTube Data API v3 scraper
 * Searches Tesla-related videos and fetches comments
 *
 * Env: YOUTUBE_API_KEY
 * Output: raw/youtube-{locale}.json
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

const API_KEY = process.env.YOUTUBE_API_KEY;
const BASE = "https://www.googleapis.com/youtube/v3";
const limiter = new RateLimiter(200);

interface SearchItem {
  id: { videoId: string };
  snippet: { title: string };
}

interface CommentItem {
  snippet: {
    topLevelComment: {
      snippet: {
        authorDisplayName: string;
        textDisplay: string;
        likeCount: number;
      };
    };
  };
}

const SEARCH_QUERIES: Record<string, string[]> = {
  "zh-TW": ["特斯拉 車主心得", "特斯拉 開箱", "Tesla 台灣 車主"],
  en: ["Tesla owner review", "Tesla owner experience", "why I bought Tesla"],
  ja: ["テスラ オーナー レビュー", "テスラ 購入", "Tesla オーナー"],
  ko: ["테슬라 후기", "테슬라 오너 리뷰", "Tesla 구매 후기"],
};

async function searchVideos(query: string, locale: string): Promise<string[]> {
  await limiter.wait();
  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    maxResults: "5",
    relevanceLanguage: locale.split("-")[0],
    key: API_KEY!,
  });
  const data = await withRetry(() =>
    fetchJSON<{ items: SearchItem[] }>(`${BASE}/search?${params}`)
  );
  return data.items.map((item) => item.id.videoId);
}

async function getComments(videoId: string): Promise<CommentItem[]> {
  await limiter.wait();
  const params = new URLSearchParams({
    part: "snippet",
    videoId,
    maxResults: "20",
    order: "relevance",
    key: API_KEY!,
  });
  try {
    const data = await withRetry(() =>
      fetchJSON<{ items: CommentItem[] }>(`${BASE}/commentThreads?${params}`)
    );
    return data.items || [];
  } catch {
    // Comments may be disabled
    return [];
  }
}

async function scrapeLocale(locale: string): Promise<Testimonial[]> {
  const queries = SEARCH_QUERIES[locale] || SEARCH_QUERIES.en;
  const videoIds = new Set<string>();

  for (const query of queries) {
    console.log(`  Searching: "${query}"`);
    const ids = await searchVideos(query, locale);
    ids.forEach((id) => videoIds.add(id));
  }

  console.log(`  Found ${videoIds.size} unique videos`);

  const testimonials: Testimonial[] = [];

  for (const videoId of videoIds) {
    const comments = await getComments(videoId);
    for (const comment of comments) {
      const { textDisplay, authorDisplayName, likeCount } =
        comment.snippet.topLevelComment.snippet;

      // Strip HTML tags from YouTube comments
      const cleanText = textDisplay.replace(/<[^>]+>/g, " ").trim();

      if (!filterContent(cleanText) || likeCount < 1) continue;

      testimonials.push({
        id: generateId("youtube", cleanText),
        content: truncate(cleanText),
        source: "YouTube",
        author: authorDisplayName,
        model: extractModel(cleanText),
        url: `https://www.youtube.com/watch?v=${videoId}`,
        fetchedAt: new Date().toISOString(),
      });
    }
  }

  // Deduplicate by id, take top items
  const seen = new Set<string>();
  return testimonials.filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  }).slice(0, 30);
}

async function main() {
  if (!API_KEY) {
    console.error("Error: YOUTUBE_API_KEY not set in .env.local");
    process.exit(1);
  }

  console.log("YouTube scraper starting...");

  for (const locale of Object.keys(SEARCH_QUERIES)) {
    console.log(`\nScraping locale: ${locale}`);
    try {
      const results = await scrapeLocale(locale);
      writeRawOutput(`youtube-${locale}.json`, results);
    } catch (err) {
      console.error(`  Error scraping ${locale}:`, err);
    }
  }

  console.log("\nYouTube scraper done.");
}

main();
