const fs = require("node:fs");
const path = require("node:path");
const {
  readContributions,
  checkCoordinates,
  groupByCoordinates,
} = require("../../lib/contributions");

module.exports = function () {
  const contributions = readContributions();
  const errors = checkCoordinates(contributions);
  if (errors.length) {
    throw new Error(errors.join("\n"));
  }

  const patches = [];
  const completePatches = new Map();
  let maxX = 0;
  let maxY = 0;

  for (const { source, directory, metadata } of contributions) {
    const { x, y } = metadata.coordinates;
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);

    const image = metadata.image;
    if (
      typeof image !== "string" || path.basename(image) !== image
      || image.includes("\\") || !/\.(?:jpe?g|png|webp|avif|gif)$/i.test(image)
    ) {
      throw new Error(`${source}: image must name a JPEG, PNG, WebP, AVIF, or GIF file in this folder.`);
    }

    let imageFile;
    try {
      imageFile = fs.lstatSync(path.join(directory, image));
    } catch (error) {
      // Keep this coordinate blank until its image is available.
      if (error.code === "ENOENT") continue;
      throw error;
    }
    if (!imageFile.isFile()) {
      throw new Error(`${source}/${image}: image must be a regular file.`);
    }

    const author = {
      name: typeof metadata.author?.name === "string" ? metadata.author.name : "",
      handle: typeof metadata.author?.handle === "string" ? metadata.author.handle : "",
    };
    const patch = {
      coordinates: { x, y },
      image: path.join(directory, image),
      alt: `Contribution by ${author.name || author.handle || "an anonymous contributor"}`,
      author,
      timestamp: typeof metadata.timestamp === "string" ? metadata.timestamp : "",
    };
    patches.push(patch);
    completePatches.set(source, patch);
  }

  const repository = process.env.GITHUB_REPOSITORY || "gdg-berlin-android/ZeThread-Contributions";
  const branch = process.env.GITHUB_REF_NAME || "main";
  const folderBaseUrl = `https://github.com/${repository}/tree/${encodeURIComponent(branch)}`;
  const cells = [];
  for (const group of groupByCoordinates(contributions).values()) {
    const { x, y } = group[0].metadata.coordinates;
    if (group.length > 1) {
      cells.push({
        coordinates: { x, y },
        conflict: true,
        folders: group.map(({ source, directory }) => ({
          name: path.basename(directory),
          url: `${folderBaseUrl}/${source.split("/").map(encodeURIComponent).join("/")}`,
        })),
      });
    } else {
      const patch = completePatches.get(group[0].source);
      if (patch) cells.push({ coordinates: { x, y }, patch });
    }
  }

  const byCoordinates = (a, b) => a.coordinates.y - b.coordinates.y || a.coordinates.x - b.coordinates.x;
  patches.sort(byCoordinates);
  cells.sort(byCoordinates);
  return { columns: maxX + 1, rows: maxY + 1, patches, cells };
};
