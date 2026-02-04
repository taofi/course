import { GameEventType, IPlayerStats, GamePhase } from '@munchkin/shared';
import { gameDispatcher } from '../dispatchers/game.dispatcher';
import { gameRedisService, playerService } from '@src/services';
import logger from '@src/utils/logger';

export class GameSyncService {
    private redis = gameRedisService;

    public async broadcastGameState(gameId: string) {
        const game = await this.redis.getGame(gameId);
        if (!game) return;

        // Очищаем приватные данные перед рассылкой
        const publicGameData = { 
            ...game, 
            doors: [], treasure: [], 
            doorsLeft: [], treasureLeft: [] 
        };

        gameDispatcher.emitValidated(GameEventType.UpdateGame, gameId, { game: publicGameData });
        gameDispatcher.emitValidated(GameEventType.StateUpdated, gameId, {
            phase: game.phase as GamePhase,
            currentPlayerId: game.currentPlayerId || '',
            turnNumber: game.turn || 0
        });
    }

    public async syncPlayer(gameId: string, userId: string) {
        const stats = await this.redis.getPlayerStats(gameId, userId);
        if (!stats) return;

        const publicStats: IPlayerStats = {
            ...stats,
            headGear: stats.headGear || null,
            armor: stats.armor || null,
            boots: stats.boots || null,
            oneHand: stats.oneHand || null,
            secondHand: stats.secondHand || null,
            race: stats.race || null,
            
            cards: [], // Скрываем карты от других игроков
            power: playerService.calculatePlayerStrength(stats),
            cardsCount: stats.cards.length
        };

        gameDispatcher.emit(GameEventType.UpdatePlayer, gameId, { player: publicStats });
    }

    public sendNotification(gameId: string, message: string, type: 'success' | 'danger' | 'info') {
        gameDispatcher.emitValidated(GameEventType.LogMessage, gameId, { message, type });
    }

    public async syncInventory(gameId: string, userId: string) {
        try {
            const stats = await this.redis.getPlayerStats(gameId, userId);
            if (!stats) return;
    

            gameDispatcher.emit(GameEventType.InventoryUpdated, gameId, {
                userId: userId,
                cards: stats.cards,
                cardsCount: stats.cards.length
            });
        } catch (error) {
            logger.error(`[GameDispatcher] syncInventory error: ${error}`);
        }
    }

    public async notifyDropCards(gameId: string, userId: string, count: number) {
        try {
            gameDispatcher.emit(GameEventType.DropCards, gameId, { count }, userId);
            
            logger.info(`[GameSyncService] Notified player ${userId} to drop ${count} cards in game ${gameId}`);
        } catch (error) {
            logger.error(`[GameSyncService] notifyDropCards error: ${error}`);
        }
    }

    public syncRunResult(gameId: string, userId: string, runData: { dice: number, result: boolean }) {

        gameDispatcher.emit(GameEventType.RunResult, gameId, {
            dice: runData.dice,
            result: runData.result
        });

        logger.info(`[GameSyncService] Run result for ${userId}: dice ${runData.dice}, result ${runData.result}`);
    }

    
    public syncGameEnd(gameId: string) {
        gameDispatcher.emit(GameEventType.End, gameId, {});
        logger.info(`[GameSyncService] Game ${gameId} ended`);
    }
}

export const gameSyncService = new GameSyncService();