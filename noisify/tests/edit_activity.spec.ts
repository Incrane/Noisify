
import { test, expect } from '@playwright/test';

test('Edit Activity Test', async ({ page }) => {
  // 1. Login as Staff (using one of the known staff credentials from memory)
  // Using anna_test@noisify.se / 123456 (Role 2)
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="email"]', 'anna_test@noisify.se');
  await page.fill('input[name="password"]', '123456');
  await page.click('button:has-text("Logga in")');
  
  // Wait for login to complete - could be dashboard or org selector
  await page.waitForURL('**/staff**', { timeout: 10000 });

  // Handle Org Selector if present
  const isOrgSelector = await page.isVisible('text=Välj verksamhet');
  if (isOrgSelector) {
      await page.click('button:has-text("Test Fritidsgård")'); // Click specific org or first one
      // Wait for dashboard to load after selection
      await page.waitForTimeout(1000); // Short wait for state update/reload
  }

  // 2. Navigate to Activities
  // Ensure we are on the right page, click sidebar link if needed, or force navigate
  await page.goto('http://localhost:3000/staff/aktiviteter');
  await page.waitForURL('**/staff/aktiviteter');

  // 3. Find an activity to edit
  // We assume there is at least one activity. If not, this test might fail or need to create one first.
  // We click the first "Hantera" link
  await page.click('table tbody tr:first-child a[href^="/staff/aktiviteter/"]');
  
  // 4. Click "Redigera"
  await page.click('text=Redigera');
  
  // 5. Modify the activity title
  const newTitle = `Updated Activity ${Date.now()}`;
  await page.fill('input[name="name"]', newTitle);
  
  // 6. Save changes
  await page.click('button[value="publish"]');
  
  // 7. Verify redirect back to list
  await page.waitForURL('**/staff/aktiviteter');
  
  // 8. Verify the new title is visible in the list
  await expect(page.locator('body')).toContainText(newTitle);
});
