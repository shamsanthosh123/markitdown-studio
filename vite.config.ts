import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    server: {
      open: true,
    },
  },

  tanstackStart: {
    server: {
      entry: "server",
    },
  },
});