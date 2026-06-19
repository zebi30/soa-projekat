import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev server runs on 5173 and talks to the API gateway (default http://localhost:8080),
// which already sends permissive CORS headers, so no proxy is required.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
});
