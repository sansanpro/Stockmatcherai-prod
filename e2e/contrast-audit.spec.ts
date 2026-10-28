import { test, expect } from '@playwright/test';
import { measureContrast } from './contrast-audit';

// The contrast audit is an instrument, so it is tested too: it must flag faint text, including
// text on a colored band and semi-transparent text, and pass dark text.
test('contrast audit flags faint text and passes readable text', async ({ page }) => {
  await page.setContent(`<body style="margin:0;background:#F7F5FE">
    <p id="faint" style="color:#9A9AB0">faint gray on the base</p>
    <p style="color:#1B1931">ink on the base</p>
    <div style="background:#C7CDFE"><span style="color:#5E5E77">light gray on a vivid band</span></div>
    <div style="background:#623CCD"><span style="color:rgba(255,255,255,0.6)">white at 60% on violet</span></div>
    <h1 style="color:#8565FF;font-size:28px;font-weight:700">large bright violet</h1>
  </body>`);
  const fails = (await measureContrast(page)).map(f => f.text);
  expect(fails).toContain('faint gray on the base');
  expect(fails).toContain('light gray on a vivid band');
  expect(fails).toContain('white at 60% on violet');
  expect(fails).not.toContain('ink on the base');
  expect(fails).not.toContain('large bright violet'); // large text needs 3:1
});
