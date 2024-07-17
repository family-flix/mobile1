import path from "path";
import fs from "fs";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

const pkg = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.resolve(__dirname, "./package.json"), "utf-8"));
  } catch (err) {
    return null;
  }
})();

// https://vitejs.dev/config/
export default defineConfig({
  base: "/mobile",
  plugins: [react()],
  resolve: {
    alias: {
      "hls.js": "hls.js/dist/hls.min.js",
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    drop: ["console", "debugger"],
  },
  define: {
    "process.global.__VERSION__": JSON.stringify(pkg ? pkg.version : "unknown"),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(filepath) {
          if (filepath.includes("hls.js")) {
            return "hls";
          }
          if (filepath.includes("node_modules") && !filepath.includes("hls")) {
            return "vendor";
          }
        },
      },
    },
  },
});
