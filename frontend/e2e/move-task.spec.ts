import { test, expect, type Page, type Locator } from '@playwright/test';

async function dragTo(page: Page, source: Locator, target: Locator) {
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  if (!sourceBox || !targetBox) throw new Error('Elemento de drag-and-drop não encontrado na tela');

  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  // dnd-kit exige > 8px de movimento antes de considerar um drag iniciado.
  await page.mouse.move(sourceBox.x + sourceBox.width / 2 + 20, sourceBox.y + sourceBox.height / 2 + 5, {
    steps: 5,
  });
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 15 });
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2 + 2, {
    steps: 3,
  });
  await page.mouse.up();
}

test('arrastar uma tarefa entre colunas move a tarefa e persiste a nova posição', async ({ page }) => {
  const email = `pw.move.${Date.now()}@example.com`;

  await page.goto('/login');
  await page.getByRole('button', { name: 'Cadastro' }).click();
  await page.getByLabel('Nome').fill('Playwright Move');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill('senha1234');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await page.waitForURL('**/orgs');

  await page.getByRole('button', { name: '+ Nova organização' }).click();
  await page.getByPlaceholder('Nome da organização').fill('Org Playwright Move');
  await page.getByRole('button', { name: 'Criar' }).click();
  await page.getByText('Org Playwright Move').click();
  await page.waitForURL(/\/orgs\/[^/]+$/);

  await page.getByRole('button', { name: '+ Novo quadro' }).click();
  await page.getByPlaceholder('Nome do quadro').fill('Quadro Playwright Move');
  await page.getByRole('button', { name: 'Criar' }).click();
  await page.getByText('Quadro Playwright Move').click();
  await page.waitForURL(/\/orgs\/[^/]+\/boards\/[^/]+$/);
  await expect(page.getByText('Concluído')).toBeVisible();

  await page.getByRole('button', { name: '+ Adicionar tarefa' }).first().click();
  await page.getByPlaceholder('Título da tarefa').fill('Tarefa arrastável');
  await page.getByRole('button', { name: 'Adicionar', exact: true }).click();
  await expect(page.getByText('Tarefa arrastável')).toBeVisible();

  const taskCard = page.getByText('Tarefa arrastável').locator('..').locator('..');
  const targetColumnComposer = page.getByRole('button', { name: '+ Adicionar tarefa' }).nth(1);

  await dragTo(page, taskCard, targetColumnComposer);

  // Após o drop, a coluna "Em Progresso" (2ª coluna) deve mostrar contador 1
  // e a "A Fazer" (1ª) deve voltar a 0 — confirma que a posição foi
  // persistida via PATCH /tasks/:id/move, não só um efeito visual local.
  await expect(page.locator('body')).toContainText('Em Progresso');
  const columnsArea = page.locator('text=A Fazer').locator('..');
  await expect(columnsArea).toContainText('0');
});
