const fs = require("node:fs");
const path = require("node:path");

const patchesDirectory = path.resolve(__dirname, "../patches");
const maxGridSize = 30;

function readContributions() {
  let folders;
  try {
    folders = fs.readdirSync(patchesDirectory, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }

  const contributions = [];
  for (const folder of folders.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!folder.isDirectory()) continue;
    const source = `patches/${folder.name}`;
    const directory = path.join(patchesDirectory, folder.name);
    let metadataText;
    try {
      metadataText = fs.readFileSync(path.join(directory, "metadata.json"), "utf8");
    } catch (error) {
      // Android commits the image before adding metadata.
      if (error.code === "ENOENT") continue;
      throw error;
    }

    let metadata;
    try {
      metadata = JSON.parse(metadataText);
    } catch (error) {
      throw new Error(`${source}/metadata.json contains invalid JSON`, { cause: error });
    }
    contributions.push({ source, directory, metadata });
  }
  return contributions;
}

function checkCoordinates(contributions) {
  const errors = [];
  for (const { source, metadata } of contributions) {
    const x = metadata?.coordinates?.x;
    const y = metadata?.coordinates?.y;
    if (
      !Number.isInteger(x) || !Number.isInteger(y)
      || x < 0 || y < 0 || x >= maxGridSize || y >= maxGridSize
    ) {
      errors.push(
        `${source}/metadata.json: coordinates (${x}, ${y}) must be integers from 0 to ${maxGridSize - 1}; the grid cannot exceed ${maxGridSize} × ${maxGridSize}.`,
      );
    }
  }
  return errors;
}

function groupByCoordinates(contributions) {
  const positions = new Map();
  for (const contribution of contributions) {
    const { metadata } = contribution;
    const x = metadata?.coordinates?.x;
    const y = metadata?.coordinates?.y;
    // Missing or noninteger coordinates are reported by checkCoordinates.
    if (!Number.isInteger(x) || !Number.isInteger(y)) continue;
    const position = `${x},${y}`;
    if (!positions.has(position)) positions.set(position, []);
    positions.get(position).push(contribution);
  }
  return positions;
}

function checkConflicts(contributions) {
  const errors = [];
  for (const [position, group] of groupByCoordinates(contributions)) {
    if (group.length > 1) {
      const sources = group.map(({ source }) => `${source}/metadata.json`);
      errors.push(`Position (${position}) is claimed by multiple contributions:\n  ${sources.join("\n  ")}`);
    }
  }
  return errors;
}

module.exports = { readContributions, checkCoordinates, checkConflicts, groupByCoordinates };
