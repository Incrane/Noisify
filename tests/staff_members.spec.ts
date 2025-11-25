import { test, expect } from '@playwright/test';

test('Staff can view members and create local member', async ({ page }) => {
  // 1. Login
  await page.goto('/logga-in');
  await page.fill('input[type="email"]', 'anna_test@noisify.se');
  await page.fill('input[type="password"]', '123456');
  await page.click('button[type="submit"]');

  // Wait for redirect to staff dashboard or activity page
  await page.waitForURL(/\/staff/);

  // 2. Navigate to Medlemmar
  // The Verksamhet menu might be collapsed or expanded. 
  // Since I set initial state to open in sidebar, check if link is visible, if not click Verksamhet
  const membersLink = page.locator('a[href="/staff/medlemmar"]');
  if (!await membersLink.isVisible()) {
    await page.click('text=Verksamhet');
  }
  await membersLink.click();

  await page.waitForURL('/staff/medlemmar');
  await expect(page.getByRole('heading', { name: 'Medlemmar' })).toBeVisible();

  // 3. Open Modal
  await page.click('button:has-text("Ny medlem")');
  await expect(page.getByText('Digital medlem')).toBeVisible();
  await expect(page.getByText('Local medlem')).toBeVisible();

  // 4. Select Local Member Tab
  await page.click('text=Local medlem');
  
  // 5. Fill Form
  const uniqueAlias = `TestMedlem_${Date.now()}`;
  await page.fill('input[placeholder="Ange alias"]', uniqueAlias);
  await page.fill('input[placeholder="T.ex. medlemsnummer"]', '12345');

  // 6. Submit
  await page.click('button:has-text("Skapa Local Medlem")');

  // 7. Verify
  await expect(page.getByText(uniqueAlias)).toBeVisible();
  // We need to be specific about 'Local' text as it might appear elsewhere, but checking row content is better
  // But simple text check is okay for now
  await expect(page.getByRole('cell', { name: 'Local' }).first()).toBeVisible();
});
