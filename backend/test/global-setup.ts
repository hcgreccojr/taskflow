import { execSync } from 'child_process';
import { E2E_DATABASE_URL } from './e2e-database-url';

/**
 * Roda uma vez antes de toda a suíte e2e: reseta o schema "test" do zero
 * (drop + reaplica todas as migrations), garantindo dados limpos a cada
 * execução em vez de acumular registros de runs anteriores.
 */
export default async function globalSetup(): Promise<void> {
  execSync('npx prisma migrate reset --force --skip-seed', {
    cwd: `${__dirname}/..`,
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
    stdio: 'inherit',
  });
}
