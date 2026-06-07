import { defineConfig } from "vite";

const docsBase = process.env.DOCS_BASE ?? "/chico/";

export default defineConfig({
  base: docsBase,
  build: {
    outDir: "../docs-dist",
    emptyOutDir: true
  },
  root: "docs-site"
});
