import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should navigate to login page from header', async ({ page }) => {
    await page.goto('/');
    
    // Click the Login button
    await page.click('text=Login');
    
    // Ensure we are on the login page
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByText('Welcome Back')).toBeVisible();
  });

  test('should navigate to register page and render form', async ({ page }) => {
    await page.goto('/');
    
    // Click the Register button
    await page.click('text=Register');
    
    // Ensure we are on the register page
    await expect(page).toHaveURL(/.*register/);
    await expect(page.getByText('Create Account')).toBeVisible();
    
    // Ensure the form inputs exist
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});
