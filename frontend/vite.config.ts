import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    // e2e/ roda via Playwright (npm run test:e2e), não pelo Vitest.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Equivalente frontend de "domain + application": stores (orquestram
      // regras de negócio), httpClient (retry/normalização de erro) e lógica
      // pura de dnd — não os *Api.ts (adapters HTTP finos, equivalentes a
      // "infrastructure") nem os componentes de apresentação.
      include: [
        'src/services/httpClient.ts',
        'src/features/*/store/**/*.ts',
        'src/features/boards/dndHelpers.ts',
      ],
      exclude: ['**/*.test.ts', '**/*.test.tsx'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
