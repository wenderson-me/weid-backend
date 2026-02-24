import request from 'supertest';
import app from '../app';
import { TestHelper, authHeader } from './helpers/testHelpers';

describe('Note API - Happy Path', () => {
  it('should create a new note', async () => {
    const { tokens } = await TestHelper.createAuthenticatedUser();
    const noteData = TestHelper.generateNoteData();

    const response = await request(app)
      .post('/api/v1/notes')
      .set(authHeader(tokens.accessToken))
      .send(noteData);

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
    expect(response.body.data.title).toBe(noteData.title);
  });

  it('should list notes', async () => {
    const { tokens } = await TestHelper.createAuthenticatedUser();

    const response = await request(app)
      .get('/api/v1/notes')
      .set(authHeader(tokens.accessToken));

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toHaveProperty('notes');
    expect(Array.isArray(response.body.data.notes)).toBe(true);
  });

  it('should get note by id', async () => {
    const { tokens } = await TestHelper.createAuthenticatedUser();
    const noteData = TestHelper.generateNoteData();

    // Criar nota
    const createResponse = await request(app)
      .post('/api/v1/notes')
      .set(authHeader(tokens.accessToken))
      .send(noteData);

    const noteId = createResponse.body.data.id;

    // Buscar nota
    const response = await request(app)
      .get(`/api/v1/notes/${noteId}`)
      .set(authHeader(tokens.accessToken));

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.id).toBe(noteId);
  });

  it('should update a note', async () => {
    const { tokens } = await TestHelper.createAuthenticatedUser();
    const noteData = TestHelper.generateNoteData();

    // Criar nota
    const createResponse = await request(app)
      .post('/api/v1/notes')
      .set(authHeader(tokens.accessToken))
      .send(noteData);

    const noteId = createResponse.body.data.id;

    // Atualizar nota
    const response = await request(app)
      .put(`/api/v1/notes/${noteId}`)
      .set(authHeader(tokens.accessToken))
      .send({
        title: 'Updated Note Title',
        content: 'Updated content',
      });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.title).toBe('Updated Note Title');
  });

  it('should delete a note', async () => {
    const { tokens } = await TestHelper.createAuthenticatedUser();
    const noteData = TestHelper.generateNoteData();

    // Criar nota
    const createResponse = await request(app)
      .post('/api/v1/notes')
      .set(authHeader(tokens.accessToken))
      .send(noteData);

    const noteId = createResponse.body.data.id;

    // Deletar nota
    const response = await request(app)
      .delete(`/api/v1/notes/${noteId}`)
      .set(authHeader(tokens.accessToken));

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
  });

  it('should get note statistics', async () => {
    const { tokens } = await TestHelper.createAuthenticatedUser();

    const response = await request(app)
      .get('/api/v1/notes/statistics')
      .set(authHeader(tokens.accessToken));

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toHaveProperty('total');
  });
});
