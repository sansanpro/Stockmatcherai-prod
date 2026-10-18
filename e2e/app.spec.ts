import { test, expect, type Page } from '@playwright/test';
import { openApp } from './helpers';

const openChat = async (page: Page) => {
  await page.getByRole('button', { name: 'Open AI Assistant' }).click();
  await expect(page.getByText('AI Stock Assistant')).toBeVisible();
};

const chatInput = (page: Page) => page.getByPlaceholder(/Ask about stocks|Try asking about a stock/);

test('swipe deck loads a stock card', async ({ page }) => {
  await openApp(page);
  await expect(page.getByText('P/E Ratio').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'View stock details' }).first()).toBeVisible();
  await page.screenshot({ path: 'test-results/screens/deck.png' });
});

test('stock details show company description, employees and HQ', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'View stock details' }).first().click();
  // Description comes from company_profiles; the italic mission line is quoted
  await expect(page.locator('p.italic').filter({ hasText: /\w{4,}/ }).first()).toBeVisible();
  await page.screenshot({ path: 'test-results/screens/details.png' });
});

test('first message shows the AI consent dialog above the chat, then sends', async ({ page }) => {
  await openApp(page, { aiConsent: false });
  await openChat(page);
  await chatInput(page).fill('Explain P/E ratio in simple terms');
  await page.getByRole('button', { name: 'Send message' }).click();

  const agree = page.getByRole('button', { name: 'I Agree' });
  await expect(agree).toBeVisible();
  await agree.click(); // fails if the dialog is hidden behind the chat panel
  await expect(page.getByText(/not investment advice/i).last()).toBeVisible({ timeout: 60_000 });
  await page.screenshot({ path: 'test-results/screens/chat-consent.png' });
});

test('chat answers a data question without showing raw tool output', async ({ page }) => {
  await openApp(page);
  await openChat(page);
  await chatInput(page).fill('How is NVIDIA doing?');
  await page.getByRole('button', { name: 'Send message' }).click();

  await expect(page.getByText(/not investment advice/i).last()).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(/Fetched/)).toHaveCount(0);
  await expect(page.getByText(/NVDA|NVIDIA/).last()).toBeVisible();
  await page.screenshot({ path: 'test-results/screens/chat-answer.png' });
});

test('chat input accepts typing while stock details are open', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'View stock details' }).first().click();
  await openChat(page);
  await chatInput(page).click();
  await page.keyboard.type('typing works');
  await expect(chatInput(page)).toHaveValue('typing works');
  await page.screenshot({ path: 'test-results/screens/chat-over-details.png' });
});
