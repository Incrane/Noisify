import { test, expect } from '@playwright/test';

test('Staff can view personal and invite new staff', async ({ page }) => {
  // 1. Login
  await page.goto('/login');
  
  await page.fill('input[type="email"]', 'anna_test@noisify.se');
  await page.fill('input[type="password"]', '123456');
  await page.click('button:has-text("Logga in")');

  // Wait a bit for redirect
  await page.waitForTimeout(2000);
  console.log('Current URL after login:', page.url());

  // Wait for redirect to staff dashboard or org selector
  await page.waitForURL(/\/staff/);
  
  // Handle Org Selector if present
  if (await page.isVisible('text=Välj verksamhet')) {
      console.log('Org selector found, clicking Test Fritidsgård');
      await page.click('button:has-text("Test Fritidsgård")');
      // Wait for dashboard to reload
      await page.waitForTimeout(2000);
  }
  
  console.log('URL after wait:', page.url());

  // 2. Navigate to Personal
  // The Verksamhet menu might be collapsed or expanded. 
  // First ensure we are on a page with the sidebar
  try {
    await expect(page.locator('nav')).toBeVisible({ timeout: 5000 });
  } catch (e) {
      console.log('Nav not found. Page content:', await page.content());
      throw e;
  }
  
  const personalLink = page.locator('a[href="/staff/verksamhet/personal"]');
  
  // If personal link is not visible, try clicking Verksamhet to expand
  if (!await personalLink.isVisible()) {
    const verksamhetBtn = page.locator('button:has-text("Verksamhet")');
    if (await verksamhetBtn.isVisible()) {
        await verksamhetBtn.click();
    }
  }
  
  // Wait for it to be visible
  await personalLink.waitFor({ state: 'visible', timeout: 5000 });
  await personalLink.click();

  await page.waitForURL('/staff/verksamhet/personal');
  await expect(page.getByRole('heading', { name: 'Personal' })).toBeVisible();

  // 3. Open Modal
  await page.click('button:has-text("Bjud in ny personal")');
  await expect(page.getByText('Bjud in ny personal till verksamheten')).toBeVisible();

  // 4. Fill Form
  // The email field in modal has label "E-post *" but let's use the placeholder or input type if label is tricky (due to *).
  // Using CSS selectors is safer here given the structure.
  
  // First name
  // <label>Förnamn ...</label><input ...>
  // We can use layout selector or just assume order or use fill on input which follows label
  // Let's use the structure: div > label:has-text("Förnamn") + input
  // Or better: page.locator('input').nth(0) is risky.
  
  // Let's use getByLabel if possible, but the * might mess it up.
  // Let's try to just fill by finding the input near the text.
  
  // Actually, looking at new-staff-modal.tsx:
  // <div><label...>Förnamn...</label><input...></div>
  
  await page.locator('label:has-text("Förnamn") + input').fill('Test');
  await page.locator('label:has-text("Efternamn") + input').fill('Personal');
  
  // Email is already filled above? No, I wait, line 60 was:
  // await page.fill('input[type="email"]', ...);
  // This might target the login email if modal not open? No, login page is gone.
  // But there are multiple inputs.
  // Let's be specific.
  
  await page.locator('input[type="email"]').last().fill(`newstaff_${Date.now()}@test.se`);

  // 5. Submit
  await page.click('form button[type="submit"]');

  // 6. Verify Success
  await expect(page.getByText('Skickat!')).toBeVisible();
});
