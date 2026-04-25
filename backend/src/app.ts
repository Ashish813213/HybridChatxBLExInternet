import express, { Application } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import messageRoutes from './routes/message.routes.js';
import groupRoutes from './routes/group.routes.js';
import channelRoutes from './routes/channel.routes.js';
import { authMiddleware } from './middlewares/auth.middleware.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { rateLimiter } from './middlewares/rate-limiter.js';

const app: Application = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRoutes);
app.use('/messages', messageRoutes);
app.use('/groups', groupRoutes);
app.use('/channels', channelRoutes);

app.use(rateLimiter);
app.use(errorMiddleware);

export default app;