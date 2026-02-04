import { Request, Response, NextFunction } from "express";
import { lobbyService } from "../../services"; // Предполагаем, что инстанс экспортируется из index.ts
import logger from "../../utils/logger";
import { UnauthorizedError, ValidationError } from "../../utils/CustomErrors";
import { LobbyType } from "@munchkin/shared";

export class LobbyController {

    /**
     * Создание нового лобби.
     * POST /api/lobbies
     */
    static async createLobby(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;
            if (!user || !user.id) {
                throw new UnauthorizedError("Неавторизованный пользователь");
            }
            const userId = user.id;

            const { type, maxPlayers, isPrivate, password, name } = req.body;

            if (!name || !type || !maxPlayers) {
                throw new ValidationError("Поля имя, тип и количество игроков обязательны.");
            }

            const lobbyType = type as LobbyType; 
            const lobby = await lobbyService.createLobby({
                type: lobbyType,
                name: name,
                maxPlayers: Number(maxPlayers),
                isPrivate: Boolean(isPrivate),
                password,
                creatorId: userId 
            }, userId);

            logger.debug(`Пользователь ${userId} создал лобби ${lobby.id}`);
            
            return res.status(201).json(lobby);
        } catch (err) {
            next(err);
        }
    }
    
    /**
     * Получение списка всех активных лобби.
     * GET /api/lobbies
     */
    static async getAllLobbies(req: Request, res: Response, next: NextFunction) {
        try {
            const lobbies = await lobbyService.getAllLobbies();
            logger.debug(`Запрошен список всех лобби. Найдено: ${lobbies.length}`);
            return res.json(lobbies);
        } catch (err) {
            next(err);
        }
    }

    /**
     * Получение детальной информации о конкретном лобби.
     * GET /api/lobbies/:id
     */
    static async getLobbyDetails(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            if (!id) {
                throw new ValidationError("ID лобби обязателен");
            }

            const lobbyDetails = await lobbyService.getLobbyDetails(id);
            logger.debug(`Получены детали лобби: ${id}`);
            return res.json(lobbyDetails);
        } catch (err) {
            next(err);
        }
    }

    /**
     * Присоединение к лобби.
     * POST /api/lobbies/:id/join
     */
    static async joinLobby(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;
            if (!user || !user.id) {
                throw new UnauthorizedError("Неавторизованный пользователь");
            }
            const userId = user.id;
            const { id } = req.params;
            const { password } = req.body;

            if (!id) {
                throw new ValidationError("ID лобби обязателен");
            }

            const result = await lobbyService.joinLobby(id, userId, password);
            
            logger.debug(`Пользователь ${userId} присоединился к лобби ${id}`);
            return res.json(result);
        } catch (err) {
            next(err);
        }
    }

    /**
     * Изменение статуса готовности игрока.
     * PUT /api/lobbies/:id/ready
     */
    static async setReadyStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;
            if (!user || !user.id) {
                throw new UnauthorizedError("Неавторизованный пользователь");
            }
            const userId = user.id;
            const { id } = req.params;
            const { isReady } = req.body;

            if (!id) {
                throw new ValidationError("ID лобби обязателен");
            }

            if (typeof isReady !== 'boolean') {
                throw new ValidationError("Поле 'isReady' должно быть булевым значением.");
            }

            await lobbyService.setReadyStatus(id, userId, isReady);

            // Опционально: можно проверить, все ли готовы, и вернуть это в ответе
            const allReady = await lobbyService.areAllReady(id);

            logger.debug(`Пользователь ${userId} изменил готовность на ${isReady} в лобби ${id}`);
            
            return res.json({ 
                message: "Статус готовности обновлен", 
                isReady,
                lobbyAllReady: allReady 
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Удаление лобби (обычно доступно только создателю, но здесь базовая реализация).
     * DELETE /api/lobbies/:id
     */
    static async deleteLobby(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;
            if (!user || !user.id) {
                throw new UnauthorizedError("Неавторизованный пользователь");
            }
            // TODO: В идеале здесь нужно проверить, является ли user.id создателем этого лобби,
            // прежде чем удалять, но метод deleteLobby в сервисе не возвращает creatorId для проверки.
            // Эту проверку лучше добавить в сам сервис или сделать предварительный getLobbyDetails.
            
            const { id } = req.params;
            if (!id) {
                throw new ValidationError("ID лобби обязателен");
            }

            await lobbyService.deleteLobby(id);
            
            logger.info(`Лобби ${id} удалено пользователем ${user.id}`);
            return res.json({ message: "Лобби успешно удалено" });
        } catch (err) {
            next(err);
        }
    }

    static async kickPlayer(req: Request, res: Response, next: NextFunction) {
        try {
            // Получаем пользователя из AuthMiddleware (req.user)
            const user = (req as any).user; 
            if (!user) throw new UnauthorizedError("Неавторизован");
    
            const { id: lobbyId, userId: targetUserId } = req.params;
            if (!lobbyId || !targetUserId) {
                throw new ValidationError("ID лобби обязателен");
            }
            // Вызываем сервис, передавая ID инициатора для проверки прав
            await lobbyService.kickPlayer(lobbyId, user.id, targetUserId);
    
            return res.json({ message: "Игрок исключен" });
        } catch (err) {
            next(err);
        }
    }
}