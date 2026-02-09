import { Sequelize } from 'sequelize';
import config from './environment';
import logger from './logger';

let sequelize: Sequelize;

const connectPostgreSQL = async (): Promise<Sequelize> => {
  try {
    sequelize = new Sequelize({
      host: config.POSTGRES_HOST,
      port: config.POSTGRES_PORT,
      database: config.POSTGRES_DB,
      username: config.POSTGRES_USER,
      password: config.POSTGRES_PASSWORD,
      dialect: 'postgres',
      logging: config.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      dialectOptions: config.POSTGRES_SSL ? {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      } : {}
    });

    await sequelize.authenticate();
    logger.info(`PostgreSQL Connected: ${config.POSTGRES_HOST}:${config.POSTGRES_PORT}/${config.POSTGRES_DB}`);

    return sequelize;
  } catch (error) {
    const err = error as Error;
    logger.error(`Error connecting to PostgreSQL: ${err.message}`);
    process.exit(1);
  }
};

export const connectDB = async (): Promise<void> => {
  logger.info('🐘 Initializing PostgreSQL connection...');
  await connectPostgreSQL();
};

export const getSequelize = (): Sequelize => {
  if (!sequelize) {
    throw new Error('Sequelize not initialized. Call connectDB() first.');
  }
  return sequelize;
};

export const closeDB = async (): Promise<void> => {
  try {
    if (sequelize) {
      await sequelize.close();
      logger.info('PostgreSQL connection closed');
    }
  } catch (error) {
    logger.error(`Error closing database connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

process.on('SIGINT', async () => {
  await closeDB();
  logger.info('Database connection closed due to app termination');
  process.exit(0);
});

export default connectDB;