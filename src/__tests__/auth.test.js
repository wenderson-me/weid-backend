describe('Auth API', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: '12345!',
        confirmPassword: '12345!'
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body.status).toEqual('success');
  });
});