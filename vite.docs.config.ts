import { defineConfig } from "vite";

export default defineConfig({
  base: "/chico/",
  build: {
    outDir: "../docs-dist",
    emptyOutDir: true
  },
  root: "docs-site"
});
