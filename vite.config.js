import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Sends /api calls to the Express server, so there are no CORS problems
    proxy: {
      "/api": `http://localhost:${process.env.API_PORT || 3001}`,
    },
  },
});
