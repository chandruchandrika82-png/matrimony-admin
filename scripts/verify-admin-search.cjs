const { chromium } = require('C:/Users/lenovo/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
async function main() {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => localStorage.setItem('adminToken', 'fixture'));
    const members = Array.from({ length: 12 }, (_, i) => ({ _id: String(i), name: `Fixture Member ${i}`, email: `member${i}@example.com`, age: i === 0 ? 30 : 31, district: i === 0 ? 'Erode' : 'Namakkal', gender: 'Female', createdAt: new Date(Date.UTC(2026, 9, i + 1)).toISOString() }));
    await page.route('**/api/**', route => route.fulfill({ json: members }));
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 }); await page.goto('http://localhost:3002/');
      await page.locator('.language-select').selectOption('en');
      await page.getByText('Fixture Member 11', { exact: true }).waitFor();
      await page.getByRole('textbox', { name: 'Search recent profiles' }).fill('Erode');
      await page.getByText('Fixture Member 0', { exact: true }).waitFor();
      await page.locator('.overview-directory').scrollIntoViewIfNeeded();
      for (const language of ['en', 'ta']) {
        await page.locator('.language-select').selectOption(language);
        if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Overview search overflow');
        await page.screenshot({ path: `artifacts/overview-search-${language}-${width}.png`, fullPage: true });
      }
      await page.locator('.language-select').selectOption('en');
      await page.getByRole('link', { name: 'View all', exact: true }).click();
      if (await page.getByRole('textbox', { name: 'Search members' }).inputValue() !== 'Erode') throw new Error('Search query not carried to Members');
      if (await page.locator('.member-card').count() !== 1) throw new Error('Directory filtering failed');
      await page.getByRole('button', { name: 'Clear search' }).click();
      await page.getByRole('textbox', { name: 'Search members' }).fill('30');
      if (await page.locator('.member-card').count() !== 1) throw new Error('Exact age search failed');
      for (const language of ['en', 'ta']) {
        await page.locator('.language-select').selectOption(language);
        if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Members search overflow');
        await page.screenshot({ path: `artifacts/members-search-${language}-${width}.png`, fullPage: true });
      }
    }
    if (errors.length) throw new Error(errors.join('\n'));
    console.log('Overview and Members search, cross-page query, exact age and English/Tamil layouts passed at desktop/mobile sizes.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
