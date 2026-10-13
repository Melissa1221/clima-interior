import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// PWA instalable y con caché offline (RF-19, RF-20, RNF-20)
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icono.svg', 'demo/*.json'],
      manifest: {
        name: 'Clima Interior',
        short_name: 'Clima Interior',
        description: 'Cuenta cómo fue tu día y míralo convertido en un clima.',
        lang: 'es-PE',
        theme_color: '#2f4466',
        background_color: '#f4f1ea',
        display: 'standalone',
        icons: [{ src: 'icono.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,json}'] },
    }),
  ],
})
