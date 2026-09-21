#!/usr/bin/env node
// npm run gen-blog-webp
//
// Resizes every image in public/_landing/blog/ to a 1200x630 (16:9) cover
// and writes a companion .webp alongside it, targeting ~40KB thumbnails.
//
// Uses "sharp" if it's installed (npm install --save-dev sharp). Without
// it, this prints what it would do so the step still runs in a bare
// scaffold.

import { existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const IMG_DIR = join(ROOT, "public", "_landing", "blog");
const TARGET_WIDTH = 1200;
const TARGET_HEIGHT = 630;
const SOURCE_EXTS = [".png", ".jpg", ".jpeg"];

function formatKb(bytes) {
  return `${Math.round(bytes / 1024)}KB`;
}

async function main() {
  if (!existsSync(IMG_DIR)) {
    console.log(`No images yet — create public/_landing/blog/ and drop a cover image in.`);
    return;
  }

  const files = readdirSync(IMG_DIR).filter((f) => SOURCE_EXTS.includes(extname(f).toLowerCase()));

  if (files.length === 0) {
    console.log(`No source images found in public/_landing/blog/ (looking for .png, .jpg, .jpeg).`);
    return;
  }

  let sharp;
  try {
    ({ default: sharp } = await import("sharp"));
  } catch {
    console.log(`"sharp" isn't installed — showing what would run:`);
    console.log(`  npm install --save-dev sharp`);
    console.log("");
    for (const file of files) {
      const src = join(IMG_DIR, file);
      const sizeBefore = statSync(src).size;
      const webpName = `${basename(file, extname(file))}.webp`;
      console.log(`  ${file} (${formatKb(sizeBefore)}) → ${webpName}  [resize ${TARGET_WIDTH}x${TARGET_HEIGHT}, quality ~80]`);
    }
    return;
  }

  for (const file of files) {
    const src = join(IMG_DIR, file);
    const sizeBefore = statSync(src).size;
    const webpName = `${basename(file, extname(file))}.webp`;
    const dest = join(IMG_DIR, webpName);

    await sharp(src)
      .resize(TARGET_WIDTH, TARGET_HEIGHT, { fit: "cover" })
      .webp({ quality: 80 })
      .toFile(dest);

    const sizeAfter = statSync(dest).size;
    console.log(`✔ ${file} (${formatKb(sizeBefore)}) → ${webpName} (${formatKb(sizeAfter)})`);

    if (sizeAfter > 60 * 1024) {
      console.log(`  ⚠ still over ~60KB — consider a simpler source image or lower quality.`);
    }
  }

  console.log("");
  console.log(`Done. Point ogImage at the .webp path in the post's frontmatter.`);
}

main();
