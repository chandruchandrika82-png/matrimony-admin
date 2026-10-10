const { chromium } = require('C:/Users/lenovo/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
async function main() {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage();
    await page.addInitScript(() => localStorage.setItem('adminToken', 'fixture-session'));
    const photo = 'http://localhost:3002/logo.png';
    await page.route('**/api/users', route => route.fulfill({ json: [{ _id: '1', name: 'Test Member', email: 'fixture@example.com', age: 30, fatherOccupation: 'Farmer', jobCategory: 'Engineering', image: photo, profilePhotos: [photo], familyPhotos: [photo], officePhotos: [photo] }] }));
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 }); await page.goto('http://localhost:3002/members');
      await page.getByRole('button', { name: 'View Test Member' }).click();
      const dialog = page.getByRole('dialog'); await dialog.getByText('Engineering', { exact: true }).waitFor();
      await dialog.locator('.member-main-photo').evaluate(img => img.decode());
      await page.screenshot({ path: `artifacts/member-full-view-${width}.png` });
      await dialog.getByRole('heading', { name: 'Photos and documents' }).scrollIntoViewIfNeeded();
      for (const img of await dialog.locator('.member-photo-grid img').all()) await img.evaluate(img => img.decode());
      if (await dialog.evaluate(el => el.scrollWidth > el.clientWidth)) throw new Error('Member view overflow');
      await page.screenshot({ path: `artifacts/member-photos-${width}.png` });
    }
    console.log('Full member details and rendered photo groups verified at desktop/mobile sizes with fixtures.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
