import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/budgeity/",
  server: {
    port: 3000,
    host: "0.0.0.0",
  },
  build: {
    chunkSizeWarningLimit: 1000, // warn at 1 MB
    rollupOptions: {
      output: {
        manualChunks: {
          // Firebase
          "vendor-firebase": [
            "firebase/app",
            "firebase/auth",
            "firebase/firestore",
            "firebase/storage",
          ],
          // Charts
          "vendor-charts": ["recharts"],
          // PDF / spreadsheet
          "vendor-docs": ["jspdf", "jspdf-autotable", "xlsx"],
          // Animation
          "vendor-motion": ["framer-motion"],
          // React runtime
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // Icons
          "vendor-icons": ["lucide-react"],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      selfDestroying: true, // Forces users' browsers to unregister the Service Worker and clear the offline cache
      registerType: "autoUpdate",
      injectRegister: "inline",
      includeAssets: [],
      workbox: {
        // Raise limit to 6 MB to handle any large vendor chunk
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /\.(?:js|css|html)$/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "app-assets",
              expiration: {
                maxEntries: 50,
              },
            },
          },
        ],
      },
      manifest: {
        name: "Budgeity",
        short_name: "Budgeity",
        description: "Smart Budgeting & Expense Tracking",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        shortcuts: [
          {
            name: "Add Expense",
            short_name: "Expense",
            url: "/budgeity/#/dashboard?add=expense",
            icons: [{ src: "pwa-192x192.png", sizes: "192x192" }],
          },
          {
            name: "Add Income",
            short_name: "Income",
            url: "/budgeity/#/dashboard?add=income",
            icons: [{ src: "pwa-192x192.png", sizes: "192x192" }],
          },
          {
            name: "Add to Shopping List",
            short_name: "Shop Item",
            url: "/budgeity/#/shopping-list?add=item",
            icons: [{ src: "pwa-192x192.png", sizes: "192x192" }],
          },
          {
            name: "Analytics",
            short_name: "Analytics",
            url: "/budgeity/#/analytics",
            icons: [{ src: "pwa-192x192.png", sizes: "192x192" }],
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
