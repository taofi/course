import { Server, Socket, Namespace } from 'socket.io';
import { gameAuthMiddleware } from '@src/express/middlewares/game.auth.middleware';
import { userDispatcher } from '@src/game/dispatchers/user.dispatcher';
import logger from '@src/utils/logger';

/**
 * Настройка игрового пространства имен (/game)
 */
export const setupSocketServer = (io: Server) => {
    const gameNamespace: Namespace = io.of('/game');

    // 1. Инициализируем шлюз UserDispatcher. 
    // Теперь он внутри себя подпишется на GameEvents и сохранит ссылку на namespace.
    userDispatcher.init(gameNamespace);

    // 2. Применяем middleware авторизации
    gameNamespace.use(gameAuthMiddleware);

    gameNamespace.on('connection', (socket: Socket) => {
        const { gameId, userId } = socket.data;

        if (!gameId || !userId) {
            logger.error(`[WS Game] Connection attempt without gameId or userId`);
            return socket.disconnect();
        }

        // 3. Изоляция игрока в общую комнату игры (для broadcast событий)
        const roomName = `game:${gameId}`;
        socket.join(roomName);

        // 4. Регистрация в персональной комнате (через UserDispatcher)
        userDispatcher.onUserConnect(socket);
        
        logger.info(`[WS Game] User ${userId} connected to game room: ${roomName}`);

        // 5. Обработка игровых действий
        socket.on('game:action', async (actionPayload) => {
            await userDispatcher.handleAction(socket, actionPayload);
        });

        socket.on('disconnect', async (reason) => {
            logger.info(`[WS Game] User ${userId} disconnected: ${reason}`);
            await userDispatcher.handleDisconnect(socket);
        });
    });

    
    return gameNamespace;
};