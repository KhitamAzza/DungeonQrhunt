import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/DungeonQrhunt/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,                 // SW only, no PWA install prompt
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,mp3,svg,json}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,  // 5MB (in case an mp3 is big)
      },
    }),
  ],
});