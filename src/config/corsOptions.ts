// src/config/db.ts - Configuração de conexão com MongoDB
import mongoose from 'mongoose';
import ENV from './environment';

// Configurações da conexão MongoDB
const connectOptions: mongoose.ConnectOptions = {
  // Mongoose 6+ não precisa mais de useNewUrlParser e useUnifiedTopology
};

// Função para conectar ao banco de dados
export const connectDB = async (): Promise<void> => {
  try {
    // Tentar conexão com o MongoDB
    const connection = await mongoose.connect(ENV.MONGODB_URI, connectOptions);

    // Conexão bem-sucedida
    const { host, port, name } = connection.connection;
    console.log(`✅ MongoDB Connected: ${host}:${port}/${name}`);

    // Configurar eventos de conexão
    setupConnectionHandlers();

  } catch (error) {
    // Erro na conexão
    console.error(`❌ MongoDB Connection Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
};

// Configurar manipuladores de eventos de conexão
const setupConnectionHandlers = () => {
  const db = mongoose.connection;

  // Evento de desconexão
  db.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
  });

  // Evento de erro (após conexão estabelecida)
  db.on('error', (err) => {
    console.error(`❌ MongoDB Error: ${err.message}`);

    // Se for um erro fatal, encerrar a aplicação
    if (err.name === 'MongoServerSelectionError') {
      console.error('❌ Fatal MongoDB Error. Exiting application.');
      process.exit(1);
    }
  });

  // Evento de reconexão
  db.on('reconnected', () => {
    console.log('✅ MongoDB reconnected successfully');
  });
};

// Função para fechar a conexão (útil para testes ou encerramento gracioso)
export const closeDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  } catch (error) {
    console.error(`❌ Error closing MongoDB connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export default connectDB;