import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './setup-app';
import { registerAndLogin } from './helpers';

describe('Task move + activity + cascade delete (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('records activity on create and move, then cascade-deletes comments/activity when the task is removed', async () => {
    const owner = await registerAndLogin(app);

    const orgRes = await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: 'Org Activity' })
      .expect(201);
    const boardRes = await request(app.getHttpServer())
      .post('/boards')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ organizationId: orgRes.body.id, name: 'Board' })
      .expect(201);
    const col1Res = await request(app.getHttpServer())
      .post(`/boards/${boardRes.body.id}/columns`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: 'A Fazer' })
      .expect(201);
    const col2Res = await request(app.getHttpServer())
      .post(`/boards/${boardRes.body.id}/columns`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: 'Em Progresso' })
      .expect(201);

    const taskRes = await request(app.getHttpServer())
      .post(`/columns/${col1Res.body.id}/tasks`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ title: 'Mover-me' })
      .expect(201);
    const taskId = taskRes.body.id;

    await request(app.getHttpServer())
      .patch(`/tasks/${taskId}/move`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ columnId: col2Res.body.id })
      .expect(200);

    const activityRes = await request(app.getHttpServer())
      .get(`/tasks/${taskId}/activity`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    const actions = activityRes.body.map((log: { action: string }) => log.action);
    expect(actions).toContain('Tarefa criada');
    expect(actions).toContain('Tarefa movida para outra coluna');

    await request(app.getHttpServer())
      .post(`/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ content: 'Comentário antes de excluir' })
      .expect(201);

    // Sem o cascade da migration da Fase 5, esta exclusão violaria a FK de
    // comments.taskId / activity_logs.taskId (que tinham ON DELETE RESTRICT).
    await request(app.getHttpServer())
      .delete(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/tasks/${taskId}/activity`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(404);
  });
});
