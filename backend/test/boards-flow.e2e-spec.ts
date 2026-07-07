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

  it('RNF-003: GET /tasks paginates results and reports accurate meta', async () => {
    const owner = await registerAndLogin(app);

    const orgRes = await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: 'Org Pagination' })
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

    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .post(`/columns/${columnRes.body.id}/tasks`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ title: `Tarefa ${i}` })
        .expect(201);
    }

    const firstPage = await request(app.getHttpServer())
      .get(`/tasks?status=${columnRes.body.id}&page=1&limit=2`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(firstPage.body.data).toHaveLength(2);
    expect(firstPage.body.meta).toEqual({ page: 1, limit: 2, total: 5, totalPages: 3 });

    const secondPage = await request(app.getHttpServer())
      .get(`/tasks?status=${columnRes.body.id}&page=2&limit=2`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(secondPage.body.data).toHaveLength(2);
    const firstPageIds = firstPage.body.data.map((t: { id: string }) => t.id);
    const secondPageIds = secondPage.body.data.map((t: { id: string }) => t.id);
    expect(secondPageIds).not.toEqual(expect.arrayContaining(firstPageIds));
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
    expect(tasksRes.body.data.map((t: { id: string }) => t.id)).toContain(taskRes.body.id);

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

  it('RN-002: blocks removing the last admin, but allows it once another admin exists', async () => {
    const owner = await registerAndLogin(app);
    const secondAdmin = await registerAndLogin(app);

    const orgRes = await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: 'Org Last Admin' })
      .expect(201);

    const membersBefore = await request(app.getHttpServer())
      .get(`/organizations/${orgRes.body.id}/members`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    const ownerMembership = membersBefore.body.find(
      (m: { userId: string }) => m.userId === owner.userId,
    );

    await request(app.getHttpServer())
      .delete(`/organizations/${orgRes.body.id}/members/${ownerMembership.id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(400);

    await request(app.getHttpServer())
      .post(`/organizations/${orgRes.body.id}/invites`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ email: secondAdmin.email, role: 'ADMIN' })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/organizations/${orgRes.body.id}/members/${ownerMembership.id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
  });

  it('RF-005/RN-002: inviting an unregistered e-mail creates a pending invite that auto-joins on registration', async () => {
    const owner = await registerAndLogin(app);
    const invitedEmail = `pending.${Date.now()}@example.com`;

    const orgRes = await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: 'Org Pending Invite' })
      .expect(201);

    const inviteRes = await request(app.getHttpServer())
      .post(`/organizations/${orgRes.body.id}/invites`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ email: invitedEmail })
      .expect(201);
    expect(inviteRes.body).toEqual({
      status: 'pending',
      invite: expect.objectContaining({ email: invitedEmail, organizationId: orgRes.body.id }),
    });

    const membersBeforeRegister = await request(app.getHttpServer())
      .get(`/organizations/${orgRes.body.id}/members`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(membersBeforeRegister.body).toHaveLength(1);

    const invitedUser = await registerAndLogin(app, { email: invitedEmail });

    const membersAfterRegister = await request(app.getHttpServer())
      .get(`/organizations/${orgRes.body.id}/members`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(membersAfterRegister.body).toHaveLength(2);
    expect(membersAfterRegister.body.map((m: { userId: string }) => m.userId)).toContain(
      invitedUser.userId,
    );

    await request(app.getHttpServer())
      .get(`/boards?organizationId=${orgRes.body.id}`)
      .set('Authorization', `Bearer ${invitedUser.accessToken}`)
      .expect(200);
  });

  it('allows any member to edit a board, but only an admin to delete it (cascading columns/tasks)', async () => {
    const owner = await registerAndLogin(app);
    const member = await registerAndLogin(app);

    const orgRes = await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: 'Org Board CRUD' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/organizations/${orgRes.body.id}/invites`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ email: member.email })
      .expect(201);

    const boardRes = await request(app.getHttpServer())
      .post('/boards')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ organizationId: orgRes.body.id, name: 'Board Original' })
      .expect(201);

    const updateRes = await request(app.getHttpServer())
      .patch(`/boards/${boardRes.body.id}`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ name: 'Board Renomeado', description: 'Nova descrição' })
      .expect(200);
    expect(updateRes.body.name).toBe('Board Renomeado');
    expect(updateRes.body.description).toBe('Nova descrição');

    const columnRes = await request(app.getHttpServer())
      .post(`/boards/${boardRes.body.id}/columns`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: 'A Fazer' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/columns/${columnRes.body.id}/tasks`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ title: 'Tarefa dentro do board' })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/boards/${boardRes.body.id}`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/boards/${boardRes.body.id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    const boardsAfter = await request(app.getHttpServer())
      .get(`/boards?organizationId=${orgRes.body.id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(boardsAfter.body).toHaveLength(0);
  });

  it('allows any member to edit an organization, but only an admin to delete it (cascading boards/columns/tasks)', async () => {
    const owner = await registerAndLogin(app);
    const member = await registerAndLogin(app);

    const orgRes = await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: 'Org Original' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/organizations/${orgRes.body.id}/invites`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ email: member.email })
      .expect(201);

    const updateRes = await request(app.getHttpServer())
      .patch(`/organizations/${orgRes.body.id}`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ name: 'Org Renomeada' })
      .expect(200);
    expect(updateRes.body.name).toBe('Org Renomeada');

    const boardRes = await request(app.getHttpServer())
      .post('/boards')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ organizationId: orgRes.body.id, name: 'Board dentro da org' })
      .expect(201);
    const columnRes = await request(app.getHttpServer())
      .post(`/boards/${boardRes.body.id}/columns`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: 'A Fazer' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/columns/${columnRes.body.id}/tasks`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ title: 'Tarefa dentro do board' })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/organizations/${orgRes.body.id}`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/organizations/${orgRes.body.id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    const orgsAfter = await request(app.getHttpServer())
      .get('/organizations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(orgsAfter.body.map((org: { id: string }) => org.id)).not.toContain(orgRes.body.id);
  });
});
