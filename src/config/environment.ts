import dotenv from 'dotenv';
import path from 'path';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config({ path: path.join(__dirname, '../../.env') });

interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  API_PREFIX: string;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_ACCESS_EXPIRATION: string;
  JWT_REFRESH_EXPIRATION: string;
  JWT_RESET_PASSWORD_EXPIRATION: string;
  CORS_ORIGIN: string;
  LOG_LEVEL: string;
  LOG_FILE: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX: number;

  // Google Drive API config
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
  GOOGLE_API_SCOPES: string;
}

// Configuração do ambiente com valores padrão
const config: EnvironmentConfig = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000'),
  API_PREFIX: process.env.API_PREFIX || '/api/v1',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/weid',
  JWT_SECRET: process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production',
  JWT_ACCESS_EXPIRATION: process.env.JWT_ACCESS_EXPIRATION || '1h',
  JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION || '7d',
  JWT_RESET_PASSWORD_EXPIRATION: process.env.JWT_RESET_PASSWORD_EXPIRATION || '10m',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || 'logs/app.log',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '15000', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),

  // Google Drive API config
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/v1/drive/callback',
  GOOGLE_API_SCOPES: process.env.GOOGLE_API_SCOPES || 'https://www.googleapis.com/auth/drive.readonly,https://www.googleapis.com/auth/drive.metadata.readonly'
};

// Validação básica de configurações críticas
if (config.NODE_ENV === 'production') {
  const missingVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ].filter(key => !process.env[key]);

  if (missingVars.length > 0) {
    throw new Error(`Variáveis de ambiente obrigatórias não definidas: ${missingVars.join(', ')}`);
  }

  // Verifica se o JWT_SECRET foi alterado do valor padrão em produção
  if (config.JWT_SECRET === 'super-secret-jwt-key-change-in-production') {
    throw new Error('JWT_SECRET deve ser alterado em produção');
  }
}

export default config;