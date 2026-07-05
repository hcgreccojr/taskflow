import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  use: {
    // Aponta para a stack já rodando via Docker (docker compose up -d --build)
    // — sem webServer próprio, já que o backend real também precisa estar de pé.
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
});
