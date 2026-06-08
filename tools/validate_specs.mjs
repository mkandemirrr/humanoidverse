#!/usr/bin/env node
/**
 * validate_specs.js — Deterministic data validation for HumanoidVerse.
 *
 * No LLM, no network. Cheap and instant. Catches structurally broken or
 * physically impossible robot data. Run it in CI on every commit and locally
 * via `npm run validate`. Also imported by discover_robots.js to vet drafts.
 *
 * Usage:
 *   node tools/validate_specs.js                 # validates robots.json
 *   node tools/validate_specs.js robots-missing.json
 *   import { validateRobot } from './validate_specs.js'
 *
 * Exit code 1 if any HARD error is found (fails the CI job). Warnings (e.g. a
 * null spec on an unverified entry) are logged but do not fail the build.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// --- Physical sanity bounds. Tune as the field evolves. ---
const BOUNDS = {
  height:  { min: 40, max: 260, unit: 'cm'  },   // NAO ~58cm ... tallest ~225cm
  weight:  { min: 1,  max: 200, unit: 'kg'  },
  dof:     { min: 1,  max: 120, unit: 'DoF' },
  speed:   { min: 0,  max: 12,  unit: 'm/s' },
  payload: { min: 0,  max: 150, unit: 'kg'  },
  battery: { min: 0,  max: 24,  unit: 'h'   },
};

const REQUIRED = ['id', 'name', 'manufacturer', 'specs'];
const ID_RE = /^[a-z0-9-]+$/;
const IP_RE = /^IP[0-6X][0-9X]$/i;

// Canonical category vocabulary. New robots must use exactly one of these.
// discover_robots.mjs and normalize_categories.mjs both import this list.
export const CATEGORIES = [
  'Industrial', 'General Purpose', 'Home Assistant', 'Healthcare',
  'Logistics', 'Research', 'Education', 'Social', 'Entertainment', 'AI-Native', 'Cognitive',
];
const CATEGORY_SET = new Set(CATEGORIES);

export function validateRobot(robot) {
  const errors = [];    // hard — fail CI
  const warnings = [];  // soft — log only

  for (const f of REQUIRED) {
    if (robot[f] === undefined || robot[f] === null) errors.push(`missing required field "${f}"`);
  }
  if (robot.id && !ID_RE.test(robot.id)) {
    errors.push(`id "${robot.id}" must be lowercase letters, numbers and hyphens only`);
  }

  const s = robot.specs || {};
  for (const [key, b] of Object.entries(BOUNDS)) {
    const v = s[key];
    if (v === undefined || v === null) { warnings.push(`spec "${key}" is empty — needs verification`); continue; }
    if (typeof v !== 'number' || Number.isNaN(v)) { errors.push(`spec "${key}" must be a number, got ${JSON.stringify(v)}`); continue; }
    if (v < b.min || v > b.max) errors.push(`spec "${key}"=${v}${b.unit} is outside the plausible range ${b.min}-${b.max}${b.unit}`);
  }

  if (s.ip_rating && !IP_RE.test(s.ip_rating)) warnings.push(`ip_rating "${s.ip_rating}" doesn't look like an IPxx code`);
  if (robot.category && !CATEGORY_SET.has(robot.category)) {
    warnings.push(`category "${robot.category}" is not canonical — run normalize_categories.mjs`);
  }
  if (robot.verified === false && (!robot.sources || robot.sources.length === 0)) {
    warnings.push('unverified entry has no sources listed');
  }

  return { id: robot.id || '(no id)', valid: errors.length === 0, errors, warnings };
}

// --- CLI mode ---
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const file = process.argv[2] || 'robots.json';
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.error(`Could not read/parse ${file}: ${e.message}`);
    process.exit(1);
  }
  const robots = Array.isArray(data) ? data : (data.robots || []);

  let hardErrors = 0, totalWarnings = 0;
  for (const r of robots) {
    const res = validateRobot(r);
    if (res.errors.length) {
      hardErrors += res.errors.length;
      console.error(`\u2717 ${res.id}`);
      res.errors.forEach(e => console.error(`    ERROR: ${e}`));
    }
    if (res.warnings.length) {
      totalWarnings += res.warnings.length;
      res.warnings.forEach(w => console.warn(`    warn (${res.id}): ${w}`));
    }
  }

  console.log(`\nChecked ${robots.length} robots — ${hardErrors} error(s), ${totalWarnings} warning(s).`);
  process.exit(hardErrors > 0 ? 1 : 0);
}
