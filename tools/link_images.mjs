#!/usr/bin/env node
/**
 * link_images.mjs — wire hosted robot images into robots.json.
 *
 * HOW IMAGE HOSTING WORKS (the part only you can do):
 *   1. Get an image per robot — official/licensed press shots, or AI-generated
 *      (Midjourney etc.). You own sourcing + rights; a script can't create or host them.
 *   2. Drop them in an `images/` folder at the repo root, named by robot id:
 *        images/atlas.webp, images/engineai-t800.webp, ...
 *   3. Commit. GitHub serves them over HTTPS with permissive CORS, so they work for
 *      BOTH the website and the iOS app (RobotThumbnail already loads from a URL).
 *   4. Run this script — it points each matching robot's `image` field at its raw URL.
 *
 * Run:  node tools/link_images.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO = process.env.REPO || 'mkandemirrr/humanoidverse';
const BRANCH = process.env.BRANCH || 'main';
const IMAGES_DIR = process.env.IMAGES_DIR || 'images';
const ROBOTS_FILE = process.env.ROBOTS_FILE || 'robots.json';
const EXTS = ['webp', 'jpg', 'jpeg', 'png'];

const raw = JSON.parse(fs.readFileSync(ROBOTS_FILE, 'utf8'));
const robots = Array.isArray(raw) ? raw : (raw.robots || []);

let linked = 0;
const missing = [];

for (const robot of robots) {
  const file = EXTS
    .map(ext => `${robot.id}.${ext}`)
    .find(name => fs.existsSync(path.join(IMAGES_DIR, name)));

  if (file) {
    robot.image = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${IMAGES_DIR}/${file}`;
    linked++;
  } else {
    missing.push(robot.id);
  }
}

const out = Array.isArray(raw) ? robots : { ...raw, robots };
fs.writeFileSync(ROBOTS_FILE, JSON.stringify(out, null, 2) + '\n');

console.log(`Linked ${linked} image(s).`);
if (missing.length) {
  console.log(`Still no image for ${missing.length}: ${missing.join(', ')}`);
  console.log(`Add images/<id>.webp for these and re-run.`);
}
