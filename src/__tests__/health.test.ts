import request from 'supertest';
import app from '../app';

describe('Health Check - Happy Path', () => {
  it('should return health status', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body).toHaveProperty('environment');
  });

  it('should return welcome message on root', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
  });
});
