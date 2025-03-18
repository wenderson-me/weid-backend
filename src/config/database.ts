import mongoose from 'mongoose';
import config from './environment';
import logger from './logger';

// Configurações de conexão do MongoDB
const mongoOptions: mongoose.ConnectOptions = {
  // Removidas as opções obsoletas que não são mais necessárias no Mongoose 7
};

// Função para conectar ao MongoDB
const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.MONGODB_URI, mongoOptions);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    const err = error as Error;
    logger.error(`Error connecting to MongoDB: ${err.message}`);
    process.exit(1);
  }
};

// Eventos de conexão do MongoDB
mongoose.connection.on('connected', () => {
  logger.info('Mongoose connected to database');
});

mongoose.connection.on('error', (err) => {
  logger.error(`Mongoose connection error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  logger.info('Mongoose disconnected');
});

// Encerramento limpa da conexão quando o processo for finalizado
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('Mongoose connection closed due to app termination');
  process.exit(0);
});

export default connectDB;