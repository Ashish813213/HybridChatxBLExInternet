import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/database.js';
import { initializeSocket } from './sockets/index.js';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    const httpServer = createServer(app);
    const io = initializeSocket(httpServer);
    
    app.set('io', io);

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();