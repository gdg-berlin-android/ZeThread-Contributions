const {
  readContributions,
  checkCoordinates,
  checkConflicts,
} = require("../lib/contributions");

const checks = { coordinates: checkCoordinates, conflicts: checkConflicts };
const mode = process.argv[2];

try {
  if (!Object.hasOwn(checks, mode)) {
    throw new Error("Usage: node scripts/validate-contributions.js <coordinates|conflicts>");
  }
  const contributions = readContributions();
  const errors = checks[mode](contributions);
  if (errors.length) {
    throw new Error(`${mode} validation failed:\n${errors.join("\n")}`);
  }
  console.log(`${mode} validation passed for ${contributions.length} contributions.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
