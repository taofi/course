import { battleService, deckService, gameRedisService, playerService } from "@src/services";
import { gameSyncService } from "./game.sync.service";
import { ValidationError } from "@src/utils/CustomErrors";
import { CardRace, CardType, DoorType, GamePhase, ICardData, IDoorData, PlayerEquipSlot } from "@munchkin/shared";
import logger from "@src/utils/logger";
import EventEmitter from "events";
import { actionDispatcher } from "../dispatchers/action.dispatcher";

export class GameActionService extends EventEmitter {
    private redis = gameRedisService;
    private deckService = deckService;
    private playerService = playerService;
    private syncService = gameSyncService;
    private battleService = battleService;

    public async takeCard(gameId: string, userId: string, type: 'doors' | 'treasures') {
        const card = type === 'doors'
            ? await this.deckService.drawDoor(gameId)
            : await this.deckService.drawTreasure(gameId);

        if (!card) throw new ValidationError("Колода пуста");

        const count = await this.deckService.getDeckCount(gameId, type);
        await this.redis.updateGame(gameId, {
            [type === 'doors' ? 'doorsLeftCount' : 'treasureLeftCount']: count
        });

        const result = await this.giveCard(gameId, userId, card);

        if (result.status === 'success') {
            await this.syncService.syncInventory(gameId, userId);
        }

        return result;
    }

    public async giveCard(gameId: string, userId: string, card: ICardData | IDoorData) {
        await this.playerService.addCardsToHand(gameId, userId, [card as any]);
        const stats = await this.redis.getPlayerStats(gameId, userId);
        if (!stats) return { status: 'error' };

        const isDwarf = stats.race?.race === CardRace.Dwarf;
        const maxCards = isDwarf ? 5 : 4;

        if (stats.cards.length > maxCards) {
            const extraCardsCount = stats.cards.length - maxCards;

            this.emit('REQUIRE_PHASE_CHANGE', {
                gameId,
                userId,
                newPhase: GamePhase.DROP_CARDS,
                extraCardsCount
            });
        }
        await gameSyncService.syncPlayer(gameId, userId);

        await this.syncService.syncInventory(gameId, userId);
        await this.syncService.broadcastGameState(gameId);

        return { status: 'success', card };
    }

    public async dropCardFromHand(gameId: string, userId: string, cardId: string): Promise<string> {
        const stats = await this.redis.getPlayerStats(gameId, userId);
        if (!stats) throw new Error("Player stats not found");

        const cardIndex = stats.cards.findIndex(c => c._id === cardId);
        if (cardIndex === -1) {
            throw new ValidationError(`Карта не найдена в руке игрока ${cardId}`);
        }

        // 1. Удаляем карту из руки
        await this.playerService.removeCardsFromHand(gameId, userId, [{ _id: cardId }]);

        // 2. Получаем обновленные данные после удаления
        const updatedStats = await this.playerService.getPlayer(gameId, userId);

        const isDwarf = stats.race?.race === CardRace.Dwarf;
        const limit = isDwarf ? 5 : 4;
        logger.info('возврат');
        logger.info(updatedStats.cards.length);
        logger.info(limit);


        // 4. Если карт теперь меньше или равно лимиту, уведомляем Engine о возврате фазы
        if (updatedStats.cards.length <= limit) {
            logger.info('возврат');

            this.emit('REQUIRE_PHASE_CHANGE', {
                gameId,
                userId,
                newPhase: null
            });
        }


        logger.info(`[GameAction] Card ${cardId} removed from player ${userId} hand`);
        return cardId;
    }

    public async discardCard(gameId: string, card: ICardData | IDoorData) {

        await this.deckService.discardCard(gameId, card);

        logger.info(`[GameAction] Card ${card._id}`);

        this.syncService.sendNotification(gameId, `Карта отправлена в сброс`, 'info');
    }

