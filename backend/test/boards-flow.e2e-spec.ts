import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './setup-app';
import { registerAndLogin } from './helpers';

describe('Boards flow (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates an organization, invites a member, and builds board/column/task end to end', async () => {
    const owner = await registerAndLogin(app);
    const member = await registerAndLogin(app);

    const orgRes = await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: 'Acme' })
      .expect(201);
    const organizationId = orgRes.body.id;

    await request(app.getHttpServer())
      .post(`/organizations/${organizationId}/invites`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ email: member.email })
      .expect(201);

    const membersRes = await request(app.getHttpServer())
      .get(`/organizations/${organizationId}/members`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(membersRes.body).toHaveLength(2);

    const boardRes = await request(app.getHttpServer())
      .post('/boards')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ organizationId, name: 'Sprint 1' })
      .expect(201);
    const boardId = boardRes.body.id;

    const columnRes = await request(app.getHttpServer())
      .post(`/boards/${boardId}/columns`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: 'A Fazer' })
      .expect(201);
    const columnId = columnRes.body.id;

    const columnsRes = await request(app.getHttpServer())
      .get(`/boards/${boardId}/columns`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .expect(200);
    expect(columnsRes.body).toHaveLength(1);

    const taskRes = await request(app.getHttpServer())
      .post(`/columns/${columnId}/tasks`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ title: 'Implementar feature', assigneeId: member.userId })
      .expect(201);

    expect(taskRes.body.title).toBe('Implementar feature');
    expect(taskRes.body.assigneeId).toBe(member.userId);
  });

  it('RN-001: rejects access from a user who is not a member of the organization', async () => {
    const owner = await registerAndLogin(app);
    const outsider = await registerAndLogin(app);

    const orgRes = await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: 'Private Org' })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/boards?organizationId=${orgRes.body.id}`)
      .set('Authorization', `Bearer ${outsider.accessToken}`)
      .expect(403);
  });

  it('RN-005: rejects creating a task whose assignee is not a member of the organization', async () => {
    const owner = await registerAndLogin(app);
    const outsider = await registerAndLogin(app);

    const orgRes = await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: 'Org RN-005' })
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

    await request(app.getHttpServer())
      .post(`/columns/${columnRes.body.id}/tasks`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ title: 'Tarefa', assigneeId: outsider.userId })
      .expect(422);
  });

  it('RN-004: deleting a column moves its tasks to the first remaining column, and blocks deleting the last one', async () => {
    const owner = await registerAndLogin(app);

    const orgRes = await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: 'Org RN-004' })
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
      .post(`/columns/${col2Res.body.id}/tasks`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ title: 'Tarefa a ser realocada' })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/columns/${col2Res.body.id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    const remainingColumnsRes = await request(app.getHttpServer())
      .get(`/boards/${boardRes.body.id}/columns`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(remainingColumnsRes.body).toHaveLength(1);
    expect(remainingColumnsRes.body[0].id).toBe(col1Res.body.id);

    const tasksRes = await request(app.getHttpServer())
      .get(`/tasks?status=${col1Res.body.id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(tasksRes.body.map((t: { id: string }) => t.id)).toContain(taskRes.body.id);

    await request(app.getHttpServer())
      .delete(`/columns/${col1Res.body.id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(400);
  });

  it('RN-002: an admin can remove a member, who then loses access to the organization', async () => {
    const owner = await registerAndLogin(app);
    const member = await registerAndLogin(app);

    const orgRes = await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: 'Org RN-002' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/organizations/${orgRes.body.id}/invites`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ email: member.email })
      .expect(201);

    const membersBefore = await request(app.getHttpServer())
      .get(`/organizations/${orgRes.body.id}/members`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    const membership = membersBefore.body.find((m: { userId: string }) => m.userId === member.userId);

    await request(app.getHttpServer())
      .delete(`/organizations/${orgRes.body.id}/members/${membership.id}`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/organizations/${orgRes.body.id}/members/${membership.id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    const membersAfter = await request(app.getHttpServer())
      .get(`/organizations/${orgRes.body.id}/members`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(membersAfter.body).toHaveLength(1);

    await request(app.getHttpServer())
      .get(`/boards?organizationId=${orgRes.body.id}`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .expect(403);
  });
});
