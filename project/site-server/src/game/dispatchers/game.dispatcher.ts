import { EventEmitter } from 'events';
import { IPlayerAction, PlayerActionType, ICardAction, CardActionType, GameStatus, GamePhase, IPlayerStats, ICardData, IDoorData } from '@munchkin/shared';
import { actionDispatcher } from './action.dispatcher';
import logger from '@src/utils/logger';
import { GameEventType, GameEventParams } from '@munchkin/shared';
import { GameRedisService } from '@src/services/game.redis.service';
import { gameRedisService, playerService, deckService } from '@src/services';
import { PlayerService } from '@src/services/player.service';
import { DeckService } from '@src/services/deck.service';
import { ValidationError } from '@src/utils/CustomErrors';
import { gameSyncService } from '../service/game.sync.service';
import { effectHandlers } from '../actions/card.effects';
import { playerHandlers } from '../actions/player.actions';

export class GameDispatcher extends EventEmitter {
    private redis: GameRedisService = gameRedisService;
   
    public emitValidated<T extends GameEventType>(
        event: T,
        gameId: string,
        params: GameEventParams[T]
    ): boolean {
        logger.debug(`[GameDispatcher] Emitting ${event} for game ${gameId}`);
        return this.emit(event, gameId, params);
    }

    public async dispatch(userId: string, gameId: string, action: IPlayerAction) {
        const handler = playerHandlers[action.name];
        if (!handler) {
            throw new Error(`Handler for player action ${action.name} not found`);
        }
        await handler(gameId, userId, action.params);
    }

    public async applyCardEffect(gameId: string, userId: string, action: ICardAction) {
        const handler = effectHandlers[action.name];
        if (handler) {
            await handler(gameId, userId, action.params);
        } else {
            logger.warn(`[GameDispatcher] No system handler for action: ${action.name}`);
        }
    }


    public async playerJoined(gameId: string, userId: string) {
        await this.redis.setPlayerOnline(gameId, userId);
        const game = await this.redis.getGame(gameId);
        const onlineCount = await this.redis.getOnlineCount(gameId);

        if (!game) return;
        
        await gameSyncService.broadcastGameState(gameId);

        const syncPromises = game.participantsId.map(async (userId) => {
            await gameSyncService.syncPlayer(gameId, userId);
        });
        gameSyncService.syncInventory(gameId, userId);
        logger.info(`[Game] Player ${userId} joined. Online: ${onlineCount}/${game?.participantsId.length}`);

        return { ...game, onlineCount };
    }

    public async playerLeft(gameId: string, userId: string) {
        await this.redis.setPlayerOffline(gameId, userId);
        await gameSyncService.syncPlayer(gameId, userId);
    }

    


    public async getPlayer(gameId: string, userId: string){
        const stats = await this.redis.getPlayerStats(gameId, userId);
            if (!stats) return;
        return stats;
    }



    


}

export const gameDispatcher = new GameDispatcher();