import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es6",
    outDir: "build",
    lib: {
      entry: "./src/index.ts",
      formats: ["cjs"],
      fileName: "node-bug",
    },
    rollupOptions: {
      external: ["fs/promises"],
      output: {
        // preserveModules: true,
        inlineDynamicImports: false,
        format: "cjs",
      },
      input: "./src/index.ts",
    },
  },
});
