const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
async function main() {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const page = await browser.newPage();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('http://localhost:3000');
    await page.waitForFunction(() => document.querySelector('.hero-photo')?.naturalWidth > 0);
    const source = await page.locator('.hero-photo').getAttribute('src');
    if (source !== '/tamil-wedding-hero.png') throw new Error('Wrong hero image');
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Horizontal overflow');
    await page.screenshot({ path: `artifacts/tamil-home-${width}.png` });
  }
  await browser.close();
  console.log('Tamil wedding image loaded and homepage layouts passed on desktop and mobile.');
}
main().catch(e => { console.error(e); process.exit(1); });
