import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export interface TestUser {
  userId: string;
  name: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

/** Registra e loga um usuário único (sufixo aleatório) para uso isolado em um teste e2e. */
export async function registerAndLogin(
  app: INestApplication,
  overrides: { name?: string; email?: string; password?: string } = {},
): Promise<TestUser> {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const name = overrides.name ?? `Usuário ${suffix}`;
  const email = overrides.email ?? `user.${suffix}@example.com`;
  const password = overrides.password ?? 'senha1234';

  const registerRes = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ name, email, password })
    .expect(201);

  const loginRes = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(201);

  return {
    userId: registerRes.body.id,
    name,
    email,
    accessToken: loginRes.body.accessToken,
    refreshToken: loginRes.body.refreshToken,
  };
}
