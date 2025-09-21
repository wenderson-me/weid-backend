const { default: mongoose } = require("mongoose");

beforeAll(async () => {
  await mongoose.connection.db
});

afterAll(async () => {
  await mongoose.connection.close();
});

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

/*

# Registrar usuário
curl -X POST http://localhost:5000/pi/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test@123456","confirmPassword":"Test@123456"}'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@123456"}'

  */