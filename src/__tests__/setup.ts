import { connectDB, getSequelize, closeDB } from '../config/database';
import { initModels } from '../models';

// Configuração antes de todos os testes
beforeAll(async () => {
  try {
    // Conectar ao banco e inic ializar modelos
    await connectDB();
    await initModels();

    const sequelize = getSequelize();

    // Sincronizar banco (apenas em ambiente de teste)
    if (process.env.NODE_ENV === 'test') {
      await sequelize.sync({ force: true });
    }
  } catch (error) {
    console.error('Erro ao configurar testes:', error);
    throw error;
  }
});

// Limpeza após todos os testes
afterAll(async () => {
  try {
    await closeDB();
  } catch (error) {
    console.error('Erro ao fechar conexão:', error);
  }
});
