import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    // Vite warns at 500kb by default. CarVerity is expected to be bigger.
    // This does NOT break anything — it's just a warning threshold.
    chunkSizeWarningLimit: 800,
  },
});
