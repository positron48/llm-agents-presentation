import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "node:path";

const repositoryName = "llm-agents-presentation";
const basePath = `/${repositoryName}`;

export default defineConfig({
  root: "github-pages",
  base: `${basePath}/`,
  publicDir: "../public",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname),
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    "process.env.NEXT_PUBLIC_BASE_PATH": JSON.stringify(basePath),
  },
  build: {
    outDir: "../dist/pages",
    emptyOutDir: true,
  },
});
