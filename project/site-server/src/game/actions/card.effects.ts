import { CardActionType, GameEventType } from '@munchkin/shared';
import { gameDispatcher } from '../dispatchers/game.dispatcher';
import { gameSyncService } from '../service/game.sync.service';
import { gameActionService } from '../service/game.action.service';


export const effectHandlers: Record<
    CardActionType,
    (gameId: string, userId: string, params: any) => Promise<void>
> = {
    [CardActionType.LevelUP]: async (gameId, userId, params) => {
        const delta = params?.count || 1;
        await gameActionService.changePlayerLevel(gameId, userId, delta);

    },

    [CardActionType.LevelDown]: async (gameId, userId, params) => {

    },

    [CardActionType.GiveBonus]: async (gameId, userId, params) => {

    },

    // Обработчики потери экипировки
    [CardActionType.DropArmor]: async (gameId, userId) => {
        await gameActionService.stealItemAndDiscard(gameId, userId, 'armor');
        await gameSyncService.syncInventory(gameId, userId);
    },

    [CardActionType.DropHeadgear]: async (gameId, userId) => {
        await gameActionService.stealItemAndDiscard(gameId, userId, 'headGear');
        await gameSyncService.syncInventory(gameId, userId);
    },

    [CardActionType.DropBoots]: async (gameId, userId) => {
        await gameActionService.stealItemAndDiscard(gameId, userId, 'boots');
        await gameSyncService.syncInventory(gameId, userId);
    },

    [CardActionType.DropOneHand]: async (gameId, userId) => {
        await gameActionService.stealItemAndDiscard(gameId, userId, 'oneHand');
        await gameSyncService.syncInventory(gameId, userId);
    },

    [CardActionType.DropHands]: async (gameId, userId) => {
        await gameActionService.stealItemAndDiscard(gameId, userId, 'oneHand');
        await gameSyncService.syncInventory(gameId, userId);
    },
};