const { execSync } = require("child_process");
const { HtmlBasePlugin } = require("@11ty/eleventy");
const esbuild = require("esbuild");
const { minify: minifyHtml } = require("html-minifier-terser");

function getAssetRev() {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return String(Date.now());
  }
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(HtmlBasePlugin);

  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });

  eleventyConfig.addWatchTarget("src/css");
  eleventyConfig.addWatchTarget("src/js");

  eleventyConfig.on("eleventy.before", async () => {
    await esbuild.build({
      entryPoints: ["src/css/main.css"],
      bundle: true,
      minify: true,
      outfile: "_site/css/main.css",
      // Asset url()s are left untouched: the output's css/ directory sits
      // at the same relative depth as the source's, so the paths still resolve.
      external: ["*.jpg", "*.jpeg", "*.png", "*.svg", "*.webp", "*.woff", "*.woff2"],
    });
    await esbuild.build({
      entryPoints: ["src/js/main.js"],
      minify: true,
      outfile: "_site/js/main.js",
    });
  });

  eleventyConfig.addGlobalData("assetRev", getAssetRev());

  eleventyConfig.addTransform("htmlmin", async function (content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      return minifyHtml(content, {
        collapseWhitespace: true,
        conservativeCollapse: true,
        removeComments: true,
        minifyJS: true,
      });
    }
    return content;
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    pathPrefix: "/Claude_Testing/",
    templateFormats: ["njk", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
