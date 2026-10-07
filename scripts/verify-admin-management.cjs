const { chromium } = require('C:/Users/lenovo/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
const fs = require('fs');
async function main() {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage(); const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let rows = [{ _id: '1', name: 'Anu', email: 'anu@example.com', age: 26, gender: 'Female', district: 'Namakkal', religion: 'Hindu', role: 'user', isPremium: false }];
    await page.route('**/api/users', route => route.fulfill({ json: rows }));
    await page.route('**/api/admin/members**', async route => {
      const req = route.request(); const id = req.url().split('/').pop();
      if (req.method() === 'POST') rows.push({ ...req.postDataJSON(), _id: '2', role: 'user' });
      if (req.method() === 'PUT') rows = rows.map(row => row._id === id ? { ...row, ...req.postDataJSON() } : row);
      if (req.method() === 'DELETE') rows = rows.filter(row => row._id !== id);
      await route.fulfill({ json: {} });
    });
    await page.addInitScript(() => localStorage.setItem('adminToken', 'fixture-session'));
    fs.mkdirSync('artifacts/admin-management', { recursive: true });
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('http://localhost:3002/');
      await page.getByRole('heading', { name: 'Overview', exact: true }).waitFor();
      if (await page.getByRole('button', { name: 'Go back' }).count()) throw new Error('Overview has back button');
      await page.goto('http://localhost:3002/members');
      await page.getByText('Anu', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Add member', exact: true }).click();
      await page.getByRole('dialog').waitFor();
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Page overflow');
      if (await page.getByRole('dialog').evaluate(el => el.scrollWidth > el.clientWidth)) throw new Error('Dialog overflow');
      await page.screenshot({ path: `artifacts/admin-management/add-${width}.png`, fullPage: true });
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      await page.getByRole('combobox', { name: 'Language' }).selectOption('ta');
      await page.getByRole('heading', { name: 'உறுப்பினர்கள்', exact: true }).waitFor();
      await page.getByRole('button', { name: 'உறுப்பினரைச் சேர்', exact: true }).click();
      await page.screenshot({ path: `artifacts/admin-management/tamil-add-${width}.png`, fullPage: true });
      await page.getByRole('button', { name: 'ரத்து', exact: true }).click();
      await page.reload();
      await page.getByRole('heading', { name: 'உறுப்பினர்கள்', exact: true }).waitFor();
      for (const path of ['/', '/premium', '/reports', '/settings']) {
        await page.goto(`http://localhost:3002${path}`);
        await page.getByRole('heading', { level: 1 }).waitFor();
        if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error(`Tamil page overflow: ${path} at ${width}`);
        await page.screenshot({ path: `artifacts/admin-management/tamil-${path.slice(1) || 'overview'}-${width}.png`, fullPage: true });
      }
      await page.goto('http://localhost:3002/members');
      await page.getByRole('combobox', { name: 'மொழி' }).selectOption('en');
    }
    await page.getByRole('button', { name: 'Add member', exact: true }).click();
    await page.getByLabel('Name', { exact: true }).fill('Test Member');
    await page.getByLabel('Email', { exact: true }).fill('test@example.com');
    await page.getByLabel('Password', { exact: true }).fill('fixture-password');
    await page.getByRole('button', { name: 'Save member', exact: true }).click();
    await page.getByText('Member added.', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Edit member Test Member', exact: true }).click();
    await page.getByLabel('Name', { exact: true }).fill('Updated Member');
    await page.getByRole('button', { name: 'Save member', exact: true }).click();
    await page.getByText('Updated Member', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Delete member Updated Member', exact: true }).click();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    if (!rows.some(row => row.name === 'Updated Member')) throw new Error('Cancel deleted member');
    await page.getByRole('button', { name: 'Delete member Updated Member', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete member', exact: true }).click();
    await page.getByText('Member deleted.', { exact: true }).waitFor();
    if (rows.some(row => row.name === 'Updated Member')) throw new Error('Delete failed');
    if (errors.length) throw new Error(errors.join('\n'));
    console.log('Desktop/mobile English/Tamil layouts, language persistence, add/edit/delete and cancellation passed with fixture data.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
