import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: process.env.PW_SKIP_WEBSERVER ? undefined : {
    command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1',
    cwd: 'frontend',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [
    {
      name: 'edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
  ],
})
