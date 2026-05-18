import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'api',
      testMatch: /api\/.*/,
      use: { baseURL: 'http://localhost:8000' },
    },
    {
      name: 'ui',
      testMatch: /ui\/.*/,
    },
  ],
});
