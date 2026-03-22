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
            name: "Add Transaction",
            short_name: "Add",
            description: "Add a new transaction",
            url: "/budgeity/#/dashboard?add=true",
            icons: [{ src: "pwa-192x192.png", sizes: "192x192" }]
          },
          {
            name: "Analytics",
            short_name: "Analytics",
            description: "View financial analytics",
            url: "/budgeity/#/analytics-v2",
            icons: [{ src: "pwa-192x192.png", sizes: "192x192" }]
          },
          {
            name: "Wallets",
            short_name: "Wallets",
            description: "Manage your wallets",
            url: "/budgeity/#/wallets",
            icons: [{ src: "pwa-192x192.png", sizes: "192x192" }]
          }
        ],
        widgets: [
          {
            name: "Budgeity Quick View",
            short_name: "Quick View",
            description: "Check your financial status at a glance",
            tag: "budgeity-summary",
            icons: [{ src: "pwa-192x192.png", sizes: "192x192" }],
            screenshots: [{ src: "pwa-512x512.png", sizes: "512x512", label: "Summary View" }]
          },
          {
            name: "Budgeity Balance",
            short_name: "Balance",
            description: "Keep track of your total balance",
            tag: "budgeity-balance",
            icons: [{ src: "pwa-192x192.png", sizes: "192x192" }],
            screenshots: [{ src: "pwa-512x512.png", sizes: "512x512", label: "Balance View" }]
          }
        ]
      } as any,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