    public async dropAndDiscard(gameId: string, userId: string, cardId: string) {
        // 1. Сначала находим объект карты в руке игрока
        const stats = await this.redis.getPlayerStats(gameId, userId);
        if (!stats) throw new Error("Player stats not found");

        const card = stats.cards.find(c => c._id === cardId);
        if (!card) {
            throw new ValidationError(`Карта не найдена в руке игрока: ${cardId}`);
        }

        await this.dropCardFromHand(gameId, userId, cardId);
        await this.discardCard(gameId, card);

        await this.syncService.syncInventory(gameId, userId);
    }

    public async equipItem(gameId: string, userId: string, cardId: string) {
        const stats = await this.playerService.getPlayer(gameId, userId);

        const card = stats.cards.find(c => c._id === cardId) as ICardData | IDoorData | undefined;

        if (!card) {
            throw new ValidationError("Карта не найдена в вашей руке");
        }

        const oldRace = stats.race;

        await this.playerService.removeCardsFromHand(gameId, userId, [{ _id: cardId }]);

        try {
            if ('type' in card && card.type === DoorType.Race) {

                await this.playerService.equipRace(gameId, userId, card as IDoorData);

                if (oldRace) {
                    await this.deckService.discardCard(gameId, oldRace);
                }

            } else {
                await this.playerService.equipItem(gameId, userId, card as ICardData);
            }
        } catch (error) {
            await this.playerService.addCardsToHand(gameId, userId, [card as ICardData]);
            throw error;
        }

        await this.syncService.syncPlayer(gameId, userId);
        await this.syncService.syncInventory(gameId, userId);
        await this.syncService.broadcastGameState(gameId);

        logger.info(`[GameAction] Player ${userId} equipped ${('type' in card && card.type === DoorType.Race) ? 'race' : 'item'} ${cardId}`);
    }

    public async unEquipItem(gameId: string, userId: string, slot: PlayerEquipSlot) {
        // 1. Находим карту в указанном слоте
        const stats = await this.playerService.getPlayer(gameId, userId);
        const card = stats[slot];

        if (!card) {
            throw new ValidationError(`В слоте ${slot} ничего нет`);
        }

        // 2. Снимаем предмет через PlayerService
        await this.playerService.unequipItem(gameId, userId, slot);

        // 3. Чтобы корректно обработать лимиты 
        await this.playerService.removeCardsFromHand(gameId, userId, [{ _id: card._id }]);
        const result = await this.giveCard(gameId, userId, card);

        // 4. Синхронизируем состояние
        await this.syncService.syncPlayer(gameId, userId);
        await this.syncService.syncInventory(gameId, userId);

        logger.info(`[GameAction] Player ${userId} unequipped ${slot}. Status: ${result.status}`);
        return result;
    }

    /**
     * Украсть предмет из слота.
     * Использует unequipItem для освобождения слота, но удаляет карту из руки "жертвы".
     */
    public async stealItem(gameId: string, userId: string, slot: PlayerEquipSlot): Promise<ICardData> {
        const statsBefore = await this.playerService.getPlayer(gameId, userId);
        const card = statsBefore[slot];

        if (!card) {
            throw new ValidationError(`У игрока нет предмета в слоте ${slot}`);
        }

        // 1. Используем unequipItem для корректного освобождения слота 
        await this.playerService.unequipItem(gameId, userId, slot);

        await this.syncService.syncPlayer(gameId, userId);
        await this.syncService.syncInventory(gameId, userId);

        logger.info(`[GameAction] Item ${card._id} stolen from ${slot} of player ${userId}`);
        return card;
    }

    /**
     * Украсть предмет из слота и отправить его в сброс.
     */
    public async stealItemAndDiscard(gameId: string, userId: string, slot: PlayerEquipSlot) {
        const card = await this.stealItem(gameId, userId, slot);

        await this.deckService.discardCard(gameId, card);

        logger.info(`[GameAction] Stolen item ${card._id} from ${slot} discarded`);
    }

