import request from 'supertest';
import app from '../app';
import { TestHelper, authHeader } from './helpers/testHelpers';

describe('Auth API - Happy Path', () => {
  it('should register a new user', async () => {
    const userData = TestHelper.generateUserData();

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        confirmPassword: userData.password,
      });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toHaveProperty('user');
    expect(response.body.data).toHaveProperty('tokens');
    expect(response.body.data.user.email).toBe(userData.email);
    expect(response.body.data.tokens).toHaveProperty('accessToken');
  });

  it('should login with valid credentials', async () => {
    const { email, password } = await TestHelper.createAuthenticatedUser();

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toHaveProperty('user');
    expect(response.body.data).toHaveProperty('tokens');
  });

  it('should get current user data', async () => {
    const { tokens, email } = await TestHelper.createAuthenticatedUser();

    const response = await request(app)
      .get('/api/v1/auth/me')
      .set(authHeader(tokens.accessToken));

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.email).toBe(email);
  });

  it('should refresh access token', async () => {
    const { tokens } = await TestHelper.createAuthenticatedUser();

    const response = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({ refreshToken: tokens.refreshToken });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toHaveProperty('accessToken');
  });

  it('should logout successfully', async () => {
    const { tokens } = await TestHelper.createAuthenticatedUser();

    const response = await request(app)
      .post('/api/v1/auth/logout')
      .set(authHeader(tokens.accessToken))
      .send({ refreshToken: tokens.refreshToken });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
  });
});
