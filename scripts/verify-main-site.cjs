const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('fs');
async function main() {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const current = { _id: 'self', name: 'Test Member', email: 'test@example.com', age: 29, gender: 'Male', district: 'Namakkal', currentCity: 'Namakkal', religion: 'Hindu', motherTongue: 'Tamil', education: 'Graduate', occupationType: 'Private Job', maritalStatus: 'Never Married', image: 'http://localhost:3000/logo.png', acceptedRequests: [], interestRequests: [], favoriteProfiles: [] };
  const other = { ...current, _id: 'other', name: 'Test Profile', gender: 'Female', age: 26 };
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url());
    let json = current;
    if (/\/login$|\/register$/.test(url.pathname)) json = { token: 'browser-test-token', user: current };
    else if (url.pathname.endsWith('/users')) json = [current, other];
    else if (url.pathname.includes('/messages') || url.pathname.endsWith('/favorites')) json = [];
    else if (url.pathname.endsWith('/other')) json = other;
    return route.fulfill({ json });
  });
  fs.mkdirSync('artifacts/main-site', { recursive: true });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/login', '/register']) {
      await page.goto('http://localhost:3000' + path);
      await page.locator('h1').first().waitFor();
      if (path === '/') await page.waitForFunction(() => document.querySelector('.hero-photo')?.naturalWidth > 0);
      await page.waitForFunction(() => document.querySelector('.brand-logo')?.naturalWidth > 0);
      if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) throw new Error(`Overflow: ${path} ${width}`);
      await page.screenshot({ path: `artifacts/main-site/${path.slice(1) || 'home'}-${width}.png`, fullPage: true });
    }
  }
  await page.goto('http://localhost:3000');
  await page.getByLabel('Minimum age').selectOption('40');
  await page.getByRole('button', { name: 'Search profiles', exact: true }).click();
  await page.getByRole('alert').waitFor();
  await page.getByLabel('Minimum age').selectOption('22');
  await page.getByRole('button', { name: 'Search profiles', exact: true }).click();
  await page.getByRole('heading', { name: 'Welcome back' }).waitFor();
  await page.getByLabel('Email address').fill('test@example.com');
  await page.getByLabel('Password', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByText('Test Profile', { exact: true }).waitFor();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/profiles', '/profile/other', '/my-dashboard', '/my-profile', '/edit/self', '/saved', '/interested', '/interest-requests', '/account-settings', '/chat/other']) {
      await page.goto('http://localhost:3000' + path);
      await page.waitForTimeout(600);
      if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) throw new Error(`Overflow: ${path} ${width}`);
      await page.screenshot({ path: `artifacts/main-site/${path.slice(1).replaceAll('/', '-')}-${width}.png`, fullPage: true });
    }
  }
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Saved profiles' }).click();
  if (!page.url().endsWith('/saved')) throw new Error('Mobile navigation failed');
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.goto('http://localhost:3000/register');
  await page.getByLabel('Full name').fill('New Test Member');
  await page.getByLabel('Email address').fill('new@example.com');
  await page.getByLabel('Password', { exact: true }).fill('test-password');
  await page.getByLabel('Confirm password').fill('different-password');
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.getByRole('alert').filter({ hasText: 'Passwords do not match' }).waitFor();
  await page.getByLabel('Confirm password').fill('test-password');
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.getByRole('heading', { name: 'Tell your story' }).waitFor();
  if (errors.length) throw new Error(errors.join('\n'));
  await browser.close();
  console.log('Main website desktop/mobile pages, search through login, and mobile navigation passed. API calls used test fixtures.');
}
main().catch(e => { console.error(e); process.exit(1); });