    public async openDoor(gameId: string, userId: string) {
        // 1. Берем карту из колоды дверей
        const card = await this.deckService.drawDoor(gameId);

        if (!card) {
            throw new ValidationError("Колода дверей пуста");
        }

        // 2. Уведомляем всех, какая карта выпала (отправляем в лог)
        this.syncService.sendNotification(gameId, `Выпала карта: ${card.name}`, 'info');

        // 3. Проверяем тип карты
        // Если это монстр — переходим в бой
        if (card.type === DoorType.Monster) {
            if (card.type === 'Monster') {
                this.emit('REQUIRE_PHASE_CHANGE', {
                    gameId,
                    userId,
                    newPhase: GamePhase.BATTLE,
                    card
                });

                return { type: 'monster', card };
            }

            logger.info(`[GameAction] Player ${userId} encountered a monster: ${card.name}`);
            return { type: 'monster', card };
        }

        // 4. Если это НЕ монстр 
        await this.giveCard(gameId, userId, card);

        this.emit('REQUIRE_PHASE_CHANGE', {
            gameId,
            userId,
            newPhase: GamePhase.NEXT_TURN
        });
        logger.info(`[GameAction] Player ${userId} drew ${card.name} and moved to LOOT phase`);
        return { type: 'loot', card };
    }

    /**
     * Усилить монстра картой из руки с выполнением эффектов
     */
    public async buffMonster(gameId: string, userId: string, cardId: string) {
        const result = await this.applyBattleBuff(gameId, userId, cardId, 'monster');

        await actionDispatcher.resolveCardEffects(cardId, gameId, userId);

        return result;
    }

    /**
     * Усилить игрока картой из руки с выполнением эффектов
     */
    public async buffPlayer(gameId: string, userId: string, cardId: string) {
        const result = await this.applyBattleBuff(gameId, userId, cardId, 'player');

        await actionDispatcher.resolveCardEffects(cardId, gameId, userId);

        return result;
    }

    private async applyBattleBuff(
        gameId: string,
        userId: string,
        cardId: string,
        target: 'monster' | 'player'
    ) {
        const stats = await this.redis.getPlayerStats(gameId, userId);
        if (!stats) throw new ValidationError("Статистика игрока не найдена");

        const card = stats.cards.find(c => c._id === cardId);
        if (!card) {
            throw new ValidationError("Этой карты нет у вас в руке");
        }

        const game = await this.redis.getGame(gameId);
        if (!game) throw new ValidationError("Игра не найдена");

        await this.battleService.addCardToBattle(gameId, card, target);

        await this.playerService.removeCardsFromHand(gameId, userId, [{ _id: cardId }]);

        logger.info(`[GameAction] Player ${userId} buffed ${target} with card ${cardId}`);

        await this.syncService.syncInventory(gameId, userId);
        await this.syncService.broadcastGameState(gameId);

        return { status: 'success', target };
    }

    public async changePlayerLevel(gameId: string, userId: string, delta: number) {
        // 1. Вызываем базовую логику изменения уровня (с проверкой на минимум 1)
        const updatedStats = await this.playerService.changeLevel(gameId, userId, delta);

        if (!updatedStats) {
            throw new Error("Не удалось обновить уровень игрока");
        }

        // 2. Отправляем уведомление в лог игры
        const action = delta > 0 ? 'повысил' : 'потерял';
        this.syncService.sendNotification(
            gameId,
            `Игрок ${userId} ${action} уровень (теперь: ${updatedStats.level})`,
            delta > 0 ? 'success' : 'danger'
        );
        if(updatedStats.level >= 10){
        logger.info(`[GameAction] Player ${userId} level ${updatedStats.level}`);

            this.emit('REQUIRE_PHASE_CHANGE', {
                gameId,
                userId,
                newPhase: GamePhase.VICTORY,
            });
        }

        // 3. Синхронизируем состояние игрока и всей игры (сила игрока изменилась)
        await this.syncService.syncPlayer(gameId, userId);
        await this.syncService.broadcastGameState(gameId);

        logger.info(`[GameAction] Level changed for ${userId} by ${delta}. New level: ${updatedStats.level}`);

        return updatedStats;
    }

