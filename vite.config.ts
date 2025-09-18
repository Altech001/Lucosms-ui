import { defaultAllowedOrigins, defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({

  plugins: [
    react(),

    tailwindcss(),
    svgr(),
  ],
  server :{
 allowedHosts: ["d0e86627d77b.ngrok-free.app/", "d0e86627d77b.ngrok-free.app"],
  },
  resolve: {

    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
