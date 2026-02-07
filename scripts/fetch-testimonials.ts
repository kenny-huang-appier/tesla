/**
 * Master orchestrator - runs all scrapers sequentially
 * Usage: pnpm fetch:all
 */

import { execSync } from "child_process";
import { resolve } from "path";
import { loadEnv } from "./scrapers/utils.js";

loadEnv();

interface ScraperConfig {
  name: string;
  script: string;
  envRequired: string[];
}

const SCRAPERS: ScraperConfig[] = [
  {
    name: "YouTube",
    script: "scripts/scrapers/youtube.ts",
    envRequired: ["YOUTUBE_API_KEY"],
  },
  {
    name: "Reddit",
    script: "scripts/scrapers/reddit.ts",
    envRequired: ["REDDIT_CLIENT_ID", "REDDIT_CLIENT_SECRET"],
  },
  {
    name: "PTT",
    script: "scripts/scrapers/ptt.ts",
    envRequired: [],
  },
  {
    name: "Threads",
    script: "scripts/scrapers/threads.ts",
    envRequired: ["THREADS_ACCESS_TOKEN"],
  },
  {
    name: "Mobile01",
    script: "scripts/scrapers/mobile01.ts",
    envRequired: [],
  },
  {
    name: "RedNote",
    script: "scripts/scrapers/rednote.ts",
    envRequired: ["RAPIDAPI_KEY"],
  },
];

function checkEnv(vars: string[]): boolean {
  return vars.every((v) => process.env[v]);
}

async function main() {
  console.log("=== Tesla Testimonials Fetcher ===\n");

  const results: Array<{ name: string; status: string }> = [];

  for (const scraper of SCRAPERS) {
    const hasEnv = checkEnv(scraper.envRequired);

    if (!hasEnv && scraper.envRequired.length > 0) {
      console.log(
        `[SKIP] ${scraper.name} - missing env: ${scraper.envRequired.join(", ")}`
      );
      results.push({ name: scraper.name, status: "skipped (missing env)" });
      continue;
    }

    console.log(`\n[RUN] ${scraper.name}`);
    console.log("─".repeat(40));

    try {
      const scriptPath = resolve(process.cwd(), scraper.script);
      execSync(`npx tsx ${scriptPath}`, {
        stdio: "inherit",
        env: process.env,
        cwd: process.cwd(),
      });
      results.push({ name: scraper.name, status: "success" });
    } catch (err) {
      console.error(`[ERROR] ${scraper.name} failed:`, err);
      results.push({ name: scraper.name, status: "failed" });
    }
  }

  // Summary
  console.log("\n" + "=".repeat(40));
  console.log("Summary:");
  for (const r of results) {
    const icon =
      r.status === "success" ? "OK" : r.status.startsWith("skipped") ? "--" : "!!";
    console.log(`  [${icon}] ${r.name}: ${r.status}`);
  }
}

main();
