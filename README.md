# xcloud-blog-workflow

Git-native workflow for writing the xCloud blog, plus an animated landing page (`index.html`) that walks through it.

## What's in here

```
.
├── index.html                    → the animated walkthrough page
├── docs/BLOG_AUTHORING.md        → full written reference
├── scripts/
│   ├── blog-new.mjs              → npm run blog:new    (scaffolds a post)
│   ├── blog-seo.mjs              → npm run blog:seo     (scores a post 0-100)
│   ├── gen-blog-webp.mjs         → npm run gen-blog-webp (optimises images)
│   └── dev-server.mjs            → npm run dev          (local preview)
├── src/content/blog/             → post Markdown files land here
└── public/_landing/blog/         → cover images land here
```

The scripts are a working scaffold matched to the field names and checks described in `docs/BLOG_AUTHORING.md`. They're intentionally framework-free (plain Node, no build step) so you can drop them straight into a real Astro, Next, or 11ty blog and adjust the paths.

## Setup

```
npm install
```

`sharp` is an optional dependency used by `gen-blog-webp`. Without it, that script prints what it would do instead of failing.

## Workflow

```
# 1. Start a post
npm run blog:new -- "What Is Redis Object Caching" --category Guide

# 2. Write it (by hand, or ask Claude Code to draft it)

# 3. Add a cover image to public/_landing/blog/, then optimise it
npm run gen-blog-webp

# 4. Score the SEO
npm run blog:seo -- what-is-redis-object-caching

# 5. Preview, then publish
npm run dev
# set draft: false in the post's frontmatter, open a PR
```

## The landing page

`index.html` is a single self-contained file (no build step, no dependencies beyond two Google Fonts) that explains the five steps above. Open it directly in a browser, or run `npm run dev` and visit `localhost:4321/blog/`.

To deploy it as a static page (e.g. GitHub Pages): push this repo, then point Pages at the root of the default branch.

## License

MIT, see `LICENSE`.
