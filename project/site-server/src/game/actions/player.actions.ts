import { PlayerActionType, GameEventType } from '@munchkin/shared';
import { actionDispatcher } from '../dispatchers/action.dispatcher';
import { gameDispatcher } from '../dispatchers/game.dispatcher';
import logger from '@src/utils/logger';
import { gameEngine } from '../service/game.engine';
import { gameActionService } from '../service/game.action.service';

export const playerHandlers: Record<
    PlayerActionType, 
    (gameId: string, userId: string, params: any) => Promise<void>
> = {
    [PlayerActionType.UseCard]: async (gameId, userId, params) => {
        //await actionDispatcher.resolveCardEffects(params.cardId, gameId, userId);
    },
    [PlayerActionType.UseOtherCard]: async (gameId, userId, params) => {
        await gameActionService.useOtherCard(gameId, userId, params.cardId);

    },

    [PlayerActionType.Equip]: async (gameId, userId, params) => {
        logger.info(`[Action] Player ${userId} equipping card ${params.cardId}`);
        
        await gameActionService.equipItem(gameId, userId, params.cardId);
        
        gameDispatcher.emitValidated(GameEventType.LogMessage, gameId, {
            message: "Предмет успешно надет",
            type: 'success'
        });
    },

    [PlayerActionType.DropCard]: async (gameId, userId, params) => {
        logger.info(`[Action] Player ${userId} discarding card ${params.cardId}`);
        await gameActionService.dropAndDiscard(gameId, userId, params.cardId);
    },

    [PlayerActionType.OpenDoor]: async (gameId, userId) => {
        logger.info(`[Game] User ${userId} opening door`);
        await gameActionService.openDoor(gameId, userId);
    },

    [PlayerActionType.EndTurn]: async (gameId, userId) => {
        await gameEngine.nextTurn(gameId);
    },

    // Заглушки для остальных действий
    [PlayerActionType.TakeCard]: async (gameId, userId) => {
        await gameActionService.takeCard(gameId, userId, 'doors');
    },
    [PlayerActionType.Run]: async (gameId, userId)  => { await gameActionService.tryRun(gameId, userId)  },
    [PlayerActionType.TakeTreasure]: async (gameId, userId) => {
        await gameActionService.takeCard(gameId, userId, 'treasures');
    },
    [PlayerActionType.AskHelp]: async () => { /* Позвать на помощь */ },
    [PlayerActionType.Help]: async () => { /* Согласиться помочь */ },
    [PlayerActionType.BuffMonster]: async (gameId, userId, params) => { 
        logger.info(`[Action] Player ${userId} BuffMonster by card ${params.cardId}`);

        await gameActionService.buffMonster(gameId, userId, params.cardId) 
    },
    [PlayerActionType.BuffPlayer]: async (gameId, userId, params) => { 
        logger.info(`[Action] Player ${userId} buffPlayer by card ${params.cardId}`);

        await gameActionService.buffPlayer(gameId, userId, params.cardId) 
     },
    [PlayerActionType.Fight]: async (gameId) => { await gameActionService.fight(gameId)  },
    [PlayerActionType.UnEquip]: async (gameId, userId, params) => { 
        logger.info(`[Action] Player ${userId} unEquipItem  ${params.slot}`);

        await gameActionService.unEquipItem(gameId, userId, params.slot)  
    },


};