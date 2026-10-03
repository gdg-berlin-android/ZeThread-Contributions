# ZeThread @ next.app devCon

A static digital wall of contributions uploaded by the ZeThread Android app. Each contribution supplies an image and coordinates; Eleventy turns those folders into a wall and a contributor leaderboard.

## Local development

Use Node 24, selected by `.nvmrc`. The image library requires Node 22 or newer.

Run these commands from this repository (`Web` in the parent workspace):

```sh
nvm use
npm install
npm run dev
```

Open the local URL printed by Eleventy, normally `http://localhost:8080/`. Changes to contribution folders trigger a rebuild and refresh the scanned data.

Use `npm install` for the first setup or after changing dependencies, and commit the resulting `package-lock.json` alongside `package.json`. Once the lockfile is up to date, `npm ci` provides the same installation used by CI.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Build, watch files, and serve the preview. |
| `npm run build` | Generate the static site in `_site/`. |
| `npm run validate:coordinates` | Reject invalid coordinates and grids larger than 30 × 30. |
| `npm run validate:conflicts` | Fail when multiple folders claim one coordinate. |

`node_modules/` and `_site/` are generated and ignored by Git.

## Contribution folders

Place each contribution in its own immediate subfolder of `patches/`:

```text
patches/
  patch_20261001_100000_ada/
    metadata.json
    patch.jpg
```

Example metadata:

```json
{
  "id": "patch_20261001_100000_ada",
  "author": {
    "name": "Ada",
    "handle": ""
  },
  "coordinates": { "x": 0, "y": 0 },
  "timestamp": "2026-10-01T08:00:00Z",
  "image": "patch.jpg"
}
```

