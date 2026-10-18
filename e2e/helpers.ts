import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';

export function testUser() {
  const env: Record<string, string> = {};
  for (const line of readFileSync('.env.test.local', 'utf8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) env[match[1]] = match[2];
  }
  if (!env.TEST_USER_EMAIL || !env.TEST_USER_PASSWORD) {
    throw new Error('Missing TEST_USER_EMAIL/TEST_USER_PASSWORD in .env.test.local');
  }
  return { email: env.TEST_USER_EMAIL, password: env.TEST_USER_PASSWORD };
}

// Opens the main app with first-run overlays dismissed. Pass { aiConsent: false } to test the consent dialog.
export async function openApp(page: Page, { aiConsent = true } = {}) {
  await page.addInitScript((consent) => {
    localStorage.setItem('stockmatch_onboarding_v2', 'true');
    localStorage.setItem('att_status', 'authorized');
    localStorage.setItem('ai_widget_opened', 'true');
    if (consent) localStorage.setItem('ai_data_consent', 'true');
    else localStorage.removeItem('ai_data_consent');
  }, aiConsent);
  await page.goto('/app');
}