    public async fight(gameId: string): Promise<void> {
        const game = await this.redis.getGame(gameId);
        if (!game || !game.activeDoor) throw new ValidationError("Нет монстра");

        const userId = game.currentPlayerId;
        const monster = game.activeDoor as IDoorData;

        const { isVictory } = await this.battleService.checkVictory(gameId);

        if (isVictory) {
            await this.changePlayerLevel(gameId, userId, 1);
            const treasuresCount = monster.treasure || 1;
            for (let i = 0; i < treasuresCount; i++) {
                const treasure = await this.deckService.drawTreasure(gameId);
                if (treasure) await this.giveCard(gameId, userId, treasure);
            }
        } else {
            await this.changePlayerLevel(gameId, userId, -1);
            await actionDispatcher.resolveDoorEffects(monster._id, gameId, userId);
        }

        await this.cleanupBattle(gameId, userId);
    }

    public async useOtherCard(gameId: string, userId: string, cardId: string) {
        const stats = await this.playerService.getPlayer(gameId, userId);
        const card = stats.cards.find(c => c._id === cardId);
        if (!card) {
            throw new ValidationError("Карта не найдена в вашей руке");
        }
        await this.playerService.removeCardsFromHand(gameId, userId, [{ _id: cardId }]);
        await actionDispatcher.resolveCardEffects(cardId, gameId, userId);
        logger.info(`[GameAction] Player ${userId} used card ${cardId} (${card.name})`);
        this.syncService.sendNotification(gameId, `Игрок использовал карту: ${card.name}`, 'info');
        await this.syncService.syncInventory(gameId, userId);
        await this.syncService.broadcastGameState(gameId);

        return { status: 'success', cardId };
    }

    /**
     * Попытка смывки из боя
     */
    public async tryRun(gameId: string, userId: string) {
        const game = await this.redis.getGame(gameId);
        if (!game || !game.activeDoor) {
            throw new ValidationError("Нет монстра, от которого нужно убегать");
        }

        const monster = game.activeDoor as IDoorData;

        const runData = await this.playerService.tryRun(gameId, userId);

        this.emit('REQUIRE_PHASE_CHANGE', {
            gameId,
            userId,
            newPhase: GamePhase.RUN,
        });

        this.syncService.syncRunResult(gameId, userId, {
            dice: runData.dice,
            result: runData.result
        });

        const statusMsg = runData.result ? 'успешно смылся!' : 'не смог убежать...';
        this.syncService.sendNotification(
            gameId,
            `Игрок ${userId} выбросил ${runData.dice} (Всего: ${runData.agility + runData.dice}). Он ${statusMsg}`,
            runData.result ? 'success' : 'danger'
        );

        if (runData.result) {
            setTimeout(async () => {
                await this.cleanupBattle(gameId, userId);
            }, 3000);

        } else {
            setTimeout(async () => {
                logger.info(`[GameAction] 3s passed. Applying bad stuff to ${userId}`);
                await this.changePlayerLevel(gameId, userId, -1);
                await actionDispatcher.resolveDoorEffects(monster._id, gameId, userId);
                await this.cleanupBattle(gameId, userId);
                this.syncService.sendNotification(
                    gameId,
                    `Монстр ${monster.name} догнал игрока и применил Непотребство!`,
                    'danger'
                );
            }, 3000);
        }

        return runData;
    }

    /**
     * Вспомогательный метод для очистки стола после боя или смывки
     */
    private async cleanupBattle(gameId: string, userId: string) {
        const game = await this.redis.getGame(gameId);
        if (game?.activeDoor) {
            await this.discardCard(gameId, game.activeDoor as IDoorData);
        }

        await this.playerService.clearTemporaryBonuses(gameId, userId);

        await this.redis.updateGame(gameId, {
            activeDoor: null,
            monsterPower: 0,
            monsterCards: [],
            battleCards: []
        });

        this.emit('REQUIRE_PHASE_CHANGE', {
            gameId,
            userId,
            newPhase: GamePhase.NEXT_TURN,
        });

        await this.syncService.broadcastGameState(gameId);

    }

}
export const gameActionService = new GameActionService();