- Coordinates start at **0**. X increases to the right; Y increases downward.
- Each axis accepts integer coordinates **0–29**: at most 30 cells per axis.
- `image` names a file inside the same folder. Accepted extensions are `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, and `.gif`, ignoring case.
- `author.handle` is optional; supply a GitHub username without a leading `@`. The popup displays it as a clickable `(@username)` beside the contributor's name.
- The Android app writes `timestamp` as an ISO 8601 UTC instant ending in `Z`. The popup converts it to the viewer's device timezone, including the offset and daylight saving at that instant. It reads metadata rather than the folder name or Git commit date.
- Android may also supply `author.email`, `note`, and `image_commit_sha`. Those fields are not displayed on the site.

Android uploads the image before its metadata. Folders without metadata are skipped. A valid metadata file with a missing image still contributes to the grid bounds, but its position stays blank unless other folders claim the same coordinate. Invalid JSON, invalid coordinates, invalid image filenames, and referenced images that are not regular files stop the build.

## Wall and details

The wall uses fixed **160px square CSS Grid cells**, with columns and rows calculated from the largest coordinates plus one. It keeps its shape on desktop and mobile; visitors scroll and use native browser zoom. There is no canvas, stitched master image, custom zoom system, or browser framework.

Missing positions have no placeholder elements, borders, or background fills. They are literally blank: white in light mode and black in dark mode. The device theme changes the surrounding interface; pictures are not inverted or filtered.

Plain numeric coordinates appear above the columns and along the left side. The wall has no outer padding. The sticky header reads `ZeThread @ next.app devCon`. A small padded Statistics link below the complete grid opens the leaderboard in a new tab.

Clicking a patch opens one shared native `<dialog>` with the contributor, optional GitHub profile, and local timestamp. The popup leaves space around it; Close and Escape use native dialog behavior. A small script handles clicks and date formatting. Layout and image loading do not need JavaScript.

### Conflicting coordinates

A grid conflict means two or more contribution folders claim the same `(x, y)`. It is separate from a Git merge conflict. The wall does not choose one person's image: it displays a GitHub-style warning, **“This cell has conflicts that must be resolved.”**

Opening that cell shows links to every matching contribution folder on GitHub. Check those contributions against the physical wall and correct the mistaken metadata coordinates. On the next build, the cell updates from the corrected data. Incomplete contributions can also participate in coordinate conflicts.

Folder links use `GITHUB_REPOSITORY` and `GITHUB_REF_NAME` in CI. Locally they default to `gdg-berlin-android/ZeThread-Contributions` and `main`; set those environment variables when previewing another repository or branch.

## Statistics

`/statistics/` has the same sticky header and automatic theme, with a contributor ranking table. It uses no browser JavaScript.

Counts include every complete contribution, including contributions sharing a conflicted coordinate. Contributors are grouped by GitHub handle, then name, then anonymous when neither is supplied. Grouping ignores case; equal counts share a competition rank, such as 1, 1, 3.

## Image optimization

[`@11ty/eleventy-img`](https://www.11ty.dev/docs/plugins/image/) generates WebP and JPEG copies at **160, 320, 640, and 1280px**, capped to the source image's resolution. It corrects EXIF orientation and generates static `<picture>` / `srcset` markup with `sizes="160px"`, lazy loading, and asynchronous decoding. The browser selects a suitable image; larger versions are available for sharp displays and zoom.

Original contributions remain untouched. Only optimized copies are generated in `_site/images/`; source images and metadata are no longer copied into the published site by the build. The image library reuses generated files, and CI caches that directory between builds. Changing the CSS patch size also requires updating the shortcode's `sizes` value.

For a completely fresh local output after removing preview data, delete the generated `_site/` directory before rebuilding. This also clears local generated-image caching.

## GitHub Pages

In the repository's **Settings → Pages**, select **GitHub Actions** as the deployment source. Every push to `main` runs `.github/workflows/deploy-pages.yml` using Node 24:

1. An independent job checks for duplicate grid coordinates.
2. The build job validates coordinates, runs `npm ci`, restores optimized images, and builds with the Pages base path.
3. A successful build is uploaded and deployed to Pages.

Invalid coordinates block the build and deployment. **Grid conflicts fail their own CI job but do not block a successful site's deployment**, so visitors can see the warnings and matching folder links. The overall workflow can therefore report a failure while the site still deploys. This behavior is intentional.

Asset, page, and optimized-image URLs respect the Pages path prefix. To generate a local build with a repository prefix:

```sh
npm run build -- --pathprefix /ZeThread-Contributions/
```

The image cache key includes dependency/configuration and contribution hashes. Its restore prefix lets new builds reuse images from earlier contribution sets. npm dependencies are cached separately by `setup-node`.

## Preview data and first deployment

The development preview used three sample folders copied from the sibling `example` repository, two `patch_demo_conflict_*` folders, and `patch_demo_preview_*` folders for a 20 × 20 wall at 40% occupancy. These are test contributions. Remove them before collecting real event data; an absent or empty `patches/` directory is supported and produces a blank wall.

At the documentation handoff, the image library was declared in `package.json` but was not yet installed or included in `package-lock.json`: installation in the agent shell failed because `registry.npmjs.org` could not be resolved. Run `nvm use` and `npm install` before committing the lockfile and deploying. The previous preview built before image optimization was added; the optimized build and GitHub deployment still need to be exercised.

## Project files

| File | Responsibility |
| --- | --- |
| `.eleventy.js` | Image shortcode, contribution watcher, contributor ranking, and profile URL filters. |
| `lib/contributions.js` | Folder scanning, coordinate validation, and grouping conflicting claims. |
| `scripts/validate-contributions.js` | CLI entry point for the two CI checks. |
| `src/_data/wall.js` | Image availability, bounds, wall cells, and GitHub folder links. |
| `src/index.njk` | Wall, coordinate labels, conflict templates, and shared detail dialog. |
| `src/statistics.njk` | Contributor leaderboard. |
| `src/_includes/` | Shared header and conflict icon. |
| `src/assets/wall.css` | Fixed grid, theme, dialog, and leaderboard styles. |
| `src/assets/details.js` | Delegated patch clicks, conflict content, and device-local timestamps. |
| `.github/workflows/deploy-pages.yml` | Validation, caching, build, and Pages deployment. |

Future coding assistants should read [AGENTS.md](AGENTS.md) before making changes.
