# Writing the xCloud Blog

The blog lives in git, not WordPress. Each post is one Markdown file. When a change ships, it appears at `xcloud.host/<slug>/` and in the blog archive automatically.

## The mental model

Nothing about writing changes. You still write a title, sections, add an image, and check SEO. It just happens in files instead of the WordPress dashboard.

| WordPress | Git-native equivalent |
| --- | --- |
| Add New Post | `blog:new` |
| Featured image | `ogImage` |
| Rank Math score | `blog:seo` |

## 1. Start a post

```
npm run blog:new -- "What Is Redis Object Caching" --category Guide
```

Creates `src/content/blog/<slug>.md` as a draft, pre-filled with frontmatter.

**The slug is the URL.** Never change it after publishing, or the live link breaks and loses its ranking.

## 2. Write it

Fill in the Markdown body between the H2 sections the scaffold left. Prefer working with Claude Code: ask it to draft the post, fill the frontmatter, write the meta description, set a focus keyword, and run `blog:seo` until the score clears 90.

## 3. Add the featured image

The featured image is the archive thumbnail, the social card, and the article hero, all one image, set via `ogImage`.

```
# put cover.png in public/_landing/blog/, set in the frontmatter:
ogImage: "/_landing/blog/<slug>-cover.png"

# then optimise:
npm run gen-blog-webp
```

Always run `gen-blog-webp`. It keeps thumbnails around 40KB. A raw PNG can be 1MB and slow the whole archive. Landscape 16:9 (1200x630) looks best.

## 4. Check the SEO score

```
npm run blog:seo -- <slug>
```

Scores the post 0-100 and names the exact fix for anything below the bar. Aim for 80+ before publishing. It checks:

- Title <= 60 chars & meta description 120-160 chars
- Content length, H2 sections, enough subheadings
- A real featured image, and alt text on body images
- 2+ internal links to other xCloud pages
- FAQ schema for the rich result
- Focus keyphrase in title, description, first line, and URL

## 5. Preview & publish

```
npm run dev   # -> http://localhost:4321/blog/
```

Check it looks right, set `draft: false`, set the real date, and open a PR. On merge and deploy it's live, no sitemap or archive edit needed.

## Frontmatter reference

| Field | Notes |
| --- | --- |
| `title` | SEO `<title>`, <= 60 chars, keep the "- xCloud" suffix |
| `h1` | On-page headline, no suffix |
| `slug` | The live URL, never change after publishing |
| `date` | ISO, e.g. `2026-09-15T10:00:00+00:00` |
| `description` | Meta description, 120-160 chars |
| `ogImage` | Featured image under `/_landing/blog/` |
| `category` | Guide, Tutorial, News, WordPress, Hosting, Features |
| `focusKeyword` | Phrase to rank for, unlocks keyphrase checks |
| `faqs` | Q&A array, feeds the FAQ rich result |
| `draft` | `true` hides it from the archive |

## Still prefer WordPress?

Keep drafting in the WordPress editor if you like it, then run this once to pull the finished post into git:

```
node scripts/import-blog.mjs --slug=<slug>
```

(Not included in this scaffold; add it if your team still needs the import path.) WordPress becomes a drafting tool. Git stays the source of truth.
