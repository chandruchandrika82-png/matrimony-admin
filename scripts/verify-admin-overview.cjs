const { chromium } = require('C:/Users/lenovo/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
async function main() {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage(); const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('adminToken', 'fixture'));
    const members = Array.from({ length: 12 }, (_, i) => ({ _id: String(i), name: `Fixture Member ${i + 1}`, email: `fixture${i + 1}@example.com`, age: 25 + i, gender: i % 2 ? 'Male' : 'Female', district: i % 3 ? 'Namakkal' : 'Erode', isPremium: i < 4, createdAt: new Date(Date.UTC(2026, 9, i + 1)).toISOString() }));
    await page.route('**/api/**', route => route.fulfill({ json: members }));
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 }); await page.goto('http://localhost:3002/');
      await page.locator('.overview-donut').getByText('33%').waitFor();
      for (const language of ['en', 'ta']) {
        await page.locator('.language-select').selectOption(language);
        if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Overview overflow');
        if (await page.locator('.page-back').count()) throw new Error('Overview has a back button');
        await page.screenshot({ path: `artifacts/admin-overview-${language}-${width}.png`, fullPage: true });
      }
    }
    await page.locator('.language-select').selectOption('en');
    await page.getByRole('button', { name: 'Refresh members' }).click();
    await page.locator('.overview-donut').getByText('33%').waitFor();
    await page.getByRole('link', { name: 'View members' }).click();
    await page.locator('.member-card').first().waitFor();
    if (errors.length) throw new Error(errors.join('\n'));
    console.log('Admin Overview metrics/chart, English/Tamil responsive layouts, refresh and Members link passed with fixture data.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
