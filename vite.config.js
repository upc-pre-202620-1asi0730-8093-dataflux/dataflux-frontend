import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";
export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("/node_modules/") &&
            /\/(primevue|@primeuix|@primevue)\//.test(id)
          )
            return "primevue";
        },
      },
    },
  },
  test: {
    environment: "node",
    include: ["scripts/*.test.js", "tests/unit/**/*.test.js", "src/app/**/*.test.js"],
  },
});
