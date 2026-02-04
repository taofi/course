import { GameRedisService } from './game.redis.service';
import { CardRace, CardSize, CardType, ICardData, IDoorData, IPlayerStats, PlayerEquipSlot } from "@munchkin/shared";
import { ForbiddenError, LobbyNotFoundError, ValidationError } from '@src/utils/CustomErrors';
import { GameRuleError } from '@src/utils/GameError';
import logger from '@src/utils/logger';

export class PlayerService {
    constructor(private gameRedisService: GameRedisService) { }

    private validateEquipConditions(stats: IPlayerStats, card: ICardData): void {
        // 1. Проверка на Большие (Big) предметы
        if (card.size === CardSize.Big) {
            const isDwarf = stats.race?.race === CardRace.Dwarf;
            if (!isDwarf) {
                const equippedItems = [stats.boots, stats.armor, stats.headGear, stats.oneHand, stats.secondHand];
                if (equippedItems.some(item => item?.size === CardSize.Big)) {
                    throw new GameRuleError(
                        "Вы не можете нести более одного Большого предмета",
                        "LIMIT_BIG_ITEMS"
                    );
                }
            }
        }

        // 2. Проверка по Расе
        if (card.race) {
            const playerRace = stats.race?.race || CardRace.Human;
            if (playerRace !== card.race) {
                throw new GameRuleError(
                    `Этот предмет только для расы: ${card.race}.`,
                    "INVALID_RACE"
                );
            }
        }

    }

    async getPlayer(gameId: string, userId: string): Promise<IPlayerStats> {
        const game = await this.gameRedisService.getGame(gameId);
        if (!game) {
            throw new LobbyNotFoundError("Игровая сессия не найдена");
        }

        const isParticipant = game.participantsId.includes(userId);
        if (!isParticipant) {
            throw new ForbiddenError("Пользователь не является участником этой игры");
        }

        const stats = await this.gameRedisService.getPlayerStats(gameId, userId);

        if (!stats) {
            logger.error(`Stats not found for player ${userId} in game ${gameId}`);
            throw new ValidationError("Данные игрока не найдены");
        }

        return stats;
    }

    /**
     * Высчитывает боевую силу игрока
     * Формула: level + boots + armor + headGear + hands + bonuses
     */
    public calculatePlayerStrength(stats: IPlayerStats): number {
        let strength = stats.level;

        // Экипировка
        strength += stats.boots?.bonus ?? 0;
        strength += stats.armor?.bonus ?? 0;
        strength += stats.headGear?.bonus ?? 0;
        strength += stats.oneHand?.bonus ?? 0;
        strength += stats.secondHand?.bonus ?? 0;

        // Временные бонусы
        const tempSum = stats.tempraryBonus.reduce((sum, card) => sum + (card.bonus ?? 0), 0);
        strength += tempSum;

        // Постоянные бонусы
        const permSum = stats.permanentBonus.reduce((sum, card) => sum + (card.bonus ?? 0), 0);
        strength += permSum;

        return strength;
    }

    async clearTemporaryBonuses(gameId: string, userId: string): Promise<IPlayerStats> {
        const stats = await this.getPlayer(gameId, userId);

        stats.tempraryBonus = [];

        await this.gameRedisService.savePlayerStats(gameId, userId, stats);

        logger.info(`Temporary bonuses cleared for player ${userId} in game ${gameId}`);

        return stats;
    }

    /**
     * Универсальный метод для обновления и сохранения статистики игрока
     */
    private async updateStats(gameId: string, userId: string, updateFn: (stats: IPlayerStats) => void): Promise<IPlayerStats> {
        const stats = await this.getPlayer(gameId, userId);
        updateFn(stats);
        await this.gameRedisService.savePlayerStats(gameId, userId, stats);
        return stats;
    }

