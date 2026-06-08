#!/usr/bin/env node
/**
 * discover_robots.mjs — AI-assisted discovery of newly launched humanoid robots.
 *
 * Pipeline:
 *   1. Read existing robots from robots.json (so known ones aren't re-added).
 *   2. Pull recent humanoid-robot news headlines (Google News RSS, no API key).
 *   3. Ask Claude (with the web_search tool ON) to find robots NOT in the list
 *      and draft a schema-compliant entry for each, citing real sources.
 *   4. Validate every draft with the deterministic bounds checker.
 *   5. Append survivors to robots.json as { verified: false } + write pr-body.md.
 *
 * The GitHub Action then opens a PULL REQUEST. A human reviews specs before
 * merge. Claude DRAFTS the skeleton and cites sources; it never auto-approves
 * numbers — LLMs hallucinate specs, so the human is the gate.
 *
 * Env:  ANTHROPIC_API_KEY (required)
 *       DISCOVERY_MODEL   (optional, default below)
 *       ROBOTS_FILE       (optional, default "robots.json")
 * Run:  node tools/discover_robots.mjs
 */

import fs from 'node:fs';
import { validateRobot, CATEGORIES } from './validate_specs.mjs';

const API_KEY = process.env.ANTHROPIC_API_KEY;
// Model string — confirm the current one at:
// https://docs.claude.com/en/docs/about-claude/models/overview
const MODEL = process.env.DISCOVERY_MODEL || 'claude-sonnet-4-6';
const ROBOTS_FILE = process.env.ROBOTS_FILE || 'robots.json';
const NEWS_WINDOW = '14d'; // how far back to scan

const NEWS_QUERIES = [
  'humanoid robot unveiled',
  'humanoid robot launch specifications',
  'new humanoid robot company',
];

if (!API_KEY) { console.error('ANTHROPIC_API_KEY is not set.'); process.exit(1); }

const normalize = (name) => String(name).toLowerCase().replace(/[^a-z0-9]/g, '');

async function fetchHeadlines() {
  const items = [];
  for (const q of NEWS_QUERIES) {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q + ' when:' + NEWS_WINDOW)}&hl=en-US&gl=US&ceid=US:en`;
    try {
      const xml = await (await fetch(url)).text();
      const matches = [...xml.matchAll(/<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>/g)];
      for (const m of matches.slice(0, 15)) {
        items.push({
          title: m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
          link: m[2].trim(),
        });
      }
    } catch (e) {
      console.warn(`news fetch failed for "${q}": ${e.message}`);
    }
  }
  return [...new Map(items.map(i => [i.title, i])).values()]; // dedupe by title
}

const SCHEMA = `{
  "id": "kebab-case-unique-id",
  "name": "Robot Name",
  "manufacturer": "Company",
  "country": "USA | China | Japan | ...",
  "year": 2026,
  "generation": "e.g. Gen 3 / Electric",
  "status": "Prototype | Pilot | Production | Research",
  "category": "exactly one of the allowed categories listed below — never invent or combine values",
  "tagline": "short slogan",
  "description": "2-3 neutral sentences",
  "specs": { "height": 170, "weight": 60, "dof": 40, "speed": 1.5, "payload": 15, "battery": 4, "ip_rating": "IP54", "actuator": "Electric", "connectivity": "Wi-Fi" },
  "pros": ["..."],
  "cons": ["..."],
  "price": "$XXk or Unknown",
  "verified": false,
  "sources": ["https://..."]
}`;

async function askClaude(existingNames, headlines) {
  const prompt = `You maintain a humanoid-robot database. Below are recent news headlines (last ${NEWS_WINDOW}) and the robots ALREADY in the database.

Find humanoid robots that are NOT already in the list. Treat a clearly new generation (e.g. "Walker S2" when only "Walker S1" exists) as a new entry. For each new robot:
- Use the web_search tool to confirm it exists and find REAL specifications.
- Fill this exact JSON schema. Use null for any spec you cannot confirm from a credible source. DO NOT guess numbers.
- "category" MUST be exactly one of these (copy verbatim, never invent or combine them): ${CATEGORIES.join(', ')}. Pick the single closest fit.
- Put the actual source URLs you used in "sources". Always keep "verified": false.

Schema (one object per robot):
${SCHEMA}

Already in the database (do NOT re-add these):
${existingNames.join(', ')}

Recent headlines:
${headlines.map(h => `- ${h.title}`).join('\n')}

Respond with ONLY a JSON array of robot objects — no markdown, no commentary. If there are no genuinely new robots, respond with [].`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8000,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 8 }],
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(`API error: ${data.error.message}`);

  // The model interleaves web_search tool calls with text; keep only text blocks.
  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
  const start = text.indexOf('['), end = text.lastIndexOf(']');
  if (start === -1 || end === -1) { console.warn('No JSON array found in the response.'); return []; }
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch (e) {
    console.error('Could not parse the model JSON:', e.message);
    return [];
  }
}

async function main() {
  const raw = JSON.parse(fs.readFileSync(ROBOTS_FILE, 'utf8'));
  const robots = Array.isArray(raw) ? raw : (raw.robots || []);
  const known = new Set(robots.flatMap(r => [normalize(r.name), normalize(r.id)]));

  const headlines = await fetchHeadlines();
  console.log(`Scanning ${headlines.length} recent headlines...`);
  if (!headlines.length) { console.log('No headlines fetched; exiting.'); return; }

  const candidates = await askClaude(robots.map(r => r.name), headlines);
  console.log(`Claude proposed ${candidates.length} candidate(s).`);

  const accepted = [];
  for (const c of candidates) {
    if (!c || !c.name) continue;
    if (known.has(normalize(c.name)) || known.has(normalize(c.id))) {
      console.log(`  skip (already known): ${c.name}`);
      continue;
    }
    c.verified = false;
    c.discovered_date = new Date().toISOString().slice(0, 10);
    const check = validateRobot(c);
    if (!check.valid) {
      console.log(`  reject (failed validation): ${c.name} — ${check.errors.join('; ')}`);
      continue;
    }
    accepted.push(c);
    known.add(normalize(c.name));
  }

  if (!accepted.length) { console.log('No new valid robots to add.'); return; }

  const updated = Array.isArray(raw)
    ? [...robots, ...accepted]
    : { ...raw, robots: [...robots, ...accepted] };
  fs.writeFileSync(ROBOTS_FILE, JSON.stringify(updated, null, 2) + '\n');

  const body = [
    `## 🤖 ${accepted.length} new humanoid robot(s) discovered`,
    '',
    'Auto-drafted by `discover_robots.mjs`. **Specs are UNVERIFIED — review every field before merging, then set `"verified": true`.**',
    '',
    ...accepted.map(r =>
      `### ${r.name} — ${r.manufacturer}\n` +
      `- Status: ${r.status || '?'} · Year: ${r.year || '?'} · Country: ${r.country || '?'}\n` +
      `- Sources: ${(r.sources || []).map(s => `<${s}>`).join(' ') || 'none'}`),
  ].join('\n');
  fs.writeFileSync('pr-body.md', body + '\n');
  console.log(`Added ${accepted.length} robot(s) to ${ROBOTS_FILE} and wrote pr-body.md`);
}

main().catch(e => { console.error(e); process.exit(1); });
