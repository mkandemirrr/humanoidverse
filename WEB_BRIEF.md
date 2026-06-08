# HumanoidVerse — Web Parity Brief for a Coding Agent

The iOS app now has features the website lacks. Bring the **website** (plain HTML/CSS/JS on
GitHub Pages) to parity. Both already read the same `robots.json` (single source of truth), so
data changes (e.g. category cleanup) reflect automatically.

Repo: https://github.com/mkandemirrr/humanoidverse · Live: https://mkandemirrr.github.io/humanoidverse/

## (!) Guardrails
- Keep the existing stack: vanilla HTML/CSS/JS, no framework, no build step.
- `robots.json` stays the single source of truth. Do not duplicate robot data.
- Match the existing dark / glassmorphism look. Don't regress current pages (robots, compare).
- The site is a real web app (not a Claude artifact), so **localStorage IS allowed** here.

## What to add (priority order)

### 1. Live News (the main gap)
The iOS app reads Google News RSS directly. **A browser cannot** (CORS). So fetch it server-side
and publish a static `news.json` that both the web and (optionally) iOS can read:

- Add `tools/fetch_news.mjs` that fetches the feed and writes `news.json`:
  ```js
  import fs from 'node:fs';
  const url = 'https://news.google.com/rss/search?q=' +
    encodeURIComponent('humanoid robot when:30d') + '&hl=en-US&gl=US&ceid=US:en';
  const xml = await (await fetch(url)).text();
  const items = [...xml.matchAll(/<item>[\s\S]*?<\/item>/g)].slice(0, 30).map(block => {
    const b = block[0];
    const pick = (tag) => (b.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`)) || [,''])[1]
      .replace(/<!\[CDATA\[|\]\]>/g, '').trim();
    return { title: pick('title'), link: pick('link'), source: pick('source'), pubDate: pick('pubDate') };
  }).filter(i => i.title && i.link);
  fs.writeFileSync('news.json', JSON.stringify(items, null, 2) + '\n');
  ```
- Add a daily GitHub Action (`.github/workflows/news.yml`) that runs it and commits `news.json`
  (same pattern as the existing workflows; no secret needed — RSS is public).
- On the homepage, fetch `news.json` and render the news list (title, source, relative date,
  link opens in a new tab). This replaces any hardcoded news.
- Optional later: switch the iOS `NewsStore` to read this `news.json` too, for consistency and
  editorial control (you could hand-curate the file).

### 2. Favorites (localStorage)
- A heart toggle on each robot card / detail. Store favorited ids in `localStorage`
  (e.g. key `hv:favorites` → JSON array of ids).
- A "Favorites" filter on the robots page that shows only saved robots.

### 3. Share
- A share button on a robot and on a comparison. Use the Web Share API
  (`navigator.share({ title, url })`) with a copy-link fallback. Optional: render a branded
  share image with `<canvas>` (mirror the iOS share card) for nicer social posts.

### 4. Images
- Wherever a robot image is shown, use the `image` field **only if it's an http(s) URL**;
  otherwise fall back to the existing colored-tile placeholder (mirror iOS `RobotThumbnail`).
  Images appear automatically once `link_images.mjs` fills in the URLs.

### 5. Discover / home polish (if not already present)
- Spotlight (a daily-rotating robot), a stats row (total robots / makers / countries),
  a "Newest" strip (sort by year desc), and category cards with counts. Several of these may
  already exist on the homepage — extend rather than duplicate.

## Categories
After `tools/normalize_categories.mjs` runs on `robots.json`, the canonical category set is:
Industrial, General Purpose, Home Assistant, Healthcare, Logistics, Research, Education, Social,
Entertainment, AI-Native, Cognitive. The web's filters/category UI will reflect these
automatically since it reads the same file — just make sure category filters are derived from the
data, not hardcoded.

## Human tasks (Mustafa)
- None new for News (RSS is public). The existing repo Actions permissions already cover committing
  `news.json`.
