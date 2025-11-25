import { test, expect } from '@playwright/test';

test('Staff can view personal and invite new staff', async ({ page }) => {
  // 1. Login
  await page.goto('/logga-in');
  await page.fill('input[type="email"]', 'anna_test@noisify.se');
  await page.fill('input[type="password"]', '123456');
  await page.click('button[type="submit"]');

  // Wait for redirect to staff dashboard
  await page.waitForURL(/\/staff/);

  // 2. Navigate to Personal
  // The Verksamhet menu might be collapsed or expanded. 
  const personalLink = page.locator('a[href="/staff/verksamhet/personal"]');
  if (!await personalLink.isVisible()) {
    await page.click('text=Verksamhet');
  }
  await personalLink.click();

  await page.waitForURL('/staff/verksamhet/personal');
  await expect(page.getByRole('heading', { name: 'Personal' })).toBeVisible();

  // 3. Open Modal
  await page.click('button:has-text("Bjud in ny personal")');
  await expect(page.getByText('Bjud in ny personal till verksamheten')).toBeVisible();

  // 4. Fill Form
  await page.fill('input[type="email"]', `newstaff_${Date.now()}@test.se`);
  await page.fill('text=Förnamn', 'Test');
  await page.fill('text=Efternamn', 'Personal');

  // 5. Submit
  await page.click('button:has-text("Bjud in")');

  // 6. Verify Success
  await expect(page.getByText('Skickat!')).toBeVisible();
  
  // Wait for modal to close or check if we can close it
  // The code closes it after 1.5s
  // We can just verify the "Skickat!" message which appears in the button or form
});
