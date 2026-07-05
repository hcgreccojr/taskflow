import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './setup-app';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  const suffix = `${Date.now()}-auth`;
  const email = `auth.${suffix}@example.com`;
  const password = 'senha1234';
  let refreshToken: string;

  it('registers a new user', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Ana Auth', email, password })
      .expect(201);

    expect(response.body).toMatchObject({ name: 'Ana Auth', email });
    expect(response.body.id).toBeDefined();
    expect(response.body.passwordHash).toBeUndefined();
  });

  it('rejects duplicate registration with 409', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Ana Auth', email, password })
      .expect(409);
  });

  it('rejects login with the wrong password (401)', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'senhaerrada' })
      .expect(401);
  });

  it('logs in and returns access + refresh tokens', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    refreshToken = response.body.refreshToken;
  });

  it('refreshes the access token given a valid refresh token', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(201);

    expect(response.body.accessToken).toBeDefined();
  });

  it('rejects an invalid refresh token with 401', async () => {
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'not-a-real-token' })
      .expect(401);
  });

  it('rejects an unauthenticated request to a protected route with 401', async () => {
    await request(app.getHttpServer()).get('/organizations').expect(401);
  });
});
