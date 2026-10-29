import { defineConfig, devices } from '@playwright/test';

// End-to-end tests against the web build in WebKit at iPhone size (closest to the Capacitor iOS
// WebView). They hit the real Supabase backend as the test account in .env.test.local.
// Run: npx playwright test        Screenshots land in e2e/screens/ (failure artifacts in test-results/)
export default defineConfig({
  testDir: './e2e',
  outputDir: 'test-results',
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1, // tests share one account and the Gemini rate limit
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:8080',
    screenshot: 'on',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/, use: { ...devices['iPhone 15'] } },
    {
      name: 'iphone',
      dependencies: ['setup'],
      use: { ...devices['iPhone 15'], storageState: 'e2e/.auth/test-user.json' },
    },
    // Swipe performance on a CPU slowed down 4x (WebKit can't throttle). Only the perf spec runs here.
    { name: 'perf-throttled', testMatch: /motion-perf\.spec\.ts/, use: { ...devices['iPhone 15'], browserName: 'chromium' } },
    // Phase 4 3D prototypes: Chromium on the Mac's real GPU (headless Chromium otherwise draws WebGL in software)
    {
      name: 'orbit-gpu',
      testMatch: /orbit-perf\.spec\.ts/,
      use: { ...devices['iPhone 15'], browserName: 'chromium', launchOptions: { args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] } },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
