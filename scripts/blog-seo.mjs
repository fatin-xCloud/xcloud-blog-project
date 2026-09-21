#!/usr/bin/env node
// npm run blog:seo -- <slug>
//
// Scores a post 0–100 against the same checks Rank Math ran in WordPress,
// and names the exact fix for anything that falls short.

import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BLOG_DIR = join(ROOT, "src", "content", "blog");

const WEIGHTS = {
  titleLength: 10,
  descriptionLength: 15,
  contentLength: 15,
  headings: 10,
  featuredImage: 15,
  altText: 5,
  internalLinks: 10,
  faqSchema: 10,
  focusKeyword: 10,
};

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { fm: {}, body: raw };
  const fm = {};
  const lines = match[1].split("\n");
  let currentKey = null;
  for (const line of lines) {
    const kv = line.match(/^([a-zA-Z]+):\s*(.*)$/);
    if (kv) {
      currentKey = kv[1];
      let val = kv[2].trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      fm[currentKey] = val;
    }
  }
  const body = raw.slice(match[0].length);
  return { fm, body };
}

function countWords(md) {
  const stripped = md
    .replace(/```[\s\S]*?```/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/[#*_`>\-]/g, " ");
  return stripped.split(/\s+/).filter(Boolean).length;
}

function countHeadings(md) {
  return (md.match(/^##\s+.+$/gm) || []).length;
}

function countImagesWithoutAlt(md) {
  const images = md.match(/!\[[^\]]*\]\([^)]+\)/g) || [];
  return images.filter((img) => /^!\[\s*\]/.test(img)).length;
}

function countInternalLinks(md) {
  const links = md.match(/\[[^\]]+\]\((?!http)[^)]+\)/g) || [];
  const xcloudLinks = md.match(/\[[^\]]+\]\(https?:\/\/(www\.)?xcloud\.host[^)]*\)/g) || [];
  return links.length + xcloudLinks.length;
}

function check(label, ok, detail, fix) {
  const mark = ok ? "✔" : "▲";
  console.log(`  ${mark}  ${label}${detail ? ` (${detail})` : ""}`);
  if (!ok && fix) console.log(`       → ${fix}`);
}

function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Usage: npm run blog:seo -- <slug>");
    process.exit(1);
  }

  const filePath = join(BLOG_DIR, `${slug}.md`);
  if (!existsSync(filePath)) {
    console.error(`✘ src/content/blog/${slug}.md not found. Run npm run blog:new first.`);
    process.exit(1);
  }

  const raw = readFileSync(filePath, "utf8");
  const { fm, body } = parseFrontmatter(raw);

  let score = 0;
  const maxScore = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);

  console.log("");

  // Title
  const titleLen = (fm.title || "").length;
  const titleOk = titleLen > 0 && titleLen <= 60;
  if (titleOk) score += WEIGHTS.titleLength;
  check(`SEO title present, ≤60 chars`, titleOk, `${titleLen}`, "Trim the title to ≤60 chars.");

  // Description
  const descLen = (fm.description || "").length;
  const descOk = descLen >= 120 && descLen <= 160;
  if (descOk) score += WEIGHTS.descriptionLength;
  check(`Meta description 120–160 chars`, descOk, `${descLen}`, "Write a meta description between 120 and 160 characters.");

  // Content length
  const wordCount = countWords(body);
  const contentOk = wordCount >= 800;
  if (contentOk) score += WEIGHTS.contentLength;
  check(`Content length (${wordCount} words)`, contentOk, null, "Aim for 800+ words, ideally 1000–1500.");

  // Headings
  const headingCount = countHeadings(body);
  const headingsOk = headingCount >= 3;
  if (headingsOk) score += WEIGHTS.headings;
  check(`Enough H2 sections (${headingCount})`, headingsOk, null, "Add more ## subheadings to break up the content.");

  // Featured image
  const hasOgImage = Boolean(fm.ogImage);
  if (hasOgImage) score += WEIGHTS.featuredImage;
  check(`Featured image set`, hasOgImage, fm.ogImage || "not set", "Set ogImage in the frontmatter, then run npm run gen-blog-webp.");

  // Alt text
  const missingAlt = countImagesWithoutAlt(body);
  const altOk = missingAlt === 0;
  if (altOk) score += WEIGHTS.altText;
  check(`Alt text on body images`, altOk, missingAlt ? `${missingAlt} missing` : null, "Add alt text to every image: ![description](path).");

  // Internal links
  const internalLinks = countInternalLinks(body);
  const linksOk = internalLinks >= 2;
  if (linksOk) score += WEIGHTS.internalLinks;
  check(`2+ internal links to other xCloud pages`, linksOk, `${internalLinks}`, "Link to 2+ other pages on xcloud.host.");

  // FAQ schema
  const faqCount = (fm.faqs && fm.faqs !== "[]") ? (fm.faqs.match(/"q"/g) || []).length || 1 : 0;
  const faqOk = faqCount >= 2;
  if (faqOk) score += WEIGHTS.faqSchema;
  check(`FAQ schema (${faqCount} Q&A)`, faqOk, null, "Add 2+ entries to the faqs array in the frontmatter.");

  // Focus keyword
  const keyword = (fm.focusKeyword || "").toLowerCase();
  const keywordOk =
    keyword.length > 0 &&
    (fm.title || "").toLowerCase().includes(keyword) &&
    (fm.description || "").toLowerCase().includes(keyword);
  if (keywordOk) score += WEIGHTS.focusKeyword;
  check(`Focus keyphrase in title & description`, keywordOk, keyword || "not set", "Set focusKeyword, then make sure it appears in the title, description, and first paragraph.");

  const pct = Math.round((score / maxScore) * 100);
  console.log("");
  console.log(`SEO score  ${pct}/100`);
  if (pct < 80) {
    console.log(`Aim for 80+ before publishing.`);
  }
  console.log("");
}

main();
