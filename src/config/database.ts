import mongoose from 'mongoose';
import config from './environment';
import logger from './logger';

const mongoOptions: mongoose.ConnectOptions = {
};

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.MONGODB_URI, mongoOptions);
    const { host, port, name } = conn.connection;
    logger.info(`MongoDB Connected: ${host}:${port}/${name}`);
  } catch (error) {
    const err = error as Error;
    logger.error(`Error connecting to MongoDB: ${err.message}`);
    process.exit(1);
  }
};

const setupConnectionHandlers = () => {
  mongoose.connection.on('connected', () => {
    logger.info('Mongoose connected to database');
  });

  mongoose.connection.on('error', (err) => {
    logger.error(`Mongoose connection error: ${err.message}`);

    if (err.name === 'MongoServerSelectionError') {
      logger.error('Fatal MongoDB Error. Exiting application.');
      process.exit(1);
    }
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('Mongoose disconnected. Attempting to reconnect...');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('Mongoose reconnected successfully');
  });
};

export const closeDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    logger.info('Mongoose connection closed');
  } catch (error) {
    logger.error(`Error closing MongoDB connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

setupConnectionHandlers();

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('Mongoose connection closed due to app termination');
  process.exit(0);
});

export default connectDB;