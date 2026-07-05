import { test, expect } from '@playwright/test';

test('cadastro e login levam ao dashboard de organizações', async ({ page }) => {
  const email = `pw.auth.${Date.now()}@example.com`;

  await page.goto('/');
  await page.waitForURL('**/login');

  await page.getByRole('button', { name: 'Cadastro' }).click();
  await page.getByLabel('Nome').fill('Playwright Auth');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill('senha1234');
  await page.getByRole('button', { name: 'Criar conta' }).click();

  await page.waitForURL('**/orgs');
  await expect(page.getByRole('heading', { name: 'Organizações' })).toBeVisible();
  await expect(page.getByRole('button', { name: '+ Nova organização' })).toBeVisible();
});

test('login com credenciais erradas mostra mensagem de erro', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('E-mail').fill('nao.existe@example.com');
  await page.getByLabel('Senha').fill('senhaerrada');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page.getByText('Credenciais inválidas')).toBeVisible();
});
