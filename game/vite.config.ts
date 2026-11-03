import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  build: {
    assetsInlineLimit: 0,
    target: "es2017",
    rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } },
  },
});
