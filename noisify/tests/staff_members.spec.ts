import { test, expect } from '@playwright/test';

test('Staff can view members and create local member', async ({ page }) => {
  // 1. Login
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'E-postadress' }).fill('anna_test@noisify.se');
  await page.getByRole('textbox', { name: 'Lösenord' }).fill('123456');
  await page.getByRole('button', { name: 'Logga in' }).click();

  // Wait for redirect to either staff dashboard or organization selection
  await page.waitForURL(/\/staff/);

  // Check if we are on the organization selection screen (buttons with org names)
  // We assume "Test Fritidsgård" is the one we want
  const orgButton = page.getByRole('button', { name: 'Test Fritidsgård' });
  
  // Short wait to see if the org selection appears
  try {
    await orgButton.waitFor({ state: 'visible', timeout: 5000 });
    await orgButton.click();
  } catch {
    // If not visible, assume we are already on the dashboard or it's a single-org user
    console.log('Organization selection not shown or timed out, proceeding...');
  }

  // 2. Navigate to Medlemmar
  // Ensure the sidebar is loaded
  await expect(page.locator('nav')).toBeVisible();
  
  const membersLink = page.getByRole('link', { name: 'Medlemmar' });
  
  // If Medlemmar link is not visible, open the Verksamhet submenu
  if (!await membersLink.isVisible()) {
    await page.getByRole('button', { name: 'Verksamhet' }).click();
  }
  await membersLink.click();

  await page.waitForURL(/\/staff\/medlemmar/);
  await expect(page.getByRole('heading', { name: 'Medlemmar' })).toBeVisible();

  // 3. Open Modal
  await page.getByRole('button', { name: 'Ny medlem' }).click();
  // Use more specific locators for the tabs
  await expect(page.getByRole('button', { name: 'Digital medlem' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Local medlem' })).toBeVisible();

  // 4. Select Local Member Tab
  await page.getByRole('button', { name: 'Local medlem' }).click();
  
  // 5. Fill Form
  const uniqueAlias = `Test_${Date.now()}`;
  await page.getByPlaceholder('Ange alias').fill(uniqueAlias);
  await page.getByPlaceholder('T.ex. medlemsnummer').fill('12345');

  // 6. Submit
  await page.getByRole('button', { name: 'Skapa Local Medlem' }).click();

  // 7. Verify
  // Wait for modal to close to ensure action completed
  await expect(page.getByRole('button', { name: 'Skapa Local Medlem' })).not.toBeVisible();

  // Force a reload to ensure server data is fresh
  await page.reload();
  await page.waitForURL(/\/staff\/medlemmar/);
  
  // Search for the new member
  const searchInput = page.getByPlaceholder('Sök medlem...');
  await expect(searchInput).toBeVisible();
  await searchInput.fill(uniqueAlias);
  await searchInput.press('Enter');
  
  // Wait for table to update and show the new member
  // Using a cell locator is more specific than getByText
  await expect(page.getByRole('cell', { name: uniqueAlias })).toBeVisible({ timeout: 10000 });
});
