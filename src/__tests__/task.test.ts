import request from 'supertest';
import app from '../app';
import { TestHelper, authHeader } from './helpers/testHelpers';

describe('Task API - Happy Path', () => {
  it('should create a new task', async () => {
    const { tokens } = await TestHelper.createAuthenticatedUser();
    const taskData = TestHelper.generateTaskData();

    const response = await request(app)
      .post('/api/v1/tasks')
      .set(authHeader(tokens.accessToken))
      .send(taskData);

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
    expect(response.body.data.title).toBe(taskData.title);
  });

  it('should list tasks', async () => {
    const { tokens } = await TestHelper.createAuthenticatedUser();

    const response = await request(app)
      .get('/api/v1/tasks')
      .set(authHeader(tokens.accessToken));

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toHaveProperty('tasks');
    expect(Array.isArray(response.body.data.tasks)).toBe(true);
  });

  it('should get task by id', async () => {
    const { tokens } = await TestHelper.createAuthenticatedUser();
    const taskData = TestHelper.generateTaskData();

    // Criar tarefa
    const createResponse = await request(app)
      .post('/api/v1/tasks')
      .set(authHeader(tokens.accessToken))
      .send(taskData);

    const taskId = createResponse.body.data.id;

    // Buscar tarefa
    const response = await request(app)
      .get(`/api/v1/tasks/${taskId}`)
      .set(authHeader(tokens.accessToken));

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.id).toBe(taskId);
  });

  it('should update a task', async () => {
    const { tokens } = await TestHelper.createAuthenticatedUser();
    const taskData = TestHelper.generateTaskData();

    // Criar tarefa
    const createResponse = await request(app)
      .post('/api/v1/tasks')
      .set(authHeader(tokens.accessToken))
      .send(taskData);

    const taskId = createResponse.body.data.id;

    // Atualizar tarefa
    const response = await request(app)
      .put(`/api/v1/tasks/${taskId}`)
      .set(authHeader(tokens.accessToken))
      .send({
        title: 'Updated Task Title',
        status: 'inProgress',
      });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.title).toBe('Updated Task Title');
    expect(response.body.data.status).toBe('inProgress');
  });

  it('should delete a task', async () => {
    const { tokens } = await TestHelper.createAuthenticatedUser();
    const taskData = TestHelper.generateTaskData();

    // Criar tarefa
    const createResponse = await request(app)
      .post('/api/v1/tasks')
      .set(authHeader(tokens.accessToken))
      .send(taskData);

    const taskId = createResponse.body.data.id;

    // Deletar tarefa
    const response = await request(app)
      .delete(`/api/v1/tasks/${taskId}`)
      .set(authHeader(tokens.accessToken));

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
  });

  it('should get task statistics', async () => {
    const { tokens } = await TestHelper.createAuthenticatedUser();

    const response = await request(app)
      .get('/api/v1/tasks/statistics')
      .set(authHeader(tokens.accessToken));

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toHaveProperty('total');
  });
});
