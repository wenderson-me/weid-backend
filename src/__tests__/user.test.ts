import request from 'supertest';
import app from '../app';
import { TestHelper, authHeader } from './helpers/testHelpers';

describe('User API - Happy Path', () => {
  it('should list users', async () => {
    const { tokens } = await TestHelper.createAuthenticatedUser();

    const response = await request(app)
      .get('/api/v1/users')
      .set(authHeader(tokens.accessToken));

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toHaveProperty('users');
    expect(Array.isArray(response.body.data.users)).toBe(true);
  });

  it('should get user profile', async () => {
    const { tokens, email } = await TestHelper.createAuthenticatedUser();

    const response = await request(app)
      .get('/api/v1/users/profile')
      .set(authHeader(tokens.accessToken));

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.email).toBe(email);
  });

  it('should update user profile', async () => {
    const { tokens } = await TestHelper.createAuthenticatedUser();

    const response = await request(app)
      .put('/api/v1/users/profile')
      .set(authHeader(tokens.accessToken))
      .send({
        name: 'Updated Name',
      });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.name).toBe('Updated Name');
  });

  it('should get user by id', async () => {
    const { tokens } = await TestHelper.createAuthenticatedUser();
    const { user: targetUser } = await TestHelper.registerUser();

    const response = await request(app)
      .get(`/api/v1/users/${targetUser.id}`)
      .set(authHeader(tokens.accessToken));

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.id).toBe(targetUser.id);
  });

  it('should get user statistics', async () => {
    const { tokens } = await TestHelper.createAuthenticatedUser();

    const response = await request(app)
      .get('/api/v1/users/profile/statistics')
      .set(authHeader(tokens.accessToken));

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toHaveProperty('tasks');
  });
});
