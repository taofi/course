// src/services/deck.service.ts
import { ICardData, IDoorData } from "@munchkin/shared";
import { RedisService } from "./redis.service";
import { CardRepository } from "@src/db/repositories/card.repository";
import { DoorsRepository } from "@src/db/repositories/doors.repository";
import logger from "@src/utils/logger";
import { GameRedisService } from "./game.redis.service";

export interface IInitialDecks {
    doors: IDoorData[];
    treasures: ICardData[];
}

export class DeckService {
    constructor(
        private redisService: RedisService,
        private cardRepo: CardRepository,
        private doorsRepo: DoorsRepository,
        private gameRedisService: GameRedisService,
    ) { }

    private getKeys(gameId: string) {
        return {
            doors: `game:${gameId}:deck:doors`,
            treasures: `game:${gameId}:deck:treasures`,
            discardDoors: `game:${gameId}:discard:doors`,
            discardTreasures: `game:${gameId}:discard:treasures`
        };
    }

    /**
     * Инициализация колод: загрузка из БД, перемешивание и сохранение в Redis
     */
    async initGameDecks(gameId: string): Promise<{ doorsCount: number; treasuresCount: number }> {
        // 1. Загрузка из БД
        const allDbDoors = await this.doorsRepo.findAll();
        const allDbTreasures = await this.cardRepo.findAll();

        // 2. Перемешивание
        const shuffledDoors = this.shuffle(allDbDoors);
        const shuffledTreasures = this.shuffle(allDbTreasures);

        // 3. Сохранение в Redis (отдельно от объекта игры)
        const keys = this.getKeys(gameId);

        await this.redisService.del([keys.doors, keys.treasures, keys.discardDoors, keys.discardTreasures]);

        if (shuffledDoors.length > 0) {
            const serialized = shuffledDoors.map(d => JSON.stringify(d));
            await (this.redisService as any).redis.rpush(keys.doors, ...serialized);
        }

        if (shuffledTreasures.length > 0) {
            const serialized = shuffledTreasures.map(t => JSON.stringify(t));
            await (this.redisService as any).redis.rpush(keys.treasures, ...serialized);
        }

        logger.info(`Decks for game ${gameId} initialized. Doors: ${shuffledDoors.length}, Treasures: ${shuffledTreasures.length}`);

        return {
            doorsCount: shuffledDoors.length,
            treasuresCount: shuffledTreasures.length
        };
    }

    /**
 * Получает текущее количество карт в колоде (остаток)
 */
    async getCount(gameId: string, type: 'doors' | 'treasures'): Promise<number> {
        const keys = this.getKeys(gameId);
        const key = type === 'doors' ? keys.doors : keys.treasures;
        return await (this.redisService as any).redis.llen(key);
    }

    /**
     * Получает количество карт в сбросе (выбывшие)
     */
    async getDiscardCount(gameId: string, type: 'doors' | 'treasures'): Promise<number> {
        const keys = this.getKeys(gameId);
        const key = type === 'doors' ? keys.discardDoors : keys.discardTreasures;
        return await (this.redisService as any).redis.llen(key);
    }
    /**
         * Вспомогательный метод для обновления всех счетчиков колоды и сброса в объекте игры
         */
    private async syncDeckCounts(gameId: string, type: 'doors' | 'treasures') {
        const keys = this.getKeys(gameId);
        const deckKey = type === 'doors' ? keys.doors : keys.treasures;
        const discardKey = type === 'doors' ? keys.discardDoors : keys.discardTreasures;
    
        const [deckCount, discardCount] = await Promise.all([
            (this.redisService as any).redis.llen(deckKey),
            (this.redisService as any).redis.llen(discardKey)
        ]);
    
        await this.gameRedisService.updateGame(gameId, {
            ...(type === 'doors' 
                ? { doorsCount: deckCount, doorsLeftCount: discardCount } 
                : { treasureCount: deckCount, treasureLeftCount: discardCount }
            )
        });
    }
    async drawDoor(gameId: string): Promise<IDoorData | null> {
        const keys = this.getKeys(gameId);

        const cardJson = await (this.redisService as any).redis.lpop(keys.doors);

        if (!cardJson) {
            const reshuffled = await this.reshuffleDiscard(gameId, 'doors');
            if (!reshuffled) return null; 
            return this.drawDoor(gameId);
        }

        const remainingCount = await (this.redisService as any).redis.llen(keys.doors);

        if (remainingCount === 0) {
            console.log(`Deck ${gameId} is empty after draw, reshuffling...`);
            await this.reshuffleDiscard(gameId, 'doors');
        }

        await this.syncDeckCounts(gameId, 'doors');

        return JSON.parse(cardJson);
    }

    async drawTreasure(gameId: string): Promise<ICardData | null> {
        const keys = this.getKeys(gameId);
        const cardJson = await (this.redisService as any).redis.lpop(keys.treasures);

        if (!cardJson) {
            const reshuffled = await this.reshuffleDiscard(gameId, 'treasures');
            if (!reshuffled) return null;
            return this.drawTreasure(gameId);
        }

        await this.syncDeckCounts(gameId, 'treasures'); // Обновляем цифры
        return JSON.parse(cardJson);
    }

    public async discardCard(gameId: string, card: ICardData | IDoorData) {
        const keys = this.getKeys(gameId);

        const isTreasure = 'price' in card;

        const type = isTreasure ? 'treasures' : 'doors';
        const key = isTreasure ? keys.discardTreasures : keys.discardDoors;

        await (this.redisService as any).redis.rpush(key, JSON.stringify(card));

        await this.syncDeckCounts(gameId, type);

        logger.info(`[DeckService] Card ${card._id} discarded to ${type}`);
    }

    private async reshuffleDiscard(gameId: string, type: 'doors' | 'treasures'): Promise<boolean> {
        const keys = this.getKeys(gameId);
        const discardKey = type === 'doors' ? keys.discardDoors : keys.discardTreasures;
        const deckKey = type === 'doors' ? keys.doors : keys.treasures;

        const cards = await (this.redisService as any).redis.lrange(discardKey, 0, -1);
        if (!cards || cards.length === 0) return false;

        const shuffled = this.shuffle(cards);
        await this.redisService.del(discardKey);
        await (this.redisService as any).redis.rpush(deckKey, ...shuffled);

        await this.syncDeckCounts(gameId, type); // Обновляем цифры (колода пополнилась)
        return true;
    }

    private shuffle<T>(array: T[]): T[] {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j]!, newArray[i]!];
        }
        return newArray;
    }

    async getDeckCount(gameId: string, type: 'doors' | 'treasures'): Promise<number> {
        const keys = this.getKeys(gameId);
        const key = type === 'doors' ? keys.doors : keys.treasures;
        return await (this.redisService as any).redis.llen(key);
    }
}