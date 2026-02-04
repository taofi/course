import express, { Request, Response } from "express";
import path from "path";
import logger from "./utils/logger";
import routes from "./express/routes";
import { checkRedis, connectMongo } from "./utils/dbCheck.utils";
require("dotenv").config();
import cors from 'cors';
import { setupSwagger } from './config/swagger';
import errorHandler from "./express/middlewares/errorHandler";
import corsConfig from './config/corsConfig'; 
import { AppConfig } from "./config";
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io'; 
import { wsService } from './services/ws.service';
import { setupSocketServer } from "./services/game.ws.service";

const app = express();
const httpServer = createServer(app); 

// 1. Настройка Middleware
app.use(express.json());
app.use(cors(corsConfig)); 
app.use("/public", express.static(path.join(__dirname, "public")));

// 2. Инициализация Баз Данных
(async () => {
  try {
    await checkRedis();
    await connectMongo();
  } catch (err) {
    logger.error("Database connection failed", err);
  }
})();

// 3. Инициализация WebSocket (Namespaces)
const io = new SocketIOServer(httpServer, {
  cors: corsConfig 
});

// Инициализируем пространство имен /lobby
wsService.initialize(io); 

// Инициализируем пространство имен /game
setupSocketServer(io);

// 4. Маршруты API
app.use("/", routes);

// Swagger
setupSwagger(app);

// 5. Обработка ошибок
app.use((req: Request, res: Response) => {
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: "Not Found" });
});

app.use(errorHandler);

// 6. Глобальные обработчики процесса
process.on("uncaughtException", (err: Error) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

process.on("unhandledRejection", (reason: any) => {
  logger.error(`Unhandled Rejection: ${reason}`);
});

// 7. Запуск сервера
const PORT = AppConfig.PORT || 3000;
httpServer.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info(`WebSockets initialized: /lobby and /game`);
});