import logger from '@src/utils/logger';
import { gameEngine } from './game.engine';

export class GameTimerService {
    private cleanupTimers: Map<string, NodeJS.Timeout> = new Map();

    public setCleanupTimer(gameId: string, userId: string, delay: number) {
        const timerId = `${gameId}:${userId}`;
        this.cancelCleanupTimer(gameId, userId);

        const timeout = setTimeout(async () => {
            await this.handlePlayerTimeout(gameId, userId);
        }, delay);

        this.cleanupTimers.set(timerId, timeout);
    }

    public cancelCleanupTimer(gameId: string, userId: string) {
        const timerId = `${gameId}:${userId}`;
        if (this.cleanupTimers.has(timerId)) {
            clearTimeout(this.cleanupTimers.get(timerId)!);
            this.cleanupTimers.delete(timerId);
        }
    }

    private async handlePlayerTimeout(gameId: string, userId: string) {
        logger.warn(`[Timer] Player ${userId} timed out in game ${gameId}`);
        
        try {
            await gameEngine.handlePlayerDie(gameId, userId);
        } catch (error) {
            logger.error(`[Timer] Error during player die: ${error}`);
        }

        this.cleanupTimers.delete(`${gameId}:${userId}`);
    }
}

export const gameTimerService = new GameTimerService();