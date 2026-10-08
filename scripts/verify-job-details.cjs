const { chromium } = require('C:/Users/lenovo/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
async function main() {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
    const member = { _id: '507f1f77bcf86cd799439012', name: 'Test Member', email: 'fixture@example.com', occupationType: 'Job', companyName: 'Test Company', jobType: 'Full-time', jobCategory: 'Engineering', jobLocation: 'Chennai', jobExperience: '3.5', profilePhotos: [], familyPhotos: [], officePhotos: [] };
    await page.addInitScript(member => { localStorage.setItem('user', JSON.stringify(member)); localStorage.setItem('token', 'fixture-session'); }, member);
    await page.route('**/api/**', async route => {
      if (route.request().method() === 'PUT') {
        const body = route.request().postData();
        for (const key of ['jobType', 'jobCategory', 'jobLocation', 'jobExperience']) if (!body.includes(`name="${key}"`)) throw new Error(`Save missing ${key}`);
      }
      await route.fulfill({ json: route.request().url().endsWith('/users') ? [member] : member });
    });
    page.on('dialog', dialog => dialog.accept());
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ['/my-profile', '/edit/' + member._id]) {
        await page.goto('http://localhost:3004' + path);
        await page.locator('[name="occupationType"]').selectOption('Job');
        await page.getByRole('combobox', { name: 'Job type', exact: true }).selectOption('Full-time');
        await page.getByLabel('Job category', { exact: true }).fill('Engineering');
        await page.getByLabel('Job location', { exact: true }).fill('Chennai');
        await page.getByLabel('Experience (years)', { exact: true }).fill('3.5');
        await page.locator('[name="occupationType"]').selectOption('Business');
        if (await page.getByRole('combobox', { name: 'Job type', exact: true }).count()) throw new Error('Business shows job controls');
        await page.locator('[name="occupationType"]').selectOption('Job');
        if (await page.getByLabel('Job location', { exact: true }).inputValue() !== 'Chennai') throw new Error('Switch lost job details');
        await page.getByLabel('Job category', { exact: true }).scrollIntoViewIfNeeded();
        if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Job form overflow');
        await page.screenshot({ path: `artifacts/job-${path.startsWith('/edit') ? 'edit' : 'add'}-${width}.png` });
        const saved = page.waitForResponse(response => response.request().method() === 'PUT');
        await page.getByRole('button', { name: path.startsWith('/edit') ? /Update Profile/ : /Save Profile/ }).click();
        await saved;
      }
    }
    await page.addInitScript(() => localStorage.setItem('adminToken', 'fixture-session'));
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('http://localhost:3002/members');
      await page.getByRole('button', { name: 'Add member', exact: true }).click();
      await page.getByRole('combobox', { name: 'Occupation', exact: true }).selectOption('Job');
      await page.getByRole('combobox', { name: 'Job type', exact: true }).selectOption('Full-time');
      await page.getByLabel('Job category', { exact: true }).fill('Engineering');
      await page.getByLabel('Job location', { exact: true }).fill('Chennai');
      await page.getByLabel('Experience (years)', { exact: true }).fill('3.5');
      await page.getByLabel('Job category', { exact: true }).scrollIntoViewIfNeeded();
      if (await page.getByRole('dialog').evaluate(el => el.scrollWidth > el.clientWidth)) throw new Error('Admin job form overflow');
      await page.screenshot({ path: `artifacts/job-admin-${width}.png` });
    }
    if (errors.length) throw new Error(errors.join('\n'));
    console.log('Main Add/Edit Profile job fields, preserved switching and desktop/mobile layouts passed with fixtures.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
