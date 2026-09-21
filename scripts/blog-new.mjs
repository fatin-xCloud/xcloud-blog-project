#!/usr/bin/env node
// npm run blog:new -- "Post Title" --category Guide [--image path/to/cover.png]
//
// Scaffolds src/content/blog/<slug>.md with every frontmatter field ready
// to fill, mirroring the "Add New Post" step of the xCloud blog workflow.

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BLOG_DIR = join(ROOT, "src", "content", "blog");
const SITE_URL = "https://xcloud.host";
const CATEGORIES = ["Guide", "Tutorial", "News", "WordPress", "Hosting", "Features"];

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") continue;
    else if (a === "--category") args.category = argv[++i];
    else if (a === "--image") args.image = argv[++i];
    else args._.push(a);
  }
  return args;
}

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isoNow() {
  const d = new Date();
  return d.toISOString().replace(/\.\d{3}Z$/, "+00:00");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const title = args._[0];

  if (!title) {
    console.error('Usage: npm run blog:new -- "Post Title" --category Guide [--image path/to/cover.png]');
    process.exit(1);
  }

  const category = args.category && CATEGORIES.includes(args.category) ? args.category : "Guide";
  if (args.category && category !== args.category) {
    console.warn(`⚠  Unknown category "${args.category}", defaulting to "Guide". Valid: ${CATEGORIES.join(" · ")}`);
  }

  const slug = slugify(title);
  const filePath = join(BLOG_DIR, `${slug}.md`);

  if (!existsSync(BLOG_DIR)) mkdirSync(BLOG_DIR, { recursive: true });

  if (existsSync(filePath)) {
    console.error(`✘ ${filePath} already exists. Pick a different title, or edit that file directly.`);
    process.exit(1);
  }

  const ogImage = args.image
    ? `/_landing/blog/${slug}-cover.png`
    : `/_landing/blog/${slug}-cover.png`;

  const frontmatter = `---
title: "${title} - xCloud"
h1: "${title}"
slug: "${slug}"
date: "${isoNow()}"
description: ""
ogImage: "${ogImage}"
category: "${category}"
focusKeyword: ""
faqs: []
draft: true
---

<!--
  Field guide (see docs/BLOG_AUTHORING.md for the full reference):

  - title         SEO <title>, ≤60 chars, keep the "- xCloud" suffix
  - h1             on-page headline, no suffix
  - slug           the live URL — never change after publishing
  - date           ISO, e.g. 2026-09-15T10:00:00+00:00
  - description    meta description, 120–160 chars
  - ogImage        featured image under /_landing/blog/ — thumbnail + social card + hero
  - category       Guide · Tutorial · News · WordPress · Hosting · Features
  - focusKeyword   phrase to rank for — unlocks keyphrase checks in blog:seo
  - faqs           Q&A array, e.g. [{ "q": "...", "a": "..." }] — unlocks FAQ rich result
  - draft          true hides it from the archive; flip to false to publish

  Next steps:
   1. Write ~1000+ words in H2 sections below this comment.
   2. Add a featured image, then run: npm run gen-blog-webp
   3. Run: npm run blog:seo -- ${slug}
   4. Set draft: false, set the real date, open a PR.
-->

## Introduction

Write the opening here.

## Section heading

Write the body here.

## FAQ

Add matching entries to the \`faqs\` field in the frontmatter above.
`;

  writeFileSync(filePath, frontmatter, "utf8");

  console.log(`✔ Created src/content/blog/${slug}.md  (draft)`);
  console.log(`  URL when published: ${SITE_URL}/${slug}/`);
  console.log("");
  console.log("Next:");
  console.log(`  1. Write the post (or ask Claude Code to draft it).`);
  console.log(`  2. Drop a cover image in public/_landing/blog/, then: npm run gen-blog-webp`);
  console.log(`  3. npm run blog:seo -- ${slug}`);
  console.log(`  4. Set draft: false, then open a PR.`);
}

main();
