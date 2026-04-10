import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      includeAssets: [
        "favicon.svg",
        "favicon-16x16.png",
        "favicon-32x32.png",
        "apple-touch-icon.png",
        "fonts/*.woff2",
      ],
      manifest: {
        name: "Dividir",
        short_name: "Dividir",
        description: "Aplicación móvil para dividir gastos compartidos.",
        theme_color: "#000000",
        background_color: "#000000",
        lang: "es",
        display: "standalone",
        start_url: "/groups",
        scope: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/maskable-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
          },
        ],
        shortcuts: [
          {
            name: "Nuevo gasto",
            short_name: "Nuevo gasto",
            description: "Abrir el flujo para registrar un gasto.",
            url: "/add-expense",
            icons: [
              {
                src: "/pwa-192x192.png",
                sizes: "192x192",
                type: "image/png",
              },
            ],
          },
          {
            name: "Mis grupos",
            short_name: "Mis grupos",
            description: "Ir directo a la lista de grupos.",
            url: "/groups",
            icons: [
              {
                src: "/pwa-192x192.png",
                sizes: "192x192",
                type: "image/png",
              },
            ],
          },
        ],
      },
    }),
  ],
});
