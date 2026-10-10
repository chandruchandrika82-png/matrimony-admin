const { chromium } = require('C:/Users/lenovo/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
const fs = require('fs');
async function main() {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage(); const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('adminToken', 'fixture-session'));
    const members = Array.from({ length: 13 }, (_, i) => ({ _id: String(i), name: `Member ${i + 1}`, email: i === 0 ? 'long-member-email-address-for-responsive-check@example.com' : `member${i + 1}@example.com`, age: 30 + i, gender: i % 2 ? 'Male' : 'Female', district: 'Namakkal', religion: 'Hindu', isPremium: i % 2 === 0, image: i === 2 ? null : 'https://fixture.invalid/photo.png' }));
    await page.route('**/api/users', route => route.fulfill({ json: members }));
    await page.route('https://fixture.invalid/photo.png', route => route.fulfill({ contentType: 'image/png', body: fs.readFileSync('C:/Users/lenovo/Desktop/matrimony-app/frontend/public/tamil-wedding-hero.png') }));
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 }); await page.goto('http://localhost:3002/members');
      await page.getByRole('article', { name: 'Member 1', exact: true }).waitFor();
      await page.locator('.member-card-photo img').first().evaluate(img => img.decode());
      const fullPhoto = await page.locator('.member-card-photo img').first().evaluate(img => {
        const image = img.getBoundingClientRect(); const frame = img.parentElement.getBoundingClientRect();
        return getComputedStyle(img).objectFit === 'cover' && Math.abs(image.height - frame.height) < 1 && Math.abs(image.width - frame.width) < 1;
      });
      if (!fullPhoto) throw new Error('Photo does not fill its fixed frame');
      const cardHeights = await page.locator('.member-card').evaluateAll(cards => cards.map(card => card.getBoundingClientRect().height));
      if (Math.max(...cardHeights) - Math.min(...cardHeights) > 1) throw new Error('Profile cards have different heights');
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Card directory overflow');
      await page.screenshot({ path: `artifacts/member-cards-${width}.png`, fullPage: true });
      await page.getByRole('textbox', { name: 'Search members' }).fill('30');
      if (await page.locator('.member-card').count() !== 1) throw new Error('Age search failed');
      await page.getByRole('button', { name: 'View Member 1', exact: true }).click(); await page.getByRole('dialog').waitFor();
      await page.getByRole('button', { name: 'Close', exact: true }).click();
      await page.getByRole('button', { name: 'Edit member Member 1', exact: true }).click();
      const editor = page.getByRole('dialog');
      await editor.locator('.dialog-scroll-body').evaluate(el => { el.scrollTop = el.scrollHeight; });
      const close = editor.getByRole('button', { name: 'Close', exact: true });
      const bounds = await close.boundingBox();
      if (!bounds || bounds.y < 0 || bounds.y + bounds.height > 900) throw new Error('Edit Close button moved outside viewport');
      await page.screenshot({ path: `artifacts/member-edit-fixed-close-${width}.png` });
      await close.click();
      if (await editor.count()) throw new Error('Scrolled editor did not close');
      await page.getByRole('textbox', { name: 'Search members' }).fill('');
      await page.getByRole('button', { name: 'Next page' }).click();
      if (await page.locator('.member-card').count() !== 3) throw new Error('Card pagination failed');
      await page.getByRole('combobox', { name: 'Language' }).selectOption('ta');
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Tamil card overflow');
      await page.screenshot({ path: `artifacts/member-cards-tamil-${width}.png`, fullPage: true });
      await page.getByRole('combobox', { name: 'மொழி' }).selectOption('en');
    }
    if (errors.length) throw new Error(errors.join('\n'));
    console.log('Photo cards, image rendering, age search, pagination, View dialog and English/Tamil desktop/mobile layouts passed with fixtures.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
