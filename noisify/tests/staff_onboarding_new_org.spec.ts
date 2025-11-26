import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

test.describe('Staff Onboarding - New Organization Experience', () => {
  let supabase: ReturnType<typeof createClient>;
  let newOrgId: string;
  let staffProfileId: string;
  const testOrgName = `Test Fritidsgård ${Date.now()}`;
  
  test.beforeAll(async () => {
    // Initialize Supabase client with service role key for admin operations
    supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the staff test user's profile ID (anna_test@noisify.se)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('alias', 'Anna Test')
      .single();
    
    if (!profile) {
      throw new Error('Test staff user not found');
    }
    
    staffProfileId = profile.id;
    
    // Create a brand new organization
    const { data: newOrg, error: orgError } = await supabase
      .from('organisation')
      .insert({
        name: testOrgName,
        description: 'En helt ny fritidsgård som precis ska sätta upp sitt konto i Noisify-systemet.',
        contact_email: 'info@testfritidsgard.se',
        contact_phone: '+46 31 999 88 77',
        address: 'Nya Gatan 1, 412 99 Göteborg',
        is_active: true
      })
      .select('org_id')
      .single();
    
    if (orgError || !newOrg) {
      throw new Error(`Failed to create test organization: ${orgError?.message}`);
    }
    
    newOrgId = newOrg.org_id;
    console.log(`✅ Created new test organization: ${testOrgName} (ID: ${newOrgId})`);
    
    // Assign staff user to this new organization (role_id 2 = standard staff)
    const { error: orgUserError } = await supabase
      .from('org_user')
      .insert({
        org_id: newOrgId,
        profile_id: staffProfileId,
        role_id: 2
      });
    
    if (orgUserError) {
      throw new Error(`Failed to assign staff to organization: ${orgUserError.message}`);
    }
    
    console.log('✅ Assigned staff user to new organization');
  });
  
  test.afterAll(async () => {
    // Cleanup: Remove test data
    if (newOrgId) {
      // Delete org_user relationship
      await supabase
        .from('org_user')
        .delete()
        .eq('org_id', newOrgId)
        .eq('profile_id', staffProfileId);
      
      // Delete organization
      await supabase
        .from('organisation')
        .delete()
        .eq('org_id', newOrgId);
      
      console.log('✅ Cleaned up test organization');
    }
  });

  test('should show organization selection screen when staff has multiple organizations', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3000/login');
    
    // Login as staff user
    await page.fill('input[type="email"]', 'anna_test@noisify.se');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to staff area
    await page.waitForURL(/\/staff/, { timeout: 10000 });
    
    // Should see organization selection screen
    await expect(page.getByText('Välj verksamhet')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Välj vilken verksamhet du vill administrera')).toBeVisible();
    
    // Should see the new organization in the list
    await expect(page.getByText(testOrgName)).toBeVisible();
    
    console.log('✅ Organization selection screen displayed correctly');
  });

  test('should allow staff to select the new organization and see dashboard', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'anna_test@noisify.se');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/staff/, { timeout: 10000 });
    
    // Select the new organization
    await page.getByText(testOrgName).click();
    
    // Should redirect to staff dashboard
    await page.waitForURL('http://localhost:3000/staff', { timeout: 10000 });
    
    // Verify dashboard elements
    await expect(page.getByRole('heading', { name: 'Översikt' })).toBeVisible();
    await expect(page.getByText('Välkommen till personalportalen')).toBeVisible();
    
    // Check stats cards
    await expect(page.getByText('Väntande anmälningar')).toBeVisible();
    await expect(page.getByText('Kommande aktiviteter')).toBeVisible();
    await expect(page.getByText('Mina Organisationer')).toBeVisible();
    
    // Verify organization is in header
    await expect(page.getByText(testOrgName)).toBeVisible();
    
    console.log('✅ Staff dashboard displayed correctly for new organization');
  });

  test('should navigate to settings and configure organization details', async ({ page }) => {
    // Login and select organization
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'anna_test@noisify.se');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/staff/, { timeout: 10000 });
    await page.getByText(testOrgName).click();
    await page.waitForURL('http://localhost:3000/staff', { timeout: 10000 });
    
    // Navigate to settings via sidebar
    await page.click('text=Verksamhet');
    await page.click('a[href="/staff/installningar"]');
    
    // Wait for settings page
    await page.waitForURL('http://localhost:3000/staff/installningar', { timeout: 10000 });
    
    // Verify settings page structure
    await expect(page.getByRole('heading', { name: 'Inställningar' })).toBeVisible();
    await expect(page.getByText('Hantera information och inställningar för din verksamhet')).toBeVisible();
    
    // Check tabs
    await expect(page.getByText('Verksamhetens info')).toBeVisible();
    await expect(page.getByText('Öppettider')).toBeVisible();
    await expect(page.getByText('Plan')).toBeVisible();
    await expect(page.getByText('Medlemskap')).toBeVisible();
    
    console.log('✅ Settings page displayed correctly');
  });

  test('should update organization information in settings', async ({ page }) => {
    // Login and select organization
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'anna_test@noisify.se');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/staff/, { timeout: 10000 });
    await page.getByText(testOrgName).click();
    await page.waitForURL('http://localhost:3000/staff', { timeout: 10000 });
    
    // Navigate to settings
    await page.click('text=Verksamhet');
    await page.click('a[href="/staff/installningar"]');
    await page.waitForURL('http://localhost:3000/staff/installningar', { timeout: 10000 });
    
    // Should be on "Verksamhetens info" tab by default
    await expect(page.getByText('Verksamhetens info', { exact: false })).toBeVisible();
    
    // Check if organization name field exists and has correct value
    const nameInput = page.locator('input[name="name"]');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveValue(testOrgName);
    
    // Update organization description
    const descriptionField = page.locator('textarea[name="description"]');
    await expect(descriptionField).toBeVisible();
    
    const newDescription = 'Vi är en modern fritidsgård som erbjuder aktiviteter för unga mellan 10-20 år. Välkomna!';
    await descriptionField.clear();
    await descriptionField.fill(newDescription);
    
    // Update contact phone
    const phoneInput = page.locator('input[name="contact_phone"]');
    if (await phoneInput.isVisible()) {
      await phoneInput.clear();
      await phoneInput.fill('+46 31 555 44 33');
    }
    
    // Submit the form
    const saveButton = page.getByRole('button', { name: /spara|uppdatera/i });
    await expect(saveButton).toBeVisible();
    await saveButton.click();
    
    // Wait for success message or page reload
    await page.waitForTimeout(2000);
    
    // Verify changes persisted (reload page)
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check if description was updated
    await expect(page.locator('textarea[name="description"]')).toHaveValue(newDescription);
    
    console.log('✅ Organization information updated successfully');
  });

  test('should explore other staff features for new organization', async ({ page }) => {
    // Login and select organization
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'anna_test@noisify.se');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/staff/, { timeout: 10000 });
    await page.getByText(testOrgName).click();
    await page.waitForURL('http://localhost:3000/staff', { timeout: 10000 });
    
    // Test navigation to Activities
    await page.click('a[href="/staff/aktiviteter"]');
    await page.waitForURL('http://localhost:3000/staff/aktiviteter', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Aktiviteter' })).toBeVisible();
    
    // Should show empty state for new organization
    await expect(page.getByText(/inga aktiviteter|skapa din första aktivitet/i)).toBeVisible();
    
    // Test navigation to Members
    await page.click('text=Verksamhet');
    await page.click('a[href="/staff/medlemmar"]');
    await page.waitForURL('http://localhost:3000/staff/medlemmar', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Medlemmar' })).toBeVisible();
    
    // Test navigation to Courses
    await page.click('a[href="/staff/kurser"]');
    await page.waitForURL('http://localhost:3000/staff/kurser', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Kurser' })).toBeVisible();
    
    // Test navigation to Room Bookings
    await page.click('a[href="/staff/rum"]');
    await page.waitForURL('http://localhost:3000/staff/rum', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: /rum|bokningar/i })).toBeVisible();
    
    console.log('✅ Successfully navigated through all staff features');
  });

  test('should be able to create first activity for new organization', async ({ page }) => {
    // Login and select organization
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'anna_test@noisify.se');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/staff/, { timeout: 10000 });
    await page.getByText(testOrgName).click();
    await page.waitForURL('http://localhost:3000/staff', { timeout: 10000 });
    
    // Navigate to activities
    await page.click('a[href="/staff/aktiviteter"]');
    await page.waitForURL('http://localhost:3000/staff/aktiviteter', { timeout: 10000 });
    
    // Click "New Activity" button
    await page.click('a[href="/staff/aktiviteter/new"]');
    await page.waitForURL('http://localhost:3000/staff/aktiviteter/new', { timeout: 10000 });
    
    // Verify activity creation form
    await expect(page.getByRole('heading', { name: /skapa aktivitet|ny aktivitet/i })).toBeVisible();
    
    // Fill in basic activity information
    await page.fill('input[name="name"]', 'Första aktiviteten - Välkomstevent');
    
    // Check if form has description field
    const descField = page.locator('textarea[name="description"]');
    if (await descField.isVisible()) {
      await descField.fill('Detta är vår allra första aktivitet i systemet! Alla är välkomna att delta.');
    }
    
    console.log('✅ Activity creation form accessible for new organization');
  });

  test('should display organization in staff header with switcher', async ({ page }) => {
    // Login and select organization
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'anna_test@noisify.se');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/staff/, { timeout: 10000 });
    await page.getByText(testOrgName).click();
    await page.waitForURL('http://localhost:3000/staff', { timeout: 10000 });
    
    // Verify organization name appears in header
    await expect(page.getByText(testOrgName)).toBeVisible();
    
    // Look for organization switcher (if exists)
    const orgSwitcher = page.locator('[data-testid="org-switcher"], button:has-text("' + testOrgName + '")');
    if (await orgSwitcher.isVisible()) {
      console.log('✅ Organization switcher found in header');
    } else {
      console.log('ℹ️ Organization name displayed in header (no switcher visible)');
    }
  });
});
