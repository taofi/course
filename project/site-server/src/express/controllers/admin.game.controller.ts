import { Request, Response, NextFunction } from 'express';
import { GameStatisticsService } from '@src/services/game.statistics.service';
import logger from '@src/utils/logger';
import { ValidationError } from '@src/utils/CustomErrors';

export class AdminGameController {
    constructor(private statsService: GameStatisticsService) {}

    /**
     * Список всех активных игровых сессий в Redis
     */
    getAllGames = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const games = await this.statsService.getAllActiveGames();
            res.json(games);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Детальная информация об одной игре (Snapshot)
     */
    getGameSnapshot = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { gameId } = req.params;
            if(!gameId)
                {
                  throw new ValidationError("Id не указано");
                }
            const snapshot = await this.statsService.getFullGameSnapshot(gameId);
            res.json(snapshot);
        } catch (error) {
            // Если игра не найдена, сервис выбросит LobbyNotFoundError
            next(error);
        }
    };

    /**
     * Только статистика игроков конкретной игры
     */
    getPlayersStats = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { gameId } = req.params;
            if(!gameId)
                {
                  throw new ValidationError("Id не указано");
                }
            // Сначала получаем саму игру, чтобы знать список участников
            const snapshot = await this.statsService.getFullGameSnapshot(gameId);
            res.json(snapshot.playersStats);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Просмотр колод (что осталось в колоде и что в сбросе)
     */
    getDecks = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { gameId } = req.params;
            if(!gameId)
                    {
                      throw new ValidationError("Id не указано");
                    }
            const decks = await this.statsService.getGameDecks(gameId);
            res.json(decks);
        } catch (error) {
            next(error);
        }
    };
}