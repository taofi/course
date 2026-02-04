// src/controllers/game.controller.ts
import { Request, Response, NextFunction } from 'express';
import { BaseError, InternalServerError, ValidationError } from '@src/utils/CustomErrors';
import { gameService } from "../../services"; 

export class GameController {
    /**
     * POST /api/games/start
     * Запуск игровой сессии из лобби
     */
    public static start = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = (req as any).user;

            // Проверяем наличие пользователя из middleware аутентификации
            if (!user || !user.id) {
                throw new ValidationError("User authentication failed: No user found in request");
            }

            const { lobbyId } = req.body;
            const creatorId = user.id; 

            if (!lobbyId) {
                throw new ValidationError("Missing lobbyId");
            }

            // Вызываем метод у импортированного объекта сервиса
            const gameSession = await gameService.startGame(lobbyId, creatorId);

            // Возвращаем данные. На этом этапе wsService уже отправил сигнал 'game_started' всем участникам.
            return res.status(201).json({
                success: true,
                data: gameSession
            });

        } catch (error: any) {
            if (error instanceof BaseError) {
                return next(error);
            }
            // Логируем необработанную ошибку перед передачей в middleware
            next(new InternalServerError(error.message));
        }
    };

    public static checkAccess = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = (req as any).user;
            const gameId = req.params.id; // Берем ID из параметров пути :id
    
            if (!user || !user.id) {
                throw new ValidationError("Пользователь не авторизован");
            }
    
            if (!gameId) {
                throw new ValidationError("ID игры не указан");
            }
    
            // Вызываем проверку в сервисе
            const accessData = await gameService.checkGameAccess(gameId, user.id);
    
            return res.status(200).json({
                success: true,
                data: {
                    gameId,
                    ...accessData
                }
            });
    
        } catch (error: any) {
            if (error instanceof BaseError) {
                return next(error);
            }
            next(new InternalServerError(error.message));
        }
    };
}