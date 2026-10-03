module.exports = async function (eleventyConfig) {
  const { default: Image } = await import("@11ty/eleventy-img");

  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  // Process contribution images into static picture/srcset markup.
  const url = eleventyConfig.getFilter("url");
  eleventyConfig.addShortcode("patchImage", async (source, alt) => {
    return Image(source, {
      widths: [160, 320, 640, 1280],
      formats: ["webp", "jpeg"],
      outputDir: "_site/images/",
      urlPath: url("/images/"),
      fixOrientation: true,
      returnType: "html",
      htmlOptions: {
        fallback: "smallest",
        imgAttributes: {
          alt,
          sizes: "160px",
          loading: "lazy",
          decoding: "async",
        },
      },
    });
  });

  eleventyConfig.addWatchTarget("patches/", { resetConfig: true });

  eleventyConfig.addFilter("contributorRanking", (patches) => {
    const contributors = new Map();
    for (const patch of patches) {
      const name = patch.author.name.trim();
      const handle = patch.author.handle.trim().replace(/^@/, "");
      const key = handle ? `github:${handle.toLowerCase()}`
        : name ? `name:${name.toLowerCase()}` : "anonymous";
      const contributor = contributors.get(key);
      if (contributor) {
        contributor.count += 1;
        if (!contributor.name && name) contributor.name = name;
      } else {
        contributors.set(key, { name, handle, count: 1 });
      }
    }

    const ranking = [...contributors.values()].sort((a, b) =>
      b.count - a.count
      || (a.handle || a.name).localeCompare(b.handle || b.name, "en"),
    );
    let previousCount = -1;
    let rank = 0;
    return ranking.map((contributor, index) => {
      if (contributor.count !== previousCount) {
        rank = index + 1;
        previousCount = contributor.count;
      }
      return { ...contributor, rank };
    });
  });

  eleventyConfig.addFilter("githubProfile", (handle) => {
    if (typeof handle !== "string") return "";
    const username = handle.trim();
    if (
      !/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(username)
      || username.includes("--")
    ) return "";
    return `https://github.com/${username}`;
  });

  return {
    dir: {
      input: "src",
      output: "_site",
    },
  };
};
