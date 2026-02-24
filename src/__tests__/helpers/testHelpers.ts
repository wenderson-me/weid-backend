import request from 'supertest';
import app from '../../app';

export interface TestUser {
  name: string;
  email: string;
  password: string;
  role?: 'user' | 'admin' | 'manager';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class TestHelper {
  private static userCounter = 0;

  /**
   * Gera dados únicos para um usuário de teste
   */
  static generateUserData(role: 'user' | 'admin' | 'manager' = 'user'): TestUser {
    this.userCounter++;
    return {
      name: `Test User ${this.userCounter}`,
      email: `test${this.userCounter}@example.com`,
      password: 'Test@123456',
      role,
    };
  }

  /**
   * Registra um novo usuário e retorna os tokens
   */
  static async registerUser(userData?: Partial<TestUser>): Promise<{ user: any; tokens: AuthTokens }> {
    const defaultData = this.generateUserData();
    const user = { ...defaultData, ...userData };

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: user.name,
        email: user.email,
        password: user.password,
        confirmPassword: user.password,
      });

    if (response.status !== 201) {
      throw new Error(`Failed to register user: ${JSON.stringify(response.body)}`);
    }

    return response.body.data;
  }

  /**
   * Faz login e retorna os tokens
   */
  static async loginUser(email: string, password: string): Promise<{ user: any; tokens: AuthTokens }> {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password });

    if (response.status !== 200) {
      throw new Error(`Failed to login: ${JSON.stringify(response.body)}`);
    }

    return response.body.data;
  }

  /**
   * Cria um usuário e retorna com os tokens
   */
  static async createAuthenticatedUser(
    role: 'user' | 'admin' | 'manager' = 'user'
  ): Promise<{ user: any; tokens: AuthTokens; email: string; password: string }> {
    const userData = this.generateUserData(role);
    const { user, tokens } = await this.registerUser(userData);

    return {
      user,
      tokens,
      email: userData.email,
      password: userData.password,
    };
  }

  /**
   * Gera dados para uma tarefa de teste
   */
  static generateTaskData(overrides?: any) {
    return {
      title: 'Test Task',
      description: 'Test task description',
      status: 'todo',
      priority: 'medium',
      ...overrides,
    };
  }

  /**
   * Gera dados para uma nota de teste
   */
  static generateNoteData(overrides?: any) {
    return {
      title: 'Test Note',
      content: 'Test note content',
      category: 'general',
      ...overrides,
    };
  }

  /**
   * Espera um tempo em ms
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Cria headers de autenticação
 */
export const authHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
});
