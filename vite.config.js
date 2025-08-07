import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { publicIndexPlugin } from "./lib/publicIndexPlugin";

export default defineConfig({
  plugins: [
    cloudflare({
      experimental: { headersAndRedirectsDevModeSupport: true },
    }),
    publicIndexPlugin(),
  ],
});
