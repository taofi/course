import { Socket } from 'socket.io';
import { RedisService } from '../../services/redis.service';
// Импорт ваших ошибок
import { 
    AuthError, 
    InvalidCredentialsError, 
    LobbyNotFoundError, 
    InternalServerError 
} from '@src/utils/CustomErrors';

import { IServerGame } from '@src/game/models/GameModel';

const redis = new RedisService();

export const gameAuthMiddleware = async (socket: Socket, next: (err?: any) => void) => {
    try {
        const { gameId, password, userId } = socket.handshake.auth;

        // Если нет ID игры или пользователя — ошибка авторизации
        if (!gameId || !userId) {
            return next(new AuthError("Missing gameId or userId"));
        }

        const gameData = await redis.get(`game:session:${gameId}`);
        
        // Если игра не найдена в Redis (используем LobbyNotFoundError за неимением GameNotFoundError)
        if (!gameData) {
            return next(new LobbyNotFoundError("Игровая ссесия не найдена"));
        }

        const game: IServerGame = JSON.parse(gameData);

        // Проверка пароля
        if (game.password && game.password !== password) {
            return next(new InvalidCredentialsError("Не верный пароль игры"));
        }

        const isWatcher = game.watchers?.includes(userId);


        socket.data.gameId = gameId;
        socket.data.userId = userId;
        socket.data.isWatcher = isWatcher;

        next();
    } catch (error) {
        // Любая непредвиденная ошибка на этапе проверки
        next(new InternalServerError("Socket authentication internal error"));
    }
};