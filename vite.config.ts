import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Repo name is "exponent-explorer" → base must match
export default defineConfig({
  plugins: [react()],
  base: "/exponent-explorer/",
});
