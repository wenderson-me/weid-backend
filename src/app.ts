import express, { Application, Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import config from './config/environment';
import corsOptions from './config/corsOptions';
import { connectDB } from './config/database';
import { initModels } from './models';
import logger, { stream } from './config/logger';
import { errorMiddleware } from './middleware/error.middleware';
import { setupSwagger } from './config/swagger';
import { defaultLimiter } from './middleware/rateLimiter.middleware';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import taskRoutes from './routes/task.routes';
import commentRoutes from './routes/comment.routes';
import activityRoutes from './routes/activity.routes';
import noteRoutes from './routes/note.routes';
import notificationRoutes from './routes/notification.routes';
import databaseRoutes from './routes/database.routes';
import transactionRoutes from './routes/transaction.routes';

const app = express();

app.set('trust proxy', 1);

app.use(morgan('combined', { stream }));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
    },
  },
  hsts: {
    maxAge: 15552000,
    includeSubDomains: true,
    preload: true,
  },
  xContentTypeOptions: true,
  xXssProtection: true,
}));
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(defaultLimiter);

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
app.use(`${apiPrefix}/database`, databaseRoutes);
app.use(`${apiPrefix}/finance`, transactionRoutes);

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

if (config.NODE_ENV !== 'test') {
  startServer();
}

export default app;