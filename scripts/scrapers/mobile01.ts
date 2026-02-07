/**
 * Mobile01 scraper
 *
 * Mobile01 uses Akamai bot protection that blocks all automated HTTP requests.
 * This scraper uses a two-pronged approach:
 *
 * 1. Automated: Tries to fetch known Tesla articles via direct access and
 *    Google Cache. Due to bot protection, this may yield 0 results.
 *
 * 2. Manual: Reads from a manually-curated JSON file at
 *    scripts/scrapers/mobile01-input.json (see --manual for format).
 *
 * Usage:
 *   pnpm fetch:mobile01              # Try automated + read manual input
 *   pnpm fetch:mobile01 -- --manual  # Print manual input instructions
 *
 * Env: none required
 * Output: raw/mobile01-zh-TW.json
 */

import * as cheerio from "cheerio";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import {
  RateLimiter,
  filterContent,
  extractModel,
  generateId,
  truncate,
  writeRawOutput,
} from "./utils.js";
import type { Testimonial } from "../../src/types/index.js";

const limiter = new RateLimiter(3000);

const HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
  Connection: "keep-alive",
};

// Known Tesla-related Mobile01 article URLs (Tesla forum f=741)
const KNOWN_URLS = [
  "https://www.mobile01.com/topicdetail.php?f=741&t=7103938",
  "https://www.mobile01.com/topicdetail.php?f=741&t=7218732",
  "https://www.mobile01.com/topicdetail.php?f=741&t=7077063",
  "https://www.mobile01.com/topicdetail.php?f=741&t=7155202",
  "https://www.mobile01.com/topicdetail.php?f=741&t=7044825",
  "https://www.mobile01.com/topicdetail.php?f=741&t=7006592",
  "https://www.mobile01.com/topicdetail.php?f=741&t=6957401",
  "https://www.mobile01.com/topicdetail.php?f=741&t=6899250",
];

const MANUAL_INPUT_PATH = resolve(
  process.cwd(),
  "scripts/scrapers/mobile01-input.json"
);

async function tryFetchDirect(url: string): Promise<string | null> {
  try {
    await limiter.wait();
    const res = await fetch(url, { headers: HEADERS, redirect: "follow" });
    if (!res.ok) return null;
    const html = await res.text();
    if (
      html.includes("Access Denied") ||
      html.includes("edgesuite.net") ||
      html.includes("g-recaptcha") ||
      html.length < 5000
    ) {
      return null;
    }
    return html;
  } catch {
    return null;
  }
}

async function tryFetchGoogleCache(url: string): Promise<string | null> {
  try {
    await limiter.wait();
    const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(url)}`;
    const res = await fetch(cacheUrl, { headers: HEADERS, redirect: "follow" });
    if (!res.ok) return null;
    const html = await res.text();
    // Must NOT contain reCAPTCHA and must be substantial
    if (
      html.includes("g-recaptcha") ||
      html.includes("Google Search") ||
      html.length < 10000
    ) {
      return null;
    }
    return html;
  } catch {
    return null;
  }
}

function parseArticlePage(
  html: string
): Array<{ author: string; content: string }> {
  const $ = cheerio.load(html);
  const entries: Array<{ author: string; content: string }> = [];

  const selectors = [
    ".l-post",
    "[class*='article-content']",
    ".post-content",
    ".single-post",
    "article",
  ];

  for (const selector of selectors) {
    $(selector).each((_, el) => {
      const author =
        $(el)
          .find(
            "[class*='userid'], [class*='user-name'], .author-name"
          )
          .first()
          .text()
          .trim() || "Mobile01 用戶";
      const content =
        $(el)
          .find(
            "[class*='postContent'], [class*='post-content'], .article-content-inner"
          )
          .first()
          .text()
          .trim() || $(el).text().trim();
      if (content && content.length > 30) {
        entries.push({ author, content });
      }
    });
    if (entries.length > 0) break;
  }

  return entries;
}

interface ManualInput {
  content: string;
  author?: string;
  model?: string;
  url?: string;
}

function loadManualInput(): Testimonial[] {
  if (!existsSync(MANUAL_INPUT_PATH)) return [];

  console.log(`  Reading manual input from ${MANUAL_INPUT_PATH}`);
  const data = JSON.parse(
    readFileSync(MANUAL_INPUT_PATH, "utf-8")
  ) as ManualInput[];

  return data
    .filter((item) => filterContent(item.content, 20))
    .map((item) => ({
      id: generateId("mobile01", item.content),
      content: truncate(item.content),
      source: "Mobile01" as const,
      author: item.author || "Mobile01 用戶",
      model: item.model || extractModel(item.content),
      url: item.url,
      fetchedAt: new Date().toISOString(),
    }));
}

function printManualInstructions() {
  console.log("\n=== Mobile01 Manual Input Instructions ===\n");
  console.log(
    "Mobile01 uses Akamai bot protection that blocks automated access."
  );
  console.log("To add Mobile01 testimonials manually:\n");
  console.log("1. Browse Tesla forum: https://www.mobile01.com/topiclist.php?f=741");
  console.log("2. Find interesting owner reviews/comments");
  console.log(`3. Create ${MANUAL_INPUT_PATH} with this format:\n`);
  console.log(
    JSON.stringify(
      [
        {
          content:
            "在這裡貼上車主評價內容，需包含 Tesla 或特斯拉等關鍵字...",
          author: "Mobile01 用戶名",
          model: "Model Y",
          url: "https://www.mobile01.com/topicdetail.php?f=741&t=XXXXXXX",
        },
      ],
      null,
      2
    )
  );
  console.log("\n4. Run: pnpm fetch:mobile01");
}

async function main() {
  if (process.argv.includes("--manual")) {
    printManualInstructions();
    return;
  }

  console.log("Mobile01 scraper starting...");

  const testimonials: Testimonial[] = [];

  // Strategy 1: Load manual input if available
  const manualItems = loadManualInput();
  if (manualItems.length > 0) {
    console.log(`  Loaded ${manualItems.length} items from manual input`);
    testimonials.push(...manualItems);
  }

  // Strategy 2: Try automated fetching
  console.log(
    `  Trying ${KNOWN_URLS.length} known URLs (direct + Google Cache)...`
  );
  let successCount = 0;

  for (const url of KNOWN_URLS) {
    process.stdout.write(`  ${url} ... `);

    let html = await tryFetchDirect(url);
    if (html) {
      console.log("direct OK");
      successCount++;
    } else {
      html = await tryFetchGoogleCache(url);
      if (html) {
        console.log("cache OK");
        successCount++;
      } else {
        console.log("blocked");
        continue;
      }
    }

    const entries = parseArticlePage(html);
    for (const entry of entries) {
      if (!filterContent(entry.content)) continue;
      testimonials.push({
        id: generateId("mobile01", entry.content),
        content: truncate(entry.content),
        source: "Mobile01",
        author: entry.author,
        model: extractModel(entry.content),
        url,
        fetchedAt: new Date().toISOString(),
      });
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  const unique = testimonials
    .filter((t) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    })
    .slice(0, 30);

  writeRawOutput("mobile01-zh-TW.json", unique);

  if (unique.length === 0 && manualItems.length === 0) {
    console.log(
      "\n  No results from automated fetching (Akamai bot protection)."
    );
    console.log(
      "  Use --manual flag for instructions: pnpm fetch:mobile01 -- --manual"
    );
  }

  console.log("\nMobile01 scraper done.");
}

main();
