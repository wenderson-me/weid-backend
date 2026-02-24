import express, { Application, Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import config from './config/environment';
import { connectDB } from './config/database';
import { initModels } from './models';
import logger, { stream } from './config/logger';
import { errorMiddleware } from './middleware/error.middleware';
import { setupSwagger } from './config/swagger';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import taskRoutes from './routes/task.routes';
import commentRoutes from './routes/comment.routes';
import activityRoutes from './routes/activity.routes';
import noteRoutes from './routes/note.routes';
import notificationRoutes from './routes/notification.routes';

const app = express();

// Configurar trust proxy para aplicações atrás de proxy reverso (Nginx)
app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas requisições, por favor tente novamente mais tarde',
});

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

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Bem-vindo à API do Weid' });
});

const apiPrefix = config.API_PREFIX;

app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/users`, userRoutes);
app.use(`${apiPrefix}/tasks`, taskRoutes);
app.use(`${apiPrefix}/comments`, commentRoutes);
app.use(`${apiPrefix}/activities`, activityRoutes);
app.use(`${apiPrefix}/notes`, noteRoutes);
app.use(`${apiPrefix}/notifications`, notificationRoutes);

app.get(`${apiPrefix}/health`, (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'API está funcionando corretamente',
    environment: config.NODE_ENV,
    timestamp: new Date(),
  });
});

setupSwagger(app);

app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: `Não foi possível encontrar ${req.originalUrl} nesta API`,
  });
});

app.use(errorMiddleware);

const PORT = config.PORT;

const startServer = async () => {
  try {
    await connectDB();
    await initModels();

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

startServer();

export default app;