/**
 * Reddit REST API + OAuth2 scraper
 * Searches Tesla subreddits for owner experiences
 *
 * Env: REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET
 * Output: raw/reddit-en.json
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

const CLIENT_ID = process.env.REDDIT_CLIENT_ID;
const CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET;
const limiter = new RateLimiter(1000);

const SUBREDDITS = ["teslamotors", "TeslaModel3", "ModelY"];
const SEARCH_QUERIES = [
  "Tesla owner experience",
  "love my Tesla",
  "Tesla review owner",
];

interface RedditPost {
  data: {
    id: string;
    title: string;
    selftext: string;
    author: string;
    score: number;
    permalink: string;
    num_comments: number;
  };
}

interface RedditComment {
  data: {
    id: string;
    body: string;
    author: string;
    score: number;
    permalink: string;
  };
}

async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "TeslaTestimonials/1.0",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) throw new Error(`Reddit auth failed: ${res.status}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function searchSubreddit(
  token: string,
  subreddit: string,
  query: string
): Promise<RedditPost[]> {
  await limiter.wait();
  const params = new URLSearchParams({
    q: query,
    sort: "relevance",
    t: "year",
    limit: "10",
  });
  const data = await withRetry(() =>
    fetchJSON<{ data: { children: RedditPost[] } }>(
      `https://oauth.reddit.com/r/${subreddit}/search?${params}&restrict_sr=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": "TeslaTestimonials/1.0",
        },
      }
    )
  );
  return data.data.children;
}

async function getPostComments(
  token: string,
  permalink: string
): Promise<RedditComment[]> {
  await limiter.wait();
  try {
    const data = await withRetry(() =>
      fetchJSON<Array<{ data: { children: RedditComment[] } }>>(
        `https://oauth.reddit.com${permalink}.json?limit=10&sort=best`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "User-Agent": "TeslaTestimonials/1.0",
          },
        }
      )
    );
    // First element is the post, second is comments
    return data[1]?.data?.children || [];
  } catch {
    return [];
  }
}

async function main() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error(
      "Error: REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET not set in .env.local"
    );
    process.exit(1);
  }

  console.log("Reddit scraper starting...");
  const token = await getAccessToken();
  console.log("  OAuth token acquired");

  const testimonials: Testimonial[] = [];

  for (const subreddit of SUBREDDITS) {
    for (const query of SEARCH_QUERIES) {
      console.log(`  Searching r/${subreddit}: "${query}"`);
      try {
        const posts = await searchSubreddit(token, subreddit, query);

        for (const post of posts) {
          const { selftext, author, score, permalink, title } = post.data;

          // Use selftext (post body) if substantial
          if (selftext && filterContent(selftext) && score >= 5) {
            testimonials.push({
              id: generateId("reddit", selftext),
              content: truncate(selftext),
              source: "Reddit",
              author: `u/${author}`,
              model: extractModel(selftext + " " + title),
              url: `https://reddit.com${permalink}`,
              fetchedAt: new Date().toISOString(),
            });
          }

          // Also grab top comments
          if (post.data.num_comments > 0) {
            const comments = await getPostComments(token, permalink);
            for (const comment of comments) {
              if (!comment.data?.body) continue;
              const { body, author: cAuthor, score: cScore } = comment.data;
              if (filterContent(body) && cScore >= 3) {
                testimonials.push({
                  id: generateId("reddit", body),
                  content: truncate(body),
                  source: "Reddit",
                  author: `u/${cAuthor}`,
                  model: extractModel(body),
                  url: `https://reddit.com${permalink}`,
                  fetchedAt: new Date().toISOString(),
                });
              }
            }
          }
        }
      } catch (err) {
        console.error(`  Error searching r/${subreddit}:`, err);
      }
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  const unique = testimonials.filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  }).slice(0, 30);

  writeRawOutput("reddit-en.json", unique);
  console.log("\nReddit scraper done.");
}

main();
