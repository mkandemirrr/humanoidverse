#!/usr/bin/env node
/**
 * normalize_categories.mjs — one-time cleanup of fragmented robot categories.
 *
 * The migration + discovery pipeline produced free-form categories
 * ("Manufacturing", "Research & Legacy", "Social & Entertainment", ...).
 * This maps those variants onto the canonical vocabulary in validate_specs.mjs,
 * so "Browse by category", filtering and grouping stay clean.
 *
 * Edit MAPPING below to taste, then run:  node tools/normalize_categories.mjs
 * Anything neither canonical nor mapped is left untouched and flagged for review.
 */

import fs from 'node:fs';
import { CATEGORIES } from './validate_specs.mjs';

const ROBOTS_FILE = process.env.ROBOTS_FILE || 'robots.json';
const canonical = new Set(CATEGORIES);

// variant (as seen in data)  ->  canonical category
const MAPPING = {
  'Manufacturing':          'Industrial',
  'Industrial & Service':   'Industrial',
  'Healthcare & Industrial':'Healthcare',
  'Research & Education':   'Research',
  'Research & Legacy':      'Research',
  'Home & Service':         'Home Assistant',
  'Service & Home':         'Home Assistant',
  'Social & Entertainment': 'Social',
  'Social & Service':       'Social',
  'Cognitive':              'Cognitive', // already canonical, kept explicit
};

const raw = JSON.parse(fs.readFileSync(ROBOTS_FILE, 'utf8'));
const robots = Array.isArray(raw) ? raw : (raw.robots || []);

let changed = 0;
const unmapped = new Set();

for (const robot of robots) {
  const c = robot.category;
  if (!c || canonical.has(c)) continue;          // already fine
  if (MAPPING[c]) {
    console.log(`  ${robot.id}: "${c}" -> "${MAPPING[c]}"`);
    robot.category = MAPPING[c];
    changed++;
  } else {
    unmapped.add(c);                              // needs a human decision
  }
}

const out = Array.isArray(raw) ? robots : { ...raw, robots };
fs.writeFileSync(ROBOTS_FILE, JSON.stringify(out, null, 2) + '\n');

console.log(`\nRemapped ${changed} robot(s).`);
if (unmapped.size) {
  console.log('Unmapped categories (add them to MAPPING and re-run):');
  for (const c of unmapped) console.log(`  - "${c}"`);
}
console.log(`Canonical set: ${CATEGORIES.join(', ')}`);
