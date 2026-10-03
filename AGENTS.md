# ZeThread Web: context for coding assistants

Read [README.md](README.md) for setup, contribution format, commands, and deployment. This file records the design decisions and working preferences needed for future changes. Update both documents when their described behavior changes.

## Scope and working style

- This repository is the receiving side of the ZeThread Android contribution flow, implemented as an Eleventy static site. In the current parent workspace, `Android/` contains the uploader and `example/` contains a cloned test repository. They are context, not part of routine Web edits.
- The user prefers one small step at a time, minimal JavaScript, plain explanations, and concrete edits. Follow the requested scope and avoid unnecessary permission questions for authorized work.
- Do not introduce a browser framework, canvas renderer, stitched master image, gallery, or custom pan/zoom system unless requested. These alternatives were discussed; fixed CSS Grid with native browser scrolling and zoom was selected.
- Do not add or run tests unless the user requests testing or verification. State what was actually built or inspected and what remains unverified.
- Do not create fake contributions unless requested. The user plans to remove all mock data and make the initial commit themselves; do not delete their data, commit, push, or deploy on their behalf based on that plan.

## Preserve these behaviors

- The header and browser title use exactly `ZeThread @ next.app devCon`; no explanatory tagline. The header stays sticky at the top and left while scrolling.
- The grid uses fixed 160px square tracks on all viewport sizes. Bounds come from the largest metadata coordinates plus one, not a hardcoded preview size. An empty dataset gives a blank 1 × 1 area.
- Coordinates are zero-based, X rightward and Y downward. Valid values are integers 0–29; the maximum is 30 cells per axis. Share validation through `lib/contributions.js`.
- Empty positions remain completely blank: no placeholders, borders, fills, labels inside cells, or DOM patch nodes. Plain numeric axes are outside the wall, in 28px tracks. The wall has zero outer padding; the Statistics link has separate padding for tapping away from the edge.
- Use the device's light/dark preference. The page background is white/black. Theme the interface through CSS variables, and leave image colors untouched.
- One native `<dialog>` serves all cells. Keep it smaller than the viewport with native Close/Escape behavior. Use the existing delegated click listener rather than listeners on every patch.
- Normal details show contributor name plus an optional clickable `(@handle)`, then an ISO 8601 timestamp in the viewer's current device timezone with the offset at the contribution instant. Preserve the original value in `<time datetime>`. Android metadata is UTC; do not infer its instant from a folder name or impose Berlin time on all viewers. Email and notes are not rendered.
- Statistics opens in a new tab, shares the header/theme, and has no browser JavaScript. Count all complete image contributions, including conflict participants. Group handles/names case-insensitively; ties use competition ranking.

## Scanning and conflicts

- Scan immediate `patches/*/metadata.json` folders. Use the metadata's `image` filename; do not assume every image is a JPEG. Filenames must identify regular raster files in the same folder.
- Missing metadata is skipped because Android uploads an image before metadata. A missing image leaves a single claim blank, but valid metadata still sets the grid bounds. Invalid JSON and invalid coordinates fail the build.
- A conflict is multiple contribution folders claiming one `(x, y)`, even if an image has not arrived. This is a grid data conflict, not a Git merge conflict.
- Render one warning cell for a conflicting position. It says `This cell has conflicts that must be resolved`, uses a neutral GitHub-style alert, and opens a popup listing links to all matching folders. Do not pick a winning contributor, display overlapping images, or silently discard claims.
- Conflict link markup is generated in static `<template>` elements, cloned into the shared dialog. Links open in new tabs. Use CI repository/branch environment variables, with the documented local defaults.
- Coordinate failures block builds/deployment. Duplicate-coordinate validation runs as an independent failing job; deployment depends only on a successful build. Preserve this distinction so the warning site can publish even while the workflow reports grid conflicts.
- `.eleventy.js` watches `patches/` with `{ resetConfig: true }`. That was added after cached external contribution data left the preview stale; keep contribution changes refreshing the global data.

## Images and deployment

- Use Node 24 (`.nvmrc`, CI); the image package requires >=22. The config remains CommonJS with an async function and dynamic import of the ESM image library.
- `patch.image` is a local source file path used by the async `patchImage` shortcode. It is not a published URL. Only normal wall cells invoke the shortcode.
- Generate WebP/JPEG at 160, 320, 640, and 1280px, without enlarging low-resolution sources. Preserve `sizes="160px"`, lazy loading, async decoding, orientation correction, and the full-cell `<picture>` wrapper. If the CSS patch size changes, update `sizes` too.
- Output goes into `_site/images/`. Use Eleventy's `url` filter to prefix image URLs for Pages; preserve the same prefix handling on all assets/page links. Original contribution images and metadata are not passthrough output.
- CI caches `_site/images` using `actions/cache`, with dependency/config and contribution hashes and a restore prefix. Do not clear that directory before the CI build, which would defeat reuse. Generated files remain ignored by Git.
- Cached output can include images no longer referenced after removing contributions. For a fresh local preview, remove the generated `_site/` directory and rebuild. The current CI cache also retains earlier generated variants; it is not a cleanup mechanism.
- Pages deployment runs on pushes to `main`; its repository setting must use GitHub Actions. There is no runtime server or database.

## Handoff status

At this documentation handoff:

- The preview contains 157 `patch_demo_preview_*` folders, two `patch_demo_conflict_*` folders, and three samples copied from `example`. The bounds are 20 × 20 with 160 occupied coordinates (40%) and 162 complete contributions; three folders share `(1, 1)`. This is disposable preview data, not required site configuration. Do not regenerate it after the user removes it.
- `@11ty/eleventy-img` is declared in `package.json`, but `package-lock.json` does not yet contain it and it is not installed. `npm install` was blocked by DNS/network restrictions in the agent shell. The user needs to run `nvm use` and `npm install` from Web and commit the synchronized lockfile; `npm ci` will otherwise fail. Do not fabricate lockfile entries.
- A build succeeded with the preview data before image optimization was added. The new image generation has not been built, browser-checked, or exercised in GitHub Actions.
- Earlier Safari inspection confirmed the conflict cell and desktop dialog's three folder links, with no console errors. The narrow-screen wall was inspected; mobile popup verification was interrupted. Do not treat those observations as verification of subsequent changes.
- README.md and this file replace the old chronological HANDOFF.md, which is no longer present. Use current source and these documents rather than older conversation descriptions.

Clear or update these status notes when the corresponding work is completed.
