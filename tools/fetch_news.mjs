#!/usr/bin/env node
/**
 * fetch_news.mjs — fetch humanoid-robot news and write news.json (for the website).
 *
 * The browser can't fetch Google News RSS directly (CORS), so we fetch it here and publish a
 * static news.json that BOTH the website and the iOS app can read. Run daily by news.yml.
 *
 * Run:  node tools/fetch_news.mjs
 */

import fs from 'node:fs';

const url = 'https://news.google.com/rss/search?q='
  + encodeURIComponent('humanoid robot when:30d')
  + '&hl=en-US&gl=US&ceid=US:en';

const pick = (block, tag) =>
  (block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`)) || [, ''])[1]
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .trim();

const xml = await (await fetch(url)).text();

const items = [...xml.matchAll(/<item>[\s\S]*?<\/item>/g)]
  .slice(0, 30)
  .map(m => ({
    title: pick(m[0], 'title'),
    link: pick(m[0], 'link'),
    source: pick(m[0], 'source'),
    pubDate: pick(m[0], 'pubDate'),
  }))
  .filter(i => i.title && i.link);

fs.writeFileSync('news.json', JSON.stringify(items, null, 2) + '\n');
console.log(`Wrote news.json with ${items.length} items.`);
