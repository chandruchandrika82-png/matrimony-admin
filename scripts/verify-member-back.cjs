const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
async function main() {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const context = await browser.newContext();
  await context.addInitScript(() => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({ _id: 'self', name: 'Test Member' }));
  });
  const page = await context.newPage();
  await page.route('**/api/**', route => route.fulfill({ json: /favorites|messages|\/users$/.test(route.request().url()) ? [] : { _id: 'self', name: 'Test Member' } }));
  await page.goto('http://localhost:3000/saved');
  await page.getByRole('button', { name: 'Go back' }).click();
  await page.waitForURL('**/profiles');
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Saved profiles' }).click();
  await page.getByRole('button', { name: 'Go back' }).click();
  await page.waitForURL('**/profiles');
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/saved', '/interested', '/my-dashboard', '/chat/other']) {
      await page.goto('http://localhost:3000' + path);
      await page.getByRole('button', { name: 'Go back' }).waitFor();
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Page overflow');
    }
  }
  await browser.close();
  console.log('Member back buttons, previous-page navigation, direct-link fallback, and desktop/mobile layouts passed.');
}
main().catch(error => { console.error(error); process.exit(1); });
