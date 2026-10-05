const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('fs');
async function main() {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const members = Array.from({ length: 13 }, (_, i) => ({ _id: String(i), name: `Member ${i + 1}`, email: `member${i + 1}@example.com`, age: 26 + i, gender: i % 2 ? 'Male' : 'Female', district: i % 2 ? 'Kollam' : 'Kochi', religion: 'Hindu', isPremium: i % 3 === 0 }));
  await page.route('**/api/users', route => route.fulfill({ json: members }));
  await page.route('**/api/admin/login', route => route.fulfill({ json: { token: 'browser-test-session', user: { name: 'Test admin' } } }));
  fs.mkdirSync('artifacts', { recursive: true });
  await page.goto('http://localhost:3001');
  await page.getByRole('heading', { name: 'Welcome back' }).waitFor();
  await page.screenshot({ path: 'artifacts/login-desktop.png', fullPage: true });
  await page.getByLabel('Email address').fill('admin@example.com');
  await page.getByLabel('Password', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByText('Member 1', { exact: true }).waitFor();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/members', '/premium', '/reports', '/settings']) {
      await page.goto(`http://localhost:3001${path}`);
      await page.getByRole('heading', { level: 1 }).waitFor();
      await page.getByText('Loading member records...', { exact: true }).waitFor({ state: 'hidden' });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (overflow) throw new Error(`Page overflow: ${path} at ${width}`);
      await page.screenshot({ path: `artifacts/${path.slice(1) || 'overview'}-${width}.png`, fullPage: true });
    }
  }
  await page.goto('http://localhost:3001/members');
  await page.getByRole('button', { name: 'View', exact: true }).first().click();
  await page.getByRole('dialog').waitFor();
  await page.getByRole('button', { name: 'Close profile' }).click();
  await page.getByRole('textbox', { name: 'Search members' }).fill('Member 13');
  await page.getByText('Member 13', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await page.getByRole('link', { name: 'Reports', exact: true }).click();
  await page.getByRole('heading', { name: 'Reports', exact: true }).waitFor();
  if (errors.length) throw new Error(errors.join('\n'));
  await browser.close();
  console.log('Desktop/mobile layouts, login, search, profile dialog and navigation passed. Screenshots use test fixtures.');
}
main().catch(error => { console.error(error); process.exit(1); });
