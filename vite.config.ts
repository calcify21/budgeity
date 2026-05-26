import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables based on the current mode
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          name: 'Budgeity',
          short_name: 'Budgeity',
          description: 'Smart personal budgeting and expense tracking app.',
          theme_color: '#09090b',
          background_color: '#09090b',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          orientation: 'portrait',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          // Fixes the build error by raising the cache limit to 4 MB
          maximumFileSizeToCacheInBytes: 4194304,
          // Cache all static assets (JS, CSS, HTML, fonts, images)
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,eot}'],
          // Cache translation JSON files at runtime (network first, fallback to cache)
          runtimeCaching: [
            {
              urlPattern: /\/locales\/.*\.json$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'i18n-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      }),
    ],
    server: {
      host: '0.0.0.0',
      port: 5000,
      allowedHosts: true,
    },
    base: env.VITE_BASE_URL || '/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
      },
    },
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          // Suppress "use client" warnings from third-party libraries (e.g., framer-motion)
          if (
            warning.code === 'MODULE_LEVEL_DIRECTIVE' &&
            warning.message.includes('use client')
          ) {
            return;
          }
          warn(warning);
        },
      },
    },
  };
});
