import { defineConfig, devices } from '@playwright/test'

// Pruebas e2e: recorren la app como un usuario. Usan el LLM simulado para que el resultado no dependa
// de la red; las salas usan el relé real. Ver e2e/.
const SALAS = 'ws://localhost:8790'
const ENV = `VITE_LLM_PROVIDER=mock VITE_SALAS_URL=${SALAS}`

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:5199', ...devices['Pixel 7'], browserName: 'chromium' },
  projects: [
    { name: 'app', testIgnore: /pwa\.spec/ },
    { name: 'pwa', testMatch: /pwa\.spec/, use: { baseURL: 'http://localhost:5198' } },
  ],
  webServer: [
    { command: 'PUERTO=8790 node server/salas.mjs', port: 8790, reuseExistingServer: false },
    { command: `${ENV} npx vite --port 5199 --strictPort`, port: 5199, reuseExistingServer: false },
    { command: `${ENV} npx vite build --outDir dist-e2e && npx vite preview --outDir dist-e2e --port 5198 --strictPort`, port: 5198, reuseExistingServer: false, timeout: 60_000 },
  ],
})
