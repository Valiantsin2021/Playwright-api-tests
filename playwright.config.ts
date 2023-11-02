import { defineConfig } from '@playwright/test'
import 'dotenv/config'
export default defineConfig({
  timeout: 120_000,
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    [
      'allure-playwright',
      {
        detail: true,
        outputFolder: 'allure-results',
        suiteTitle: true
      }
    ]
  ],
  use: {
    headless: true,
    baseURL: process.env.URL,
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: {
      cookie: `${process.env.COOKIES}`
    },
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'auth_setup',
      testMatch: /auth.spec.ts/
    },
    {
      name: 'Api test of Booking App',
      dependencies: ['auth_setup'],
      testMatch: /.*.spec.ts/
    }
  ]
})