    /**
     * Добавляет карты в руку игрока (в массив cards)
     */
    async addCardsToHand(gameId: string, userId: string, cards: ICardData[]): Promise<IPlayerStats> {
        return this.updateStats(gameId, userId, (stats) => {
            stats.cards.push(...cards);
        });
    }

    /**
     * Добавляет временный бонус
     */
    async addTemporaryBonus(gameId: string, userId: string, card: ICardData): Promise<IPlayerStats> {
        return this.updateStats(gameId, userId, (stats) => {
            stats.tempraryBonus.push(card);
        });
    }

    /**
     * Добавляет постоянный бонус
     */
    async addPermanentBonus(gameId: string, userId: string, card: ICardData): Promise<IPlayerStats> {
        return this.updateStats(gameId, userId, (stats) => {
            stats.permanentBonus.push(card);
        });
    }

    /**
     * Устанавливает расу персонажа
     */
    async setRace(gameId: string, userId: string, raceCard: IDoorData): Promise<IPlayerStats> {
        return this.updateStats(gameId, userId, (stats) => {
            stats.race = raceCard;
        });
    }

    /**
     * Экипирует предмет в соответствующий слот
     */async equipItem(gameId: string, userId: string, card: ICardData): Promise<IPlayerStats> {
        return this.updateStats(gameId, userId, (stats) => {
            // Сначала проверяем, можно ли это надеть (уровень, раса, класс)
            this.validateEquipConditions(stats, card);

            // Вспомогательная функция для замены предмета
            const swapItem = (currentCard: ICardData | null): ICardData => {
                if (currentCard) {
                    // Если в слоте что-то было, возвращаем в руку
                    stats.cards.push(currentCard);
                }
                return card;
            };

            switch (card.type) {
                case CardType.Armor:
                    stats.armor = swapItem(stats.armor as ICardData);
                    break;
                case CardType.Boots:
                    stats.boots = swapItem(stats.boots as ICardData);
                    break;
                case CardType.Headgear:
                    stats.headGear = swapItem(stats.headGear as ICardData);
                    break;
                case CardType.TwoHands:
                    // Если надеваем двуручное, нужно снять ВСЁ из обеих рук
                    if (stats.oneHand) stats.cards.push(stats.oneHand as ICardData);
                    if (stats.secondHand) stats.cards.push(stats.secondHand as ICardData);
                    stats.oneHand = card;
                    stats.secondHand = undefined;
                    break;
                case CardType.OneHand:
                    // Если обе руки заняты, снимаем из первой и сдвигаем или просто заменяем вторую
                    // Логика: если есть место во второй — кладем туда, если нет — меняем первую
                    if (!stats.oneHand) {
                        stats.oneHand = card;
                    } else if (!stats.secondHand) {
                        // Проверяем, не занята ли первая рука двуручным оружием
                        if (stats.oneHand.type === CardType.TwoHands) {
                            stats.cards.push(stats.oneHand as ICardData);
                            stats.oneHand = card;
                        } else {
                            stats.secondHand = card;
                        }
                    } else {
                        // Обе руки заняты одноручными — меняем первую (или любую по логике)
                        stats.cards.push(stats.oneHand as ICardData);
                        stats.oneHand = card;
                    }
                    break;
                default:
                    throw new ValidationError(`Тип карты ${card.type} не является экипировкой`);
            }
        });
    }

    async unequipItem(gameId: string, userId: string, slot: PlayerEquipSlot): Promise<IPlayerStats> {
        return this.updateStats(gameId, userId, (stats) => {
            // Доступ к полю через индекс [slot]
            const itemToUnequip = stats[slot];

            if (!itemToUnequip) {
                throw new ValidationError(`Слот ${slot} уже пуст`);
            }

            // 1. Если это двуручный предмет, он технически занимает oneHand, 
            // но нам нужно убедиться, что логика консистентна
            if (itemToUnequip.type === CardType.TwoHands) {
                stats.oneHand = undefined;
            } else {
                stats[slot] = undefined;
            }
            logger.info(`[PlayerService] Item ${itemToUnequip._id} removed from ${slot}`);
        });
    }

