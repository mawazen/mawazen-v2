import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";


function copyClientLogoPlugin() {
  const src = path.resolve(import.meta.dirname, "logo.png");
  const destDir = path.resolve(import.meta.dirname, "client", "public");
  const dest = path.resolve(destDir, "logo.png");

  const copy = () => {
    try {
      if (!fs.existsSync(src)) return;
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(src, dest);
    } catch {
    }
  };

  return {
    name: "copy-client-logo",
    buildStart() {
      copy();
    },
    configureServer() {
      copy();
    },
  };
}


const plugins = [react(), tailwindcss(), vitePluginManusRuntime(), copyClientLogoPlugin()];

export default defineConfig({
  base: '/',
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "client/dist"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
