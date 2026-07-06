const { execSync, execFileSync } = require("child_process");
const { HtmlBasePlugin } = require("@11ty/eleventy");
const esbuild = require("esbuild");
const { minify: minifyHtml } = require("html-minifier-terser");
const site = require("./src/_data/site.json");

function gitLastMod(inputPath) {
  try {
    const date = execFileSync("git", ["log", "-1", "--format=%cI", "--", inputPath]).toString().trim();
    if (date) return date;
  } catch {}
  return new Date().toISOString();
}

function getAssetRev() {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return String(Date.now());
  }
}

// The product data stores its handful of accented/typographic characters as
// HTML entities so they render correctly in markup; <script> tag content is
// not HTML-entity-decoded, so JSON-LD needs the literal characters instead.
const ENTITY_MAP = { "&eacute;": "é", "&iacute;": "í", "&ndash;": "–", "&rsquo;": "’", "&amp;": "&" };
function decodeEntities(str) {
  return typeof str === "string"
    ? str.replace(/&[a-z]+;/g, (m) => ENTITY_MAP[m] ?? m)
    : str;
}

function productJsonLd(product) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images.map((img) => `${site.url}${img.src}`),
    description: decodeEntities(product.desc),
    brand: { "@type": "Brand", name: "Pita Cigars" },
    category: "Cigars",
  });
}

function itemListJsonLd(products) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.name,
      url: `${site.url}/product/${p.slug}/`,
    })),
  });
}

function breadcrumbJsonLd(product) {
  const parent = product.isBox
    ? { name: "Flor de Pita Boxes", url: "/boxes/" }
    : { name: "Premium Naked Bundles", url: "/premium-cigars/" };
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${site.url}/` },
      { "@type": "ListItem", position: 2, name: "Cigars", item: `${site.url}/products/` },
      { "@type": "ListItem", position: 3, name: parent.name, item: `${site.url}${parent.url}` },
      { "@type": "ListItem", position: 4, name: product.name, item: `${site.url}/product/${product.slug}/` },
    ],
  });
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
  eleventyConfig.addFilter("productJsonLd", productJsonLd);
  eleventyConfig.addFilter("breadcrumbJsonLd", breadcrumbJsonLd);
  eleventyConfig.addFilter("itemListJsonLd", itemListJsonLd);
  eleventyConfig.addFilter("plainText", decodeEntities);
  eleventyConfig.addFilter("gitLastMod", gitLastMod);

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
