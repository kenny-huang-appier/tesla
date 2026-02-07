/**
 * PTT web scraper using cheerio
 * Scrapes car board for Tesla-related posts and push comments
 *
 * Env: none required
 * Output: raw/ptt-zh-TW.json
 */

import * as cheerio from "cheerio";
import {
  RateLimiter,
  filterContent,
  extractModel,
  generateId,
  truncate,
  writeRawOutput,
} from "./utils.js";
import type { Testimonial } from "../../src/types/index.js";

const BASE_URL = "https://www.ptt.cc";
const BOARD = "car";
const limiter = new RateLimiter(2000);

// Full browser-like headers to avoid Cloudflare blocking
const HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
  "Accept-Encoding": "gzip, deflate, br",
  Cookie: "over18=1",
  Connection: "keep-alive",
  "Upgrade-Insecure-Requests": "1",
};

const TESLA_TITLE_KEYWORDS = [
  "tesla",
  "特斯拉",
  "model 3",
  "model y",
  "model s",
  "model x",
  "cybertruck",
];

async function fetchPage(url: string, retries = 3): Promise<string> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      await limiter.wait();
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
      return await res.text();
    } catch (err) {
      const isLast = attempt === retries - 1;
      if (isLast) throw err;
      const delay = Math.pow(2, attempt) * 2000;
      console.warn(
        `  Retry ${attempt + 1}/${retries} for ${url} after ${delay}ms...`
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("Unreachable");
}

interface PostLink {
  title: string;
  href: string;
}

async function getPostLinks(pages = 3): Promise<PostLink[]> {
  const links: PostLink[] = [];
  let indexUrl = `${BASE_URL}/bbs/${BOARD}/index.html`;

  for (let i = 0; i < pages; i++) {
    console.log(`  Fetching page: ${indexUrl}`);
    try {
      const html = await fetchPage(indexUrl);
      const $ = cheerio.load(html);

      // Get post links
      $(".r-ent").each((_, el) => {
        const titleEl = $(el).find(".title a");
        const title = titleEl.text().trim();
        const href = titleEl.attr("href");
        if (!title || !href) return;

        const lower = title.toLowerCase();
        const isTesla = TESLA_TITLE_KEYWORDS.some((kw) => lower.includes(kw));
        if (isTesla) {
          links.push({ title, href: `${BASE_URL}${href}` });
        }
      });

      // Navigate to previous page
      const prevLink = $(".btn-group-paging a")
        .filter((_, el) => $(el).text().includes("上頁"))
        .attr("href");
      if (!prevLink) break;
      indexUrl = `${BASE_URL}${prevLink}`;
    } catch (err) {
      console.error(`  Error fetching page ${indexUrl}:`, err);
      break;
    }
  }

  return links;
}

// Also search via PTT web search for more results
async function searchPtt(query: string): Promise<PostLink[]> {
  const links: PostLink[] = [];
  const searchUrl = `https://www.ptt.cc/bbs/${BOARD}/search?q=${encodeURIComponent(query)}`;

  console.log(`  Searching PTT: "${query}"`);
  try {
    const html = await fetchPage(searchUrl);
    const $ = cheerio.load(html);

    $(".r-ent").each((_, el) => {
      const titleEl = $(el).find(".title a");
      const title = titleEl.text().trim();
      const href = titleEl.attr("href");
      if (!title || !href) return;
      links.push({ title, href: `${BASE_URL}${href}` });
    });
  } catch (err) {
    console.warn(`  Search failed for "${query}":`, err);
  }

  return links;
}

interface ParsedArticle {
  author: string;
  content: string;
  pushes: Array<{ author: string; content: string }>;
}

async function parseArticle(url: string): Promise<ParsedArticle | null> {
  try {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    // Extract article metadata
    const metalines = $(".article-metaline");
    let author = "匿名";
    metalines.each((_, el) => {
      const tag = $(el).find(".article-meta-tag").text();
      if (tag === "作者") {
        author = $(el).find(".article-meta-value").text().split(" ")[0];
      }
    });

    // Extract main content (between metalines and pushes)
    const mainContent = $("#main-content").clone();
    mainContent
      .find(".article-metaline, .article-metaline-right, .push")
      .remove();
    const content = mainContent.text().replace(/--\n[\s\S]*$/, "").trim();

    // Extract push comments
    const pushes: Array<{ author: string; content: string }> = [];
    $(".push").each((_, el) => {
      const tag = $(el).find(".push-tag").text().trim();
      if (tag !== "推") return; // Only positive pushes
      const pushAuthor = $(el).find(".push-userid").text().trim();
      const pushContent = $(el)
        .find(".push-content")
        .text()
        .replace(/^:\s*/, "")
        .trim();
      if (pushContent) {
        pushes.push({ author: pushAuthor, content: pushContent });
      }
    });

    return { author, content, pushes };
  } catch (err) {
    console.error(`  Error parsing article: ${url}`, err);
    return null;
  }
}

async function main() {
  console.log("PTT scraper starting...");

  // Strategy 1: Browse recent pages
  const postLinks = await getPostLinks(5);

  // Strategy 2: Also search for Tesla-specific posts
  const searchQueries = ["Tesla", "特斯拉", "Model 3", "Model Y"];
  for (const q of searchQueries) {
    const results = await searchPtt(q);
    postLinks.push(...results);
  }

  // Deduplicate by URL
  const uniquePosts = Array.from(
    new Map(postLinks.map((p) => [p.href, p])).values()
  );
  console.log(`  Found ${uniquePosts.length} unique Tesla-related posts`);

  const testimonials: Testimonial[] = [];

  for (const post of uniquePosts) {
    console.log(`  Parsing: ${post.title}`);
    const article = await parseArticle(post.href);
    if (!article) continue;

    // Use the article content as a testimonial if it passes filter
    if (filterContent(article.content, 50)) {
      testimonials.push({
        id: generateId("ptt", article.content),
        content: truncate(article.content),
        source: "PTT",
        author: article.author,
        model: extractModel(article.content + " " + post.title),
        url: post.href,
        fetchedAt: new Date().toISOString(),
      });
    }

    // Also include quality push comments
    for (const push of article.pushes) {
      if (filterContent(push.content)) {
        testimonials.push({
          id: generateId("ptt", push.content),
          content: truncate(push.content),
          source: "PTT",
          author: push.author,
          model: extractModel(push.content + " " + post.title),
          url: post.href,
          fetchedAt: new Date().toISOString(),
        });
      }
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

  writeRawOutput("ptt-zh-TW.json", unique);
  console.log("\nPTT scraper done.");
}

main();
