import { test, expect } from '@playwright/test';

test('cria organização, quadro e tarefa, e a tarefa aparece na coluna', async ({ page }) => {
  const email = `pw.create.${Date.now()}@example.com`;

  await page.goto('/login');
  await page.getByRole('button', { name: 'Cadastro' }).click();
  await page.getByLabel('Nome').fill('Playwright Create');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill('senha1234');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await page.waitForURL('**/orgs');

  await page.getByRole('button', { name: '+ Nova organização' }).click();
  await page.getByPlaceholder('Nome da organização').fill('Org Playwright Create');
  await page.getByRole('button', { name: 'Criar' }).click();
  await page.getByText('Org Playwright Create').click();
  await page.waitForURL(/\/orgs\/[^/]+$/);

  await page.getByRole('button', { name: '+ Novo quadro' }).click();
  await page.getByPlaceholder('Nome do quadro').fill('Quadro Playwright Create');
  await page.getByRole('button', { name: 'Criar' }).click();
  await page.getByText('Quadro Playwright Create').click();
  await page.waitForURL(/\/orgs\/[^/]+\/boards\/[^/]+$/);
  await expect(page.getByText('Concluído')).toBeVisible();

  await page.getByRole('button', { name: '+ Adicionar tarefa' }).first().click();
  await page.getByPlaceholder('Título da tarefa').fill('Tarefa criada via Playwright');
  await page.getByRole('button', { name: 'Adicionar', exact: true }).click();

  // O formulário de nova tarefa fecha após a criação — espera-o sumir antes de checar o
  // card, já que por um instante o texto digitado e o título do card recém-criado coexistem
  // (ambos com o mesmo texto), o que torna getByText ambíguo (strict mode violation).
  await expect(page.getByPlaceholder('Título da tarefa')).not.toBeVisible();
  await expect(page.getByRole('button', { name: /Tarefa criada via Playwright/ })).toBeVisible();
});
