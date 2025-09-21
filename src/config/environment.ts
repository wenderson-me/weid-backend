import dotenv from 'dotenv';
import path from 'path';

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
}

const config: EnvironmentConfig = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000'),
  API_PREFIX: process.env.API_PREFIX || '/api/v1',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/weid',
  JWT_SECRET: process.env.JWT_SECRET || 'default_development_secret_key',
  JWT_ACCESS_EXPIRATION: process.env.JWT_ACCESS_EXPIRATION || '1h',
  JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION || '7d',
  JWT_RESET_PASSWORD_EXPIRATION: process.env.JWT_RESET_PASSWORD_EXPIRATION || '10m',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || 'logs/app.log',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '15000', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
};

if (config.NODE_ENV === 'production') {
  const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'CORS_ORIGIN',
  ];

  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  );

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(', ')}`
    );
  }

  if (config.JWT_SECRET === 'default_development_secret_key') {
    throw new Error('JWT_SECRET must be changed from default value in production mode');
  }
}

export default config;