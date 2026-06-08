# Robot Images — production + hosting

The app and site are already **image-ready**: they read the `image` field as a URL and fall
back to the colored tile when it isn't one. You provide the images; `link_images.mjs` wires
them in. (I can't create or host the actual images — this is the part that's yours.)

## Option A — AI-generated (one consistent set, fast)
Cohesion matters more than per-robot accuracy: use the **same** background, lighting and angle
for every robot so the grid and Compare view look uniform. Midjourney template:

```
studio product photograph of a [ROBOT] humanoid robot, full body, standing, front view,
centered, seamless dark charcoal background, soft rim lighting with a subtle cyan accent,
high detail, photorealistic --ar 1:1 --style raw
```

Swap `[ROBOT]` per entry, keeping everything else identical, e.g.:
- Atlas → "sleek athletic dark-grey electric"
- Optimus → "slim white-and-black consumer"
- Digit → "compact bird-legged warehouse"
- T800 → "industrial silver magnesium-frame"

Export ~1024×1024 and save as `<robot-id>.webp` using the exact `id` from `robots.json`
(e.g. `engineai-t800.webp`, `fourier-gr3.webp`).

## Option B — Official press images
Manufacturer newsrooms/press kits sometimes permit editorial use — check each one's terms.
Don't scrape or use images you don't have the rights to.

## Hosting (either option)
1. Put the files in an `images/` folder at the repo root, named by id.
2. Commit them.
3. Run `node tools/link_images.mjs` → it sets each matching robot's `image` to its raw
   GitHub URL (and lists any robot still missing an image).
4. Push. Images then appear automatically in **both** the iOS app and the website.

## Tip
Do a handful first (the Spotlight + the Newest row + a few popular ones) so the highest-traffic
screens look great immediately, then backfill the rest.
