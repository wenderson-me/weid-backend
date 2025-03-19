import express, { Application, Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import config from './config/environment';
import connectDB from './config/database';
import logger, { stream } from './config/logger';
import { errorMiddleware } from './middleware/error.middleware';
import { setupSwagger } from './config/swagger';

// Importação de rotas
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import taskRoutes from './routes/task.routes';
import commentRoutes from './routes/comment.routes';
import activityRoutes from './routes/activity.routes';
import noteRoutes from './routes/note.routes';
import driveRoutes from './routes/drive.routes';

// Inicialização do app Express
const app = express();

// Configuração do rate limiter
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas requisições, por favor tente novamente mais tarde',
});

// Middlewares
app.use(morgan('combined', { stream }));
app.use(helmet());
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

// Rotas base
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Bem-vindo à API do Weid' });
});

// Prefix de API
const apiPrefix = config.API_PREFIX;

// Rotas da API
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/users`, userRoutes);
app.use(`${apiPrefix}/tasks`, taskRoutes);
app.use(`${apiPrefix}/comments`, commentRoutes);
app.use(`${apiPrefix}/activities`, activityRoutes);
app.use(`${apiPrefix}/notes`, noteRoutes);
app.use(`${apiPrefix}/drive`, driveRoutes);

// Rota para verificar o estado da API
app.get(`${apiPrefix}/health`, (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'API está funcionando corretamente',
    environment: config.NODE_ENV,
    timestamp: new Date(),
  });
});

// Configurar documentação Swagger
setupSwagger(app);

// Rota para quando não encontra o endpoint
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: `Não foi possível encontrar ${req.originalUrl} nesta API`,
  });
});

// Middleware de tratamento de erros
app.use(errorMiddleware);

// Inicialização do servidor
const PORT = config.PORT;

const startServer = async () => {
  try {
    // Conexão com o banco de dados
    await connectDB();

    // Inicialização do servidor HTTP
    app.listen(PORT, () => {
      logger.info(`Servidor rodando em http://localhost:${PORT}`);
      logger.info(`API disponível em http://localhost:${PORT}${apiPrefix}`);
      logger.info(`Documentação disponível em http://localhost:${PORT}/api-docs`);
      logger.info(`Ambiente: ${config.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Falha ao iniciar o servidor', error);
    process.exit(1);
  }
};

// Inicia o servidor
startServer();

// Exporta o app para testes
export default app;