    async removeCardsFromHand(
        gameId: string,
        userId: string,
        cardsToRemove: { _id: string }[]
    ): Promise<IPlayerStats> {
        return this.updateStats(gameId, userId, (stats) => {
            const idsToRemove = new Set(cardsToRemove.map(card => card._id));

            const initialCount = stats.cards.length;

            stats.cards = stats.cards.filter(card => !idsToRemove.has(card._id));

            if (stats.cards.length === initialCount && idsToRemove.size > 0) {
                logger.warn(`[PlayerService] No cards were removed for player ${userId}. Possible ID mismatch.`);
            } else {
                logger.debug(`[PlayerService] Removed ${initialCount - stats.cards.length} cards from player ${userId}`);
            }
        });
    }

    async changeLevel(gameId: string, userId: string, delta: number): Promise<IPlayerStats> {
        return this.updateStats(gameId, userId, (stats) => {
            const oldLevel = stats.level;
            let newLevel = oldLevel + delta;

            if (newLevel < 1) {
                newLevel = 1;
            }

            stats.level = newLevel;

            logger.info(`[PlayerService] Player ${userId} level changed: ${oldLevel} -> ${newLevel} (delta: ${delta})`);
        });
    }

    /**
     * Устанавливает расу персонажа, выбрасывает старую в сброс и проверяет легальность экипировки
     */
    async equipRace(gameId: string, userId: string, raceCard: IDoorData): Promise<IPlayerStats> {
        return this.updateStats(gameId, userId, async (stats) => {
            // 1. Обработка старой расы
            const oldRace = stats.race;
            if (oldRace) {
                logger.info(`[PlayerService] Old race ${oldRace.name} discarded for player ${userId}`);
            }

            // 2. Устанавливаем новую расу
            stats.race = raceCard;
            logger.info(`[PlayerService] Player ${userId} changed race to ${raceCard.race}`);

            // 3. Проверка всей экипировки
            const equipmentSlots: PlayerEquipSlot[] = [
                'armor', 
                'boots', 
                'headGear', 
                'oneHand', 
                'secondHand'
            ];

            // Флаг для отслеживания больших шмоток (если новая раса - не Дварф)
            let bigItemsCount = 0;
            const isDwarf = raceCard.race === CardRace.Dwarf;

            for (const slot of equipmentSlots) {
                const item = stats[slot] as ICardData;
                if (!item) continue;

                let shouldUnequip = false;

                // А) Проверка на соответствие новой расе
                if (item.race && item.race !== raceCard.race) {
                    logger.info(`[PlayerService] Item ${item.name} unequipped: race mismatch`);
                    shouldUnequip = true;
                }

                // Б) Проверка на лимит больших шмоток
                if (!shouldUnequip && item.size === CardSize.Big) {
                    if (!isDwarf) {
                        bigItemsCount++;
                        if (bigItemsCount > 1) {
                            logger.info(`[PlayerService] Item ${item.name} unequipped: big item limit`);
                            shouldUnequip = true;
                        }
                    }
                }

                if (shouldUnequip) {
                    stats.cards.push(item);
                    stats[slot] = undefined;
                }
            }
        });
    }


    async tryRun(gameId: string, userId: string): Promise<{ 
        dice: number, 
        agility: number, 
        result: boolean, 
        isElf: boolean 
    }> {
        const stats = await this.getPlayer(gameId, userId);

        const dice = Math.floor(Math.random() * 6) + 1;

        let agility = stats.agility || 0;

        const isElf = stats.race?.race === CardRace.Elf;
        if (isElf) {
            agility += 1;
        }

        const result:boolean = dice > (6 - agility);

        logger.info(`[PlayerService] Player ${userId} roll for run: dice=${dice}, agility=${agility} (Elf: ${isElf}), result=${result}`);

        return {
            dice,
            agility,
            result,
            isElf
        };
    }
}