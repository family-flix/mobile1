import path from "path";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "hls.js": "hls.js/dist/hls.min.js",
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(filepath) {
          // if (filepath.includes("hls.js")) {
          //   return "hls";
          // }
          if (filepath.includes("node_modules") && !filepath.includes("hls")) {
            return "vendor";
          }
        },
      },
    },
  },
});
