/**
 * Reaproveita o mesmo Postgres do desenvolvimento/CI, mas isolado num schema
 * Prisma próprio ("test") para não colidir com dados de dev — evita precisar
 * de um segundo container só para os testes de integração.
 */
export const E2E_DATABASE_URL =
  process.env.DATABASE_URL_TEST ??
  'postgresql://taskflow:taskflow@localhost:5432/taskflow?schema=test';
