import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

test('admin login test', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await expect(page.getByRole('link', { name: 'Sigma Tutor Logo Sigma Tutor' })).toBeVisible();
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await page.getByRole('textbox', { name: 'name@example.com' }).click();
  await page.getByRole('textbox', { name: 'name@example.com' }).fill(process.env.TEST_ADMIN_EMAIL!);
  await page.getByRole('textbox', { name: '••••••••' }).click();
  await page.getByRole('textbox', { name: '••••••••' }).fill(process.env.TEST_ADMIN_PASSWORD!);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
  await expect(page.getByRole('button', { name: 'ออกจากระบบ' })).toBeVisible();
});
