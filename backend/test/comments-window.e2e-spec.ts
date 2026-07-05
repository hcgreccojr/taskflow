import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './setup-app';
import { registerAndLogin } from './helpers';
import { PrismaService } from '../src/shared/prisma/prisma.service';

describe('Comment edit window (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows editing within the 15-minute window and blocks it once the window has passed', async () => {
    const owner = await registerAndLogin(app);

    const orgRes = await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: 'Org Comments' })
      .expect(201);
    const boardRes = await request(app.getHttpServer())
      .post('/boards')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ organizationId: orgRes.body.id, name: 'Board' })
      .expect(201);
    const columnRes = await request(app.getHttpServer())
      .post(`/boards/${boardRes.body.id}/columns`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: 'A Fazer' })
      .expect(201);
    const taskRes = await request(app.getHttpServer())
      .post(`/columns/${columnRes.body.id}/tasks`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ title: 'Tarefa com comentário' })
      .expect(201);

    const commentRes = await request(app.getHttpServer())
      .post(`/tasks/${taskRes.body.id}/comments`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ content: 'Primeiro comentário' })
      .expect(201);
    const commentId = commentRes.body.id;

    await request(app.getHttpServer())
      .patch(`/comments/${commentId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ content: 'Editado dentro da janela' })
      .expect(200);

    // Simula os 15 minutos terem passado, ajustando createdAt direto no banco
    // (o relógio real não pode ser adiantado num teste determinístico).
    await prisma.comment.update({
      where: { id: commentId },
      data: { createdAt: new Date(Date.now() - 16 * 60 * 1000) },
    });

    await request(app.getHttpServer())
      .patch(`/comments/${commentId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ content: 'Tentando editar depois da janela' })
      .expect(422);

    // Excluir continua permitido mesmo depois da janela de edição (RN-006).
    await request(app.getHttpServer())
      .delete(`/comments/${commentId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
  });

  it('rejects editing/deleting a comment written by someone else with 403', async () => {
    const owner = await registerAndLogin(app);
    const outsider = await registerAndLogin(app);

    const orgRes = await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: 'Org Comments 2' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/organizations/${orgRes.body.id}/invites`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ email: outsider.email })
      .expect(201);
    const boardRes = await request(app.getHttpServer())
      .post('/boards')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ organizationId: orgRes.body.id, name: 'Board' })
      .expect(201);
    const columnRes = await request(app.getHttpServer())
      .post(`/boards/${boardRes.body.id}/columns`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: 'A Fazer' })
      .expect(201);
    const taskRes = await request(app.getHttpServer())
      .post(`/columns/${columnRes.body.id}/tasks`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ title: 'Tarefa' })
      .expect(201);
    const commentRes = await request(app.getHttpServer())
      .post(`/tasks/${taskRes.body.id}/comments`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ content: 'Comentário do dono' })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/comments/${commentRes.body.id}`)
      .set('Authorization', `Bearer ${outsider.accessToken}`)
      .send({ content: 'Tentativa de outro usuário' })
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/comments/${commentRes.body.id}`)
      .set('Authorization', `Bearer ${outsider.accessToken}`)
      .expect(403);
  });
});
